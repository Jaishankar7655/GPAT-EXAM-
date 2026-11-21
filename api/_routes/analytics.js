import { connectToDatabase } from '../_lib/db.js';
import {
  Profile,
  Topic,
  Subject,
  UserTopicProgress,
  StudySession,
  QuizAttempt,
  DailyPlan,
  DailyScore,
  Mistake
} from '../_lib/models.js';
import { authenticate } from '../_lib/auth.js';
import { sendJson, sendError, getTodayDateString } from '../_lib/utils.js';

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to access analytics');
    }

    await connectToDatabase();
    const today = getTodayDateString();

    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      profile = {
        examDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        weekdayHours: 4,
        weekendHours: 6,
        targetScore: 350
      };
    }

    const examDate = new Date(profile.examDate);
    const now = new Date();
    const msDiff = examDate.getTime() - now.getTime();
    const daysRemaining = Math.max(1, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

    const allTopics = await Topic.find().lean();
    const totalTopicsCount = allTopics.length || 1;

    const userProgress = await UserTopicProgress.find({ userId: user._id }).lean();
    const progressMap = new Map();
    userProgress.forEach((p) => progressMap.set(p.topicId.toString(), p));

    let completedTopicsCount = 0;
    let revisedTopicsCount = 0;
    let inProgressTopicsCount = 0;

    userProgress.forEach((p) => {
      if (p.status === 'completed') completedTopicsCount++;
      else if (p.status === 'revised') {
        completedTopicsCount++;
        revisedTopicsCount++;
      } else if (p.status === 'in_progress') inProgressTopicsCount++;
    });

    const remainingTopicsCount = Math.max(0, totalTopicsCount - completedTopicsCount);
    const overallSyllabusPercent = Math.round((completedTopicsCount / totalTopicsCount) * 100);

    const completedTopicIds = new Set(
      userProgress
        .filter((p) => p.status === 'completed' || p.status === 'revised')
        .map((p) => p.topicId.toString())
    );

    let remainingHoursNeeded = 0;
    allTopics.forEach((t) => {
      if (!completedTopicIds.has(t._id.toString())) {
        remainingHoursNeeded += t.estimatedHours || 2;
      }
    });

    const totalHoursNeededWithRevision = Math.round(remainingHoursNeeded * 1.25);
    const requiredHoursPerDay = Math.round((totalHoursNeededWithRevision / daysRemaining) * 10) / 10;

    const userAverageDailyPlan =
      Math.round(((profile.weekdayHours * 5 + profile.weekendHours * 2) / 7) * 10) / 10;

    let paceStatus = 'on_track';
    let paceMessage = '';

    if (requiredHoursPerDay <= userAverageDailyPlan * 0.85) {
      paceStatus = 'ahead';
      paceMessage = `You are ahead of schedule! You only need ${requiredHoursPerDay} hrs/day to finish with full revision.`;
    } else if (requiredHoursPerDay <= userAverageDailyPlan * 1.15) {
      paceStatus = 'on_track';
      paceMessage = `You are right on track. Keep up your current target of ${userAverageDailyPlan} hrs/day.`;
    } else {
      paceStatus = 'behind';
      const gap = Math.round((requiredHoursPerDay - userAverageDailyPlan) * 10) / 10;
      paceMessage = `You are slightly behind pace. You need ${requiredHoursPerDay} hrs/day (${gap} hrs more than your planned daily target) to cover the syllabus comfortably.`;
    }

    const todayPlan = await DailyPlan.findOne({ userId: user._id, date: today });
    const todaySessions = await StudySession.find({ userId: user._id, date: today });
    const todayLoggedMins = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const todayLoggedHours = Math.round((todayLoggedMins / 60) * 10) / 10;

    const plannedHours = todayPlan?.plannedHours || (now.getDay() === 0 || now.getDay() === 6 ? profile.weekendHours : profile.weekdayHours);
    const todayHoursLeft = Math.max(0, Math.round((plannedHours - todayLoggedHours) * 10) / 10);

    const tasksDone = todayPlan?.tasks?.filter((t) => t.completed).length || 0;
    const tasksPending = (todayPlan?.tasks?.length || 0) - tasksDone;

    const subjects = await Subject.find().sort({ order: 1 }).lean();
    const subjectProgressList = subjects.map((sub) => {
      const subTopics = allTopics.filter((t) => t.subjectId.toString() === sub._id.toString());
      const subTotal = subTopics.length || 1;
      const subDone = subTopics.filter((t) => completedTopicIds.has(t._id.toString())).length;
      const percent = Math.round((subDone / subTotal) * 100);

      return {
        id: sub._id,
        name: sub.name,
        slug: sub.slug,
        color: sub.color || '#1e4d3b',
        total: subTotal,
        completed: subDone,
        percentage: percent
      };
    });

    const past14DaysData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      past14DaysData.push({
        date: str,
        label: dayLabel,
        hours: 0
      });
    }

    const past14Sessions = await StudySession.find({
      userId: user._id,
      date: { $gte: past14DaysData[0].date }
    });

    past14Sessions.forEach((s) => {
      const entry = past14DaysData.find((d) => d.date === s.date);
      if (entry) {
        entry.hours += Math.round((s.durationMinutes / 60) * 10) / 10;
      }
    });

    const recentQuizzes = await QuizAttempt.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const quizAccuracyTrend = recentQuizzes.reverse().map((q, idx) => {
      const total = q.correctAnswers + q.wrongAnswers;
      const accuracy = total > 0 ? Math.round((q.correctAnswers / total) * 100) : 0;
      return {
        quizNumber: `Q${idx + 1}`,
        date: q.date,
        type: q.type,
        accuracy,
        score: q.score,
        correct: q.correctAnswers,
        wrong: q.wrongAnswers
      };
    });

    const past60Scores = await DailyScore.find({
      userId: user._id,
      date: { $gte: getTodayDateString(-60) }
    }).lean();

    const consistencyMap = {};
    past60Scores.forEach((s) => {
      consistencyMap[s.date] = {
        score: s.score,
        hours: s.actualHours
      };
    });

    const weakProgressItems = await UserTopicProgress.find({
      userId: user._id,
      confidence: { $lte: 2 }
    })
      .populate('topicId')
      .limit(6)
      .lean();

    const unreviewedMistakesCount = await Mistake.countDocuments({
      userId: user._id,
      isReviewed: false
    });

    return sendJson(res, 200, {
      success: true,
      summary: {
        daysRemaining,
        examDate: profile.examDate,
        targetScore: profile.targetScore,
        overallSyllabusPercent,
        totalTopicsCount,
        completedTopicsCount,
        remainingTopicsCount,
        todayLoggedHours,
        todayHoursLeft,
        plannedHours,
        tasksDone,
        tasksPending,
        unreviewedMistakesCount
      },
      pace: {
        status: paceStatus,
        requiredHoursPerDay,
        userPlannedDailyHours: userAverageDailyPlan,
        remainingHoursNeeded: totalHoursNeededWithRevision,
        message: paceMessage
      },
      subjectProgress: subjectProgressList,
      studyHoursTrend: past14DaysData,
      quizAccuracyTrend,
      consistencyMap,
      weakTopics: weakProgressItems.filter((p) => p.topicId).map((p) => ({
        id: p.topicId._id,
        title: p.topicId.title,
        chapter: p.topicId.chapter,
        confidence: p.confidence,
        status: p.status
      }))
    });
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Error generating analytics');
  }
}

