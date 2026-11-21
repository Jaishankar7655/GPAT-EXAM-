import { z } from 'zod';
import { connectToDatabase } from '../_lib/db.js';
import { PushSubscription } from '../_lib/models.js';
import { authenticate } from '../_lib/auth.js';
import { sendJson, sendError, parseAndValidate } from '../_lib/utils.js';

const subscriptionSchema = z.object({
  endpoint: z.string().url('Valid push endpoint URL is required'),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  }),
  userAgent: z.string().optional()
});

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to configure push notifications');
    }

    await connectToDatabase();

    if (req.method === 'GET') {
      const publicKey =
        process.env.VAPID_PUBLIC_KEY ||
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBKr3qBUYIHBQFLXY5ceE1L-U';

      const existingSub = await PushSubscription.findOne({ userId: user._id });

      return sendJson(res, 200, {
        success: true,
        publicKey,
        isSubscribed: !!existingSub
      });
    }

    if (req.method === 'POST') {
      const data = await parseAndValidate(req, subscriptionSchema);

      const subscription = await PushSubscription.findOneAndUpdate(
        { endpoint: data.endpoint },
        {
          $set: {
            userId: user._id,
            keys: data.keys,
            userAgent: req.headers['user-agent'] || data.userAgent || ''
          }
        },
        { upsert: true, new: true }
      );

      return sendJson(res, 201, {
        success: true,
        message: 'Push notifications registered successfully',
        subscription
      });
    }

    if (req.method === 'DELETE') {
      await PushSubscription.deleteMany({ userId: user._id });
      return sendJson(res, 200, {
        success: true,
        message: 'Push notifications disabled'
      });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Error managing push notifications');
  }
}

