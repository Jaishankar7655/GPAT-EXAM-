import authHandler from './_routes/auth.js';
import profileHandler from './_routes/profile.js';
import syllabusHandler from './_routes/syllabus.js';
import progressHandler from './_routes/progress.js';
import planHandler from './_routes/plan.js';
import sessionsHandler from './_routes/sessions.js';
import quizHandler from './_routes/quiz.js';
import scoreHandler from './_routes/score.js';
import analyticsHandler from './_routes/analytics.js';
import mocksHandler from './_routes/mocks.js';
import notesHandler from './_routes/notes.js';
import mistakesHandler from './_routes/mistakes.js';
import resourcesHandler from './_routes/resources.js';
import pushHandler from './_routes/push.js';
import cronHandler from './_routes/cron.js';
import seedHandler from './_routes/seed.js';

const routes = {
  auth: authHandler,
  profile: profileHandler,
  syllabus: syllabusHandler,
  progress: progressHandler,
  plan: planHandler,
  sessions: sessionsHandler,
  quiz: quizHandler,
  score: scoreHandler,
  analytics: analyticsHandler,
  mocks: mocksHandler,
  notes: notesHandler,
  mistakes: mistakesHandler,
  resources: resourcesHandler,
  push: pushHandler,
  cron: cronHandler,
  seed: seedHandler
};

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    // Extract route: e.g. /api/auth -> 'auth', /api/quiz?type=daily -> 'quiz'
    const route = url.pathname.replace(/^\/api\/?/, '').split('/')[0] || 'health';

    const routeFn = routes[route];
    if (routeFn) {
      return await routeFn(req, res);
    }

    if (route === 'health' || route === '') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ status: 'ok', name: 'GPAT Prep API' }));
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: `Route /api/${route} not found` }));
  } catch (err) {
    console.error('[API Router Error]:', err);
    if (!res.headersSent) {
      res.statusCode = err.status || 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, message: err.message || 'Internal Server Error' }));
    }
  }
}

