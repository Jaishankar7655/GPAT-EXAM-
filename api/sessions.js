import { z } from 'zod';
import { connectToDatabase } from './_lib/db.js';
import { StudySession, DailyPlan, UserTopicProgress, Topic, User } from './_lib/models.js';
import { authenticate } from './_lib/auth.js';
import { sendJson, sendError, parseAndValidate, getTodayDateString } from './_lib/utils.js';

const sessionSchema = z.object({
  topicId: z.string().optional(),
  subjectId: z.string().optional(),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  type: z.enum(['timer', 'pomodoro', 'manual']).default('timer'),
  notes: z.string().optional(),
  date: z.string().optional()
});

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to log study sessions');
    }

    await connectToDatabase();
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const dateParam = url.searchParams.get('date') || getTodayDateString();

    // 1. GET sessions for date or all recent sessions
    if (req.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '30', 10);
      const query = { userId: user._id };

      if (url.searchParams.get('date')) {
        query.date = dateParam;
      }

      const sessions = await StudySession.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('topicId', 'title chapter')
        .populate('subjectId', 'name slug color')
        .lean();

      // Today's total logged minutes
      const todaySessions = await StudySession.find({ userId: user._id, date: getTodayDateString() });
      const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

      return sendJson(res, 200, {
        success: true,
        sessions,
        todayMinutes,
        todayHours: Math.round((todayMinutes / 60) * 10) / 10
      });
    }

    // 2. POST Log new study session
    if (req.method === 'POST') {
      const data = await parseAndValidate(req, sessionSchema);
      const sessionDate = data.date || getTodayDateString();

      let subjectId = data.subjectId;
      if (!subjectId && data.topicId) {
        const topic = await Topic.findById(data.topicId);
        if (topic) subjectId = topic.subjectId;
      }

      const session = await StudySession.create({
        userId: user._id,
        topicId: data.topicId || null,
        subjectId: subjectId || null,
        durationMinutes: data.durationMinutes,
        type: data.type,
        notes: data.notes || '',
        date: sessionDate,
        startTime: new Date(Date.now() - data.durationMinutes * 60 * 1000),
        endTime: new Date()
      });

      // Update topic progress if linked
      if (data.topicId) {
        await UserTopicProgress.findOneAndUpdate(
          { userId: user._id, topicId: data.topicId },
          {
            $set: { lastStudiedAt: new Date() },
            $setOnInsert: { status: 'in_progress', confidence: 2 }
          },
          { upsert: true }
        );
      }

      // Update DailyPlan completed hours for that date
      const plan = await DailyPlan.findOne({ userId: user._id, date: sessionDate });
      if (plan) {
        const allSessions = await StudySession.find({ userId: user._id, date: sessionDate });
        const totalMinutes = allSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        plan.completedHours = Math.round((totalMinutes / 60) * 10) / 10;
        await plan.save();
      }

      // Check for first_step badge
      const existingBadges = user.badges?.map((b) => b.id) || [];
      if (!existingBadges.includes('first_step')) {
        await User.findByIdAndUpdate(user._id, {
          $push: { badges: { id: 'first_step', earnedAt: new Date() } }
        });
      }

      return sendJson(res, 201, {
        success: true,
        message: 'Study session recorded',
        session
      });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Error logging session');
  }
}

