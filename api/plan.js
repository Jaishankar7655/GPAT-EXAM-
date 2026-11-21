import { z } from 'zod';
import { connectToDatabase } from './_lib/db.js';
import { DailyPlan, Profile, Topic, Subject, UserTopicProgress } from './_lib/models.js';
import { authenticate } from './_lib/auth.js';
import { sendJson, sendError, parseAndValidate, getTodayDateString, isWeekend } from './_lib/utils.js';

const taskUpdateSchema = z.object({
  taskId: z.string(),
  completed: z.boolean().optional(),
  title: z.string().optional(),
  estimatedMinutes: z.number().optional(),
  notes: z.string().optional()
});

const addTaskSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  subjectName: z.string().optional(),
  topicId: z.string().optional(),
  estimatedMinutes: z.number().default(60),
  isBacklog: z.boolean().default(false)
});

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to view your daily plan');
    }

    await connectToDatabase();
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const dateParam = url.searchParams.get('date') || getTodayDateString();
    const action = url.searchParams.get('action');

    // 1. GET or AUTO-GENERATE Plan for the requested date
    if (req.method === 'GET') {
      let plan = await DailyPlan.findOne({ userId: user._id, date: dateParam });

      if (!plan && dateParam === getTodayDateString()) {
        plan = await generateSmartDailyPlan(user._id, dateParam);
      }

      return sendJson(res, 200, {
        success: true,
        date: dateParam,
        plan: plan || {
          date: dateParam,
          plannedHours: 4,
          completedHours: 0,
          tasks: [],
          status: 'active'
        }
      });
    }

    // 2. POST Force Regenerate Plan
    if (req.method === 'POST' && action === 'regenerate') {
      const plan = await generateSmartDailyPlan(user._id, dateParam, true);
      return sendJson(res, 200, {
        success: true,
        message: 'Daily plan regenerated successfully',
        plan
      });
    }

    // 3. POST Add New Task to Plan
    if (req.method === 'POST' && action === 'add-task') {
      const taskData = await parseAndValidate(req, addTaskSchema);

      let plan = await DailyPlan.findOne({ userId: user._id, date: dateParam });
      if (!plan) {
        plan = await generateSmartDailyPlan(user._id, dateParam);
      }

      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        title: taskData.title,
        subjectName: taskData.subjectName || 'General',
        topicId: taskData.topicId || null,
        estimatedMinutes: taskData.estimatedMinutes,
        completed: false,
        isBacklog: taskData.isBacklog,
        order: plan.tasks.length,
        notes: ''
      };

      plan.tasks.push(newTask);
      plan.plannedHours = Math.round((plan.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) / 60) * 10) / 10;
      await plan.save();

      return sendJson(res, 201, {
        success: true,
        message: 'Task added to daily plan',
        task: newTask,
        plan
      });
    }

    // 4. PUT Update Task status/details
    if (req.method === 'PUT') {
      const { taskId, completed, title, estimatedMinutes, notes } = await parseAndValidate(req, taskUpdateSchema);

      const plan = await DailyPlan.findOne({ userId: user._id, date: dateParam });
      if (!plan) {
        return sendError(res, 404, 'Daily plan not found for this date');
      }

      const taskIndex = plan.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) {
        return sendError(res, 404, 'Task not found in daily plan');
      }

      if (completed !== undefined) plan.tasks[taskIndex].completed = completed;
      if (title !== undefined) plan.tasks[taskIndex].title = title;
      if (estimatedMinutes !== undefined) plan.tasks[taskIndex].estimatedMinutes = estimatedMinutes;
      if (notes !== undefined) plan.tasks[taskIndex].notes = notes;

      // Recalculate completed hours
      const completedMins = plan.tasks.filter((t) => t.completed).reduce((sum, t) => sum + t.estimatedMinutes, 0);
      plan.completedHours = Math.round((completedMins / 60) * 10) / 10;

      await plan.save();

      // If task is completed and linked to a topic, mark UserTopicProgress
      if (completed && plan.tasks[taskIndex].topicId) {
        await UserTopicProgress.findOneAndUpdate(
          { userId: user._id, topicId: plan.tasks[taskIndex].topicId },
          { $set: { status: 'completed', lastStudiedAt: new Date() } },
          { upsert: true }
        );
      }

      return sendJson(res, 200, {
        success: true,
        message: 'Task updated',
        plan
      });
    }

    // 5. DELETE Task
    if (req.method === 'DELETE') {
      const taskId = url.searchParams.get('taskId');
      if (!taskId) {
        return sendError(res, 400, 'taskId parameter is required');
      }

      const plan = await DailyPlan.findOne({ userId: user._id, date: dateParam });
      if (!plan) {
        return sendError(res, 404, 'Plan not found');
      }

      plan.tasks = plan.tasks.filter((t) => t.id !== taskId);
      const totalMins = plan.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
      plan.plannedHours = Math.round((totalMins / 60) * 10) / 10;
      await plan.save();

      return sendJson(res, 200, { success: true, message: 'Task deleted', plan });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Error handling daily plan');
  }
}

/**
 * Smart generator for daily study tasks
 */
async function generateSmartDailyPlan(userId, dateStr, force = false) {
  if (force) {
    await DailyPlan.deleteOne({ userId, date: dateStr });
  }

  // 1. Fetch user profile
  let profile = await Profile.findOne({ userId });
  if (!profile) {
    profile = { weekdayHours: 4, weekendHours: 6, subjectStrengths: new Map() };
  }

  const isWknd = isWeekend(dateStr);
  const targetStudyHours = isWknd ? profile.weekendHours || 6 : profile.weekdayHours || 4;

  const tasks = [];
  let allocatedMinutes = 0;
  const maxTargetMinutes = targetStudyHours * 60;

  // 2. Check yesterday's backlog tasks
  const yesterdayStr = getTodayDateString(-1);
  const yesterdayPlan = await DailyPlan.findOne({ userId, date: yesterdayStr });
  if (yesterdayPlan) {
    const uncompletedTasks = yesterdayPlan.tasks.filter((t) => !t.completed);
    uncompletedTasks.forEach((backlogTask) => {
      if (allocatedMinutes < maxTargetMinutes) {
        tasks.push({
          id: 'backlog_' + backlogTask.id,
          topicId: backlogTask.topicId,
          title: `[Backlog] ${backlogTask.title}`,
          subjectName: backlogTask.subjectName,
          estimatedMinutes: backlogTask.estimatedMinutes || 60,
          completed: false,
          isBacklog: true,
          order: tasks.length,
          notes: 'Carried over from yesterday'
        });
        allocatedMinutes += backlogTask.estimatedMinutes || 60;
      }
    });
  }

  // 3. Find topics due for revision today
  const dueRevisions = await UserTopicProgress.find({
    userId,
    status: { $in: ['completed', 'revised'] },
    nextRevisionDate: { $lte: new Date() }
  })
    .populate('topicId')
    .limit(2);

  dueRevisions.forEach((rev) => {
    if (rev.topicId && allocatedMinutes + 45 <= maxTargetMinutes) {
      tasks.push({
        id: 'rev_' + rev.topicId._id.toString(),
        topicId: rev.topicId._id,
        title: `Revision: ${rev.topicId.title}`,
        subjectName: 'Revision Due',
        estimatedMinutes: 45,
        completed: false,
        isBacklog: false,
        order: tasks.length,
        notes: `Confidence: ${rev.confidence}/5`
      });
      allocatedMinutes += 45;
    }
  });

  // 4. Fill remaining time with weak subject topics or not started topics
  if (allocatedMinutes < maxTargetMinutes) {
    const subjects = await Subject.find().lean();
    const strengths = profile.subjectStrengths ? Object.fromEntries(profile.subjectStrengths) : {};

    // Sort subjects so 'weak' come first, then 'medium', then 'strong'
    subjects.sort((a, b) => {
      const priorityMap = { weak: 1, medium: 2, strong: 3 };
      const prioA = priorityMap[strengths[a.slug] || 'medium'] || 2;
      const prioB = priorityMap[strengths[b.slug] || 'medium'] || 2;
      return prioA - prioB;
    });

    const userCompletedProgress = await UserTopicProgress.find({
      userId,
      status: { $in: ['completed', 'revised'] }
    }).select('topicId');
    const doneTopicIds = new Set(userCompletedProgress.map((p) => p.topicId.toString()));

    for (const sub of subjects) {
      if (allocatedMinutes >= maxTargetMinutes) break;

      const candidates = await Topic.find({
        subjectId: sub._id,
        _id: { $nin: Array.from(doneTopicIds) }
      })
        .sort({ importance: -1, order: 1 })
        .limit(3);

      for (const topic of candidates) {
        if (allocatedMinutes + 60 <= maxTargetMinutes + 30) {
          tasks.push({
            id: 'top_' + topic._id.toString(),
            topicId: topic._id,
            title: topic.title,
            subjectName: sub.name,
            estimatedMinutes: 60,
            completed: false,
            isBacklog: false,
            order: tasks.length,
            notes: `High priority topic in ${sub.name}`
          });
          allocatedMinutes += 60;
          doneTopicIds.add(topic._id.toString());
        }
      }
    }
  }

  // 5. Always include Daily Quiz slot (20 mins)
  tasks.push({
    id: 'quiz_' + Date.now(),
    title: 'Daily Practice Quiz (15 Questions)',
    subjectName: 'Test & Review',
    estimatedMinutes: 20,
    completed: false,
    isBacklog: false,
    order: tasks.length,
    notes: 'Test weak topics and revisions'
  });

  const plannedHours = Math.round((tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) / 60) * 10) / 10;

  const plan = await DailyPlan.create({
    userId,
    date: dateStr,
    plannedHours,
    completedHours: 0,
    tasks,
    status: 'active'
  });

  return plan;
}

