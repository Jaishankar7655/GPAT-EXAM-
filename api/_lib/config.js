/**
 * GPAT Examination Rules & Scoring Configuration
 * Kept in one central place for easy modifications
 */

export const EXAM_RULES = {
  totalQuestions: 125,
  totalMarks: 500,
  durationMinutes: 180,
  marksPerCorrect: 4,
  marksPerWrong: -1,
  marksPerSkip: 0,
  sections: [
    { id: 'pharmaceutics', name: 'Pharmaceutics', defaultQuestions: 38 },
    { id: 'pharmacology', name: 'Pharmacology', defaultQuestions: 28 },
    { id: 'chemistry', name: 'Pharmaceutical Chemistry', defaultQuestions: 38 },
    { id: 'pharmacognosy', name: 'Pharmacognosy', defaultQuestions: 10 },
    { id: 'other', name: 'Jurisprudence & Other Subjects', defaultQuestions: 11 }
  ]
};

export const DAILY_QUIZ_CONFIG = {
  questionsCount: 15,
  durationMinutes: 20,
  marksPerCorrect: 4,
  marksPerWrong: -1,
  marksPerSkip: 0
};

export const SCORE_FORMULA = {
  maxDailyScore: 100,
  weights: {
    studyTime: 30,       // Up to 30 points for reaching planned study hours
    topicsCompleted: 25, // Up to 25 points for completing scheduled topics
    quizScore: 30,       // Up to 30 points based on daily quiz accuracy
    revision: 15         // Up to 15 points for reviewing flagged/past topics
  },
  targets: {
    minimumQuizPassPercent: 50,
    dailyRevisionMinutes: 30
  }
};

/**
 * Calculate daily score (0 - 100) based on formula
 * @param {Object} metrics
 * @param {number} metrics.plannedHours
 * @param {number} metrics.actualHours
 * @param {number} metrics.plannedTopics
 * @param {number} metrics.completedTopics
 * @param {number} metrics.quizCorrect
 * @param {number} metrics.quizTotal
 * @param {boolean} metrics.revisionDone
 * @returns {number} calculated score rounded to 1 decimal place
 */
export function calculateDailyScore({
  plannedHours = 4,
  actualHours = 0,
  plannedTopics = 3,
  completedTopics = 0,
  quizCorrect = 0,
  quizTotal = 15,
  revisionDone = false
}) {
  // 1. Study Time Score (max 30)
  const timeRatio = plannedHours > 0 ? Math.min(actualHours / plannedHours, 1.2) : 1;
  const timeScore = Math.min(SCORE_FORMULA.weights.studyTime, timeRatio * SCORE_FORMULA.weights.studyTime);

  // 2. Topics Score (max 25)
  const topicRatio = plannedTopics > 0 ? Math.min(completedTopics / plannedTopics, 1) : (completedTopics > 0 ? 1 : 0);
  const topicScore = topicRatio * SCORE_FORMULA.weights.topicsCompleted;

  // 3. Quiz Score (max 30)
  const quizRatio = quizTotal > 0 ? Math.max(0, quizCorrect / quizTotal) : 0;
  const quizScore = quizRatio * SCORE_FORMULA.weights.quizScore;

  // 4. Revision Score (max 15)
  const revisionScore = revisionDone ? SCORE_FORMULA.weights.revision : 0;

  const total = timeScore + topicScore + quizScore + revisionScore;
  return Math.min(SCORE_FORMULA.maxDailyScore, Math.round(total * 10) / 10);
}

export const BADGES = [
  { id: 'first_step', name: 'First Step', description: 'Completed your first study session', icon: 'flag' },
  { id: 'streak_3', name: 'Consistent Learner', description: 'Maintained a 3-day study streak', icon: 'flame' },
  { id: 'streak_7', name: 'Week Warrior', description: 'Maintained a 7-day study streak', icon: 'zap' },
  { id: 'streak_30', name: 'Iron Will', description: 'Maintained a 30-day study streak', icon: 'shield' },
  { id: 'quiz_master', name: 'Quiz Master', description: 'Scored 80%+ on 5 daily quizzes', icon: 'award' },
  { id: 'mock_finisher', name: 'Mock Champion', description: 'Completed a full 180-minute mock test', icon: 'check-circle' },
  { id: 'syllabus_25', name: 'Quarter Mile', description: 'Finished 25% of the syllabus', icon: 'book' },
  { id: 'syllabus_50', name: 'Halfway There', description: 'Finished 50% of the syllabus', icon: 'compass' },
  { id: 'syllabus_100', name: 'GPAT Ready', description: 'Completed 100% of all syllabus topics', icon: 'star' }
];

