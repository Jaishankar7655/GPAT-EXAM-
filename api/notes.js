import { z } from 'zod';
import { connectToDatabase } from './_lib/db.js';
import { Note } from './_lib/models.js';
import { authenticate } from './_lib/auth.js';
import { sendJson, sendError, parseAndValidate } from './_lib/utils.js';

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  topicId: z.string().optional(),
  subjectId: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to access notes');
    }

    await connectToDatabase();
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const noteId = url.searchParams.get('id');
    const topicId = url.searchParams.get('topicId');
    const search = url.searchParams.get('search');

    // 1. GET Notes
    if (req.method === 'GET') {
      const query = { userId: user._id };
      if (topicId) query.topicId = topicId;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ];
      }

      const notes = await Note.find(query)
        .sort({ updatedAt: -1 })
        .populate('topicId', 'title chapter')
        .populate('subjectId', 'name')
        .lean();

      return sendJson(res, 200, { success: true, notes });
    }

    // 2. POST Create Note
    if (req.method === 'POST') {
      const data = await parseAndValidate(req, noteSchema);

      const note = await Note.create({
        userId: user._id,
        title: data.title,
        content: data.content,
        topicId: data.topicId || null,
        subjectId: data.subjectId || null,
        tags: data.tags || []
      });

      return sendJson(res, 201, { success: true, message: 'Note created', note });
    }

    // 3. PUT Update Note
    if (req.method === 'PUT' && noteId) {
      const data = await parseAndValidate(req, noteSchema.partial());

      const updated = await Note.findOneAndUpdate(
        { _id: noteId, userId: user._id },
        { $set: data },
        { new: true }
      );

      if (!updated) {
        return sendError(res, 404, 'Note not found');
      }

      return sendJson(res, 200, { success: true, message: 'Note updated', note: updated });
    }

    // 4. DELETE Note
    if (req.method === 'DELETE' && noteId) {
      await Note.findOneAndDelete({ _id: noteId, userId: user._id });
      return sendJson(res, 200, { success: true, message: 'Note deleted' });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Error managing notes');
  }
}

