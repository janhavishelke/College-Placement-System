const { query, get, run } = require('../config/db');

function formatJobRecord(job, studentApplications = {}) {
    return {
        id: job.id,
        company_id: job.company_id,
        companyId: job.company_id,
        company: job.company_name,
        company_name: job.company_name,
        name: job.company_name,
        title: job.title,
        jobTitle: job.title,
        role: job.title,
        cgpa: job.cgpa,
        minimumCgpa: job.cgpa,
        skills: job.skills,
        requiredSkills: job.skills,
        location: job.location || 'On-Campus',
        salary: job.salary,
        package: job.salary,
        eligibleBranches: job.eligible_branches || 'All Branches',
        eligible_branches: job.eligible_branches || 'All Branches',
        maxBacklogs: job.max_backlogs !== undefined ? job.max_backlogs : 0,
        max_backlogs: job.max_backlogs !== undefined ? job.max_backlogs : 0,
        deadline: job.deadline || '',
        applicationDeadline: job.deadline || '',
        visitDate: job.visit_date || job.deadline || '',
        visit_date: job.visit_date || job.deadline || '',
        testDate: job.test_date || '',
        test_date: job.test_date || '',
        interviewDate: job.interview_date || '',
        interview_date: job.interview_date || '',
        description: job.description || '',
        roleCategory: job.role_category || 'Software Engineering',
        role_category: job.role_category || 'Software Engineering',
        baseSalary: job.base_salary || '',
        base_salary: job.base_salary || '',
        bonus: job.bonus || '',
        bondMonths: job.bond_months || 0,
        bond_months: job.bond_months || 0,
        workMode: job.work_mode || 'On-Site',
        work_mode: job.work_mode || 'On-Site',
        logo: job.logo || '',
        company_logo: job.logo || '',
        website: job.website || '',
        company_website: job.website || '',
        recruitmentStatus: job.recruitment_status || 'Upcoming',
        recruitment_status: job.recruitment_status || 'Upcoming',
        applicantCount: job.applicant_count !== undefined ? job.applicant_count : 0,
        applicant_count: job.applicant_count !== undefined ? job.applicant_count : 0,
        appliedStatus: studentApplications[job.id] || null,
        applied_status: studentApplications[job.id] || null,
        created_at: job.created_at
    };
}

exports.formatJobRecord = formatJobRecord;

exports.getAllJobs = async (req, res) => {
    try {
        const { search, status } = req.query;
        let sql = `
            SELECT j.*, 
                   (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
            FROM jobs j
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

        const jobs = await query(sql, params);

        // If user is a logged-in student, include their application status for each job
        let studentApplications = {};
        if (req.user && req.user.role === 'STUDENT') {
            const apps = await query('SELECT job_id, status FROM applications WHERE student_id = ?', [req.user.id]);
            apps.forEach(app => {
                studentApplications[app.job_id] = app.status;
            });
        }

        const formattedJobs = jobs.map(job => formatJobRecord(job, studentApplications));

        return res.status(200).json({
            success: true,
            count: formattedJobs.length,
            jobs: formattedJobs,
            companies: formattedJobs // Compatibility alias
        });
    } catch (err) {
        console.error('Get jobs error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving visiting companies and jobs.'
        });
    }
};

exports.getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await get(`
            SELECT j.*, 
                   (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
            FROM jobs j 
            WHERE j.id = ?
        `, [id]);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Company drive not found.'
            });
        }

        let studentApplications = {};
        if (req.user && req.user.role === 'STUDENT') {
            const app = await get('SELECT status FROM applications WHERE job_id = ? AND student_id = ?', [id, req.user.id]);
            if (app) studentApplications[job.id] = app.status;
        }

        const formatted = formatJobRecord(job, studentApplications);

        return res.status(200).json({
            success: true,
            job: formatted,
            company: formatted // Compatibility alias
        });
    } catch (err) {
        console.error('Get job by ID error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving company details.'
        });
    }
};

exports.createJob = async (req, res) => {
    try {
        const {
            companyName, jobTitle, minimumCgpa, skills, location, salary,
            eligibleBranches, maxBacklogs, deadline, visitDate, testDate, interviewDate,
            description, roleCategory, baseSalary, bonus, bondMonths, workMode,
            logo, website, recruitmentStatus
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
        const tDate = testDate ? testDate.trim() : '';
        const iDate = interviewDate ? interviewDate.trim() : '';
        const desc = description ? description.trim() : '';
        const roleCat = roleCategory ? roleCategory.trim() : 'Software Engineering';
        const base = baseSalary ? (baseSalary.toString().includes('LPA') ? baseSalary : `${baseSalary} LPA`) : '';
        const bon = bonus ? (bonus.toString().includes('LPA') ? bonus : `${bonus} LPA`) : '';
        const bond = parseInt(bondMonths, 10) || 0;
        const mode = workMode || 'On-Site';
        const compLogo = logo ? logo.trim() : '';
        const compWeb = website ? website.trim() : '';
        const recStatus = recruitmentStatus ? recruitmentStatus.trim() : 'Upcoming';

        const result = await run(
            `INSERT INTO jobs 
             (company_id, company_name, title, cgpa, skills, location, salary, eligible_branches, max_backlogs, deadline, visit_date, test_date, interview_date, description, role_category, base_salary, bonus, bond_months, work_mode, logo, website, recruitment_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, compName, jobTitle.trim(), cgpa, skills.trim(), location.trim(), sal, branches, backlogs, dline, vDate, tDate, iDate, desc, roleCat, base, bon, bond, mode, compLogo, compWeb, recStatus]
        );

        const newJob = await get(`
            SELECT j.*, 0 as applicant_count 
            FROM jobs j 
            WHERE j.id = ?
        `, [result.lastID]);

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

        const formatted = formatJobRecord(newJob);

        return res.status(201).json({
            success: true,
            message: `Campus drive for ${compName} published successfully! All students have been notified.`,
            job: formatted,
            company: formatted
        });
    } catch (err) {
        console.error('Create job error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error creating company drive.'
        });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await get('SELECT * FROM jobs WHERE id = ?', [id]);

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Company drive not found.'
            });
        }

        // Only Admin or the owner company can update
        if (req.user.role !== 'ADMIN' && existing.company_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this company drive.'
            });
        }

        const {
            companyName, jobTitle, minimumCgpa, skills, location, salary,
            eligibleBranches, maxBacklogs, deadline, visitDate, testDate, interviewDate,
            description, roleCategory, baseSalary, bonus, bondMonths, workMode,
            logo, website, recruitmentStatus
        } = req.body;

        const compName = companyName !== undefined ? companyName.trim() : existing.company_name;
        const title = jobTitle !== undefined ? jobTitle.trim() : existing.title;
        const cgpa = minimumCgpa !== undefined ? parseFloat(minimumCgpa) : existing.cgpa;
        const sk = skills !== undefined ? skills.trim() : existing.skills;
        const loc = location !== undefined ? location.trim() : existing.location;
        const sal = salary !== undefined ? (salary.toString().includes('LPA') ? salary.toString().trim() : `${salary} LPA`) : existing.salary;
        const branches = eligibleBranches !== undefined ? eligibleBranches.trim() : existing.eligible_branches;
        const backlogs = maxBacklogs !== undefined ? parseInt(maxBacklogs, 10) : existing.max_backlogs;
        const dline = deadline !== undefined ? deadline.trim() : existing.deadline;
        const vDate = visitDate !== undefined ? visitDate.trim() : existing.visit_date;
        const tDate = testDate !== undefined ? testDate.trim() : existing.test_date;
        const iDate = interviewDate !== undefined ? interviewDate.trim() : existing.interview_date;
        const desc = description !== undefined ? description.trim() : existing.description;
        const roleCat = roleCategory !== undefined ? roleCategory.trim() : existing.role_category;
        const base = baseSalary !== undefined ? baseSalary.toString().trim() : existing.base_salary;
        const bon = bonus !== undefined ? bonus.toString().trim() : existing.bonus;
        const bond = bondMonths !== undefined ? parseInt(bondMonths, 10) : existing.bond_months;
        const mode = workMode !== undefined ? workMode.trim() : existing.work_mode;
        const compLogo = logo !== undefined ? logo.trim() : existing.logo;
        const compWeb = website !== undefined ? website.trim() : existing.website;
        const recStatus = recruitmentStatus !== undefined ? recruitmentStatus.trim() : existing.recruitment_status;

        await run(
            `UPDATE jobs SET 
             company_name = ?, title = ?, cgpa = ?, skills = ?, location = ?, salary = ?,
             eligible_branches = ?, max_backlogs = ?, deadline = ?, visit_date = ?,
             test_date = ?, interview_date = ?, description = ?, role_category = ?,
             base_salary = ?, bonus = ?, bond_months = ?, work_mode = ?, logo = ?,
             website = ?, recruitment_status = ?
             WHERE id = ?`,
            [compName, title, cgpa, sk, loc, sal, branches, backlogs, dline, vDate, tDate, iDate, desc, roleCat, base, bon, bond, mode, compLogo, compWeb, recStatus, id]
        );

        const updated = await get(`
            SELECT j.*, 
                   (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count 
            FROM jobs j 
            WHERE j.id = ?
        `, [id]);

        const formatted = formatJobRecord(updated);

        return res.status(200).json({
            success: true,
            message: 'Company drive updated successfully.',
            job: formatted,
            company: formatted
        });
    } catch (err) {
        console.error('Update job error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error updating company drive.'
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
                message: 'Company drive not found.'
            });
        }

        // Only Admin or the owner company can delete the job
        if (req.user.role !== 'ADMIN' && job.company_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this company drive.'
            });
        }

        await run('DELETE FROM jobs WHERE id = ?', [id]);

        return res.status(200).json({
            success: true,
            message: `Campus recruitment drive for ${job.company_name} deleted successfully.`
        });
    } catch (err) {
        console.error('Delete job error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error deleting company drive.'
        });
    }
};
