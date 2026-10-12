const { query, get } = require('../config/db');

// Knowledge base for skill learning resources and practice activities
const SKILL_RESOURCES_DB = {
    'spring boot': {
        name: 'Spring Boot',
        category: 'Backend Framework',
        documentation: 'https://spring.io/projects/spring-boot',
        freeCourses: [
            { title: 'Spring Boot 3 & Microservices Full Course', provider: 'freeCodeCamp', type: 'Video Tutorial' },
            { title: 'Spring Framework Master Class', provider: 'Java Brains', type: 'YouTube Series' }
        ],
        roadmap: 'https://roadmap.sh/spring-boot',
        practiceActivities: [
            'Build a complete REST API with Spring Boot, Spring Data JPA, and H2/MySQL with JWT authentication.',
            'Implement global exception handling using @ControllerAdvice and custom error response DTOs.',
            'Build a microservice that communicates with another service using Spring Cloud OpenFeign or WebClient.'
        ],
        estimatedHours: 25
    },
    'java': {
        name: 'Java',
        category: 'Programming Language',
        documentation: 'https://docs.oracle.com/en/java/',
        freeCourses: [
            { title: 'Java Programming Course for Beginners', provider: 'freeCodeCamp', type: 'Video Tutorial' },
            { title: 'Java Object-Oriented Programming', provider: 'Coursera (Audit Free)', type: 'Course' }
        ],
        roadmap: 'https://roadmap.sh/java',
        practiceActivities: [
            'Implement standard Data Structures from scratch: ArrayList, LinkedList, Stack, Queue, and Binary Search Tree.',
            'Practice Collections Framework: HashMap collision mechanics, TreeMap, and PriorityQueue.',
            'Solve 30 LeetCode Easy/Medium questions in Java focusing on arrays, strings, and hash maps.'
        ],
        estimatedHours: 30
    },
    'react': {
        name: 'React.js',
        category: 'Frontend Framework',
        documentation: 'https://react.dev/',
        freeCourses: [
            { title: 'React 18 Full Course - Modern React with Hooks', provider: 'freeCodeCamp', type: 'Video Tutorial' },
            { title: 'Interactive React Tutorials', provider: 'Scrimba', type: 'Interactive' }
        ],
        roadmap: 'https://roadmap.sh/react',
        practiceActivities: [
            'Build a Kanban or Job Application Tracker board with state management using useState, useEffect, and custom hooks.',
            'Implement dynamic filtering, search debounce, and dark mode theme switching in React.',
            'Build a full-stack dashboard connected to an Express/Spring REST API with protected JWT routes.'
        ],
        estimatedHours: 20
    },
    'sql': {
        name: 'SQL & Database Design',
        category: 'Database',
        documentation: 'https://www.sqlite.org/docs.html',
        freeCourses: [
            { title: 'SQL Tutorial - Full Database Course for Beginners', provider: 'freeCodeCamp', type: 'Video Tutorial' },
            { title: 'SQLZoo Interactive SQL Practice', provider: 'SQLZoo', type: 'Interactive Practice' }
        ],
        roadmap: 'https://roadmap.sh/postgresql',
        practiceActivities: [
            'Solve the top 20 SQL interview questions on LeetCode (Second Highest Salary, Nth Highest, Rank, Consecutive Numbers).',
            'Write complex queries using INNER JOIN, LEFT JOIN, GROUP BY, HAVING, and window functions (ROW_NUMBER, DENSE_RANK).',
            'Design a normalized database schema (3NF) for an e-commerce or college placement system with foreign keys and indexes.'
        ],
        estimatedHours: 15
    },
    'python': {
        name: 'Python',
        category: 'Programming Language',
        documentation: 'https://docs.python.org/3/',
        freeCourses: [
            { title: 'Python for Beginners Full Course', provider: 'freeCodeCamp', type: 'Video Tutorial' },
            { title: 'Automate the Boring Stuff with Python', provider: 'Al Sweigart', type: 'Interactive Book' }
        ],
        roadmap: 'https://roadmap.sh/python',
        practiceActivities: [
            'Build a web scraper using BeautifulSoup and Requests to collect tech job listings and export to CSV.',
            'Create a RESTful API using FastAPI or Flask with Pydantic data validation and SQLite.',
            'Implement core algorithms: Binary Search, QuickSort, BFS/DFS graph traversals in Python.'
        ],
        estimatedHours: 20
    },
    'machine learning': {
        name: 'Machine Learning',
        category: 'Artificial Intelligence',
        documentation: 'https://scikit-learn.org/stable/',
        freeCourses: [
            { title: 'Machine Learning Specialization', provider: 'Andrew Ng / DeepLearning.AI (Audit)', type: 'Course' },
            { title: 'Practical Deep Learning for Coders', provider: 'fast.ai', type: 'Course' }
        ],
        roadmap: 'https://roadmap.sh/ai-data-scientist',
        practiceActivities: [
            'Build an end-to-end classification pipeline for placement prediction using Scikit-Learn (Random Forest, Logistic Regression).',
            'Perform exploratory data analysis (EDA) with Pandas, Matplotlib, and Seaborn on a Kaggle dataset.',
            'Deploy an ML model as an API endpoint using FastAPI and Docker.'
        ],
        estimatedHours: 35
    },
    'javascript': {
        name: 'JavaScript (ES6+)',
        category: 'Web Development',
        documentation: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        freeCourses: [
            { title: 'JavaScript Programming Tutorial', provider: 'freeCodeCamp', type: 'Video Tutorial' },
            { title: 'JavaScript30 - 30 Day Vanilla JS Coding Challenge', provider: 'Wes Bos', type: 'Practice' }
        ],
        roadmap: 'https://roadmap.sh/javascript',
        practiceActivities: [
            'Master asynchronous JavaScript: Promises, async/await, fetch API, and Event Loop mechanics.',
            'Build an interactive dashboard widget with debounced search, DOM manipulation, and localStorage persistence.',
            'Implement Array methods from scratch: map, filter, reduce, find.'
        ],
        estimatedHours: 15
    },
    'cloud': {
        name: 'Cloud Computing & AWS',
        category: 'Infrastructure & DevOps',
        documentation: 'https://aws.amazon.com/free/',
        freeCourses: [
            { title: 'AWS Certified Cloud Practitioner Training', provider: 'freeCodeCamp', type: 'Video Tutorial' },
            { title: 'Cloud Computing Basics', provider: 'Coursera (Audit)', type: 'Course' }
        ],
        roadmap: 'https://roadmap.sh/devops',
        practiceActivities: [
            'Deploy a containerized application to AWS EC2 or Render with automated HTTPS and environment secrets.',
            'Configure an S3 bucket for secure file uploads with pre-signed URLs.',
            'Set up a basic CI/CD pipeline with GitHub Actions to run tests and build Docker containers on git push.'
        ],
        estimatedHours: 25
    },
    'html': {
        name: 'HTML5 & Modern CSS',
        category: 'Frontend Fundamentals',
        documentation: 'https://developer.mozilla.org/en-US/docs/Learn/HTML',
        freeCourses: [
            { title: 'Responsive Web Design Certification', provider: 'freeCodeCamp', type: 'Interactive' }
        ],
        roadmap: 'https://roadmap.sh/frontend',
        practiceActivities: [
            'Build accessible, responsive page layouts using CSS Flexbox, Grid, and CSS Custom Properties (Theme tokens).',
            'Ensure WCAG 2.1 accessibility compliance: correct ARIA tags, color contrast, and keyboard navigation.'
        ],
        estimatedHours: 10
    },
    'git': {
        name: 'Git & Version Control',
        category: 'Developer Tooling',
        documentation: 'https://git-scm.com/doc',
        freeCourses: [
            { title: 'Git and GitHub for Beginners', provider: 'freeCodeCamp', type: 'Video Tutorial' }
        ],
        roadmap: 'https://roadmap.sh/git',
        practiceActivities: [
            'Practice branching strategies: git branch, checkout, merge, rebase, and resolving merge conflicts.',
            'Publish 3 well-documented projects on GitHub with detailed README.md, architecture diagrams, and license.'
        ],
        estimatedHours: 8
    }
};

function normalizeSkill(skill) {
    return skill.trim().toLowerCase();
}

function parseSkills(skillsString) {
    if (!skillsString) return [];
    return skillsString
        .split(/[,;|]/)
        .map(s => s.trim())
        .filter(Boolean);
}

// 1. Intelligent Job Recommendation Engine
exports.getRecommendations = async (req, res) => {
    try {
        const studentId = req.user.id;
        const student = await get(
            `SELECT id, name, email, branch, cgpa, skills, backlogs, batch, interests 
             FROM users WHERE id = ?`,
            [studentId]
        );

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found.' });
        }

        const studentSkills = parseSkills(student.skills);
        const studentNormSkills = studentSkills.map(normalizeSkill);
        const studentBranch = (student.branch || '').trim();
        const studentCgpa = parseFloat(student.cgpa) || 0;
        const studentBacklogs = parseInt(student.backlogs, 10) || 0;
        const studentInterests = (student.interests || '').toLowerCase();

        // Get all active jobs
        const jobs = await query(`
            SELECT j.*, 
                   (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count,
                   (SELECT status FROM applications WHERE job_id = j.id AND student_id = ?) as student_status
            FROM jobs j
            ORDER BY j.created_at DESC
        `, [studentId]);

        const recommendations = jobs.map(job => {
            const jobSkills = parseSkills(job.skills);
            const jobNormSkills = jobSkills.map(normalizeSkill);

            // Skill overlap analysis
            const matchedSkills = [];
            const missingSkills = [];

            jobSkills.forEach(reqSkill => {
                const normReq = normalizeSkill(reqSkill);
                const hasSkill = studentNormSkills.some(s => s.includes(normReq) || normReq.includes(s));
                if (hasSkill) {
                    matchedSkills.push(reqSkill);
                } else {
                    missingSkills.push(reqSkill);
                }
            });

            const totalReqSkills = jobSkills.length || 1;
            const skillMatchRatio = `${matchedSkills.length}/${totalReqSkills}`;
            const skillScore = (matchedSkills.length / totalReqSkills) * 40; // 40 max points

            // Eligibility criteria
            const cgpaDiff = parseFloat((studentCgpa - job.cgpa).toFixed(2));
            const isCgpaEligible = studentCgpa >= job.cgpa;
            const cgpaScore = isCgpaEligible ? Math.min(30, 20 + Math.max(0, cgpaDiff * 5)) : 5; // 30 max points

            const eligibleBranches = (job.eligible_branches || 'All Branches')
                .split(',')
                .map(b => b.trim().toLowerCase());
            const isBranchEligible = eligibleBranches.includes('all branches') || 
                                     eligibleBranches.some(b => studentBranch.toLowerCase().includes(b) || b.includes(studentBranch.toLowerCase()));
            const branchScore = isBranchEligible ? 15 : 0; // 15 max points

            const isBacklogsEligible = studentBacklogs <= (job.max_backlogs !== undefined ? job.max_backlogs : 0);
            const backlogScore = isBacklogsEligible ? 5 : 0; // 5 max points

            const isFullyEligible = isCgpaEligible && isBranchEligible && isBacklogsEligible;

            // Interest alignment
            const jobText = `${job.title} ${job.role_category || ''} ${job.description || ''}`.toLowerCase();
            const studentInterestTerms = studentInterests.split(/[,;|]/).map(t => t.trim().toLowerCase()).filter(Boolean);
            const matchedInterests = studentInterestTerms.filter(term => jobText.includes(term));
            const isInterestAligned = matchedInterests.length > 0;
            const interestScore = isInterestAligned ? 10 : 3; // 10 max points

            // Total explainable composite index (out of 100)
            const rawScore = Math.round(skillScore + cgpaScore + branchScore + backlogScore + interestScore);
            const compositeIndex = Math.min(100, Math.max(0, rawScore));

            // Categorical Recommendation Tier (No arbitrary black-box percentage)
            let recommendationTier = '';
            let tierBadge = '';
            if (isFullyEligible && matchedSkills.length >= Math.ceil(totalReqSkills * 0.6) && cgpaDiff >= 0) {
                recommendationTier = 'Strongly Recommended';
                tierBadge = 'badge-success';
            } else if (isFullyEligible && matchedSkills.length >= 1) {
                recommendationTier = 'Recommended';
                tierBadge = 'badge-primary';
            } else if (isFullyEligible) {
                recommendationTier = 'Consider with Upskilling';
                tierBadge = 'badge-warning';
            } else {
                recommendationTier = 'Ineligible / Reference Only';
                tierBadge = 'badge-danger';
            }

            // Transparent Factor Breakdown
            const factors = [
                {
                    factor: 'Eligibility Status',
                    status: isFullyEligible ? 'PASS' : 'FAIL',
                    detail: isFullyEligible 
                        ? 'Meets all branch, CGPA, and backlog criteria' 
                        : `Disqualified on: ${[!isCgpaEligible && `CGPA (${studentCgpa} < ${job.cgpa})`, !isBranchEligible && `Branch (${studentBranch || 'Unspecified'})`, !isBacklogsEligible && `Backlogs (${studentBacklogs} > ${job.max_backlogs})`].filter(Boolean).join(', ')}`
                },
                {
                    factor: 'Academic Cutoff',
                    status: isCgpaEligible ? 'PASS' : 'FAIL',
                    detail: isCgpaEligible
                        ? `CGPA ${studentCgpa} meets requirement of ${job.cgpa} (${cgpaDiff >= 0 ? `+${cgpaDiff} buffer` : 'Exact cutoff'})`
                        : `CGPA ${studentCgpa} is below the cutoff of ${job.cgpa} (Shortfall of ${Math.abs(cgpaDiff)})`
                },
                {
                    factor: 'Branch Eligibility',
                    status: isBranchEligible ? 'PASS' : 'FAIL',
                    detail: isBranchEligible
                        ? `Your branch (${studentBranch || 'All'}) is approved for this drive`
                        : `Drive open only to: ${job.eligible_branches}`
                },
                {
                    factor: 'Skill Match',
                    status: matchedSkills.length === totalReqSkills ? 'COMPLETE' : matchedSkills.length > 0 ? 'PARTIAL' : 'GAP',
                    detail: `${matchedSkills.length} of ${totalReqSkills} required skills matched (${matchedSkills.join(', ') || 'None'})`
                },
                {
                    factor: 'Missing Skills',
                    status: missingSkills.length === 0 ? 'NONE' : 'ATTENTION',
                    detail: missingSkills.length > 0 ? missingSkills.join(', ') : 'All required skills are present in your profile'
                },
                {
                    factor: 'Career Interest',
                    status: isInterestAligned ? 'ALIGNED' : 'NEUTRAL',
                    detail: isInterestAligned
                        ? `Matches your specified interests: ${matchedInterests.join(', ')}`
                        : 'General software role'
                }
            ];

            return {
                id: job.id,
                company: job.company_name,
                title: job.title,
                location: job.location,
                salary: job.salary,
                requiredCgpa: job.cgpa,
                deadline: job.deadline,
                visitDate: job.visit_date || job.deadline || '',
                workMode: job.work_mode || 'On-Site',
                roleCategory: job.role_category || 'Software Engineering',
                applicantCount: job.applicant_count,
                appliedStatus: job.student_status,
                isEligible: isFullyEligible,
                recommendationTier,
                tierBadge,
                compositeIndex,
                skillMatchRatio,
                matchedSkills,
                missingSkills,
                factors
            };
        });

        // Sort: Strongly Recommended -> Recommended -> Consider with Upskilling -> Ineligible
        const tierWeights = {
            'Strongly Recommended': 4,
            'Recommended': 3,
            'Consider with Upskilling': 2,
            'Ineligible / Reference Only': 1
        };

        recommendations.sort((a, b) => {
            const weightA = tierWeights[a.recommendationTier] || 0;
            const weightB = tierWeights[b.recommendationTier] || 0;
            if (weightA !== weightB) return weightB - weightA;
            return b.compositeIndex - a.compositeIndex;
        });

        return res.status(200).json({
            success: true,
            studentProfile: {
                name: student.name,
                branch: student.branch,
                cgpa: student.cgpa,
                skills: studentSkills,
                backlogs: student.backlogs,
                interests: student.interests
            },
            recommendations
        });
    } catch (err) {
        console.error('Job recommendations error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error generating recommendations.'
        });
    }
};

// 2. Skill-Gap Analyzer
exports.getSkillGap = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { jobId, targetRole } = req.query;

        const student = await get(
            `SELECT id, name, branch, cgpa, skills FROM users WHERE id = ?`,
            [studentId]
        );

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        const studentSkills = parseSkills(student.skills);
        const studentNormSkills = studentSkills.map(normalizeSkill);

        let targetTitle = '';
        let targetCompany = '';
        let requiredSkills = [];

        if (jobId) {
            const job = await get('SELECT * FROM jobs WHERE id = ?', [jobId]);
            if (!job) {
                return res.status(404).json({ success: false, message: 'Specified job not found.' });
            }
            targetTitle = job.title;
            targetCompany = job.company_name;
            requiredSkills = parseSkills(job.skills);
        } else if (targetRole) {
            targetTitle = targetRole;
            targetCompany = 'Standard Placement Track';
            // Predefined standard skills by industry role
            const roleSkillsMap = {
                'Full Stack Developer': ['Java', 'Spring Boot', 'React', 'JavaScript', 'SQL', 'Git'],
                'Software Engineer': ['Java', 'Python', 'SQL', 'Data Structures', 'Git'],
                'Backend Developer': ['Java', 'Spring Boot', 'SQL', 'Cloud', 'Git'],
                'Data Analyst': ['Python', 'SQL', 'Machine Learning', 'Data Structures'],
                'Frontend Developer': ['HTML', 'JavaScript', 'React', 'Git']
            };
            requiredSkills = roleSkillsMap[targetRole] || ['Java', 'SQL', 'Data Structures', 'Git'];
        } else {
            // Default to first job in DB or standard track
            const defaultJob = await get('SELECT * FROM jobs ORDER BY id ASC LIMIT 1');
            if (defaultJob) {
                targetTitle = defaultJob.title;
                targetCompany = defaultJob.company_name;
                requiredSkills = parseSkills(defaultJob.skills);
            } else {
                targetTitle = 'Software Engineer';
                targetCompany = 'Standard IT Services Track';
                requiredSkills = ['Java', 'SQL', 'Spring Boot', 'Git'];
            }
        }

        // Compare skills
        const acquiredSkills = [];
        const missingSkills = [];

        requiredSkills.forEach(reqSkill => {
            const norm = normalizeSkill(reqSkill);
            const found = studentNormSkills.some(s => s.includes(norm) || norm.includes(s));
            if (found) {
                acquiredSkills.push(reqSkill);
            } else {
                missingSkills.push(reqSkill);
            }
        });

        // Generate tailored learning resources and practice activities
        const resourceRoadmap = [];
        let totalEstimatedHours = 0;

        missingSkills.forEach(skill => {
            const norm = normalizeSkill(skill);
            // Search in our curated knowledge base
            const matchedKey = Object.keys(SKILL_RESOURCES_DB).find(k => norm.includes(k) || k.includes(norm));
            const entry = matchedKey ? SKILL_RESOURCES_DB[matchedKey] : null;

            if (entry) {
                totalEstimatedHours += entry.estimatedHours;
                resourceRoadmap.push({
                    skill,
                    category: entry.category,
                    documentation: entry.documentation,
                    freeCourses: entry.freeCourses,
                    roadmap: entry.roadmap,
                    practiceActivities: entry.practiceActivities,
                    estimatedHours: entry.estimatedHours
                });
            } else {
                totalEstimatedHours += 15;
                resourceRoadmap.push({
                    skill,
                    category: 'Core Competency',
                    documentation: `https://www.google.com/search?q=${encodeURIComponent(skill + ' official documentation tutorial')}`,
                    freeCourses: [
                        { title: `${skill} Complete Bootcamp`, provider: 'YouTube / freeCodeCamp', type: 'Self-Paced' }
                    ],
                    roadmap: 'https://roadmap.sh',
                    practiceActivities: [
                        `Build a mini-project demonstrating practical application of ${skill}.`,
                        `Review and document commonly asked interview questions related to ${skill}.`
                    ],
                    estimatedHours: 15
                });
            }
        });

        return res.status(200).json({
            success: true,
            analysis: {
                targetTitle,
                targetCompany,
                totalRequiredCount: requiredSkills.length,
                acquiredCount: acquiredSkills.length,
                missingCount: missingSkills.length,
                coverageStatus: missingSkills.length === 0 ? 'Complete Match' : `${acquiredSkills.length}/${requiredSkills.length} Skills Acquired`,
                acquiredSkills,
                missingSkills,
                totalEstimatedHours,
                resourceRoadmap
            }
        });
    } catch (err) {
        console.error('Skill gap error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error analyzing skill gap.'
        });
    }
};
