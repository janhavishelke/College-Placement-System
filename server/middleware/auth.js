const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'placement_hub_jwt_super_secret_2026';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No authentication token provided.'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired authentication token.'
        });
    }
}

function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            req.user = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            // Token is invalid/expired, continue unauthenticated
        }
    }
    next();
}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }
        const userRole = req.user.role;
        // Normalize: ADMIN and PLACEMENT_HEAD both qualify for administrative access
        const isAllowed = allowedRoles.includes(userRole) ||
            (allowedRoles.includes('ADMIN') && userRole === 'PLACEMENT_HEAD') ||
            (allowedRoles.includes('PLACEMENT_HEAD') && userRole === 'ADMIN');

        if (!isAllowed) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Your role '${userRole}' is not permitted to perform this action. Required roles: ${allowedRoles.join(', ')}.`
            });
        }
        next();
    };
}

module.exports = {
    JWT_SECRET,
    authenticateToken,
    optionalAuthenticate,
    authorizeRoles
};
