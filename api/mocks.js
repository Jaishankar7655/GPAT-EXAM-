import { z } from 'zod';
import { connectToDatabase } from './_lib/db.js';
import { MockTest, User } from './_lib/models.js';
import { authenticate } from './_lib/auth.js';
import { sendJson, sendError, parseAndValidate, getTodayDateString } from './_lib/utils.js';

const mockSchema = z.object({
  testName: z.string().min(2, 'Test name is required'),
  score: z.number().min(-125).max(500),
  totalMarks: z.number().default(500),
  durationMinutes: z.number().default(180),
  accuracyPercent: z.number().min(0).max(100).default(0),
  subjectBreakdown: z
    .array(
      z.object({
        subjectName: z.string(),
        correct: z.number(),
        wrong: z.number(),
        skipped: z.number(),
        score: z.number()
      })
    )
    .optional(),
  notes: z.string().optional()
});

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to access mock tests');
    }

    await connectToDatabase();

    // 1. GET Mock test history
    if (req.method === 'GET') {
      const mocks = await MockTest.find({ userId: user._id }).sort({ date: -1, createdAt: -1 }).lean();
      return sendJson(res, 200, { success: true, mocks });
    }

    // 2. POST Log Mock Test
    if (req.method === 'POST') {
      const data = await parseAndValidate(req, mockSchema);

      const mock = await MockTest.create({
        userId: user._id,
        testName: data.testName,
        date: getTodayDateString(),
        score: data.score,
        totalMarks: data.totalMarks,
        durationMinutes: data.durationMinutes,
        accuracyPercent: data.accuracyPercent,
        subjectBreakdown: data.subjectBreakdown || [],
        notes: data.notes || ''
      });

      // Award badge if first mock test
      await User.findByIdAndUpdate(user._id, {
        $addToSet: { badges: { id: 'mock_finisher', earnedAt: new Date() } }
      });

      return sendJson(res, 201, {
        success: true,
        message: 'Mock test logged successfully',
        mock
      });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Error handling mock test');
  }
}

