const { query, get, run } = require('../config/db');

// Get announcements filtered by user role
exports.getAnnouncements = async (req, res) => {
    try {
        const userRole = req.user ? req.user.role : 'STUDENT';
        let sql = `
            SELECT a.*, a.content as message, j.company_name as drive_company, j.title as drive_title
            FROM announcements a
            LEFT JOIN jobs j ON a.job_id = j.id
        `;
        const params = [];

        // Role-based visibility
        if (userRole === 'STUDENT') {
            sql += ` WHERE a.target_role IN ('ALL', 'STUDENT')`;
        } else if (userRole === 'COORDINATOR') {
            sql += ` WHERE a.target_role IN ('ALL', 'COORDINATOR')`;
        }

        sql += ` ORDER BY a.created_at DESC LIMIT 50`;

        const announcements = await query(sql, params);

        return res.status(200).json({
            success: true,
            count: announcements.length,
            announcements
        });
    } catch (err) {
        console.error('Get announcements error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving announcements.' });
    }
};

// Create Announcement (Placement Head, Coordinator, Admin)
exports.createAnnouncement = async (req, res) => {
    try {
        const title = (req.body.title || '').trim();
        const content = (req.body.content || req.body.message || '').trim();
        const targetRole = req.body.targetRole || req.body.target_role || 'ALL';
        const jobId = req.body.jobId || req.body.job_id || null;
        const priority = req.body.priority || 'NORMAL';

        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and content are required.' });
        }

        const validTargets = ['ALL', 'STUDENT', 'COORDINATOR', 'COMPANY'];
        const tgt = validTargets.includes(targetRole.toUpperCase()) ? targetRole.toUpperCase() : 'ALL';
        const prio = ['NORMAL', 'URGENT', 'HIGH', 'CRITICAL'].includes(priority.toUpperCase()) ? priority.toUpperCase() : 'NORMAL';

        const result = await run(
            `INSERT INTO announcements (author_id, author_name, author_role, title, content, target_role, job_id, priority)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, req.user.name, req.user.role, title, content, tgt, jobId, prio]
        );

        // Audit Trail
        await run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, 'PUBLISH_ANNOUNCEMENT', 'ANNOUNCEMENT', ?, ?)`,
            [req.user.id, req.user.name, req.user.role, result.lastID, `Published announcement '${title.trim()}' for target '${tgt}'.`]
        );

        // If high or urgent priority, deliver notifications to targeted users
        if (prio === 'HIGH' || prio === 'URGENT') {
            let userQuery = "SELECT id FROM users WHERE 1=1";
            if (tgt === 'STUDENT') userQuery += " AND role = 'STUDENT'";
            else if (tgt === 'COORDINATOR') userQuery += " AND role = 'COORDINATOR'";

            const targetUsers = await query(userQuery);
            for (const u of targetUsers) {
                await run(
                    `INSERT INTO notifications (user_id, title, message, type, link)
                     VALUES (?, ?, ?, 'announcement', 'jobs.html')`,
                    [u.id, `📢 ${prio === 'URGENT' ? 'Urgent Notice: ' : 'Announcement: '}${title.trim()}`, content.trim().substring(0, 160)]
                );
            }
        }

        return res.status(201).json({
            success: true,
            message: 'Announcement published successfully!',
            announcementId: result.lastID
        });
    } catch (err) {
        console.error('Create announcement error:', err);
        return res.status(500).json({ success: false, message: 'Server error publishing announcement.' });
    }
};

// Delete Announcement (Author, Placement Head, Admin)
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await get('SELECT * FROM announcements WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Announcement not found.' });
        }

        const isHeadOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'PLACEMENT_HEAD';
        if (!isHeadOrAdmin && existing.author_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this announcement.' });
        }

        await run('DELETE FROM announcements WHERE id = ?', [id]);

        return res.status(200).json({ success: true, message: 'Announcement deleted.' });
    } catch (err) {
        console.error('Delete announcement error:', err);
        return res.status(500).json({ success: false, message: 'Server error deleting announcement.' });
    }
};
