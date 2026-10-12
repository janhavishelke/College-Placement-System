const { query, get, run } = require('../config/db');

exports.getAllJobs = async (req, res) => {
    try {
        const { search } = req.query;
        let sql = `
            SELECT j.*, 
                   (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
            FROM jobs j
        `;
        const params = [];

        if (search && search.trim() !== '') {
            const term = `%${search.trim().toLowerCase()}%`;
            sql += ` WHERE LOWER(j.title) LIKE ? 
                        OR LOWER(j.company_name) LIKE ? 
                        OR LOWER(j.skills) LIKE ? 
                        OR LOWER(j.location) LIKE ?
                        OR LOWER(j.role_category) LIKE ?`;
            params.push(term, term, term, term, term);
        }

        sql += ` ORDER BY j.created_at DESC`;

        const jobs = await query(sql, params);

        // If user is a logged-in student, include their application status for each job
        let studentApplications = {};
        if (req.user && req.user.role === 'STUDENT') {
            const apps = await query('SELECT job_id, status FROM applications WHERE student_id = ?', [req.user.id]);
            apps.forEach(app => {
                studentApplications[app.job_id] = app.status;
            });
        }

        const formattedJobs = jobs.map(job => ({
            id: job.id,
            company: job.company_name,
            title: job.title,
            cgpa: job.cgpa,
            skills: job.skills,
            location: job.location,
            salary: job.salary,
            eligibleBranches: job.eligible_branches || 'All Branches',
            maxBacklogs: job.max_backlogs !== undefined ? job.max_backlogs : 0,
            deadline: job.deadline || '',
            visitDate: job.visit_date || job.deadline || '',
            description: job.description || '',
            roleCategory: job.role_category || 'Software Engineering',
            baseSalary: job.base_salary || '',
            bonus: job.bonus || '',
            bondMonths: job.bond_months || 0,
            workMode: job.work_mode || 'On-Site',
            created_at: job.created_at,
            applicantCount: job.applicant_count,
            appliedStatus: studentApplications[job.id] || null
        }));

        return res.status(200).json({
            success: true,
            count: formattedJobs.length,
            jobs: formattedJobs
        });
    } catch (err) {
        console.error('Get jobs error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving jobs.'
        });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await get('SELECT * FROM jobs WHERE id = ?', [id]);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.'
            });
        }
        return res.status(200).json({
            success: true,
            job
        });
    } catch (err) {
        console.error('Get job by ID error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving job.'
        });
    }
};

exports.createJob = async (req, res) => {
    try {
        const {
            companyName, jobTitle, minimumCgpa, skills, location, salary,
            eligibleBranches, maxBacklogs, deadline, visitDate, description,
            roleCategory, baseSalary, bonus, bondMonths, workMode
        } = req.body;

        if (!jobTitle || !skills || !location || !salary) {
            return res.status(400).json({
                success: false,
                message: 'Job Title, Skills, Location, and Salary are required.'
            });
        }

        const compName = (companyName && companyName.trim()) || req.user.name;
        const cgpa = parseFloat(minimumCgpa) || 0;
        const sal = salary.toString().includes('LPA') ? salary.toString().trim() : `${salary} LPA`;
        const branches = eligibleBranches ? eligibleBranches.trim() : 'Computer Engineering, Information Technology, AI & ML';
        const backlogs = parseInt(maxBacklogs, 10) || 0;
        const dline = deadline ? deadline.trim() : '2026-12-15';
        const vDate = visitDate ? visitDate.trim() : dline;
        const desc = description ? description.trim() : '';
        const roleCat = roleCategory ? roleCategory.trim() : 'Software Engineering';
        const base = baseSalary ? (baseSalary.toString().includes('LPA') ? baseSalary : `${baseSalary} LPA`) : '';
        const bon = bonus ? (bonus.toString().includes('LPA') ? bonus : `${bonus} LPA`) : '';
        const bond = parseInt(bondMonths, 10) || 0;
        const mode = workMode || 'On-Site';

        const result = await run(
            `INSERT INTO jobs 
             (company_id, company_name, title, cgpa, skills, location, salary, eligible_branches, max_backlogs, deadline, visit_date, description, role_category, base_salary, bonus, bond_months, work_mode)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, compName, jobTitle.trim(), cgpa, skills.trim(), location.trim(), sal, branches, backlogs, dline, vDate, desc, roleCat, base, bon, bond, mode]
        );

        const newJob = await get('SELECT * FROM jobs WHERE id = ?', [result.lastID]);

        // Broadcast notification to all students so they immediately see the new visiting company
        const students = await query("SELECT id FROM users WHERE role = 'STUDENT'");
        for (const s of students) {
            await run(
                `INSERT INTO notifications (user_id, title, message, type, link)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    s.id,
                    `📢 Campus Drive Announced: ${compName}`,
                    `${compName} is visiting for ${jobTitle.trim()} (${sal}). Campus visit on ${vDate}. Apply before deadline ${dline}!`,
                    'drive',
                    'jobs.html'
                ]
            );
        }

        return res.status(201).json({
            success: true,
            message: `Campus drive for ${compName} published successfully! All students have been notified.`,
            job: newJob
        });
    } catch (err) {
        console.error('Create job error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error creating job.'
        });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await get('SELECT * FROM jobs WHERE id = ?', [id]);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found.'
            });
        }

        // Only Admin or the owner company can delete the job
        if (req.user.role !== 'ADMIN' && job.company_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this job.'
            });
        }

        await run('DELETE FROM jobs WHERE id = ?', [id]);

        return res.status(200).json({
            success: true,
            message: 'Job deleted successfully.'
        });
    } catch (err) {
        console.error('Delete job error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error deleting job.'
        });
    }
};
