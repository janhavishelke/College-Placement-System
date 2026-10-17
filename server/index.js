const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const seedDatabase = require('./seed');

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]', reason);
});

// Run seed on startup if database is fresh
try {
  const docCount = db.prepare('SELECT COUNT(*) as count FROM documents').get();
  if (!docCount || docCount.count === 0) {
    seedDatabase();
  }
} catch (e) {
  console.log('Running initial database seed...');
  seedDatabase();
}

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/concepts', require('./routes/concepts'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/chats', require('./routes/chat')); // Supports GET /api/chats as well
app.use('/api/doubts', require('./routes/doubts'));
app.use('/api/verify', require('./routes/verify'));
app.use('/api/interruptions', require('./routes/interruptions'));
app.use('/api/voice', require('./routes/voice'));
app.use('/api/artifacts', require('./routes/artifacts'));
app.use('/api/session', require('./routes/session'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/pyq', require('./routes/pyq'));
app.use('/api/ocr', require('./routes/ocr'));
app.use('/api/voicenotes', require('./routes/voicenotes'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/video', require('./routes/video'));
app.use('/api/multilingual', require('./routes/multilingual'));
app.use('/api/cost', require('./routes/cost'));
app.use('/api/org', require('./routes/organizations'));
app.use('/api/profile', require('./routes/learning_profile'));
app.use('/api/rescue', require('./routes/rescue'));
app.use('/api/proof-of-understanding', require('./routes/proof_understanding'));
app.use('/api/alarms', require('./routes/alarms'));
app.use('/api/peers', require('./routes/peers'));

// Connect to MongoDB and mount uploaded NoteMind backend routes
const notemindDb = require('../notemind-backend-v1/backend/src/config/database');
notemindDb.connect().then(() => {
  console.log('✓ NoteMind MongoDB Backend Connected');
}).catch(err => {
  console.warn('NoteMind MongoDB Notice:', err.message);
});

// Mount uploaded NoteMind backend routes (auth, users, tutor, quizzes, learning-sessions, tasks, wellbeing, revisions, dashboard)
app.use('/api/auth', require('../notemind-backend-v1/backend/src/routes/auth.routes'));
app.use('/api/users', require('../notemind-backend-v1/backend/src/routes/users.routes'));
app.use('/api/tutor', require('../notemind-backend-v1/backend/src/routes/tutor.routes'));
app.use('/api/quizzes', require('../notemind-backend-v1/backend/src/routes/quizzes.routes'));
app.use('/api/learning-sessions', require('../notemind-backend-v1/backend/src/routes/learning-sessions.routes'));
app.use('/api/study-partners', require('../notemind-backend-v1/backend/src/routes/study-partners.routes'));
app.use('/api/peer-requests', require('../notemind-backend-v1/backend/src/routes/peer-requests.routes'));
app.use('/api/study-groups', require('../notemind-backend-v1/backend/src/routes/study-groups.routes'));
app.use('/api/tasks', require('../notemind-backend-v1/backend/src/routes/tasks.routes'));
app.use('/api/wellbeing', require('../notemind-backend-v1/backend/src/routes/wellbeing.routes'));
app.use('/api/revisions', require('../notemind-backend-v1/backend/src/routes/revisions.routes'));
app.use('/api/dashboard', require('../notemind-backend-v1/backend/src/routes/dashboard.routes'));
app.use('/api/unera', require('../notemind-backend-v1/backend/src/routes/unera.routes'));

// Serve interactive Floor Lamp Login page
app.get(['/login', '/login.html'], (req, res) => {
  res.sendFile(path.resolve(__dirname, '../login.html'));
});

// Serve built frontend in production if dist exists
const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));

// Fallback for client-side routing (Express 5 compatible)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send(`Unera API is active on port ${PORT}. Frontend dev server available on port 5173.`);
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Unera Backend running at http://localhost:${PORT}`);
  console.log(`📖 API Endpoints:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - GET  /api/documents`);
  console.log(`   - POST /api/chat`);
  console.log(`   - GET  /api/doubts`);
  console.log(`   - POST /api/verify`);
  console.log(`   - POST /api/voice/start`);
  console.log(`========================================\n`);
});
