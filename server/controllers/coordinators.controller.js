const bcrypt = require('bcryptjs');
const { query, get, run } = require('../config/db');

// List all Placement Coordinators with their workload
exports.getCoordinators = async (req, res) => {
    try {
        const coordinators = await query(`
            SELECT u.id, u.name, u.email, u.role, u.department, u.phone, u.status, u.created_at,
                   (SELECT COUNT(*) FROM jobs WHERE coordinator_id = u.id AND (is_archived = 0 OR is_archived IS NULL)) as assigned_drives_count,
                   (SELECT COUNT(*) FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.coordinator_id = u.id) as candidates_count
            FROM users u
            WHERE u.role = 'COORDINATOR'
            ORDER BY u.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            count: coordinators.length,
            coordinators
        });
    } catch (err) {
        console.error('Get coordinators error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving placement coordinators.'
        });
    }
};

// Add new Placement Coordinator (Placement Head / Admin only)
exports.createCoordinator = async (req, res) => {
    try {
        const { name, email, password, department, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required.'
            });
        }

        const existing = await get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await run(
            `INSERT INTO users (name, email, password, role, department, phone, status)
             VALUES (?, ?, ?, 'COORDINATOR', ?, ?, 'Active')`,
            [name.trim(), email.trim().toLowerCase(), hashedPassword, department ? department.trim() : 'General', phone ? phone.trim() : '']
        );

        // Audit Trail
        await run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, 'CREATE_COORDINATOR', 'COORDINATOR', ?, ?)`,
            [req.user.id, req.user.name, req.user.role, result.lastID, `Created new Placement Coordinator: ${name.trim()} (${email.trim()}).`]
        );

        return res.status(201).json({
            success: true,
            message: `Placement Coordinator ${name.trim()} registered successfully.`,
            coordinator: {
                id: result.lastID,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                department: department || 'General',
                phone: phone || '',
                status: 'Active'
            }
        });
    } catch (err) {
        console.error('Create coordinator error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error registering coordinator.'
        });
    }
};

// Update Coordinator details or status
exports.updateCoordinator = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, department, phone, status, password } = req.body;

        const coordinator = await get("SELECT * FROM users WHERE id = ? AND role = 'COORDINATOR'", [id]);
        if (!coordinator) {
            return res.status(404).json({ success: false, message: 'Placement Coordinator not found.' });
        }

        const newName = name ? name.trim() : coordinator.name;
        const newDept = department ? department.trim() : coordinator.department;
        const newPhone = phone ? phone.trim() : coordinator.phone;
        const newStatus = status ? status.trim() : coordinator.status;

        if (password && password.trim().length >= 8) {
            const hash = await bcrypt.hash(password.trim(), 10);
            await run(
                `UPDATE users SET name = ?, department = ?, phone = ?, status = ?, password = ? WHERE id = ?`,
                [newName, newDept, newPhone, newStatus, hash, id]
            );
        } else {
            await run(
                `UPDATE users SET name = ?, department = ?, phone = ?, status = ? WHERE id = ?`,
                [newName, newDept, newPhone, newStatus, id]
            );
        }

        // Also update coordinator_name on their assigned jobs if name changed
        if (name && name.trim() !== coordinator.name) {
            await run(`UPDATE jobs SET coordinator_name = ? WHERE coordinator_id = ?`, [newName, id]);
        }

        await run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, 'UPDATE_COORDINATOR', 'COORDINATOR', ?, ?)`,
            [req.user.id, req.user.name, req.user.role, id, `Updated coordinator details for ${newName}. Status: '${newStatus}'.`]
        );

        return res.status(200).json({
            success: true,
            message: `Coordinator ${newName} updated successfully.`
        });
    } catch (err) {
        console.error('Update coordinator error:', err);
        return res.status(500).json({ success: false, message: 'Server error updating coordinator.' });
    }
};

// Delete Coordinator (Placement Head / Admin only)
exports.deleteCoordinator = async (req, res) => {
    try {
        const { id } = req.params;
        const coordinator = await get("SELECT * FROM users WHERE id = ? AND role = 'COORDINATOR'", [id]);
        if (!coordinator) {
            return res.status(404).json({ success: false, message: 'Coordinator not found.' });
        }

        // Unassign their drives before deleting
        await run(`UPDATE jobs SET coordinator_id = NULL, coordinator_name = '' WHERE coordinator_id = ?`, [id]);
        await run(`DELETE FROM users WHERE id = ?`, [id]);

        await run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, 'DELETE_COORDINATOR', 'COORDINATOR', ?, ?)`,
            [req.user.id, req.user.name, req.user.role, id, `Removed coordinator ${coordinator.name}.`]
        );

        return res.status(200).json({
            success: true,
            message: `Coordinator ${coordinator.name} deleted successfully.`
        });
    } catch (err) {
        console.error('Delete coordinator error:', err);
        return res.status(500).json({ success: false, message: 'Server error deleting coordinator.' });
    }
};

// Coordinator Personal Dashboard KPI Statistics
exports.getCoordinatorStats = async (req, res) => {
    try {
        const coordId = req.user.id;

        const assignedDrives = await get(
            `SELECT COUNT(*) as count FROM jobs WHERE coordinator_id = ? AND (is_archived = 0 OR is_archived IS NULL)`,
            [coordId]
        );

        const pendingApproval = await get(
            `SELECT COUNT(*) as count FROM jobs WHERE coordinator_id = ? AND approval_status = 'Pending Approval'`,
            [coordId]
        );

        const totalApplicants = await get(
            `SELECT COUNT(a.id) as count 
             FROM applications a 
             JOIN jobs j ON a.job_id = j.id 
             WHERE j.coordinator_id = ?`,
            [coordId]
        );

        const selectedCandidates = await get(
            `SELECT COUNT(a.id) as count 
             FROM applications a 
             JOIN jobs j ON a.job_id = j.id 
             WHERE j.coordinator_id = ? AND a.status IN ('Selected', 'Offer Accepted')`,
            [coordId]
        );

        return res.status(200).json({
            success: true,
            stats: {
                assignedDrivesCount: assignedDrives.count || 0,
                pendingApprovalCount: pendingApproval.count || 0,
                totalApplicantsCount: totalApplicants.count || 0,
                selectedCandidatesCount: selectedCandidates.count || 0
            }
        });
    } catch (err) {
        console.error('Get coordinator stats error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving coordinator statistics.' });
    }
};
