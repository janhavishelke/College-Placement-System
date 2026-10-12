const { query, get, run } = require('../config/db');

// --- TIMELINE ---

exports.getApplicationTimeline = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { applicationId } = req.params;

        const application = await get(`
            SELECT a.id, a.status, a.stage, a.stage_notes, a.applied_at,
                   j.id as job_id, j.title, j.company_name, j.salary, j.location, j.deadline
            FROM applications a
            JOIN jobs j ON a.job_id = j.id
            WHERE a.id = ? AND (a.student_id = ? OR ? = 'ADMIN' OR ? = 'COMPANY')
        `, [applicationId, studentId, req.user.role, req.user.role]);

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found or unauthorized.' });
        }

        const timeline = await query(
            `SELECT id, stage, title, notes, created_at 
             FROM application_timeline 
             WHERE application_id = ? 
             ORDER BY created_at ASC`,
            [applicationId]
        );

        // Standard stage milestones sequence
        const standardStages = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Offer Accepted'];
        let currentStageIndex = standardStages.indexOf(application.stage || application.status);
        if (currentStageIndex === -1) {
            if (application.status === 'Offer Declined') currentStageIndex = standardStages.length - 1;
            else if (application.status === 'Not Selected' || application.status === 'Rejected') currentStageIndex = 1;
            else currentStageIndex = 0;
        }

        return res.status(200).json({
            success: true,
            application,
            currentStageIndex,
            standardStages,
            timeline
        });
    } catch (err) {
        console.error('Get application timeline error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving timeline.' });
    }
};

// --- CALENDAR & DEADLINE REMINDERS ---

exports.getCalendarEvents = async (req, res) => {
    try {
        const studentId = req.user.id;

        const jobs = await query(`
            SELECT id, company_name, title, deadline, visit_date, test_date, interview_date, location, salary, eligible_branches,
                   (SELECT status FROM applications WHERE job_id = jobs.id AND student_id = ?) as applied_status
            FROM jobs
            ORDER BY COALESCE(visit_date, deadline) ASC
        `, [studentId]);

        const events = [];
        const now = new Date();

        jobs.forEach(job => {
            // 1. Application Deadlines
            if (job.deadline) {
                const deadlineDate = new Date(job.deadline);
                const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
                events.push({
                    id: `deadline-${job.id}`,
                    category: 'deadline',
                    type: 'Application Deadline',
                    title: `${job.company_name} - Registration Deadline`,
                    description: `Last date to register and submit resume for ${job.title} (${job.salary}).`,
                    company: job.company_name,
                    jobTitle: job.title,
                    salary: job.salary,
                    date: job.deadline,
                    venue: 'Online Portal',
                    daysRemaining: diffDays,
                    isUrgent: diffDays >= 0 && diffDays <= 4,
                    isExpired: diffDays < 0,
                    link: 'jobs.html',
                    appliedStatus: job.applied_status || null
                });
            }

            // 2. Company Campus Visits
            const vDate = job.visit_date || job.deadline;
            if (vDate) {
                const visitDateObj = new Date(vDate);
                const diffVisitDays = Math.ceil((visitDateObj - now) / (1000 * 60 * 60 * 24));
                events.push({
                    id: `visit-${job.id}`,
                    category: 'visit',
                    type: 'Company Visit',
                    title: `🏢 ${job.company_name} Campus Visit`,
                    description: `Official campus recruitment drive visit for ${job.title}. Pre-placement talk and orientation.`,
                    company: job.company_name,
                    jobTitle: job.title,
                    salary: job.salary,
                    date: vDate,
                    venue: job.location || 'College Auditorium & Labs',
                    daysRemaining: diffVisitDays,
                    isUrgent: diffVisitDays >= 0 && diffVisitDays <= 7,
                    isExpired: diffVisitDays < 0,
                    link: 'jobs.html',
                    appliedStatus: job.applied_status || null
                });
            }

            // 3. Online Assessments & Tests
            const tDate = job.test_date || (job.deadline ? new Date(new Date(job.deadline).getTime() + 2 * 86400000).toISOString().split('T')[0] : null);
            if (tDate) {
                const testDateObj = new Date(tDate);
                const diffTestDays = Math.ceil((testDateObj - now) / (1000 * 60 * 60 * 24));
                events.push({
                    id: `test-${job.id}`,
                    category: 'test',
                    type: 'Online Test',
                    title: `📝 ${job.company_name} Aptitude & Coding Test`,
                    description: `Aptitude assessment (Quant, Logic, Verbal) and technical coding challenge round for ${job.company_name}.`,
                    company: job.company_name,
                    jobTitle: job.title,
                    salary: job.salary,
                    date: tDate,
                    venue: 'Online Proctoring / Computer Labs',
                    daysRemaining: diffTestDays,
                    isUrgent: diffTestDays >= 0 && diffTestDays <= 3,
                    isExpired: diffTestDays < 0,
                    link: 'student-dashboard.html',
                    appliedStatus: job.applied_status || null
                });
            }

            // 4. Interviews
            const iDate = job.interview_date || (job.visit_date ? new Date(new Date(job.visit_date).getTime() + 86400000).toISOString().split('T')[0] : null);
            if (iDate) {
                const interviewDateObj = new Date(iDate);
                const diffIntDays = Math.ceil((interviewDateObj - now) / (1000 * 60 * 60 * 24));
                events.push({
                    id: `interview-${job.id}`,
                    category: 'interview',
                    type: 'Interview Round',
                    title: `🎤 ${job.company_name} Technical & HR Interviews`,
                    description: `Technical interview rounds and HR evaluation for shortlisted applicants.`,
                    company: job.company_name,
                    jobTitle: job.title,
                    salary: job.salary,
                    date: iDate,
                    venue: 'Interview Panels (Seminar Hall 2)',
                    daysRemaining: diffIntDays,
                    isUrgent: diffIntDays >= 0 && diffIntDays <= 3,
                    isExpired: diffIntDays < 0,
                    link: 'student-dashboard.html',
                    appliedStatus: job.applied_status || null
                });
            }

            // 5. Upcoming Drives (Announcement overview)
            events.push({
                id: `upcoming-${job.id}`,
                category: 'upcoming',
                type: 'Upcoming Drive',
                title: `🚀 ${job.company_name} Recruitment Drive Season 2026`,
                description: `Hiring for ${job.title}. Branches eligible: ${job.eligible_branches}. Package: ${job.salary}.`,
                company: job.company_name,
                jobTitle: job.title,
                salary: job.salary,
                date: job.visit_date || job.deadline,
                venue: job.location || 'On-Campus',
                daysRemaining: Math.ceil((new Date(job.deadline) - now) / (1000 * 60 * 60 * 24)),
                isUrgent: false,
                isExpired: false,
                link: 'jobs.html',
                appliedStatus: job.applied_status || null
            });
        });

        // Sort chronologically
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        return res.status(200).json({
            success: true,
            count: events.length,
            events
        });
    } catch (err) {
        console.error('Get calendar events error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving calendar events.' });
    }
};

// --- IN-APP NOTIFICATIONS ---

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const notifications = await query(
            `SELECT id, title, message, type, link, is_read, created_at
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 25`,
            [userId]
        );

        const unread = await get(
            `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            unreadCount: unread.count,
            notifications
        });
    } catch (err) {
        console.error('Get notifications error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving notifications.' });
    }
};

exports.markNotificationRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await run(
            `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        return res.status(200).json({ success: true, message: 'Notification marked as read.' });
    } catch (err) {
        console.error('Mark notification read error:', err);
        return res.status(500).json({ success: false, message: 'Server error updating notification.' });
    }
};

exports.markAllNotificationsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await run(
            `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
            [userId]
        );

        return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
        console.error('Mark all notifications read error:', err);
        return res.status(500).json({ success: false, message: 'Server error clearing notifications.' });
    }
};
