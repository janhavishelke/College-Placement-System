const { query, get } = require('../config/db');

exports.getStudentStats = async (req, res) => {
    try {
        const studentId = req.user.id;

        const totalJobs = await get('SELECT COUNT(*) as count FROM jobs');
        const totalApps = await get('SELECT COUNT(*) as count FROM applications WHERE student_id = ?', [studentId]);
        const shortlisted = await get(
            `SELECT COUNT(*) as count FROM applications 
             WHERE student_id = ? AND status IN ('Shortlisted', 'Interview Scheduled', 'Selected', 'Offer Accepted')`,
            [studentId]
        );

        const recentJobs = await query(
            'SELECT id, title, company_name as company, location, salary, cgpa, skills FROM jobs ORDER BY created_at DESC LIMIT 4'
        );

        return res.status(200).json({
            success: true,
            stats: {
                jobCount: totalJobs.count,
                applicationCount: totalApps.count,
                shortlistedCount: shortlisted.count
            },
            recentJobs
        });
    } catch (err) {
        console.error('Student stats error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving student dashboard statistics.'
        });
    }
};

exports.getCompanyStats = async (req, res) => {
    try {
        const companyId = req.user.id;

        const jobsPosted = await get(
            'SELECT COUNT(*) as count FROM jobs WHERE company_id = ?',
            [companyId]
        );

        const totalApplicants = await get(
            `SELECT COUNT(a.id) as count 
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE j.company_id = ?`,
            [companyId]
        );

        const shortlisted = await get(
            `SELECT COUNT(a.id) as count 
             FROM applications a
             JOIN jobs j ON a.job_id = j.id
             WHERE j.company_id = ? AND a.status IN ('Shortlisted', 'Interview Scheduled', 'Selected', 'Offer Accepted')`,
            [companyId]
        );

        const myJobs = await query(
            `SELECT j.*, 
                    (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
             FROM jobs j 
             WHERE j.company_id = ? 
             ORDER BY j.created_at DESC`,
            [companyId]
        );

        const recentApplicants = await query(
            `SELECT a.id, a.status, a.applied_at,
                    u.name as student_name, u.email as student_email, u.branch, u.cgpa, u.skills,
                    j.title as job_title
             FROM applications a
             JOIN users u ON a.student_id = u.id
             JOIN jobs j ON a.job_id = j.id
             WHERE j.company_id = ?
             ORDER BY a.applied_at DESC
             LIMIT 10`,
            [companyId]
        );

        return res.status(200).json({
            success: true,
            stats: {
                jobsPosted: jobsPosted.count,
                totalApplicants: totalApplicants.count,
                shortlisted: shortlisted.count
            },
            myJobs,
            recentApplicants
        });
    } catch (err) {
        console.error('Company stats error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving company dashboard statistics.'
        });
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        const studentCount = await get("SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'");
        const companyCount = await get("SELECT COUNT(*) as count FROM users WHERE role = 'COMPANY'");
        const jobCount = await get('SELECT COUNT(*) as count FROM jobs');
        const placedCount = await get(
            "SELECT COUNT(DISTINCT student_id) as count FROM applications WHERE status IN ('Selected', 'Offer Accepted')"
        );

        const applications = await query(
            `SELECT a.id, a.status, a.applied_at,
                    u.name as student, u.email as student_email, u.branch, u.cgpa,
                    j.title as job, j.company_name as company
             FROM applications a
             JOIN users u ON a.student_id = u.id
             JOIN jobs j ON a.job_id = j.id
             ORDER BY a.applied_at DESC`
        );

        return res.status(200).json({
            success: true,
            stats: {
                studentCount: studentCount.count,
                companyCount: companyCount.count,
                adminJobCount: jobCount.count,
                placedCount: placedCount.count
            },
            applications
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving admin statistics.'
        });
    }
};
