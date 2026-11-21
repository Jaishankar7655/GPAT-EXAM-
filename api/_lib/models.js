import mongoose from 'mongoose';

const { Schema } = mongoose;

// 1. User
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    badges: [{ id: String, earnedAt: { type: Date, default: Date.now } }]
  },
  { timestamps: true }
);

// 2. Profile
const profileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    examDate: { type: Date, required: true },
    targetScore: { type: Number, default: 350, min: 100, max: 500 },
    weekdayHours: { type: Number, default: 4, min: 1, max: 16 },
    weekendHours: { type: Number, default: 6, min: 1, max: 16 },
    subjectStrengths: {
      type: Map,
      of: String, // 'weak' | 'medium' | 'strong'
      default: {}
    },
    reminderTimes: {
      morning: { type: String, default: '07:30' },
      evening: { type: String, default: '20:30' }
    },
    preferences: {
      darkMode: { type: Boolean, default: false },
      soundEnabled: { type: Boolean, default: true }
    },
    isSetupCompleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// 3. Subject
const subjectSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    order: { type: Number, default: 0 },
    description: { type: String, default: '' },
    color: { type: String, default: '#1e4d3b' }
  },
  { timestamps: true }
);

// 4. Topic
const topicSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    chapter: { type: String, required: true, index: true },
    title: { type: String, required: true },
    importance: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    estimatedHours: { type: Number, default: 2 },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);
topicSchema.index({ subjectId: 1, chapter: 1, order: 1 });

// 5. UserTopicProgress
const userTopicProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'revised'],
      default: 'not_started',
      index: true
    },
    confidence: { type: Number, min: 1, max: 5, default: 1 },
    revisionCount: { type: Number, default: 0 },
    lastStudiedAt: { type: Date },
    nextRevisionDate: { type: Date, index: true }
  },
  { timestamps: true }
);
userTopicProgressSchema.index({ userId: 1, topicId: 1 }, { unique: true });
userTopicProgressSchema.index({ userId: 1, status: 1 });

// 6. DailyPlan
const dailyPlanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    plannedHours: { type: Number, default: 4 },
    completedHours: { type: Number, default: 0 },
    tasks: [
      {
        id: { type: String, required: true },
        topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
        title: { type: String, required: true },
        subjectName: { type: String, default: '' },
        estimatedMinutes: { type: Number, default: 60 },
        completed: { type: Boolean, default: false },
        isBacklog: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
        notes: { type: String, default: '' }
      }
    ],
    status: { type: String, enum: ['active', 'completed', 'missed'], default: 'active' }
  },
  { timestamps: true }
);
dailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

// 7. StudySession
const studySessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    durationMinutes: { type: Number, required: true },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: Date.now },
    type: { type: String, enum: ['timer', 'pomodoro', 'manual'], default: 'timer' },
    notes: { type: String, default: '' },
    date: { type: String, required: true, index: true } // YYYY-MM-DD
  },
  { timestamps: true }
);
studySessionSchema.index({ userId: 1, date: 1 });

// 8. Question
const questionSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', index: true },
    chapter: { type: String, default: '' },
    questionText: { type: String, required: true },
    options: [
      {
        key: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
        text: { type: String, required: true }
      }
    ],
    correctOption: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    year: { type: String, default: '' } // e.g. "GPAT 2023"
  },
  { timestamps: true }
);
questionSchema.index({ subjectId: 1, topicId: 1 });

// 9. QuizAttempt
const quizAttemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['daily', 'subject', 'mock'], default: 'daily', index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, default: 0 },
    wrongAnswers: { type: Number, default: 0 },
    skippedAnswers: { type: Number, default: 0 },
    score: { type: Number, default: 0 }, // +4 / -1 / 0
    durationSeconds: { type: Number, default: 0 },
    answers: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOption: { type: String }, // 'A' | 'B' | 'C' | 'D' or null
        isCorrect: { type: Boolean, default: false },
        markedForReview: { type: Boolean, default: false },
        timeSpentSeconds: { type: Number, default: 0 }
      }
    ]
  },
  { timestamps: true }
);
quizAttemptSchema.index({ userId: 1, date: 1 });

// 10. DailyScore
const dailyScoreSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    score: { type: Number, required: true, min: 0, max: 100 },
    breakdown: {
      studyTime: { type: Number, default: 0 },
      topicsCompleted: { type: Number, default: 0 },
      quizScore: { type: Number, default: 0 },
      revision: { type: Number, default: 0 }
    },
    streakCount: { type: Number, default: 1 },
    actualHours: { type: Number, default: 0 },
    completedTopicsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);
dailyScoreSchema.index({ userId: 1, date: 1 }, { unique: true });

// 11. MockTest
const mockTestSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    testName: { type: String, required: true },
    date: { type: String, required: true, index: true },
    durationMinutes: { type: Number, default: 180 },
    score: { type: Number, required: true }, // out of 500
    totalMarks: { type: Number, default: 500 },
    accuracyPercent: { type: Number, default: 0 },
    subjectBreakdown: [
      {
        subjectName: String,
        correct: Number,
        wrong: Number,
        skipped: Number,
        score: Number
      }
    ],
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);
mockTestSchema.index({ userId: 1, date: -1 });

// 12. Note
const noteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic', index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }]
  },
  { timestamps: true }
);
noteSchema.index({ userId: 1, topicId: 1 });
noteSchema.index({ title: 'text', content: 'text' });

// 13. Mistake
const mistakeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    quizAttemptId: { type: Schema.Types.ObjectId, ref: 'QuizAttempt' },
    subjectName: { type: String, default: '' },
    topicTitle: { type: String, default: '' },
    questionText: { type: String, required: true },
    options: [
      {
        key: String,
        text: String
      }
    ],
    userSelected: { type: String, required: true },
    correctOption: { type: String, required: true },
    explanation: { type: String, default: '' },
    userReflection: { type: String, default: '' },
    isReviewed: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);
mistakeSchema.index({ userId: 1, questionId: 1 });
mistakeSchema.index({ userId: 1, isReviewed: 1 });

// 14. Reminder
const reminderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['morning_plan', 'evening_check', 'quiz_not_done', 'streak_at_risk', 'revision_due'],
      required: true
    },
    scheduledTime: { type: String, default: '08:00' }, // HH:mm
    daysOfWeek: [{ type: Number }], // 0 (Sun) - 6 (Sat)
    enabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);
reminderSchema.index({ userId: 1, type: 1 });

// 15. PushSubscription
const pushSubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true, index: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    },
    userAgent: { type: String, default: '' }
  },
  { timestamps: true }
);

// Prevent re-registering models upon hot-reload
export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);
export const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);
export const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);
export const UserTopicProgress = mongoose.models.UserTopicProgress || mongoose.model('UserTopicProgress', userTopicProgressSchema);
export const DailyPlan = mongoose.models.DailyPlan || mongoose.model('DailyPlan', dailyPlanSchema);
export const StudySession = mongoose.models.StudySession || mongoose.model('StudySession', studySessionSchema);
export const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);
export const QuizAttempt = mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', quizAttemptSchema);
export const DailyScore = mongoose.models.DailyScore || mongoose.model('DailyScore', dailyScoreSchema);
export const MockTest = mongoose.models.MockTest || mongoose.model('MockTest', mockTestSchema);
export const Note = mongoose.models.Note || mongoose.model('Note', noteSchema);
export const Mistake = mongoose.models.Mistake || mongoose.model('Mistake', mistakeSchema);
export const Reminder = mongoose.models.Reminder || mongoose.model('Reminder', reminderSchema);
export const PushSubscription = mongoose.models.PushSubscription || mongoose.model('PushSubscription', pushSubscriptionSchema);

