const { query, get, run } = require('../config/db');

// --- INTERVIEW EXPERIENCES ---

exports.getExperiences = async (req, res) => {
    try {
        const { company, search } = req.query;
        const isAdmin = req.user && req.user.role === 'ADMIN';

        let sql = 'SELECT * FROM alumni_experiences';
        const params = [];
        const conditions = [];

        // Moderation filter: non-admins only see approved experiences
        if (!isAdmin) {
            conditions.push('is_approved = 1');
        }

        if (company && company.trim() !== '') {
            conditions.push('LOWER(company_name) = ?');
            params.push(company.trim().toLowerCase());
        }

        if (search && search.trim() !== '') {
            conditions.push('(LOWER(company_name) LIKE ? OR LOWER(job_role) LIKE ? OR LOWER(rounds_detail) LIKE ?)');
            const term = `%${search.trim().toLowerCase()}%`;
            params.push(term, term, term);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC';
        const rows = await query(sql, params);

        const formatted = rows.map(exp => ({
            id: exp.id,
            authorName: exp.is_anonymous ? `Anonymous Alumni (Class of ${exp.year_placed})` : exp.author_name,
            isAnonymous: Boolean(exp.is_anonymous),
            companyName: exp.company_name,
            jobRole: exp.job_role,
            yearPlaced: exp.year_placed,
            salaryOffered: exp.salary_offered,
            difficulty: exp.difficulty,
            roundsDetail: exp.rounds_detail,
            tips: exp.tips,
            isApproved: Boolean(exp.is_approved),
            createdAt: exp.created_at
        }));

        return res.status(200).json({
            success: true,
            count: formatted.length,
            experiences: formatted
        });
    } catch (err) {
        console.error('Get alumni experiences error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving interview experiences.' });
    }
};

exports.submitExperience = async (req, res) => {
    try {
        const studentId = req.user.id;
        const studentName = req.user.name;
        const { companyName, jobRole, yearPlaced, salaryOffered, difficulty, roundsDetail, tips, isAnonymous } = req.body;

        if (!companyName || !jobRole || !roundsDetail) {
            return res.status(400).json({
                success: false,
                message: 'Company Name, Job Role, and Interview Rounds Details are required.'
            });
        }

        // Student submissions default to is_approved = 0 (Pending Moderation); Admin submissions auto-approve
        const isApproved = req.user.role === 'ADMIN' ? 1 : 0;
        const anonymousFlag = isAnonymous ? 1 : 0;

        const result = await run(
            `INSERT INTO alumni_experiences 
             (student_id, author_name, company_name, job_role, year_placed, salary_offered, difficulty, rounds_detail, tips, is_anonymous, is_approved)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId,
                studentName,
                companyName.trim(),
                jobRole.trim(),
                yearPlaced || '2025',
                salaryOffered || 'N/A',
                difficulty || 'Medium',
                roundsDetail.trim(),
                tips ? tips.trim() : '',
                anonymousFlag,
                isApproved
            ]
        );

        return res.status(201).json({
            success: true,
            message: isApproved === 1 
                ? 'Experience published directly.' 
                : 'Thank you! Your interview experience has been submitted and will be published once reviewed by the Placement Cell.',
            experienceId: result.lastID
        });
    } catch (err) {
        console.error('Submit alumni experience error:', err);
        return res.status(500).json({ success: false, message: 'Server error submitting experience.' });
    }
};

exports.moderateExperience = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        const exp = await get('SELECT * FROM alumni_experiences WHERE id = ?', [id]);
        if (!exp) {
            return res.status(404).json({ success: false, message: 'Interview experience not found.' });
        }

        if (action === 'approve') {
            await run('UPDATE alumni_experiences SET is_approved = 1 WHERE id = ?', [id]);
            return res.status(200).json({ success: true, message: 'Experience approved and published publicly.' });
        } else if (action === 'reject') {
            await run('DELETE FROM alumni_experiences WHERE id = ?', [id]);
            return res.status(200).json({ success: true, message: 'Experience submission rejected and removed.' });
        } else {
            return res.status(400).json({ success: false, message: 'Action must be "approve" or "reject".' });
        }
    } catch (err) {
        console.error('Moderate experience error:', err);
        return res.status(500).json({ success: false, message: 'Server error moderating experience.' });
    }
};

// --- MENTORSHIP QUERIES ---

exports.getMentorshipQueries = async (req, res) => {
    try {
        const queries = await query(
            `SELECT id, student_id, student_name, topic, question, answer, answered_by, status, created_at, answered_at
             FROM alumni_mentorship_queries
             ORDER BY created_at DESC`
        );

        return res.status(200).json({ success: true, queries });
    } catch (err) {
        console.error('Get mentorship queries error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving mentorship queries.' });
    }
};

exports.submitMentorshipQuery = async (req, res) => {
    try {
        const studentId = req.user.id;
        const studentName = req.user.name;
        const { topic, question } = req.body;

        if (!topic || !question) {
            return res.status(400).json({ success: false, message: 'Topic and question are required.' });
        }

        const result = await run(
            `INSERT INTO alumni_mentorship_queries (student_id, student_name, topic, question, status)
             VALUES (?, ?, ?, ?, 'Open')`,
            [studentId, studentName, topic.trim(), question.trim()]
        );

        return res.status(201).json({
            success: true,
            message: 'Your mentorship question has been posted to our alumni network!',
            queryId: result.lastID
        });
    } catch (err) {
        console.error('Submit mentorship query error:', err);
        return res.status(500).json({ success: false, message: 'Server error posting query.' });
    }
};

exports.answerMentorshipQuery = async (req, res) => {
    try {
        const { id } = req.params;
        const { answer } = req.body;
        const mentorName = req.user.name;

        if (!answer || answer.trim() === '') {
            return res.status(400).json({ success: false, message: 'Answer text is required.' });
        }

        await run(
            `UPDATE alumni_mentorship_queries 
             SET answer = ?, answered_by = ?, status = 'Answered', answered_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [answer.trim(), mentorName, id]
        );

        return res.status(200).json({ success: true, message: 'Mentorship query answered successfully!' });
    } catch (err) {
        console.error('Answer mentorship query error:', err);
        return res.status(500).json({ success: false, message: 'Server error answering query.' });
    }
};
