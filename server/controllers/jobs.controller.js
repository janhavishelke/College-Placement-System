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
        approvalStatus: job.approval_status || 'Approved',
        approval_status: job.approval_status || 'Approved',
        coordinatorId: job.coordinator_id || null,
        coordinator_id: job.coordinator_id || null,
        coordinatorName: job.coordinator_name || '',
        coordinator_name: job.coordinator_name || '',
        industry: job.industry || 'Information Technology',
        stipend: job.stipend || '',
        internshipDuration: job.internship_duration || '',
        internship_duration: job.internship_duration || '',
        availablePositions: job.available_positions !== undefined ? job.available_positions : 10,
        available_positions: job.available_positions !== undefined ? job.available_positions : 10,
        selectionProcess: job.selection_process || 'Online Assessment -> Technical Interview -> HR Round',
        selection_process: job.selection_process || 'Online Assessment -> Technical Interview -> HR Round',
        graduationYear: job.graduation_year || '2026',
        graduation_year: job.graduation_year || '2026',
        approvalNotes: job.approval_notes || '',
        approval_notes: job.approval_notes || '',
        isArchived: job.is_archived || 0,
        is_archived: job.is_archived || 0,
        created_at: job.created_at
    };
}

exports.formatJobRecord = formatJobRecord;

exports.getAllJobs = async (req, res) => {
    try {
        const { search, status, approvalStatus, assignedOnly, includeArchived } = req.query;
        let sql = `
            SELECT j.*, 
                   (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
            FROM jobs j
        `;
        const params = [];
        const conditions = [];

        // Public / Student visibility filter: only approved and unarchived drives
        const isStudentOrPublic = !req.user || req.user.role === 'STUDENT';
        if (isStudentOrPublic) {
            conditions.push(`(j.approval_status = 'Approved' OR j.approval_status IS NULL)`);
            conditions.push(`(j.is_archived = 0 OR j.is_archived IS NULL)`);
        } else {
            // Coordinator filtering
            if (req.user.role === 'COORDINATOR' && assignedOnly === 'true') {
                conditions.push(`(j.coordinator_id = ? OR j.coordinator_id IS NULL)`);
                params.push(req.user.id);
            }
            if (approvalStatus && approvalStatus.trim() !== '' && approvalStatus.toLowerCase() !== 'all') {
                conditions.push(`LOWER(j.approval_status) = ?`);
                params.push(approvalStatus.trim().toLowerCase());
            }
            if (includeArchived !== 'true') {
                conditions.push(`(j.is_archived = 0 OR j.is_archived IS NULL)`);
            }
        }

        if (search && search.trim() !== '') {
            const term = `%${search.trim().toLowerCase()}%`;
            conditions.push(`(LOWER(j.title) LIKE ? 
                        OR LOWER(j.company_name) LIKE ? 
                        OR LOWER(j.skills) LIKE ? 
                        OR LOWER(j.location) LIKE ?
                        OR LOWER(j.industry) LIKE ?
                        OR LOWER(j.role_category) LIKE ?)`);
            params.push(term, term, term, term, term, term);
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
            logo, website, recruitmentStatus,
            approvalStatus, coordinatorId, industry, stipend, internshipDuration,
            availablePositions, selectionProcess, graduationYear
        } = req.body;

        const loc = (location && location.trim()) || 'On-Campus';
        if (!jobTitle || !skills || !salary) {
            return res.status(400).json({
                success: false,
                message: 'Job Title, Skills, and Salary are required.'
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

        const ind = industry ? industry.trim() : 'Information Technology';
        const stip = stipend ? stipend.trim() : '';
        const internDur = internshipDuration ? internshipDuration.trim() : '';
        const positions = parseInt(availablePositions, 10) || 10;
        const selProc = selectionProcess ? selectionProcess.trim() : 'Online Assessment -> Technical Interview -> HR Round';
        const gradYr = graduationYear ? graduationYear.trim() : '2026';

        // Workflow state determination
        let appStat = 'Approved';
        let assignedCoordId = null;
        let assignedCoordName = '';

        if (req.user.role === 'COORDINATOR') {
            appStat = approvalStatus || 'Pending Approval';
            assignedCoordId = req.user.id;
            assignedCoordName = req.user.name;
        } else if (req.user.role === 'ADMIN' || req.user.role === 'PLACEMENT_HEAD') {
            appStat = approvalStatus || 'Approved';
            if (coordinatorId) {
                const coord = await get("SELECT name FROM users WHERE id = ?", [coordinatorId]);
                assignedCoordId = coordinatorId;
                assignedCoordName = coord ? coord.name : '';
            }
        }

        const result = await run(
            `INSERT INTO jobs 
             (company_id, company_name, title, cgpa, skills, location, salary, eligible_branches, max_backlogs, deadline, visit_date, test_date, interview_date, description, role_category, base_salary, bonus, bond_months, work_mode, logo, website, recruitment_status, approval_status, coordinator_id, coordinator_name, industry, stipend, internship_duration, available_positions, selection_process, graduation_year)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, compName, jobTitle.trim(), cgpa, skills.trim(), loc, sal, branches, backlogs, dline, vDate, tDate, iDate, desc, roleCat, base, bon, bond, mode, compLogo, compWeb, recStatus, appStat, assignedCoordId, assignedCoordName, ind, stip, internDur, positions, selProc, gradYr]
        );

        const newJobId = result.lastID;
        const newJob = await get(`
            SELECT j.*, 0 as applicant_count 
            FROM jobs j 
            WHERE j.id = ?
        `, [newJobId]);

        // Audit Trail Entry
        await run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, 'CREATE_DRIVE', 'DRIVE', ?, ?)`,
            [req.user.id, req.user.name, req.user.role, newJobId, `Created campus drive for ${compName} (${jobTitle.trim()}) with approval status '${appStat}'.`]
        );

        // If approved directly, broadcast to students
        if (appStat === 'Approved') {
            const students = await query("SELECT id FROM users WHERE role = 'STUDENT'");
            for (const s of students) {
                await run(
                    `INSERT INTO notifications (user_id, title, message, type, link)
                     VALUES (?, ?, ?, 'drive', 'jobs.html')`,
                    [s.id, `📢 Campus Drive Announced: ${compName}`, `${compName} is visiting for ${jobTitle.trim()} (${sal}). Visit on ${vDate}. Apply before deadline ${dline}!`]
                );
            }
        } else {
            // Notify Placement Head for review
            const heads = await query("SELECT id FROM users WHERE role IN ('PLACEMENT_HEAD', 'ADMIN')");
            for (const h of heads) {
                await run(
                    `INSERT INTO notifications (user_id, title, message, type, link)
                     VALUES (?, ?, ?, 'approval', 'admin-dashboard.html')`,
                    [h.id, `📑 New Drive Pending Approval: ${compName}`, `Coordinator ${req.user.name} submitted a new recruitment drive for ${compName} (${jobTitle.trim()}) requiring your review.`]
                );
            }
        }

        const formatted = formatJobRecord(newJob);

        return res.status(201).json({
            success: true,
            message: appStat === 'Approved'
                ? `Campus drive for ${compName} published successfully! All students have been notified.`
                : `Campus drive for ${compName} saved as ${appStat}. Submitted for Placement Head review.`,
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

        // Authorization check: Admin, Placement Head, assigned Coordinator, or owner Company
        const isHeadOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'PLACEMENT_HEAD';
        const isCoordinator = req.user.role === 'COORDINATOR';
        const isAssignedCoord = isCoordinator && (existing.coordinator_id === req.user.id || !existing.coordinator_id);
        const isOwnerCompany = req.user.role === 'COMPANY' && existing.company_id === req.user.id;

        if (!isHeadOrAdmin && !isAssignedCoord && !isOwnerCompany) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update this company drive.'
            });
        }

        const {
            companyName, jobTitle, minimumCgpa, skills, location, salary,
            eligibleBranches, maxBacklogs, deadline, visitDate, testDate, interviewDate,
            description, roleCategory, baseSalary, bonus, bondMonths, workMode,
            logo, website, recruitmentStatus,
            approvalStatus, coordinatorId, industry, stipend, internshipDuration,
            availablePositions, selectionProcess, graduationYear, approvalNotes
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

        const ind = industry !== undefined ? industry.trim() : (existing.industry || 'Information Technology');
        const stip = stipend !== undefined ? stipend.trim() : (existing.stipend || '');
        const internDur = internshipDuration !== undefined ? internshipDuration.trim() : (existing.internship_duration || '');
        const positions = availablePositions !== undefined ? parseInt(availablePositions, 10) : (existing.available_positions || 10);
        const selProc = selectionProcess !== undefined ? selectionProcess.trim() : (existing.selection_process || '');
        const gradYr = graduationYear !== undefined ? graduationYear.trim() : (existing.graduation_year || '2026');
        const appNotes = approvalNotes !== undefined ? approvalNotes.trim() : (existing.approval_notes || '');

        let appStat = existing.approval_status || 'Approved';
        if (approvalStatus !== undefined) {
            appStat = approvalStatus;
        }

        let assignedCoordId = existing.coordinator_id;
        let assignedCoordName = existing.coordinator_name;
        if (coordinatorId !== undefined) {
            assignedCoordId = coordinatorId;
            const coord = await get("SELECT name FROM users WHERE id = ?", [coordinatorId]);
            assignedCoordName = coord ? coord.name : '';
        } else if (isCoordinator && !existing.coordinator_id) {
            assignedCoordId = req.user.id;
            assignedCoordName = req.user.name;
        }

        await run(
            `UPDATE jobs SET 
             company_name = ?, title = ?, cgpa = ?, skills = ?, location = ?, salary = ?,
             eligible_branches = ?, max_backlogs = ?, deadline = ?, visit_date = ?,
             test_date = ?, interview_date = ?, description = ?, role_category = ?,
             base_salary = ?, bonus = ?, bond_months = ?, work_mode = ?, logo = ?,
             website = ?, recruitment_status = ?,
             approval_status = ?, coordinator_id = ?, coordinator_name = ?, industry = ?,
             stipend = ?, internship_duration = ?, available_positions = ?, selection_process = ?,
             graduation_year = ?, approval_notes = ?
             WHERE id = ?`,
            [compName, title, cgpa, sk, loc, sal, branches, backlogs, dline, vDate, tDate, iDate, desc, roleCat, base, bon, bond, mode, compLogo, compWeb, recStatus, appStat, assignedCoordId, assignedCoordName, ind, stip, internDur, positions, selProc, gradYr, appNotes, id]
        );

        // Audit Trail
        await run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, 'UPDATE_DRIVE', 'DRIVE', ?, ?)`,
            [req.user.id, req.user.name, req.user.role, id, `Updated drive for ${compName} (${title}). Status: '${appStat}', Recruitment: '${recStatus}'.`]
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
            message: 'Company recruitment drive updated successfully.',
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

        const isHeadOrAdmin = req.user.role === 'ADMIN' || req.user.role === 'PLACEMENT_HEAD';
        if (!isHeadOrAdmin && job.company_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this company drive.'
            });
        }

        await run('DELETE FROM jobs WHERE id = ?', [id]);

        await run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, 'DELETE_DRIVE', 'DRIVE', ?, ?)`,
            [req.user.id, req.user.name, req.user.role, id, `Deleted recruitment drive for ${job.company_name} (${job.title}).`]
        );

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

// Approval Workflow: Approve & Publish Drive
exports.approveDrive = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const drive = await get('SELECT * FROM jobs WHERE id = ?', [id]);

        if (!drive) {
            return res.status(404).json({ success: false, message: 'Drive not found.' });
        }

        const approvalNotes = notes ? notes.trim() : 'Approved and published by Placement Head for campus recruitment.';
        await run(
            `UPDATE jobs SET approval_status = 'Approved', approval_notes = ? WHERE id = ?`,
            [approvalNotes, id]
        );

        await run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, 'APPROVE_DRIVE', 'DRIVE', ?, ?)`,
            [req.user.id, req.user.name, req.user.role, id, `Approved and published drive for ${drive.company_name} (${drive.title}).`]
        );

        // Notify students that drive is now open
        const students = await query("SELECT id FROM users WHERE role = 'STUDENT'");
        for (const s of students) {
            await run(
                `INSERT INTO notifications (user_id, title, message, type, link)
                 VALUES (?, ?, ?, 'drive', 'jobs.html')`,
                [s.id, `📢 Campus Drive Approved: ${drive.company_name}`, `${drive.company_name} is now approved for campus recruitment. Register before ${drive.deadline || 'deadline'}!`]
            );
        }

        // Notify coordinator if assigned
        if (drive.coordinator_id) {
            await run(
                `INSERT INTO notifications (user_id, title, message, type, link)
                 VALUES (?, ?, ?, 'system', 'coordinator-dashboard.html')`,
                [drive.coordinator_id, `✓ Drive Approved: ${drive.company_name}`, `Placement Head approved your submission for ${drive.company_name}. Drive is now live for students.`]
            );
        }

        return res.status(200).json({
            success: true,
            message: `Drive for ${drive.company_name} successfully approved and published!`
        });
    } catch (err) {
        console.error('Approve drive error:', err);
        return res.status(500).json({ success: false, message: 'Server error approving drive.' });
    }
};

// Approval Workflow: Reject / Request Revisions
exports.rejectDrive = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const drive = await get('SELECT * FROM jobs WHERE id = ?', [id]);

        if (!drive) {
            return res.status(404).json({ success: false, message: 'Drive not found.' });
        }

        const rejectionReason = reason ? reason.trim() : 'Revisions requested by Placement Head.';
        await run(
            `UPDATE jobs SET approval_status = 'Rejected', approval_notes = ? WHERE id = ?`,
            [rejectionReason, id]
        );

        await run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, 'REJECT_DRIVE', 'DRIVE', ?, ?)`,
            [req.user.id, req.user.name, req.user.role, id, `Rejected drive for ${drive.company_name}. Reason: ${rejectionReason}`]
        );

        // Notify coordinator
        if (drive.coordinator_id) {
            await run(
                `INSERT INTO notifications (user_id, title, message, type, link)
                 VALUES (?, ?, ?, 'alert', 'coordinator-dashboard.html')`,
                [drive.coordinator_id, `⚠️ Changes Requested: ${drive.company_name}`, `Placement Head requested revisions: ${rejectionReason}`]
            );
        }

        return res.status(200).json({
            success: true,
            message: `Drive rejected with revision notes.`
        });
    } catch (err) {
        console.error('Reject drive error:', err);
        return res.status(500).json({ success: false, message: 'Server error rejecting drive.' });
    }
};

// Assign Coordinator to Drive
exports.assignCoordinator = async (req, res) => {
    try {
        const { id } = req.params;
        const coordId = req.body.coordinatorId || req.body.coordinator_id;
        const drive = await get('SELECT * FROM jobs WHERE id = ?', [id]);

        if (!drive) {
            return res.status(404).json({ success: false, message: 'Drive not found.' });
        }

        const coordinator = await get("SELECT id, name FROM users WHERE id = ? AND role = 'COORDINATOR'", [coordId]);
        if (!coordinator) {
            return res.status(404).json({ success: false, message: 'Placement Coordinator not found.' });
        }

        await run(
            `UPDATE jobs SET coordinator_id = ?, coordinator_name = ? WHERE id = ?`,
            [coordinator.id, coordinator.name, id]
        );

        await run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, 'ASSIGN_COORDINATOR', 'DRIVE', ?, ?)`,
            [req.user.id, req.user.name, req.user.role, id, `Assigned coordinator ${coordinator.name} to ${drive.company_name} drive.`]
        );

        await run(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES (?, ?, ?, 'system', 'coordinator-dashboard.html')`,
            [coordinator.id, `📋 Assigned to Drive: ${drive.company_name}`, `You have been assigned as the coordinator for ${drive.company_name} (${drive.title}).`]
        );

        return res.status(200).json({
            success: true,
            message: `Assigned ${coordinator.name} to ${drive.company_name} successfully.`
        });
    } catch (err) {
        console.error('Assign coordinator error:', err);
        return res.status(500).json({ success: false, message: 'Server error assigning coordinator.' });
    }
};

// Archive / Unarchive Drive
exports.archiveDrive = async (req, res) => {
    try {
        const { id } = req.params;
        const drive = await get('SELECT * FROM jobs WHERE id = ?', [id]);

        if (!drive) {
            return res.status(404).json({ success: false, message: 'Drive not found.' });
        }

        const newArchived = drive.is_archived ? 0 : 1;
        await run(`UPDATE jobs SET is_archived = ? WHERE id = ?`, [newArchived, id]);

        await run(
            `INSERT INTO audit_logs (user_id, user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, ?, 'DRIVE', ?, ?)`,
            [req.user.id, req.user.name, req.user.role, newArchived ? 'ARCHIVE_DRIVE' : 'UNARCHIVE_DRIVE', id, `${newArchived ? 'Archived' : 'Unarchived'} drive for ${drive.company_name}.`]
        );

        return res.status(200).json({
            success: true,
            message: `Drive for ${drive.company_name} ${newArchived ? 'archived' : 'unarchived'} successfully.`
        });
    } catch (err) {
        console.error('Archive drive error:', err);
        return res.status(500).json({ success: false, message: 'Server error archiving drive.' });
    }
};
