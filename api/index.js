// Vercel Serverless Function entry point for PlacementHub
let app;
let initError = null;

try {
    app = require('../server/server');
} catch (e) {
    initError = e;
    console.error('Vercel serverless initialization error:', e);
}

module.exports = (req, res) => {
    if (initError) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
            success: false,
            error: 'Serverless App Initialization Error',
            message: initError.message,
            stack: initError.stack
        }));
    }

    // Restore original route path if rewritten by Vercel
    const matchedPath = req.headers && (req.headers['x-matched-path'] || req.headers['x-vercel-matched-path'] || req.headers['x-forwarded-uri']);
    if (matchedPath && matchedPath.startsWith('/api')) {
        req.url = matchedPath;
    }

    return app(req, res);
};
