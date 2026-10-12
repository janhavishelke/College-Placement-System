const { query, get, run } = require('../config/db');

const ACTION_VERBS = [
    'developed', 'built', 'engineered', 'designed', 'implemented', 'optimized',
    'architected', 'integrated', 'automated', 'created', 'led', 'managed',
    'deployed', 'refactored', 'streamlined', 'delivered', 'orchestrated',
    'resolved', 'analyzed', 'configured', 'tested', 'executed', 'collaborated'
];

const STANDARD_TECH_KEYWORDS = [
    'java', 'python', 'javascript', 'c++', 'sql', 'html', 'css', 'react',
    'angular', 'vue', 'node', 'express', 'spring boot', 'django', 'fastapi',
    'git', 'github', 'docker', 'kubernetes', 'aws', 'azure', 'linux', 'mongodb',
    'postgresql', 'mysql', 'rest api', 'microservices', 'data structures',
    'algorithms', 'oops', 'dbms', 'operating systems', 'computer networks',
    'machine learning', 'ci/cd', 'unit testing', 'agile', 'scrum'
];

exports.analyzeResume = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { resumeText, jobId, jobDescription } = req.body;

        if (!resumeText || resumeText.trim().length < 50) {
            return res.status(400).json({
                success: false,
                message: 'Please provide substantive resume text (at least 50 characters) to analyze.'
            });
        }

        const text = resumeText.toLowerCase();
        const rawText = resumeText;
        const words = rawText.match(/\b\w+\b/g) || [];
        const wordCount = words.length;

        // 1. Completeness Evaluation
        const sectionChecks = [
            {
                name: 'Contact Information',
                passed: (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(rawText)) || (/\b\d{10}\b/.test(rawText)) || rawText.includes('linkedin') || rawText.includes('github'),
                weight: 15,
                tip: 'Include clear email, contact number, and GitHub/LinkedIn profile links at the top.'
            },
            {
                name: 'Professional Summary / Objective',
                passed: /summary|objective|profile|about me/.test(text),
                weight: 10,
                tip: 'Add a concise 2-3 line summary outlining your engineering discipline and career aspirations.'
            },
            {
                name: 'Education & Academics',
                passed: /education|b\.tech|b\.e|bachelor|cgpa|gpa|university|college|percentage|degree/.test(text),
                weight: 15,
                tip: 'State your degree, college name, graduation year, and current CGPA.'
            },
            {
                name: 'Technical Skills Section',
                passed: /skills|technologies|technical stack|languages|frameworks|tools/.test(text),
                weight: 20,
                tip: 'Group your skills into categories: Programming Languages, Frameworks, Databases, and Developer Tools.'
            },
            {
                name: 'Projects Section',
                passed: /project|academic project|capstone|personal project/.test(text),
                weight: 20,
                tip: 'Describe at least 2 technical projects with tech stack used, problem solved, and key features.'
            },
            {
                name: 'Experience / Internships / Training',
                passed: /experience|internship|training|work history|employment/.test(text),
                weight: 10,
                tip: 'Include internships, open-source contributions, or university lab training.'
            },
            {
                name: 'Certifications & Achievements',
                passed: /certification|achievement|awards|hackathon|extracurricular|publications/.test(text),
                weight: 10,
                tip: 'Highlight verified certifications (AWS, HackerRank, Coursera) or hackathon ranks.'
            }
        ];

        let completenessScore = 0;
        sectionChecks.forEach(sec => {
            if (sec.passed) completenessScore += sec.weight;
        });

        // 2. Action Verbs & Quantifiable Achievements Heuristics
        const foundActionVerbs = ACTION_VERBS.filter(verb => text.includes(verb));
        const actionVerbRatio = foundActionVerbs.length;

        // Metrics & Numbers pattern (e.g. 20%, 500ms, 10x, 1000+, 4.5, 99%)
        const metricsMatches = rawText.match(/\b\d+(\.\d+)?%|\b\d+\+?(\s*(ms|seconds|users|requests|queries|x|star|stars|team members))?\b/gi) || [];
        const hasMetrics = metricsMatches.length >= 2;

        let formattingScore = 60;
        if (actionVerbRatio >= 4) formattingScore += 20;
        else if (actionVerbRatio >= 2) formattingScore += 10;

        if (hasMetrics) formattingScore += 20;
        else formattingScore += 5;

        // Word count penalty / bonus
        if (wordCount < 200) formattingScore -= 20;
        else if (wordCount > 1200) formattingScore -= 10;
        formattingScore = Math.max(0, Math.min(100, formattingScore));

        // 3. Keyword Alignment with Job Description or Placement Standards
        let targetKeywords = [];
        let jobTitleContext = 'General Placement Profile';

        if (jobId) {
            const job = await get('SELECT * FROM jobs WHERE id = ?', [jobId]);
            if (job) {
                jobTitleContext = `${job.title} at ${job.company_name}`;
                const jobSkillItems = (job.skills || '').split(/[,;|]/).map(s => s.trim().toLowerCase()).filter(Boolean);
                const descWords = (job.description || '').toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
                targetKeywords = Array.from(new Set([...jobSkillItems, ...descWords.slice(0, 15)]));
            }
        } else if (jobDescription) {
            jobTitleContext = 'Custom Job Description';
            const descWords = jobDescription.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
            targetKeywords = Array.from(new Set(descWords.filter(w => STANDARD_TECH_KEYWORDS.includes(w))));
        }

        if (targetKeywords.length === 0) {
            targetKeywords = ['java', 'python', 'sql', 'git', 'spring boot', 'react', 'data structures', 'oops', 'rest api', 'agile'];
        }

        const matchedKeywords = [];
        const missingKeywords = [];

        targetKeywords.forEach(kw => {
            if (text.includes(kw.toLowerCase())) {
                matchedKeywords.push(kw);
            } else {
                missingKeywords.push(kw);
            }
        });

        const keywordMatchScore = Math.round((matchedKeywords.length / Math.max(1, targetKeywords.length)) * 100);

        // Overall Estimated Alignment Score (Weighted average)
        const overallScore = Math.round(
            (completenessScore * 0.40) +
            (formattingScore * 0.30) +
            (keywordMatchScore * 0.30)
        );

        // Construct actionable recommendations list
        const recommendations = [];
        if (actionVerbRatio < 3) {
            recommendations.push('Strengthen bullet points with decisive action verbs like "Architected", "Engineered", "Optimized", or "Automated".');
        }
        if (!hasMetrics) {
            recommendations.push('Quantify your project outcomes with tangible metrics (e.g., "Reduced response latency by 25%", "Supported 500+ daily concurrent users").');
        }
        if (missingKeywords.length > 0) {
            recommendations.push(`Include critical keywords relevant to ${jobTitleContext}: ${missingKeywords.slice(0, 5).join(', ')}.`);
        }
        if (wordCount < 250) {
            recommendations.push('Resume length appears brief. Elaborate on project architectures, responsibilities, and key accomplishments.');
        }

        return res.status(200).json({
            success: true,
            disclaimer: 'ESTIMATE NOTICE: Resume analysis scores, keyword matches, and structural feedback are automated heuristic estimates intended solely for placement preparation and ATS optimization. They do not constitute a guarantee of interview shortlisting or hiring by any recruiter or organization.',
            analysis: {
                targetContext: jobTitleContext,
                overallScore,
                completenessScore,
                formattingScore,
                keywordMatchScore,
                wordCount,
                sectionChecks,
                actionVerbsDetected: foundActionVerbs,
                quantifiableMetricsCount: metricsMatches.length,
                matchedKeywords,
                missingKeywords,
                recommendations
            }
        });
    } catch (err) {
        console.error('Resume analysis error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error analyzing resume.'
        });
    }
};

exports.saveResume = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { resumeText, filename } = req.body;

        await run(
            `UPDATE users SET resume_text = ?, resume_filename = ? WHERE id = ?`,
            [resumeText || '', filename || 'My_Resume.txt', studentId]
        );

        return res.status(200).json({
            success: true,
            message: 'Resume text saved to profile successfully!'
        });
    } catch (err) {
        console.error('Save resume error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error saving resume.'
        });
    }
};

exports.getResume = async (req, res) => {
    try {
        const studentId = req.user.id;
        const user = await get(
            `SELECT resume_text, resume_filename FROM users WHERE id = ?`,
            [studentId]
        );

        return res.status(200).json({
            success: true,
            resumeText: user ? user.resume_text : '',
            filename: user ? user.resume_filename : ''
        });
    } catch (err) {
        console.error('Get resume error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving resume.'
        });
    }
};
