import { connectToDatabase } from './_lib/db.js';
import { Subject, Topic, Question } from './_lib/models.js';
import { sendJson, sendError } from './_lib/utils.js';
import { GPAT_SUBJECTS, GPAT_TOPICS, GPAT_QUESTIONS } from '../scripts/seed.js';

export default async function handler(req, res) {
  try {
    await connectToDatabase();

    // 1. Seed Subjects
    const subjectDocMap = {};
    for (const s of GPAT_SUBJECTS) {
      const doc = await Subject.findOneAndUpdate(
        { slug: s.slug },
        { $set: s },
        { upsert: true, new: true }
      );
      subjectDocMap[s.slug] = doc._id;
    }

    // 2. Seed Topics
    const topicDocMap = {};
    for (const t of GPAT_TOPICS) {
      const subId = subjectDocMap[t.subjectSlug];
      if (!subId) continue;

      const doc = await Topic.findOneAndUpdate(
        { subjectId: subId, title: t.title },
        {
          $set: {
            subjectId: subId,
            chapter: t.chapter,
            title: t.title,
            importance: t.importance,
            estimatedHours: t.estimatedHours,
            order: t.order
          }
        },
        { upsert: true, new: true }
      );
      topicDocMap[t.title] = doc._id;
    }

    // 3. Seed Questions
    let qCount = 0;
    for (const q of GPAT_QUESTIONS) {
      const subId = subjectDocMap[q.subjectSlug];
      const topId = topicDocMap[q.chapter] || null;

      await Question.findOneAndUpdate(
        { questionText: q.questionText },
        {
          $set: {
            subjectId: subId,
            topicId: topId,
            chapter: q.chapter,
            questionText: q.questionText,
            options: q.options,
            correctOption: q.correctOption,
            explanation: q.explanation,
            difficulty: q.difficulty,
            year: q.year
          }
        },
        { upsert: true }
      );
      qCount++;
    }

    return sendJson(res, 200, {
      success: true,
      message: 'GPAT Database Seeded Successfully!',
      counts: {
        subjects: GPAT_SUBJECTS.length,
        topics: GPAT_TOPICS.length,
        questions: qCount
      }
    });
  } catch (error) {
    return sendError(res, 500, error.message || 'Seeding error');
  }
}

