import { z } from 'zod';
import { connectToDatabase } from '../_lib/db.js';
import { Mistake } from '../_lib/models.js';
import { authenticate } from '../_lib/auth.js';
import { sendJson, sendError, parseAndValidate } from '../_lib/utils.js';

const updateMistakeSchema = z.object({
  userReflection: z.string().optional(),
  isReviewed: z.boolean().optional()
});

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to access your mistake notebook');
    }

    await connectToDatabase();
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const mistakeId = url.searchParams.get('id');
    const filter = url.searchParams.get('filter');

    if (req.method === 'GET') {
      const query = { userId: user._id };
      if (filter === 'unreviewed') query.isReviewed = false;
      else if (filter === 'reviewed') query.isReviewed = true;

      const mistakes = await Mistake.find(query).sort({ createdAt: -1 }).lean();
      const unreviewedCount = await Mistake.countDocuments({ userId: user._id, isReviewed: false });

      return sendJson(res, 200, {
        success: true,
        mistakes,
        unreviewedCount,
        totalMistakes: mistakes.length
      });
    }

    if (req.method === 'PUT' && mistakeId) {
      const data = await parseAndValidate(req, updateMistakeSchema);

      const updated = await Mistake.findOneAndUpdate(
        { _id: mistakeId, userId: user._id },
        { $set: data },
        { new: true }
      );

      if (!updated) {
        return sendError(res, 404, 'Mistake entry not found');
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Mistake notebook updated',
        mistake: updated
      });
    }

    if (req.method === 'DELETE' && mistakeId) {
      await Mistake.findOneAndDelete({ _id: mistakeId, userId: user._id });
      return sendJson(res, 200, { success: true, message: 'Mistake entry removed' });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Error managing mistake notebook');
  }
}

