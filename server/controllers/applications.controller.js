const { query, get, run } = require('../config/db');

exports.applyToJob = async (req, res) => {
    try {
        const { jobId } = req.body;

        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: 'Job ID is required.'
            });
        }

        const job = await get('SELECT * FROM jobs WHERE id = ?', [jobId]);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.'
            });
        }

        // Check if student already applied
        const existingApp = await get(
            'SELECT id, status FROM applications WHERE job_id = ? AND student_id = ?',
            [jobId, req.user.id]
        );

        if (existingApp) {
            return res.status(400).json({
                success: false,
                message: `You have already applied for this position. Current status: ${existingApp.status}`
            });
        }

        const result = await run(
            'INSERT INTO applications (job_id, student_id, status, stage, stage_notes) VALUES (?, ?, ?, ?, ?)',
            [jobId, req.user.id, 'Applied', 'Applied', 'Application received and under review.']
        );

        const newAppId = result.lastID;

        // Automatically create initial timeline entry
        await run(
            `INSERT INTO application_timeline (application_id, stage, title, notes)
             VALUES (?, ?, ?, ?)`,
            [newAppId, 'Applied', 'Application Submitted', `Applied for ${job.title} at ${job.company_name}. Resume and profile under screening.`]
        );

        // Send confirmation notification to student
        await run(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES (?, ?, ?, ?, ?)`,
            [
                req.user.id,
                'Application Submitted',
                `Successfully applied for ${job.title} at ${job.company_name}. We will notify you once your application is reviewed.`,
                'drive',
                'student-dashboard.html'
            ]
        );

        const newApp = await get(
            `SELECT a.id, a.status, a.stage, a.applied_at, j.title, j.company_name as company, j.salary, j.location
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.id = ?`,
            [newAppId]
        );

        return res.status(201).json({
            success: true,
            message: 'Application submitted successfully!',
            applicationId: newAppId,
            application: newApp
        });
    } catch (err) {
        console.error('Apply to job error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error processing job application.'
        });
    }
};

exports.getStudentApplications = async (req, res) => {
    try {
        const applications = await query(
            `SELECT a.id, a.job_id, a.status, a.stage, a.stage_notes, a.applied_at,
                    j.title as job_title, j.company_name as company, j.location, j.salary, j.cgpa as min_cgpa, j.deadline
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.student_id = ?
             ORDER BY a.applied_at DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (err) {
        console.error('Get student applications error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving applications.'
        });
    }
};

exports.getCompanyApplications = async (req, res) => {
    try {
        let sql = `
            SELECT a.id, a.status, a.stage, a.stage_notes, a.applied_at,
                   u.id as student_id, u.name as student_name, u.email as student_email,
                   u.branch, u.cgpa as student_cgpa, u.skills as student_skills, u.backlogs,
                   j.id as job_id, j.title as job_title, j.company_name
            FROM applications a
            JOIN users u ON a.student_id = u.id
            JOIN jobs j ON a.job_id = j.id
        `;
        const params = [];

        if (req.user.role === 'COMPANY') {
            sql += ` WHERE j.company_id = ?`;
            params.push(req.user.id);
        } else if (req.user.role === 'COORDINATOR' && req.query.assignedOnly === 'true') {
            sql += ` WHERE (j.coordinator_id = ? OR j.coordinator_id IS NULL)`;
            params.push(req.user.id);
        }

        sql += ` ORDER BY a.applied_at DESC`;

        const applications = await query(sql, params);

        return res.status(200).json({
            success: true,
            count: applications.length,
            applications
        });
    } catch (err) {
        console.error('Get company applications error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving applications.'
        });
    }
};

exports.updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, stage, notes } = req.body;

        const validStatuses = [
            'Applied',
            'Under Review',
            'Shortlisted',
            'Interview Scheduled',
            'Selected',
            'Not Selected',
            'Offer Accepted',
            'Offer Declined',
            'Rejected'
        ];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const application = await get(
            `SELECT a.*, j.company_id, j.company_name, j.title, u.id as student_id, u.name as student_name
             FROM applications a 
             JOIN jobs j ON a.job_id = j.id 
             JOIN users u ON a.student_id = u.id
             WHERE a.id = ?`,
            [id]
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found.'
            });
        }

        // Check permission: Admin, Placement Head, Coordinator, or Company owner
        const isHeadOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'PLACEMENT_HEAD';
        const isCoordinator = req.user.role === 'COORDINATOR';
        const isCompanyOwner = req.user.role === 'COMPANY' && application.company_id === req.user.id;

        if (!isHeadOrAdmin && !isCoordinator && !isCompanyOwner) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update applications for this job.'
            });
        }

        const effectiveStage = stage || status;
        const effectiveNotes = notes || `Application moved to ${status} stage by ${req.user.role === 'COMPANY' ? application.company_name : (req.user.role === 'COORDINATOR' ? `Coordinator (${req.user.name})` : 'Placement Cell')}.`;

        await run(
            'UPDATE applications SET status = ?, stage = ?, stage_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, effectiveStage, effectiveNotes, id]
        );

        // Audit Trail
        await run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, 'UPDATE_APPLICATION', 'APPLICATION', ?, ?)`,
            [req.user.id, req.user.name, req.user.role, id, `Changed application status of ${application.student_name} (${application.company_name} - ${application.title}) to '${status}'.`]
        );

        // Log timeline entry
        await run(
            `INSERT INTO application_timeline (application_id, stage, title, notes)
             VALUES (?, ?, ?, ?)`,
            [id, effectiveStage, `Application ${status}`, effectiveNotes]
        );

        // Notify student about the status change
        let notifType = 'status';
        let notifTitle = `Application Update: ${application.company_name}`;
        if (status === 'Selected') notifTitle = `🎉 Selected at ${application.company_name}!`;
        else if (status === 'Shortlisted') notifTitle = `🎯 Shortlisted by ${application.company_name}!`;
        else if (status === 'Interview Scheduled') notifTitle = `📅 Interview Scheduled: ${application.company_name}`;
        else if (status === 'Under Review') notifTitle = `🔍 Application Under Review: ${application.company_name}`;
        else if (status === 'Not Selected') notifTitle = `Application Status: ${application.company_name}`;
        else if (status === 'Offer Accepted') notifTitle = `✅ Offer Accepted: ${application.company_name}`;
        else if (status === 'Offer Declined') notifTitle = `Offer Declined: ${application.company_name}`;

        await run(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES (?, ?, ?, ?, ?)`,
            [
                application.student_id,
                notifTitle,
                `Your application for ${application.title} at ${application.company_name} is now: ${status}. ${effectiveNotes}`,
                notifType,
                'student-dashboard.html'
            ]
        );

        const updated = await get(
            `SELECT a.id, a.status, a.stage, a.applied_at, a.updated_at, u.name as student_name, j.title as job_title, j.company_name
             FROM applications a
             JOIN users u ON a.student_id = u.id
             JOIN jobs j ON a.job_id = j.id
             WHERE a.id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: `Application status updated to ${status}.`,
            application: updated
        });
    } catch (err) {
        console.error('Update status error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error updating application status.'
        });
    }
};

exports.respondToOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'Offer Accepted' or 'Offer Declined'

        if (!['Offer Accepted', 'Offer Declined'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid offer response. Allowed actions: "Offer Accepted", "Offer Declined"'
            });
        }

        const application = await get(
            `SELECT a.*, j.company_id, j.company_name, j.title, u.name as student_name
             FROM applications a 
             JOIN jobs j ON a.job_id = j.id 
             JOIN users u ON a.student_id = u.id
             WHERE a.id = ?`,
            [id]
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found.'
            });
        }

        // Must be the owner of the application
        if (application.student_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to respond to this application.'
            });
        }

        // Must currently be in 'Selected' status
        if (application.status !== 'Selected') {
            return res.status(400).json({
                success: false,
                message: `Cannot respond to offer. Current status is '${application.status}', not 'Selected'.`
            });
        }

        const note = action === 'Offer Accepted'
            ? `Candidate accepted the placement offer for ${application.title}.`
            : `Candidate declined the placement offer for ${application.title}.`;

        await run(
            'UPDATE applications SET status = ?, stage = ?, stage_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [action, action, note, id]
        );

        // Timeline entry
        await run(
            `INSERT INTO application_timeline (application_id, stage, title, notes)
             VALUES (?, ?, ?, ?)`,
            [id, action, action, note]
        );

        // Notify student confirmation
        await run(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES (?, ?, ?, ?, ?)`,
            [
                req.user.id,
                action === 'Offer Accepted' ? '🎉 Placement Offer Accepted' : 'Placement Offer Declined',
                `You have successfully recorded your response as '${action}' for ${application.company_name}.`,
                'status',
                'student-dashboard.html'
            ]
        );

        // Notify recruiter / company
        await run(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES (?, ?, ?, ?, ?)`,
            [
                application.company_id,
                `Candidate Offer Response: ${application.student_name}`,
                `${application.student_name} has chosen '${action}' for ${application.title}.`,
                'status',
                'company.html'
            ]
        );

        const updated = await get(
            `SELECT a.id, a.status, a.stage, a.applied_at, a.updated_at, j.title as job_title, j.company_name
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE a.id = ?`,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: `Offer successfully updated to ${action}.`,
            application: updated
        });
    } catch (err) {
        console.error('Respond to offer error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error processing offer response.'
        });
    }
};
