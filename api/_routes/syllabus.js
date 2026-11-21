import { connectToDatabase } from '../_lib/db.js';
import { Subject, Topic, UserTopicProgress } from '../_lib/models.js';
import { authenticate } from '../_lib/auth.js';
import { sendJson, sendError } from '../_lib/utils.js';

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to view syllabus');
    }

    await connectToDatabase();

    const subjects = await Subject.find().sort({ order: 1 }).lean();
    const topics = await Topic.find().sort({ order: 1 }).lean();

    const userProgress = await UserTopicProgress.find({ userId: user._id }).lean();
    const progressMap = new Map();
    userProgress.forEach((p) => {
      progressMap.set(p.topicId.toString(), p);
    });

    const subjectMap = {};
    subjects.forEach((sub) => {
      subjectMap[sub._id.toString()] = {
        ...sub,
        chapters: {},
        totalTopics: 0,
        completedTopics: 0,
        revisedTopics: 0,
        inProgressTopics: 0
      };
    });

    topics.forEach((top) => {
      const subId = top.subjectId.toString();
      if (!subjectMap[subId]) return;

      const progress = progressMap.get(top._id.toString()) || {
        status: 'not_started',
        confidence: 1,
        revisionCount: 0,
        lastStudiedAt: null
      };

      const chapterName = top.chapter || 'General Topics';
      if (!subjectMap[subId].chapters[chapterName]) {
        subjectMap[subId].chapters[chapterName] = [];
      }

      subjectMap[subId].chapters[chapterName].push({
        ...top,
        userProgress: {
          status: progress.status,
          confidence: progress.confidence,
          revisionCount: progress.revisionCount,
          lastStudiedAt: progress.lastStudiedAt
        }
      });

      subjectMap[subId].totalTopics += 1;
      if (progress.status === 'completed') subjectMap[subId].completedTopics += 1;
      else if (progress.status === 'revised') subjectMap[subId].revisedTopics += 1;
      else if (progress.status === 'in_progress') subjectMap[subId].inProgressTopics += 1;
    });

    const result = Object.values(subjectMap).map((sub) => {
      const chapterList = Object.entries(sub.chapters).map(([name, topicList]) => ({
        chapterName: name,
        topics: topicList
      }));
      return {
        ...sub,
        chapters: chapterList
      };
    });

    return sendJson(res, 200, {
      success: true,
      subjects: result,
      totalTopicsOverall: topics.length,
      userCompletedOverall: userProgress.filter((p) => p.status === 'completed' || p.status === 'revised').length
    });
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Error fetching syllabus');
  }
}

