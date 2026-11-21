import webpush from 'web-push';
import { connectToDatabase } from '../_lib/db.js';
import { PushSubscription, DailyPlan, QuizAttempt, Profile } from '../_lib/models.js';
import { sendJson, sendError, getTodayDateString } from '../_lib/utils.js';

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const reminderType = url.searchParams.get('type') || 'morning';
    const today = getTodayDateString();

    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@gpatexamprepration.vercel.app';

    if (vapidPublic && vapidPrivate && vapidPrivate !== 'YOUR_VAPID_PRIVATE_KEY') {
      try {
        webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
      } catch (e) {
        console.warn('VAPID setup warning:', e.message);
      }
    }

    const subscriptions = await PushSubscription.find().lean();
    let sentCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      try {
        let title = 'GPAT Study Planner';
        let body = 'Time to check your study schedule for today.';
        let tag = 'study-reminder';

        if (reminderType === 'morning') {
          const plan = await DailyPlan.findOne({ userId: sub.userId, date: today });
          const taskCount = plan?.tasks?.length || 3;
          title = '🌅 Good Morning! GPAT Daily Plan Ready';
          body = `You have ${taskCount} study tasks scheduled today. Stay consistent and start early!`;
          tag = 'morning-plan';
        } else if (reminderType === 'evening') {
          const quiz = await QuizAttempt.findOne({ userId: sub.userId, date: today });
          if (!quiz) {
            title = '⚠️ Daily Quiz Pending!';
            body = 'You have not completed your 15-question daily quiz yet. Protect your streak!';
            tag = 'quiz-pending';
          } else {
            title = '🌙 Evening Study Check';
            body = 'Review today’s completed topics and check off remaining tasks before bed.';
            tag = 'evening-check';
          }
        }

        const payload = JSON.stringify({
          title,
          body,
          icon: '/icon.svg',
          tag,
          url: '/dashboard'
        });

        if (vapidPublic && vapidPrivate && vapidPrivate !== 'YOUR_VAPID_PRIVATE_KEY') {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys
            },
            payload
          );
        }
        sentCount++;
      } catch (err) {
        failedCount++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    }

    return sendJson(res, 200, {
      success: true,
      message: `Cron job executed for ${reminderType} reminders`,
      processed: subscriptions.length,
      sentCount,
      failedCount
    });
  } catch (error) {
    return sendError(res, 500, error.message || 'Error executing cron job');
  }
}

