# GPAT Exam Preparation & Study Tracker

A clean, focused study-planning web app built for GPAT (Graduate Pharmacy Aptitude Test) aspirants.

## What it does

| Feature | Detail |
|---|---|
| **Dashboard** | Today's hours left, tasks done, pace check, subject progress, consistency calendar, weak topic list |
| **Daily Plan** | Auto-generated smart study schedule (backlog carry-over, revision-due, weak-first ordering) |
| **Syllabus Tracker** | All 5 GPAT subjects, 34 chapters, full topic list — status (not started / in progress / completed / revised) + 1–5 confidence rating |
| **Study Timer** | Pomodoro (25 m / 5 m) or free stopwatch; manual entry for offline study; sessions synced to daily score |
| **Practice Quiz** | Daily 15-question quiz, subject test (30 Qs), full 125-question mock — real marking (+4 / −1 / 0) |
| **Mistake Notebook** | Auto-saves every wrong answer with explanation; write personal reflections |
| **Quick Revision Sheets** | Drug class MOA tables, pharmacy formulas, Acts & Schedules summary, resource links |
| **Score System** | Daily score 0–100 (Study Time 30 + Topics 25 + Quiz 30 + Revision 15) |
| **Badges & Streaks** | 9 milestone badges, streak tracking, weekly averages |
| **Push Notifications** | Morning plan + evening check via Vercel Cron & browser push |
| **Dark Mode** | Full system-aware dark theme |
| **PWA** | Installable on mobile / desktop |
| **Export** | Download study sessions and syllabus progress as CSV |

## Exam Rules (GPAT 2024–25)

- **125 questions • 500 marks • 180 minutes**
- Correct answer: **+4** | Wrong answer: **−1** | Skipped: **0**

---

## Tech Stack

```
React 19 + Vite 6          — Frontend
Tailwind CSS 4             — Styling
Recharts 3                 — Charts & analytics
Vercel Serverless Functions — /api (zero separate server)
MongoDB Atlas + Mongoose 9  — Database
JWT (httpOnly cookie)       — Authentication
Zod 4                      — API input validation
web-push                   — Browser push notifications
Vercel Cron                — Scheduled reminders
```

---

## Folder Structure

```
GPAT/
├── api/                        # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── auth.js             # JWT sign / verify / httpOnly cookie
│   │   ├── config.js           # EXAM_RULES, SCORE_FORMULA, BADGES
│   │   ├── db.js               # Mongoose connection (cached across invocations)
│   │   ├── models.js           # All 15 Mongoose schemas with indexes
│   │   └── utils.js            # sendJson, sendError, parseAndValidate, getTodayDateString
│   ├── auth.js                 # POST register / login / logout, GET me
│   ├── profile.js              # GET / PUT profile
│   ├── syllabus.js             # GET all subjects + topics + user progress
│   ├── progress.js             # POST update topic status & confidence
│   ├── plan.js                 # GET/POST/PUT/DELETE daily study plan + auto-generator
│   ├── sessions.js             # GET/POST study sessions
│   ├── quiz.js                 # GET questions / POST submit quiz → saves mistakes
│   ├── score.js                # GET daily score, breakdown, streak, badges
│   ├── analytics.js            # GET dashboard analytics, pace check, charts data
│   ├── mocks.js                # GET/POST mock test log
│   ├── notes.js                # CRUD topic notes
│   ├── mistakes.js             # GET/PUT/DELETE mistake notebook
│   ├── resources.js            # GET revision sheets (drug classes, formulas, acts)
│   ├── push.js                 # GET VAPID key / POST subscribe / DELETE unsubscribe
│   ├── cron.js                 # Vercel Cron handler (morning + evening push)
│   └── seed.js                 # One-time seed endpoint for Vercel deploys
├── scripts/
│   └── seed.js                 # Node.js seed script (run locally)
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── BottomNav.jsx
│   │   ├── StatCard.jsx
│   │   ├── EmptyState.jsx
│   │   ├── LoadingSkeleton.jsx
│   │   └── Modal.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── pages/
│   │   ├── AuthPage.jsx
│   │   ├── SetupPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── DailyPlanPage.jsx
│   │   ├── SyllabusPage.jsx
│   │   ├── TimerPage.jsx
│   │   ├── QuizPage.jsx
│   │   ├── MistakeNotebookPage.jsx
│   │   ├── RevisionSheetsPage.jsx
│   │   └── SettingsPage.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
│   ├── icon.svg
│   ├── manifest.json
│   └── sw.js
├── .env                        # Git-ignored — your secrets
├── .env.example                # Commit-safe template
├── .gitignore
├── index.html
├── package.json
├── vercel.json
└── vite.config.js
```

---

## Setup — Run Locally

### 1. Prerequisites

- Node.js v18+ and npm v9+
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) account (cluster already set up)
- A [Vercel](https://vercel.com) account for deployment

### 2. Install Dependencies

```bash
cd GPAT
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and confirm the values match yours (they are already filled for this project):

```env
MONGODB_URI="mongodb+srv://jaishankarp089_db_user:ds2Y2EWn9wUnau2d@cluster0.hh5c4ci.mongodb.net/gpat_prep?retryWrites=true&w=majority"
JWT_SECRET="gpat_prep_secret_jwt_key_2026_super_secure_random_hash"
NODE_ENV="development"
APP_URL="https://gpatexamprepration.vercel.app"
# Optional for push notifications:
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
```

### 4. Seed the Database (GPAT Syllabus + Sample Questions)

This runs once to populate MongoDB Atlas with 5 subjects, 34 high-yield topics, and 15 practice questions:

```bash
npm run seed
```

You should see:
```
Connected to MongoDB Atlas.
Upserted 5 subjects.
Upserted 34 syllabus topics.
Upserted 15 GPAT questions.
Database seeding complete!
```

### 5. Run Development Server

```bash
npm run dev
```

App opens at **http://localhost:3000**

The Vite dev server proxies `/api/*` requests directly to the serverless function handlers — no separate backend process needed.

### 6. Create Your Account

Go to `http://localhost:3000`, click **Create Account**, and complete the one-time setup (exam date, target score, weekly hours, subject strengths).

---

## Deployment — Vercel

### 1. Push to GitHub (create a new repo first)

```bash
git init
git add .
git commit -m "Initial GPAT Prep app"
git remote add origin https://github.com/YOUR_USERNAME/gpat-prep.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import the GitHub repo.
2. Framework preset: **Vite**
3. Add all environment variables from your `.env` file in the Vercel dashboard (Settings → Environment Variables).

### 3. Seed the Production Database

After deploying, visit:
```
https://gpatexamprepration.vercel.app/api/seed
```
This runs the seed script on the production database.

### 4. Generate VAPID Keys for Push Notifications (Optional)

```bash
npx web-push generate-vapid-keys
```

Add the output to Vercel environment variables as `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`.

---

## MongoDB Schemas at a Glance

| Collection | Key Indexes |
|---|---|
| `users` | `email` (unique) |
| `profiles` | `userId` (unique) |
| `subjects` | `slug` (unique) |
| `topics` | `subjectId`, `chapter`, compound (`subjectId`, `chapter`, `order`) |
| `usertopicprogresses` | `userId + topicId` (unique), `userId + status` |
| `dailyplans` | `userId + date` (unique) |
| `studysessions` | `userId`, `date`, compound (`userId + date`) |
| `questions` | `subjectId`, compound (`subjectId + topicId`) |
| `quizattempts` | `userId`, `date`, compound (`userId + date`) |
| `dailyscores` | `userId + date` (unique) |
| `mocktests` | `userId`, `date` descending |
| `notes` | `userId`, text index on `title + content` |
| `mistakes` | `userId + questionId`, `userId + isReviewed` |
| `reminders` | `userId + type` |
| `pushsubscriptions` | `userId`, `endpoint` (unique) |

---

## Daily Score Formula

```
Daily Score (0–100) =
  Study Time Points    (max 30)  × (actual_hours / planned_hours)
+ Topics Done Points   (max 25)  × (completed_topics / planned_topics)
+ Quiz Accuracy Points (max 30)  × (correct / total_quiz_questions)
+ Revision Points      (max 15)  × (1 if any revision done today, else 0)
```

The formula lives in [`api/_lib/config.js`](api/_lib/config.js) — change the weights there and every calculation updates automatically.

---

## Adding More Questions

Edit [`scripts/seed.js`](scripts/seed.js) — append objects to the `GPAT_QUESTIONS` array and re-run `npm run seed`. Questions need:
- `subjectSlug` matching one of: `pharmaceutics`, `pharmacology`, `chemistry`, `pharmacognosy`, `other`
- `options`: array of `{ key: 'A'|'B'|'C'|'D', text: '...' }`
- `correctOption`: `'A'|'B'|'C'|'D'`
- `explanation`: the reason behind the correct answer
