const vm = require('vm');
const { query, get, run } = require('../config/db');

// --- APTITUDE MODULE ---

exports.getAptitudeQuestions = async (req, res) => {
    try {
        const { category } = req.query;
        let sql = 'SELECT id, category, question, options FROM prep_aptitude_questions';
        const params = [];

        if (category && category !== 'All') {
            sql += ' WHERE category = ?';
            params.push(category);
        }

        sql += ' ORDER BY id ASC';
        const questions = await query(sql, params);

        const formatted = questions.map(q => ({
            id: q.id,
            category: q.category,
            question: q.question,
            options: JSON.parse(q.options || '[]')
        }));

        return res.status(200).json({
            success: true,
            count: formatted.length,
            questions: formatted
        });
    } catch (err) {
        console.error('Get aptitude questions error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving questions.' });
    }
};

exports.submitAptitudeTest = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { category, answers } = req.body; // answers: [{ questionId: 1, selectedIndex: 0 }]

        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide test answers.' });
        }

        const ids = answers.map(a => a.questionId);
        const placeholders = ids.map(() => '?').join(',');
        const dbQuestions = await query(
            `SELECT id, category, question, options, correct_index, explanation 
             FROM prep_aptitude_questions WHERE id IN (${placeholders})`,
            ids
        );

        let correctCount = 0;
        const results = [];

        dbQuestions.forEach(q => {
            const userAns = answers.find(a => a.questionId === q.id);
            const selected = userAns !== undefined ? userAns.selectedIndex : -1;
            const isCorrect = selected === q.correct_index;
            if (isCorrect) correctCount++;

            results.push({
                questionId: q.id,
                category: q.category,
                question: q.question,
                options: JSON.parse(q.options || '[]'),
                selectedOption: selected,
                correctOption: q.correct_index,
                isCorrect,
                explanation: q.explanation
            });
        });

        const totalQuestions = dbQuestions.length;
        const percentage = parseFloat(((correctCount / totalQuestions) * 100).toFixed(1));

        // Save attempt to DB
        await run(
            `INSERT INTO prep_test_attempts (student_id, category, score, total_questions, percentage)
             VALUES (?, ?, ?, ?, ?)`,
            [studentId, category || 'Mixed', correctCount, totalQuestions, percentage]
        );

        return res.status(200).json({
            success: true,
            score: correctCount,
            totalQuestions,
            percentage,
            results
        });
    } catch (err) {
        console.error('Submit aptitude test error:', err);
        return res.status(500).json({ success: false, message: 'Server error processing test.' });
    }
};

exports.getAptitudeHistory = async (req, res) => {
    try {
        const studentId = req.user.id;
        const history = await query(
            `SELECT id, category, score, total_questions, percentage, completed_at
             FROM prep_test_attempts WHERE student_id = ? ORDER BY completed_at DESC LIMIT 10`,
            [studentId]
        );

        return res.status(200).json({ success: true, history });
    } catch (err) {
        console.error('Aptitude history error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving history.' });
    }
};

// --- CODING PRACTICE MODULE ---

exports.getCodingChallenges = async (req, res) => {
    try {
        const studentId = req.user.id;
        const challenges = await query(`
            SELECT c.id, c.title, c.difficulty, c.category, c.description, c.solution_notes,
                   (SELECT status FROM prep_coding_submissions 
                    WHERE challenge_id = c.id AND student_id = ? ORDER BY submitted_at DESC LIMIT 1) as user_status
            FROM prep_coding_challenges c
            ORDER BY c.id ASC
        `, [studentId]);

        return res.status(200).json({
            success: true,
            challenges: challenges.map(c => ({
                id: c.id,
                title: c.title,
                difficulty: c.difficulty,
                category: c.category,
                description: c.description,
                solved: c.user_status === 'Passed',
                status: c.user_status || 'Unsolved'
            }))
        });
    } catch (err) {
        console.error('Get coding challenges error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving challenges.' });
    }
};

exports.getCodingChallengeById = async (req, res) => {
    try {
        const { id } = req.params;
        const challenge = await get('SELECT * FROM prep_coding_challenges WHERE id = ?', [id]);
        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge not found.' });
        }

        return res.status(200).json({
            success: true,
            challenge: {
                id: challenge.id,
                title: challenge.title,
                difficulty: challenge.difficulty,
                category: challenge.category,
                description: challenge.description,
                starterCode: challenge.starter_code,
                testCases: JSON.parse(challenge.test_cases || '[]'),
                solutionNotes: challenge.solution_notes
            }
        });
    } catch (err) {
        console.error('Get coding challenge by ID error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving challenge.' });
    }
};

exports.submitCodingChallenge = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { challengeId, code } = req.body;

        if (!challengeId || !code) {
            return res.status(400).json({ success: false, message: 'Challenge ID and code are required.' });
        }

        const challenge = await get('SELECT * FROM prep_coding_challenges WHERE id = ?', [challengeId]);
        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge not found.' });
        }

        const testCases = JSON.parse(challenge.test_cases || '[]');
        const results = [];
        let allPassed = true;

        // Sandboxed execution of user code against test cases
        for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            const sandbox = {
                result: null,
                input: tc.input,
                console: { log: () => {} }
            };

            // Detect target function name from challenge title / starter code
            let funcName = 'twoSum';
            if (challenge.title.toLowerCase().includes('parentheses')) funcName = 'isValid';
            else if (challenge.title.toLowerCase().includes('reverse')) funcName = 'reverseString';
            else if (challenge.title.toLowerCase().includes('stock')) funcName = 'maxProfit';

            const scriptCode = `
                ${code};
                try {
                    result = ${funcName}.apply(null, input);
                } catch(e) {
                    result = '__ERROR__: ' + e.message;
                }
            `;

            try {
                const context = vm.createContext(sandbox);
                const script = new vm.Script(scriptCode);
                script.runInContext(context, { timeout: 1500 });

                const actualOutput = sandbox.result;
                const expectedOutput = tc.expected;

                const isMatch = JSON.stringify(actualOutput) === JSON.stringify(expectedOutput);
                if (!isMatch) allPassed = false;

                results.push({
                    testCaseIndex: i + 1,
                    input: tc.input,
                    expected: expectedOutput,
                    actual: actualOutput,
                    passed: isMatch
                });
            } catch (execErr) {
                allPassed = false;
                results.push({
                    testCaseIndex: i + 1,
                    input: tc.input,
                    expected: tc.expected,
                    actual: execErr.message,
                    passed: false
                });
            }
        }

        const finalStatus = allPassed ? 'Passed' : 'Failed';
        const summary = `${results.filter(r => r.passed).length}/${results.length} test cases passed.`;

        // Record submission
        await run(
            `INSERT INTO prep_coding_submissions (student_id, challenge_id, code, status, test_results)
             VALUES (?, ?, ?, ?, ?)`,
            [studentId, challengeId, code, finalStatus, summary]
        );

        return res.status(200).json({
            success: true,
            status: finalStatus,
            allPassed,
            summary,
            results
        });
    } catch (err) {
        console.error('Submit coding challenge error:', err);
        return res.status(500).json({ success: false, message: 'Server error executing code.' });
    }
};

// --- MOCK INTERVIEW MODULE ---

const MOCK_QUESTION_BANKS = {
    'Software Engineer': [
        {
            id: 1,
            type: 'Technical Core',
            question: 'Explain the fundamental differences between Process and Thread in Operating Systems. How do they handle memory sharing?',
            sampleKeywords: ['process', 'thread', 'memory', 'address space', 'stack', 'heap', 'overhead', 'context switch']
        },
        {
            id: 2,
            type: 'Data Structures & Algorithms',
            question: 'When would you prefer a HashMap over a Binary Search Tree (BST) for lookup operations, and what are the trade-offs regarding ordering and hash collisions?',
            sampleKeywords: ['o(1)', 'o(log n)', 'collision', 'chaining', 'sorted', 'ordering', 'range query', 'worst case']
        },
        {
            id: 3,
            type: 'Behavioral & Leadership',
            question: 'Describe a time when you encountered a challenging technical bug or blocker in a team project. Walk through your diagnostic approach using the STAR method (Situation, Task, Action, Result).',
            sampleKeywords: ['situation', 'task', 'action', 'result', 'debug', 'log', 'collaborate', 'resolved', 'learned']
        }
    ],
    'Full-Stack Developer': [
        {
            id: 1,
            type: 'Architecture & REST',
            question: 'What are the core architectural principles of a RESTful API? Explain how idempotent HTTP methods work (GET, PUT, DELETE vs POST).',
            sampleKeywords: ['stateless', 'idempotent', 'resource', 'http', 'get', 'post', 'put', 'delete', 'payload', 'status codes']
        },
        {
            id: 2,
            type: 'Frontend Lifecycle & State',
            question: 'Explain how the Virtual DOM in React optimizes UI rendering. How do hooks like useEffect and useMemo prevent unnecessary re-renders?',
            sampleKeywords: ['virtual dom', 'reconciliation', 'diffing', 'render', 'useeffect', 'usememo', 'state', 'props']
        },
        {
            id: 3,
            type: 'Behavioral',
            question: 'Tell me about a time you had to balance feature delivery speed against code quality and test coverage before a strict deadline.',
            sampleKeywords: ['deadline', 'priority', 'tech debt', 'testing', 'communication', 'trade-off', 'quality']
        }
    ],
    'HR & Behavioral': [
        {
            id: 1,
            type: 'Personal Alignment',
            question: 'Walk me through your background, technical interests, and why you are interested in joining our campus recruitment drive.',
            sampleKeywords: ['background', 'projects', 'engineering', 'passion', 'growth', 'culture', 'values']
        },
        {
            id: 2,
            type: 'Conflict Resolution',
            question: 'Describe a situation where you had a disagreement with a team member on a project decision. How did you resolve it professionally?',
            sampleKeywords: ['discussion', 'listen', 'objective', 'consensus', 'compromise', 'respect', 'team outcome']
        },
        {
            id: 3,
            type: 'Adaptability',
            question: 'Where do you see yourself in the next 3 to 5 years, and how do you plan to keep your engineering skills current with evolving technologies?',
            sampleKeywords: ['learning', 'mentor', 'leadership', 'skills', 'certifications', 'specialization', 'contribution']
        }
    ]
};

exports.getMockInterviewQuestions = async (req, res) => {
    try {
        const { role } = req.query;
        const selectedRole = role || 'Software Engineer';
        const questions = MOCK_QUESTION_BANKS[selectedRole] || MOCK_QUESTION_BANKS['Software Engineer'];

        return res.status(200).json({
            success: true,
            role: selectedRole,
            questions: questions.map(q => ({
                id: q.id,
                type: q.type,
                question: q.question
            }))
        });
    } catch (err) {
        console.error('Get mock interview questions error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving questions.' });
    }
};

exports.evaluateMockInterview = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { role, answers } = req.body; // answers: [{ questionId: 1, answerText: '...' }]

        const selectedRole = role || 'Software Engineer';
        const bank = MOCK_QUESTION_BANKS[selectedRole] || MOCK_QUESTION_BANKS['Software Engineer'];

        if (!Array.isArray(answers) || answers.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide interview responses.' });
        }

        let totalScore = 0;
        let totalTechRating = 0;
        let totalCommRating = 0;
        const detailedFeedback = [];

        answers.forEach(ans => {
            const q = bank.find(item => item.id === ans.questionId) || bank[0];
            const answer = (ans.answerText || '').trim();
            const lowerAns = answer.toLowerCase();
            const wordCount = answer.split(/\s+/).filter(Boolean).length;

            // Keyword relevance check
            const matchedKeywords = (q.sampleKeywords || []).filter(kw => lowerAns.includes(kw));
            const keywordRatio = matchedKeywords.length / Math.max(1, q.sampleKeywords.length);

            // Technical accuracy & completeness score
            let techRating = Math.min(10, Math.round(keywordRatio * 10) + (wordCount >= 40 ? 2 : 0));
            // Communication & Structure score (STAR check for behavioral)
            let commRating = 5;
            if (wordCount >= 50) commRating += 3;
            if (wordCount >= 90) commRating += 2;
            if (/situation|task|action|result|because|therefore|specifically|example/i.test(answer)) {
                commRating = Math.min(10, commRating + 1);
            }

            const itemScore = Math.min(100, Math.round((techRating * 5) + (commRating * 5)));
            totalScore += itemScore;
            totalTechRating += techRating;
            totalCommRating += commRating;

            let feedbackTip = '';
            if (wordCount < 30) {
                feedbackTip = 'Response is too concise. Elaborate with specific examples, architectural details, and measurable outcomes.';
            } else if (matchedKeywords.length < 2) {
                feedbackTip = `Consider incorporating core concepts such as: ${q.sampleKeywords.slice(0, 3).join(', ')}.`;
            } else {
                feedbackTip = 'Well-structured response with strong terminology and clear explanation.';
            }

            detailedFeedback.push({
                questionId: q.id,
                question: q.question,
                type: q.type,
                score: itemScore,
                techRating,
                commRating,
                matchedKeywords,
                feedbackTip
            });
        });

        const overallScore = Math.round(totalScore / answers.length);
        const avgTech = parseFloat((totalTechRating / answers.length).toFixed(1));
        const avgComm = parseFloat((totalCommRating / answers.length).toFixed(1));

        const summaryFeedback = overallScore >= 75
            ? 'Strong interview performance! You articulate technical concepts clearly and provide structured answers.'
            : overallScore >= 50
            ? 'Decent foundation. Work on incorporating the STAR framework for situational questions and deepening technical terminology.'
            : 'Needs improvement. Practice speaking through code solutions out loud and expanding on your project architectures.';

        // Save session in DB
        await run(
            `INSERT INTO prep_mock_interviews (student_id, role_type, transcript, score, technical_rating, communication_rating, feedback)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [studentId, selectedRole, JSON.stringify(detailedFeedback), overallScore, avgTech, avgComm, summaryFeedback]
        );

        return res.status(200).json({
            success: true,
            overallScore,
            technicalRating: avgTech,
            communicationRating: avgComm,
            summaryFeedback,
            detailedFeedback
        });
    } catch (err) {
        console.error('Evaluate mock interview error:', err);
        return res.status(500).json({ success: false, message: 'Server error evaluating mock interview.' });
    }
};

// --- COMPANY GUIDES MODULE ---

exports.getCompanyGuides = async (req, res) => {
    try {
        const guides = await query('SELECT * FROM company_guides ORDER BY company_name ASC');
        const formatted = guides.map(g => ({
            id: g.id,
            companyName: g.company_name,
            industry: g.industry,
            overview: g.overview,
            patternOverview: g.pattern_overview,
            roundsInfo: JSON.parse(g.rounds_info || '[]'),
            commonQuestions: JSON.parse(g.common_questions || '[]'),
            prepTips: g.prep_tips
        }));

        return res.status(200).json({ success: true, count: formatted.length, guides: formatted });
    } catch (err) {
        console.error('Get company guides error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving guides.' });
    }
};

// --- PLACEMENT READINESS DASHBOARD ---

exports.getReadinessDashboard = async (req, res) => {
    try {
        const studentId = req.user.id;

        // 1. Student profile & resume data
        const student = await get('SELECT * FROM users WHERE id = ?', [studentId]);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        // Profile & Resume (Max 25 pts)
        let profileScore = 0;
        const profileItems = [];
        if (student.name && student.branch && student.cgpa > 0) {
            profileScore += 10;
            profileItems.push({ label: 'Basic Profile Completed (Name, Branch, CGPA)', points: 10, completed: true });
        } else {
            profileItems.push({ label: 'Complete Basic Profile Details', points: 10, completed: false });
        }

        if (student.interests && student.interests.trim() !== '') {
            profileScore += 5;
            profileItems.push({ label: 'Career Interests Registered', points: 5, completed: true });
        } else {
            profileItems.push({ label: 'Add Career Interests in Profile', points: 5, completed: false });
        }

        if (student.resume_text && student.resume_text.length > 50) {
            profileScore += 10;
            profileItems.push({ label: 'Resume Text Uploaded & Analyzed', points: 10, completed: true });
        } else {
            profileItems.push({ label: 'Upload / Analyze Resume in Resume Module', points: 10, completed: false });
        }

        // Skills (Max 25 pts)
        let skillsScore = 0;
        const skillList = (student.skills || '').split(/[,;|]/).map(s => s.trim()).filter(Boolean);
        if (skillList.length >= 4) {
            skillsScore += 15;
            profileItems.push({ label: `Key Skills Registered (${skillList.length} skills listed)`, points: 15, completed: true });
        } else if (skillList.length >= 1) {
            skillsScore += 8;
            profileItems.push({ label: `Add at least 4 skills to profile (currently ${skillList.length})`, points: 7, completed: false });
        } else {
            profileItems.push({ label: 'List your technical skills in Profile', points: 15, completed: false });
        }

        // Check if student has core language & SQL
        const hasCore = skillList.some(s => /java|python|c\+\+|javascript/i.test(s));
        const hasDb = skillList.some(s => /sql|dbms|database|mongodb/i.test(s));
        if (hasCore && hasDb) {
            skillsScore += 10;
            profileItems.push({ label: 'Core Language + Database Competency', points: 10, completed: true });
        } else {
            profileItems.push({ label: 'Add both a Core Programming Language and SQL/Database skill', points: 10, completed: false });
        }

        // Aptitude Tests (Max 25 pts)
        let aptitudeScore = 0;
        const aptAttempts = await query(
            'SELECT score, total_questions, percentage FROM prep_test_attempts WHERE student_id = ?',
            [studentId]
        );

        if (aptAttempts.length >= 2) {
            aptitudeScore += 15;
            profileItems.push({ label: `Aptitude Practice (${aptAttempts.length} tests attempted)`, points: 15, completed: true });
        } else if (aptAttempts.length === 1) {
            aptitudeScore += 8;
            profileItems.push({ label: 'Take at least 2 Aptitude Practice Tests', points: 7, completed: false });
        } else {
            profileItems.push({ label: 'Take an Aptitude Test in Preparation Zone', points: 15, completed: false });
        }

        if (aptAttempts.length > 0) {
            const avgPct = aptAttempts.reduce((acc, a) => acc + a.percentage, 0) / aptAttempts.length;
            const accuracyPts = Math.min(10, Math.round((avgPct / 100) * 10));
            aptitudeScore += accuracyPts;
            profileItems.push({ label: `Aptitude Accuracy Performance (${avgPct.toFixed(0)}% average)`, points: accuracyPts, completed: avgPct >= 70 });
        } else {
            profileItems.push({ label: 'Achieve >70% in Aptitude Tests for full accuracy bonus', points: 10, completed: false });
        }

        // Coding & Mock Interviews (Max 25 pts)
        let codingInterviewScore = 0;
        const codingSolved = await get(
            `SELECT COUNT(DISTINCT challenge_id) as count FROM prep_coding_submissions 
             WHERE student_id = ? AND status = 'Passed'`,
            [studentId]
        );

        const mockInterviews = await query(
            'SELECT score FROM prep_mock_interviews WHERE student_id = ?',
            [studentId]
        );

        if (codingSolved.count >= 2) {
            codingInterviewScore += 10;
            profileItems.push({ label: `Solved Coding Challenges (${codingSolved.count} solved)`, points: 10, completed: true });
        } else if (codingSolved.count === 1) {
            codingInterviewScore += 5;
            profileItems.push({ label: 'Solve at least 2 Coding Practice Challenges', points: 5, completed: false });
        } else {
            profileItems.push({ label: 'Solve Coding Practice Challenges', points: 10, completed: false });
        }

        if (mockInterviews.length > 0) {
            const bestMock = Math.max(...mockInterviews.map(m => m.score));
            const mockPts = Math.min(15, Math.round((bestMock / 100) * 15));
            codingInterviewScore += mockPts;
            profileItems.push({ label: `Mock Interview Completed (Best Score: ${bestMock}/100)`, points: mockPts, completed: bestMock >= 70 });
        } else {
            profileItems.push({ label: 'Complete a Mock Interview Simulation', points: 15, completed: false });
        }

        const totalReadinessScore = Math.min(100, profileScore + skillsScore + aptitudeScore + codingInterviewScore);

        let readinessTier = '';
        let tierColor = '';
        if (totalReadinessScore >= 80) {
            readinessTier = 'Placement Ready (Top Tier)';
            tierColor = '#16a34a';
        } else if (totalReadinessScore >= 60) {
            readinessTier = 'Good Progress (Fine-Tuning Needed)';
            tierColor = '#2563eb';
        } else if (totalReadinessScore >= 40) {
            readinessTier = 'Developing (Practice Recommended)';
            tierColor = '#d97706';
        } else {
            readinessTier = 'Getting Started (Action Required)';
            tierColor = '#dc2626';
        }

        return res.status(200).json({
            success: true,
            readiness: {
                totalScore: totalReadinessScore,
                tier: readinessTier,
                tierColor,
                breakdown: {
                    profile: { score: profileScore, max: 25, label: 'Profile & Resume' },
                    skills: { score: skillsScore, max: 25, label: 'Skill Set & Market Fit' },
                    aptitude: { score: aptitudeScore, max: 25, label: 'Aptitude Mastery' },
                    interviewCoding: { score: codingInterviewScore, max: 25, label: 'Coding & Mock Interviews' }
                },
                actionChecklist: profileItems
            }
        });
    } catch (err) {
        console.error('Readiness dashboard error:', err);
        return res.status(500).json({ success: false, message: 'Server error calculating readiness.' });
    }
};
