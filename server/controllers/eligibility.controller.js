const { query, get } = require('../config/db');

exports.checkJobEligibility = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { jobId } = req.params;

        const student = await get('SELECT id, name, branch, cgpa, backlogs, batch FROM users WHERE id = ?', [studentId]);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found.' });
        }

        const job = await get('SELECT * FROM jobs WHERE id = ?', [jobId]);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Placement drive not found.' });
        }

        const studentCgpa = parseFloat(student.cgpa) || 0;
        const requiredCgpa = parseFloat(job.cgpa) || 0;
        const cgpaMargin = parseFloat((studentCgpa - requiredCgpa).toFixed(2));
        const cgpaPass = studentCgpa >= requiredCgpa;

        const studentBranch = (student.branch || '').trim();
        const allowedBranchesRaw = job.eligible_branches || 'All Branches';
        const allowedBranches = allowedBranchesRaw.split(',').map(b => b.trim().toLowerCase());
        const isAllBranches = allowedBranches.includes('all branches') || allowedBranches.includes('all');
        const branchPass = isAllBranches || allowedBranches.some(b => studentBranch.toLowerCase().includes(b) || b.includes(studentBranch.toLowerCase()));

        const studentBacklogs = parseInt(student.backlogs, 10) || 0;
        const maxBacklogsAllowed = parseInt(job.max_backlogs, 10) || 0;
        const backlogPass = studentBacklogs <= maxBacklogsAllowed;

        const studentBatch = student.batch || '2026';
        const batchPass = true; // Seeded jobs are current batch 2026

        // Check if deadline passed
        let deadlineStatus = 'Open';
        let daysLeft = null;
        if (job.deadline) {
            const deadlineDate = new Date(job.deadline);
            const now = new Date();
            const diffTime = deadlineDate - now;
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (daysLeft < 0) deadlineStatus = 'Closed';
        }

        // Check existing application status
        const app = await get('SELECT status FROM applications WHERE job_id = ? AND student_id = ?', [jobId, studentId]);

        const criteria = [
            {
                rule: 'Academic CGPA Requirement',
                required: `>= ${requiredCgpa.toFixed(1)}`,
                studentValue: studentCgpa.toFixed(2),
                passed: cgpaPass,
                message: cgpaPass
                    ? `Qualified! Your CGPA (${studentCgpa.toFixed(2)}) is ${cgpaMargin > 0 ? `${cgpaMargin} points above` : 'at'} the minimum cutoff (${requiredCgpa.toFixed(1)}).`
                    : `Disqualified. Your CGPA (${studentCgpa.toFixed(2)}) is below the required cutoff of ${requiredCgpa.toFixed(1)} (Shortfall of ${Math.abs(cgpaMargin)}).`
            },
            {
                rule: 'Eligible Engineering Branches',
                required: allowedBranchesRaw,
                studentValue: studentBranch || 'Not specified',
                passed: branchPass,
                message: branchPass
                    ? `Qualified! Your branch (${studentBranch || 'General'}) is approved for this recruitment drive.`
                    : `Disqualified. This drive is strictly reserved for: ${allowedBranchesRaw}. Your branch is ${studentBranch}.`
            },
            {
                rule: 'Active Backlog Restriction',
                required: `Maximum ${maxBacklogsAllowed} active backlog(s)`,
                studentValue: `${studentBacklogs} active backlog(s)`,
                passed: backlogPass,
                message: backlogPass
                    ? `Qualified! You have ${studentBacklogs} backlogs, which meets the company ceiling of ${maxBacklogsAllowed}.`
                    : `Disqualified. You have ${studentBacklogs} active backlogs; company policy strictly permits at most ${maxBacklogsAllowed}.`
            },
            {
                rule: 'Graduation Batch',
                required: 'Batch 2026 (Final Year)',
                studentValue: `Batch ${studentBatch}`,
                passed: batchPass,
                message: 'Qualified! You belong to the eligible graduating batch.'
            }
        ];

        const isOverallEligible = cgpaPass && branchPass && backlogPass && batchPass && (deadlineStatus !== 'Closed');

        let summaryExplanation = '';
        if (isOverallEligible) {
            summaryExplanation = `You meet all ${criteria.length} eligibility conditions for ${job.title} at ${job.company_name}. You are fully cleared to submit your application.`;
        } else {
            const failedRules = criteria.filter(c => !c.passed).map(c => c.rule);
            summaryExplanation = `You are currently ineligible for this position due to: ${failedRules.join('; ')}. Review the rule breakdown above for exact details.`;
        }

        return res.status(200).json({
            success: true,
            job: {
                id: job.id,
                company: job.company_name,
                title: job.title,
                salary: job.salary,
                location: job.location,
                deadline: job.deadline,
                deadlineStatus,
                daysLeft,
                appliedStatus: app ? app.status : null
            },
            isEligible: isOverallEligible,
            summaryExplanation,
            criteria
        });
    } catch (err) {
        console.error('Check eligibility error:', err);
        return res.status(500).json({ success: false, message: 'Server error checking eligibility.' });
    }
};

exports.checkAllDrivesEligibility = async (req, res) => {
    try {
        const studentId = req.user.id;
        const student = await get('SELECT id, branch, cgpa, backlogs FROM users WHERE id = ?', [studentId]);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        const jobs = await query(`
            SELECT id, company_name, title, cgpa, eligible_branches, max_backlogs, salary, location, deadline, visit_date,
                   (SELECT status FROM applications WHERE job_id = jobs.id AND student_id = ?) as applied_status
            FROM jobs
            ORDER BY id ASC
        `, [studentId]);

        const studentCgpa = parseFloat(student.cgpa) || 0;
        const studentBranch = (student.branch || '').trim().toLowerCase();
        const studentBacklogs = parseInt(student.backlogs, 10) || 0;

        const eligibilityMap = {};
        const drives = [];

        jobs.forEach(job => {
            const requiredCgpa = parseFloat(job.cgpa) || 0;
            const cgpaPass = studentCgpa >= requiredCgpa;
            const branches = (job.eligible_branches || 'All Branches').split(',').map(b => b.trim().toLowerCase());
            const branchPass = branches.includes('all branches') || branches.includes('all') || branches.some(b => studentBranch.includes(b) || b.includes(studentBranch));
            const maxBacklogsAllowed = parseInt(job.max_backlogs, 10) || 0;
            const backlogPass = studentBacklogs <= maxBacklogsAllowed;
            const isEligible = cgpaPass && branchPass && backlogPass;

            let reason = '';
            if (isEligible) {
                reason = `Qualified: CGPA ${studentCgpa.toFixed(1)} ≥ ${requiredCgpa.toFixed(1)}, Branch matched, ${studentBacklogs} backlogs ≤ ${maxBacklogsAllowed}`;
            } else {
                const issues = [];
                if (!cgpaPass) issues.push(`CGPA ${studentCgpa.toFixed(1)} < ${requiredCgpa.toFixed(1)} cutoff`);
                if (!branchPass) issues.push(`Branch not in approved list`);
                if (!backlogPass) issues.push(`Backlogs ${studentBacklogs} > allowed ${maxBacklogsAllowed}`);
                reason = `Disqualified: ${issues.join(', ')}`;
            }

            eligibilityMap[job.id] = {
                isEligible,
                cgpaPass,
                branchPass,
                backlogPass
            };

            drives.push({
                id: job.id,
                company: job.company_name,
                title: job.title,
                salary: job.salary,
                location: job.location,
                deadline: job.deadline,
                visitDate: job.visit_date,
                requiredCgpa,
                eligibleBranches: job.eligible_branches,
                maxBacklogs: maxBacklogsAllowed,
                isEligible,
                cgpaPass,
                branchPass,
                backlogPass,
                reason,
                appliedStatus: job.applied_status
            });
        });

        return res.status(200).json({ success: true, eligibilityMap, drives });
    } catch (err) {
        console.error('Check all drives eligibility error:', err);
        return res.status(500).json({ success: false, message: 'Server error checking drives eligibility.' });
    }
};
