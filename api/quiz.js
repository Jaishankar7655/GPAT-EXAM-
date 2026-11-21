import { z } from 'zod';
import { connectToDatabase } from './_lib/db.js';
import { Question, QuizAttempt, Mistake, UserTopicProgress, Subject, Topic, User } from './_lib/models.js';
import { authenticate } from './_lib/auth.js';
import { sendJson, sendError, parseAndValidate, getTodayDateString } from './_lib/utils.js';
import { DAILY_QUIZ_CONFIG, EXAM_RULES } from './_lib/config.js';

const submitQuizSchema = z.object({
  type: z.enum(['daily', 'subject', 'mock']).default('daily'),
  subjectId: z.string().optional(),
  durationSeconds: z.number().default(0),
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOption: z.string().nullable().optional(), // 'A' | 'B' | 'C' | 'D'
      markedForReview: z.boolean().default(false),
      timeSpentSeconds: z.number().default(0)
    })
  )
});

export default async function handler(req, res) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return sendError(res, 401, 'Please sign in to access quizzes');
    }

    await connectToDatabase();
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const action = url.searchParams.get('action');

    // 1. GET Questions for Quiz (Daily 15, Subject, or Mock)
    if (req.method === 'GET' && (!action || action === 'questions')) {
      const type = url.searchParams.get('type') || 'daily';
      const subjectId = url.searchParams.get('subjectId');

      let limit = DAILY_QUIZ_CONFIG.questionsCount; // 15
      let query = {};

      if (type === 'subject' && subjectId) {
        query.subjectId = subjectId;
        limit = 30;
      } else if (type === 'mock') {
        limit = EXAM_RULES.totalQuestions; // 125
      } else {
        // Daily Quiz: prioritize weak topics & revisions
        // Check topics user is struggling with (confidence <= 2)
        const weakProgress = await UserTopicProgress.find({
          userId: user._id,
          confidence: { $lte: 2 }
        })
          .select('topicId')
          .limit(10);

        const weakTopicIds = weakProgress.map((p) => p.topicId);
        if (weakTopicIds.length > 0) {
          // Find questions matching these topics first
          query = {
            $or: [{ topicId: { $in: weakTopicIds } }, {}]
          };
        }
      }

      // Sample questions randomly
      const questions = await Question.aggregate([
        { $match: query },
        { $sample: { size: limit } },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subject'
          }
        },
        {
          $project: {
            questionText: 1,
            options: 1,
            difficulty: 1,
            year: 1,
            chapter: 1,
            subjectId: 1,
            subjectName: { $arrayElemAt: ['$subject.name', 0] }
            // Do NOT return correctOption or explanation before submitting!
          }
        }
      ]);

      return sendJson(res, 200, {
        success: true,
        type,
        count: questions.length,
        durationMinutes:
          type === 'mock'
            ? EXAM_RULES.durationMinutes
            : type === 'subject'
            ? 45
            : DAILY_QUIZ_CONFIG.durationMinutes,
        questions
      });
    }

    // 2. POST Submit Quiz Attempt
    if (req.method === 'POST') {
      const data = await parseAndValidate(req, submitQuizSchema);
      const questionIds = data.answers.map((a) => a.questionId);

      // Fetch questions with correct answers and explanations
      const fullQuestions = await Question.find({ _id: { $in: questionIds } })
        .populate('subjectId', 'name')
        .populate('topicId', 'title')
        .lean();

      const questionMap = new Map();
      fullQuestions.forEach((q) => questionMap.set(q._id.toString(), q));

      let correctCount = 0;
      let wrongCount = 0;
      let skippedCount = 0;
      let totalMarks = 0;

      const processedAnswers = [];
      const newMistakes = [];

      for (const ans of data.answers) {
        const q = questionMap.get(ans.questionId);
        if (!q) continue;

        const isSkipped = !ans.selectedOption || ans.selectedOption === '';
        const isCorrect = !isSkipped && ans.selectedOption === q.correctOption;

        if (isSkipped) {
          skippedCount += 1;
        } else if (isCorrect) {
          correctCount += 1;
          totalMarks += EXAM_RULES.marksPerCorrect; // +4
        } else {
          wrongCount += 1;
          totalMarks += EXAM_RULES.marksPerWrong; // -1

          // Save to Mistake notebook automatically!
          newMistakes.push({
            userId: user._id,
            questionId: q._id,
            subjectName: q.subjectId?.name || 'General',
            topicTitle: q.topicId?.title || q.chapter || '',
            questionText: q.questionText,
            options: q.options,
            userSelected: ans.selectedOption,
            correctOption: q.correctOption,
            explanation: q.explanation || 'No explanation provided.',
            userReflection: '',
            isReviewed: false
          });
        }

        processedAnswers.push({
          questionId: q._id,
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          explanation: q.explanation,
          selectedOption: ans.selectedOption || null,
          isCorrect,
          markedForReview: ans.markedForReview,
          timeSpentSeconds: ans.timeSpentSeconds
        });
      }

      // Record Quiz Attempt
      const attempt = await QuizAttempt.create({
        userId: user._id,
        type: data.type,
        subjectId: data.subjectId || null,
        date: getTodayDateString(),
        totalQuestions: data.answers.length,
        correctAnswers: correctCount,
        wrongAnswers: wrongCount,
        skippedAnswers: skippedCount,
        score: totalMarks,
        durationSeconds: data.durationSeconds,
        answers: processedAnswers.map((a) => ({
          questionId: a.questionId,
          selectedOption: a.selectedOption,
          isCorrect: a.isCorrect,
          markedForReview: a.markedForReview,
          timeSpentSeconds: a.timeSpentSeconds
        }))
      });

      // Insert mistakes (avoid duplicates for same user and question)
      for (const m of newMistakes) {
        m.quizAttemptId = attempt._id;
        await Mistake.findOneAndUpdate(
          { userId: user._id, questionId: m.questionId },
          { $set: m },
          { upsert: true }
        );
      }

      // Award Quiz Master badge if applicable
      const totalDailyQuizzes = await QuizAttempt.countDocuments({
        userId: user._id,
        type: 'daily',
        score: { $gte: 36 } // 80%+ of 45
      });
      if (totalDailyQuizzes >= 5) {
        await User.findByIdAndUpdate(user._id, {
          $addToSet: { badges: { id: 'quiz_master', earnedAt: new Date() } }
        });
      }

      return sendJson(res, 201, {
        success: true,
        message: 'Quiz evaluated successfully',
        summary: {
          totalQuestions: data.answers.length,
          correctAnswers: correctCount,
          wrongAnswers: wrongCount,
          skippedAnswers: skippedCount,
          score: totalMarks,
          accuracyPercent:
            correctCount + wrongCount > 0
              ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
              : 0
        },
        review: processedAnswers
      });
    }

    return sendError(res, 405, 'Method not allowed');
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Error processing quiz');
  }
}

