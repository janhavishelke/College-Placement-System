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

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins (supports both direct static files and external frontends)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from project root
const publicDir = path.join(__dirname, '..');
app.use(express.static(publicDir));

// Route alias for company dashboard
app.get('/company-dashboard.html', (req, res) => {
    res.sendFile(path.join(publicDir, 'company.html'));
});

// Core API Routes
app.use('/api/auth', authRoutes);
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

// Initialize DB schema & seeds, then start server
initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`=================================================`);
        console.log(`🎓 PlacementHub Advanced Backend Server is running!`);
        console.log(`🌐 Local URL:  http://localhost:${PORT}`);
        console.log(`📡 API URL:    http://localhost:${PORT}/api/health`);
        console.log(`=================================================`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
