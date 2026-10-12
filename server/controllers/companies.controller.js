const { query, get, run } = require('../config/db');
const { formatJobRecord, getAllJobs, getJobById, createJob, updateJob, deleteJob } = require('./jobs.controller');

exports.getVisitingCompanies = async (req, res) => {
    try {
        const { search, status } = req.query;
        let sql = `
            SELECT j.*, 
                   u.company_logo, u.company_website, u.company_description,
                   (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
            FROM jobs j
            LEFT JOIN users u ON j.company_id = u.id
        `;
        const params = [];
        const conditions = [];

        if (search && search.trim() !== '') {
            const term = `%${search.trim().toLowerCase()}%`;
            conditions.push(`(LOWER(j.title) LIKE ? 
                        OR LOWER(j.company_name) LIKE ? 
                        OR LOWER(j.skills) LIKE ? 
                        OR LOWER(j.location) LIKE ?
                        OR LOWER(j.role_category) LIKE ?)`);
            params.push(term, term, term, term, term);
        }

        if (status && status.trim() !== '' && status.toLowerCase() !== 'all') {
            conditions.push(`LOWER(j.recruitment_status) = ?`);
            params.push(status.trim().toLowerCase());
        }

        if (conditions.length > 0) {
            sql += ` WHERE ` + conditions.join(' AND ');
        }

        sql += ` ORDER BY j.created_at DESC`;

        const drives = await query(sql, params);

        let studentApplications = {};
        if (req.user && req.user.role === 'STUDENT') {
            const apps = await query('SELECT job_id, status FROM applications WHERE student_id = ?', [req.user.id]);
            apps.forEach(app => {
                studentApplications[app.job_id] = app.status;
            });
        }

        const formatted = drives.map(drive => {
            const base = formatJobRecord(drive, studentApplications);
            // Fallback to user company fields if job fields are blank
            if (!base.logo && drive.company_logo) base.logo = drive.company_logo;
            if (!base.website && drive.company_website) base.website = drive.company_website;
            if (!base.description && drive.company_description) base.description = drive.company_description;
            return base;
        });

        return res.status(200).json({
            success: true,
            count: formatted.length,
            companies: formatted,
            visitingCompanies: formatted,
            jobs: formatted
        });
    } catch (err) {
        console.error('Get visiting companies error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving visiting companies.'
        });
    }
};

exports.getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;

        // First attempt: match by job/drive ID
        let drive = await get(`
            SELECT j.*, 
                   u.company_logo, u.company_website, u.company_description,
                   (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
            FROM jobs j
            LEFT JOIN users u ON j.company_id = u.id
            WHERE j.id = ?
        `, [id]);

        let studentApplications = {};
        if (drive && req.user && req.user.role === 'STUDENT') {
            const app = await get('SELECT status FROM applications WHERE job_id = ? AND student_id = ?', [drive.id, req.user.id]);
            if (app) studentApplications[drive.id] = app.status;
        }

        if (drive) {
            const formatted = formatJobRecord(drive, studentApplications);
            if (!formatted.logo && drive.company_logo) formatted.logo = drive.company_logo;
            if (!formatted.website && drive.company_website) formatted.website = drive.company_website;
            if (!formatted.description && drive.company_description) formatted.description = drive.company_description;

            // Fetch other drives from same company
            const otherDrives = await query(`
                SELECT j.*, (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
                FROM jobs j 
                WHERE j.company_id = ? AND j.id != ?
            `, [drive.company_id, drive.id]);

            return res.status(200).json({
                success: true,
                company: formatted,
                job: formatted,
                relatedDrives: otherDrives.map(d => formatJobRecord(d))
            });
        }

        // Second attempt: match by company user ID
        const companyUser = await get(`
            SELECT id, name, email, company_logo, company_website, company_description, created_at 
            FROM users 
            WHERE id = ? AND role = 'COMPANY'
        `, [id]);

        if (!companyUser) {
            return res.status(404).json({
                success: false,
                message: `Visiting company with ID '${id}' not found.`
            });
        }

        const drives = await query(`
            SELECT j.*, (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
            FROM jobs j 
            WHERE j.company_id = ? 
            ORDER BY j.created_at DESC
        `, [companyUser.id]);

        if (req.user && req.user.role === 'STUDENT') {
            const apps = await query('SELECT job_id, status FROM applications WHERE student_id = ?', [req.user.id]);
            apps.forEach(app => {
                studentApplications[app.job_id] = app.status;
            });
        }

        const formattedDrives = drives.map(d => formatJobRecord(d, studentApplications));

        return res.status(200).json({
            success: true,
            company: {
                id: companyUser.id,
                name: companyUser.name,
                company_name: companyUser.name,
                company: companyUser.name,
                email: companyUser.email,
                logo: companyUser.company_logo || '',
                website: companyUser.company_website || '',
                description: companyUser.company_description || '',
                created_at: companyUser.created_at,
                drives: formattedDrives,
                activeDrivesCount: formattedDrives.length
            },
            drives: formattedDrives
        });
    } catch (err) {
        console.error('Get company by ID error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving company details.'
        });
    }
};

exports.createCompanyDrive = createJob;
exports.updateCompanyDrive = updateJob;
exports.deleteCompanyDrive = deleteJob;
