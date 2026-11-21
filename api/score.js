import { connectToDatabase } from './_lib/db.js';
import { DailyScore, DailyPlan, StudySession, QuizAttempt, UserTopicProgress, User } from './_lib/models.js';
import { authenticate } from './_lib/auth.js';
import { sendJson, sendError, getTodayDateString } from './_lib/utils.js';
import { calculateDailyScore, BADGES, SCORE_FORMULA } from './_lib/config.js';

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to view score');
    }

    await connectToDatabase();
    const today = getTodayDateString();

    // 1. Gather Today's Metrics
    const todayPlan = await DailyPlan.findOne({ userId: user._id, date: today });
    const todaySessions = await StudySession.find({ userId: user._id, date: today });
    const todayQuiz = await QuizAttempt.findOne({ userId: user._id, date: today }).sort({ createdAt: -1 });

    const plannedHours = todayPlan?.plannedHours || 4;
    const actualMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const actualHours = Math.round((actualMinutes / 60) * 10) / 10;

    const plannedTopics = todayPlan?.tasks?.length || 3;
    const completedTopics = todayPlan?.tasks?.filter((t) => t.completed).length || 0;

    const quizCorrect = todayQuiz?.correctAnswers || 0;
    const quizTotal = todayQuiz?.totalQuestions || 15;

    // Check if user did revision today (any session or task marked revision)
    const revisionSession = todaySessions.some((s) => s.notes?.toLowerCase().includes('revision'));
    const revisionTask = todayPlan?.tasks?.some((t) => t.completed && t.title?.toLowerCase().includes('revision'));
    const revisionDone = revisionSession || revisionTask || false;

    // Calculate score using central formula
    const calculatedScore = calculateDailyScore({
      plannedHours,
      actualHours,
      plannedTopics,
      completedTopics,
      quizCorrect,
      quizTotal,
      revisionDone
    });

    // Breakdown components
    const timeRatio = plannedHours > 0 ? Math.min(actualHours / plannedHours, 1.2) : 1;
    const studyTimePoints = Math.min(SCORE_FORMULA.weights.studyTime, Math.round(timeRatio * SCORE_FORMULA.weights.studyTime * 10) / 10);

    const topicRatio = plannedTopics > 0 ? Math.min(completedTopics / plannedTopics, 1) : 0;
    const topicsCompletedPoints = Math.round(topicRatio * SCORE_FORMULA.weights.topicsCompleted * 10) / 10;

    const quizRatio = quizTotal > 0 ? Math.max(0, quizCorrect / quizTotal) : 0;
    const quizScorePoints = Math.round(quizRatio * SCORE_FORMULA.weights.quizScore * 10) / 10;

    const revisionPoints = revisionDone ? SCORE_FORMULA.weights.revision : 0;

    // 2. Calculate Streak
    // Look at past scores backwards
    const pastScores = await DailyScore.find({ userId: user._id, date: { $ne: today } })
      .sort({ date: -1 })
      .limit(60)
      .lean();

    let streak = 0;
    // If today has activity (study or quiz), today counts as part of active streak
    const hasActivityToday = actualHours > 0 || todayQuiz !== null || completedTopics > 0;
    if (hasActivityToday) {
      streak = 1;
    }

    let checkDate = new Date();
    if (!hasActivityToday) {
      // Check if yesterday had streak
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 30; i++) {
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const day = String(checkDate.getDate()).padStart(2, '0');
      const targetStr = `${year}-${month}-${day}`;

      const found = pastScores.find((s) => s.date === targetStr && s.score >= 20);
      if (found) {
        streak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Save or update today's DailyScore
    await DailyScore.findOneAndUpdate(
      { userId: user._id, date: today },
      {
        $set: {
          score: calculatedScore,
          breakdown: {
            studyTime: studyTimePoints,
            topicsCompleted: topicsCompletedPoints,
            quizScore: quizScorePoints,
            revision: revisionPoints
          },
          streakCount: streak,
          actualHours,
          completedTopicsCount: completedTopics
        }
      },
      { upsert: true, new: true }
    );

    // 3. Award Streak Badges
    const userBadges = user.badges || [];
    const earnedBadgeIds = new Set(userBadges.map((b) => b.id));
    const newBadges = [];

    if (streak >= 3 && !earnedBadgeIds.has('streak_3')) newBadges.push({ id: 'streak_3', earnedAt: new Date() });
    if (streak >= 7 && !earnedBadgeIds.has('streak_7')) newBadges.push({ id: 'streak_7', earnedAt: new Date() });
    if (streak >= 30 && !earnedBadgeIds.has('streak_30')) newBadges.push({ id: 'streak_30', earnedAt: new Date() });

    if (newBadges.length > 0) {
      await User.findByIdAndUpdate(user._id, {
        $push: { badges: { $each: newBadges } }
      });
      userBadges.push(...newBadges);
    }

    // 4. Fetch past 7 days for weekly trends
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      let dayScore = 0;
      if (str === today) {
        dayScore = calculatedScore;
      } else {
        const found = pastScores.find((s) => s.date === str);
        dayScore = found ? found.score : 0;
      }

      past7Days.push({
        date: str,
        day: dayName,
        score: dayScore
      });
    }

    const weeklyAverage = Math.round(past7Days.reduce((sum, d) => sum + d.score, 0) / 7);

    // Map badges with full details
    const populatedBadges = BADGES.map((b) => ({
      ...b,
      unlocked: earnedBadgeIds.has(b.id) || newBadges.some((nb) => nb.id === b.id)
    }));

    return sendJson(res, 200, {
      success: true,
      todayScore: calculatedScore,
      maxScore: 100,
      breakdown: {
        studyTime: { points: studyTimePoints, max: SCORE_FORMULA.weights.studyTime, actualHours, plannedHours },
        topicsCompleted: { points: topicsCompletedPoints, max: SCORE_FORMULA.weights.topicsCompleted, completedTopics, plannedTopics },
        quizScore: { points: quizScorePoints, max: SCORE_FORMULA.weights.quizScore, quizCorrect, quizTotal },
        revision: { points: revisionPoints, max: SCORE_FORMULA.weights.revision, revisionDone }
      },
      streak,
      weeklyAverage,
      weeklyHistory: past7Days,
      badges: populatedBadges
    });
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Error calculating score');
  }
}

