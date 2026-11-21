import { z } from 'zod';
import { connectToDatabase } from '../_lib/db.js';
import { UserTopicProgress, Topic, User } from '../_lib/models.js';
import { authenticate } from '../_lib/auth.js';
import { sendJson, sendError, parseAndValidate } from '../_lib/utils.js';

const progressUpdateSchema = z.object({
  topicId: z.string().min(1, 'Topic ID is required'),
  status: z.enum(['not_started', 'in_progress', 'completed', 'revised']).optional(),
  confidence: z.number().min(1).max(5).optional(),
  notes: z.string().optional()
});

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to update progress');
    }

    await connectToDatabase();

    if (req.method === 'POST' || req.method === 'PUT') {
      const { topicId, status, confidence } = await parseAndValidate(req, progressUpdateSchema);

      const updateFields = {
        lastStudiedAt: new Date()
      };

      if (status !== undefined) {
        updateFields.status = status;
        if (status === 'completed') {
          const revDate = new Date();
          revDate.setDate(revDate.getDate() + 3);
          updateFields.nextRevisionDate = revDate;
        } else if (status === 'revised') {
          const revDate = new Date();
          revDate.setDate(revDate.getDate() + 7);
          updateFields.nextRevisionDate = revDate;
        }
      }

      if (confidence !== undefined) {
        updateFields.confidence = confidence;
      }

      const progress = await UserTopicProgress.findOneAndUpdate(
        { userId: user._id, topicId },
        {
          $set: updateFields,
          ...(status === 'revised' ? { $inc: { revisionCount: 1 } } : {})
        },
        { new: true, upsert: true }
      );

      const totalTopicsCount = await Topic.countDocuments();
      if (totalTopicsCount > 0) {
        const completedCount = await UserTopicProgress.countDocuments({
          userId: user._id,
          status: { $in: ['completed', 'revised'] }
        });

        const percent = Math.round((completedCount / totalTopicsCount) * 100);
        const existingBadges = user.badges?.map((b) => b.id) || [];
        const newBadges = [];

        if (percent >= 25 && !existingBadges.includes('syllabus_25')) {
          newBadges.push({ id: 'syllabus_25', earnedAt: new Date() });
        }
        if (percent >= 50 && !existingBadges.includes('syllabus_50')) {
          newBadges.push({ id: 'syllabus_50', earnedAt: new Date() });
        }
        if (percent >= 100 && !existingBadges.includes('syllabus_100')) {
          newBadges.push({ id: 'syllabus_100', earnedAt: new Date() });
        }

        if (newBadges.length > 0) {
          await User.findByIdAndUpdate(user._id, {
            $push: { badges: { $each: newBadges } }
          });
        }
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Topic progress updated',
        progress
      });
    }

    if (req.method === 'GET') {
      const userProgress = await UserTopicProgress.find({ userId: user._id }).lean();
      return sendJson(res, 200, { success: true, progress: userProgress });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Error updating progress');
  }
}

