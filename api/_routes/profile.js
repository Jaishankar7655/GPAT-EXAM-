import { z } from 'zod';
import { connectToDatabase } from '../_lib/db.js';
import { Profile } from '../_lib/models.js';
import { authenticate } from '../_lib/auth.js';
import { sendJson, sendError, parseAndValidate } from '../_lib/utils.js';

const updateProfileSchema = z.object({
  examDate: z.string().or(z.date()).optional(),
  targetScore: z.number().min(100).max(500).optional(),
  weekdayHours: z.number().min(1).max(16).optional(),
  weekendHours: z.number().min(1).max(16).optional(),
  subjectStrengths: z.record(z.string(), z.enum(['weak', 'medium', 'strong'])).optional(),
  reminderTimes: z
    .object({
      morning: z.string().optional(),
      evening: z.string().optional()
    })
    .optional(),
  preferences: z
    .object({
      darkMode: z.boolean().optional(),
      soundEnabled: z.boolean().optional()
    })
    .optional(),
  isSetupCompleted: z.boolean().optional()
});

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to access your profile');
    }

    await connectToDatabase();

    if (req.method === 'GET') {
      let profile = await Profile.findOne({ userId: user._id });
      if (!profile) {
        profile = await Profile.create({
          userId: user._id,
          examDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          targetScore: 350,
          weekdayHours: 4,
          weekendHours: 6,
          isSetupCompleted: false
        });
      }
      return sendJson(res, 200, { success: true, profile });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const data = await parseAndValidate(req, updateProfileSchema);

      const updateData = { ...data };
      if (data.examDate) {
        updateData.examDate = new Date(data.examDate);
      }

      const updated = await Profile.findOneAndUpdate(
        { userId: user._id },
        { $set: updateData },
        { new: true, upsert: true }
      );

      return sendJson(res, 200, {
        success: true,
        message: 'Profile updated successfully',
        profile: updated
      });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Error updating profile');
  }
}

