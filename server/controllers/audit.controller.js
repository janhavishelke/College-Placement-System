const { query } = require('../config/db');

// Retrieve institutional audit logs (Placement Head & Admin only)
exports.getAuditLogs = async (req, res) => {
    try {
        const { action, targetType, limit } = req.query;
        let sql = `SELECT * FROM audit_logs`;
        const conditions = [];
        const params = [];

        if (action && action.trim() !== '') {
            conditions.push(`action = ?`);
            params.push(action.trim().toUpperCase());
        }

        if (targetType && targetType.trim() !== '') {
            conditions.push(`target_type = ?`);
            params.push(targetType.trim().toUpperCase());
        }

        if (conditions.length > 0) {
            sql += ` WHERE ` + conditions.join(' AND ');
        }

        sql += ` ORDER BY created_at DESC LIMIT ?`;
        params.push(parseInt(limit, 10) || 100);

        const logs = await query(sql, params);

        return res.status(200).json({
            success: true,
            count: logs.length,
            logs
        });
    } catch (err) {
        console.error('Get audit logs error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving audit logs.' });
    }
};
