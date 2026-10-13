/**
 * In-memory sliding-window rate limiter middleware
 * Provides IP-based protection against brute-force and DDoS attacks
 * without external dependencies.
 */
function createRateLimiter(options = {}) {
    const windowMs = options.windowMs || 60 * 1000;
    const max = options.max || 100;
    const message = options.message || 'Too many requests from this IP, please try again later.';
    const ipHits = new Map();

    // Periodic cleanup every 2 minutes
    setInterval(() => {
        const now = Date.now();
        for (const [ip, data] of ipHits.entries()) {
            if (now > data.resetTime) {
                ipHits.delete(ip);
            }
        }
    }, 2 * 60 * 1000).unref();

    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const now = Date.now();

        let clientData = ipHits.get(ip);
        if (!clientData || now > clientData.resetTime) {
            clientData = {
                count: 1,
                resetTime: now + windowMs
            };
            ipHits.set(ip, clientData);
        } else {
            clientData.count++;
        }

        const remaining = Math.max(0, max - clientData.count);
        const resetSeconds = Math.ceil((clientData.resetTime - now) / 1000);

        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', resetSeconds);

        if (clientData.count > max) {
            res.setHeader('Retry-After', resetSeconds);
            return res.status(429).json({
                success: false,
                message,
                retryAfterSeconds: resetSeconds
            });
        }

        next();
    };
}

module.exports = {
    apiLimiter: createRateLimiter({
        windowMs: 60 * 1000,
        max: 300,
        message: 'High request traffic detected. Please slow down.'
    }),
    authLimiter: createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 30,
        message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
    }),
    createRateLimiter
};
