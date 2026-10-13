const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const jobsRoutes = require('./routes/jobs.routes');
const companiesRoutes = require('./routes/companies.routes');
const applicationsRoutes = require('./routes/applications.routes');
const profileRoutes = require('./routes/profile.routes');
const statsRoutes = require('./routes/stats.routes');

// Advanced differentiating feature routes
const recommendationsRoutes = require('./routes/recommendations.routes');
const resumeRoutes = require('./routes/resume.routes');
const prepRoutes = require('./routes/prep.routes');
const eligibilityRoutes = require('./routes/eligibility.routes');
const timelineRoutes = require('./routes/timeline.routes');
const alumniRoutes = require('./routes/alumni.routes');
const offersRoutes = require('./routes/offers.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const assistantRoutes = require('./routes/assistant.routes');

// Placement Head & Coordinator Management routes
// Institutional & Coordinator Management routes
const coordinatorsRoutes = require('./routes/coordinators.routes');
const announcementsRoutes = require('./routes/announcements.routes');
const reportsRoutes = require('./routes/reports.routes');
const auditRoutes = require('./routes/audit.routes');

// Security & Rate Limiting Middleware
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
});

// Enable CORS & Private Network Access (PNA) for dev servers, file://, and production
app.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Request-Private-Network');

    // Chromium Private Network Access (PNA) preflight support
    if (req.headers['access-control-request-private-network']) {
        res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true
}));

// Request logger for API calls
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url} (Origin: ${req.headers.origin || 'same-origin'})`);
    }
    next();
});

// Enforce request size boundaries to protect against payload flood
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply rate limiter to all API routes
app.use('/api', apiLimiter);

// Serve static frontend files from project root
const publicDir = path.join(__dirname, '..');
app.use(express.static(publicDir));

// Route alias for company dashboard
app.get('/company-dashboard.html', (req, res) => {
    res.sendFile(path.join(publicDir, 'company.html'));
});

// Core API Routes (authLimiter applied to sensitive auth endpoints)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/stats', statsRoutes);

// Differentiating Features API Routes
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/prep', prepRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/assistant', assistantRoutes);

// Institutional & Coordinator API Routes
app.use('/api/coordinators', coordinatorsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit-logs', auditRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'UP',
        message: 'PlacementHub Innovative Campus Placement API is running smoothly.',
        timestamp: new Date().toISOString()
    });
});

// 404 handler for unknown API routes
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API endpoint '${req.originalUrl}' not found.`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

// Initialize DB schema & seeds, then start server if run directly
if (require.main === module) {
    initDatabase().then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`=================================================`);
            console.log(`🎓 PlacementHub Advanced Backend Server is running!`);
            console.log(`🌐 Local URL:  http://localhost:${PORT}`);
            console.log(`🌐 IPv4 URL:   http://127.0.0.1:${PORT}`);
            console.log(`📡 API URL:    http://localhost:${PORT}/api/health`);
            console.log(`=================================================`);
        });
    }).catch(err => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
} else {
    // When imported by serverless functions (e.g. Vercel)
    initDatabase().catch(err => {
        console.warn('Database initialization notice:', err.message);
    });
}

module.exports = app;
