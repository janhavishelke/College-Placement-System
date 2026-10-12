const { query, get } = require('../config/db');

exports.askAssistant = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { message } = req.body;

        if (!message || message.trim() === '') {
            return res.status(400).json({ success: false, message: 'Message query is required.' });
        }

        const q = message.trim().toLowerCase();
        let reply = '';
        let intent = 'general';
        let dataReferences = [];

        // 1. Eligibility Queries
        if (q.includes('eligible') || q.includes('qualify') || q.includes('eligibility')) {
            intent = 'eligibility_check';
            if (userRole !== 'STUDENT') {
                reply = 'Eligibility checks are tailored to student profiles. As an administrator or recruiter, you can view student eligibility criteria directly on job postings.';
            } else {
                const student = await get('SELECT id, name, branch, cgpa, backlogs, skills FROM users WHERE id = ?', [userId]);
                const jobs = await query('SELECT id, company_name, title, cgpa, eligible_branches, max_backlogs FROM jobs');

                // Check if user named a specific company
                const mentionedJob = jobs.find(j => q.includes(j.company_name.toLowerCase()));
                if (mentionedJob) {
                    const studentCgpa = parseFloat(student.cgpa) || 0;
                    const reqCgpa = parseFloat(mentionedJob.cgpa) || 0;
                    const cgpaPass = studentCgpa >= reqCgpa;

                    const branches = (mentionedJob.eligible_branches || 'All Branches').split(',').map(b => b.trim().toLowerCase());
                    const branchPass = branches.includes('all branches') || branches.some(b => (student.branch || '').toLowerCase().includes(b));
                    const backlogPass = (student.backlogs || 0) <= (mentionedJob.max_backlogs || 0);

                    const isEligible = cgpaPass && branchPass && backlogPass;

                    if (isEligible) {
                        reply = `✅ **Yes, you are eligible for ${mentionedJob.company_name} (${mentionedJob.title})!**\n\n` +
                                `• **CGPA**: Your CGPA is **${studentCgpa.toFixed(2)}** (Minimum required: ${reqCgpa.toFixed(1)})\n` +
                                `• **Branch**: Your branch **${student.branch || 'General'}** is approved\n` +
                                `• **Backlogs**: You have **${student.backlogs || 0}** backlogs (Max allowed: ${mentionedJob.max_backlogs || 0})\n\n` +
                                `You are cleared to apply on the Jobs page!`;
                    } else {
                        const reasons = [];
                        if (!cgpaPass) reasons.push(`CGPA shortfall (${studentCgpa.toFixed(2)} < ${reqCgpa.toFixed(1)})`);
                        if (!branchPass) reasons.push(`Branch ${student.branch} not in [${mentionedJob.eligible_branches}]`);
                        if (!backlogPass) reasons.push(`Backlogs exceed limit (${student.backlogs} > ${mentionedJob.max_backlogs})`);

                        reply = `❌ **You are currently not eligible for ${mentionedJob.company_name} (${mentionedJob.title}).**\n\n` +
                                `Reasons based on your profile:\n` +
                                reasons.map(r => `• ${r}`).join('\n') +
                                `\n\nTip: You can update your skills or target drives open to All Branches on the Jobs page.`;
                    }
                    dataReferences.push(`Job ID ${mentionedJob.id} (${mentionedJob.company_name})`, `Student ID ${userId}`);
                } else {
                    // Check all jobs
                    const eligibleJobs = [];
                    const studentCgpa = parseFloat(student.cgpa) || 0;

                    jobs.forEach(j => {
                        const cgpaPass = studentCgpa >= (parseFloat(j.cgpa) || 0);
                        const branches = (j.eligible_branches || 'All Branches').split(',').map(b => b.trim().toLowerCase());
                        const branchPass = branches.includes('all branches') || branches.some(b => (student.branch || '').toLowerCase().includes(b));
                        const backlogPass = (student.backlogs || 0) <= (j.max_backlogs || 0);
                        if (cgpaPass && branchPass && backlogPass) {
                            eligibleJobs.push(j.company_name);
                        }
                    });

                    reply = `🎓 **Your Drive Eligibility Summary:**\n\n` +
                            `Based on your recorded CGPA (**${studentCgpa.toFixed(2)}**), Branch (**${student.branch || 'General'}**), and Backlogs (**${student.backlogs || 0}**):\n\n` +
                            `You qualify for **${eligibleJobs.length} of ${jobs.length}** active campus drives:\n` +
                            (eligibleJobs.length > 0 ? eligibleJobs.map(c => `• **${c}**`).join('\n') : '• No matching drives currently meeting criteria.') +
                            `\n\nUse the **Find Jobs** tab to view complete requirements and submit your applications.`;
                    dataReferences.push('Platform Live Jobs Directory', `Student Profile ID ${userId}`);
                }
            }
        }

        // 2. Skill Gap & Missing Skills
        else if (q.includes('skill') || q.includes('missing') || q.includes('gap') || q.includes('learn')) {
            intent = 'skill_gap';
            if (userRole !== 'STUDENT') {
                reply = 'Skill gap analysis is available for student profiles comparing their technical repertoire against recruiter requirements.';
            } else {
                const student = await get('SELECT skills FROM users WHERE id = ?', [userId]);
                const studentSkills = (student.skills || '').split(/[,;|]/).map(s => s.trim().toLowerCase()).filter(Boolean);

                const jobs = await query('SELECT company_name, title, skills FROM jobs');
                const targetJob = jobs.find(j => q.includes(j.company_name.toLowerCase())) || jobs[0];

                if (targetJob) {
                    const reqSkills = (targetJob.skills || '').split(/[,;|]/).map(s => s.trim()).filter(Boolean);
                    const missing = reqSkills.filter(r => !studentSkills.some(s => s.includes(r.toLowerCase()) || r.toLowerCase().includes(s)));
                    const matched = reqSkills.filter(r => studentSkills.some(s => s.includes(r.toLowerCase()) || r.toLowerCase().includes(s)));

                    reply = `💻 **Skill Gap Analysis for ${targetJob.company_name} (${targetJob.title}):**\n\n` +
                            `• **Acquired Skills (${matched.length}/${reqSkills.length})**: ${matched.join(', ') || 'None'}\n` +
                            `• **Missing / In-Demand Skills**: ${missing.length > 0 ? missing.join(', ') : 'None! You meet all required skills 🎉'}\n\n` +
                            (missing.length > 0 
                                ? `💡 **Recommended Action**: Head over to the **Skill-Gap Analyzer** tab in your dashboard to access structured learning roadmaps and practice challenges for ${missing.slice(0, 2).join(' and ')}.`
                                : `You possess strong technical alignment for this role. Consider taking a Mock Interview to practice technical communication.`);
                    dataReferences.push(`Job Record (${targetJob.company_name})`, `Student Profile Skills`);
                }
            }
        }

        // 3. Application Status & Timeline
        else if (q.includes('status') || q.includes('applied') || q.includes('application') || q.includes('shortlist') || q.includes('selected')) {
            intent = 'application_status';
            if (userRole !== 'STUDENT') {
                const appsCount = await get('SELECT COUNT(*) as count FROM applications');
                reply = `Total applications across all institutional drives currently stands at **${appsCount.count}**. Check the Admin/Recruiter table for individual student rosters.`;
            } else {
                const apps = await query(`
                    SELECT a.status, a.stage, a.applied_at, j.company_name, j.title, j.salary
                    FROM applications a
                    JOIN jobs j ON a.job_id = j.id
                    WHERE a.student_id = ?
                    ORDER BY a.applied_at DESC
                `, [userId]);

                if (apps.length === 0) {
                    reply = `You have not applied to any campus drives yet. Explore open drives in the **Find Jobs** section to submit your first application.`;
                } else {
                    reply = `📋 **Your Live Applications (${apps.length}):**\n\n` +
                            apps.map(a => `• **${a.company_name}** - ${a.title} (${a.salary})\n  ↳ Stage: **${a.stage || a.status}** | Status: **${a.status}**`).join('\n\n') +
                            `\n\nClick on any application card in your dashboard to inspect its chronological milestone timeline.`;
                    dataReferences.push(`Database Applications Table for User ID ${userId}`);
                }
            }
        }

        // 4. Deadlines & Upcoming Drives
        else if (q.includes('deadline') || q.includes('upcoming') || q.includes('calendar') || q.includes('when') || q.includes('date')) {
            intent = 'deadlines';
            const jobs = await query(`
                SELECT company_name, title, salary, deadline, location
                FROM jobs
                WHERE deadline != ''
                ORDER BY deadline ASC
            `);

            if (jobs.length === 0) {
                reply = 'There are currently no active placement drives with registered deadlines.';
            } else {
                reply = `📅 **Upcoming Drive Deadlines:**\n\n` +
                        jobs.map(j => {
                            const days = Math.ceil((new Date(j.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                            const urgency = days <= 3 && days >= 0 ? '⚠️ Closing Soon!' : '';
                            return `• **${j.company_name}** - ${j.title} (${j.salary})\n  ↳ Deadline: **${j.deadline}** (${days >= 0 ? `${days} days left` : 'Closed'}) ${urgency}`;
                        }).join('\n\n') +
                        `\n\nMake sure your resume is up-to-date in your profile before deadlines elapse!`;
                dataReferences.push('Platform Live Jobs Schedule');
            }
        }

        // 5. Salary & Placement Statistics
        else if (q.includes('salary') || q.includes('package') || q.includes('highest') || q.includes('average') || q.includes('stats') || q.includes('rate')) {
            intent = 'placement_stats';
            const allJobs = await query('SELECT salary FROM jobs');
            const placedCount = await get("SELECT COUNT(DISTINCT student_id) as count FROM applications WHERE status = 'Selected'");
            const totalStudents = await get("SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'");

            const salaries = allJobs.map(j => {
                const match = (j.salary || '').match(/(\d+(\.\d+)?)/);
                return match ? parseFloat(match[1]) : 0;
            }).filter(s => s > 0).sort((a, b) => a - b);

            const max = salaries.length > 0 ? salaries[salaries.length - 1] : 0;
            const avg = salaries.length > 0 ? (salaries.reduce((a, b) => a + b, 0) / salaries.length).toFixed(1) : 0;

            reply = `📊 **Official Campus Placement Statistics:**\n\n` +
                    `• **Highest Package Offered**: **${max} LPA**\n` +
                    `• **Average Package**: **${avg} LPA**\n` +
                    `• **Students Selected / Placed**: **${placedCount.count}** of ${totalStudents.count} registered candidates\n` +
                    `• **Active Drives**: **${allJobs.length}** participating companies\n\n` +
                    `Detailed branch-wise analytics and recruitment funnel conversions are available on the institutional analytics dashboard.`;
            dataReferences.push('PlacementHub Real Database Aggregate Queries');
        }

        // 6. Company Guide / Preparation Tips
        else if (q.includes('prepare') || q.includes('guide') || q.includes('tcs') || q.includes('infosys') || q.includes('accenture') || q.includes('capgemini')) {
            intent = 'company_guide';
            const guides = await query('SELECT * FROM company_guides');
            const targetGuide = guides.find(g => q.includes(g.company_name.toLowerCase())) || guides[0];

            if (targetGuide) {
                const rounds = JSON.parse(targetGuide.rounds_info || '[]');
                const questions = JSON.parse(targetGuide.common_questions || '[]');

                reply = `🏢 **Recruiter Preparation Guide: ${targetGuide.company_name}**\n\n` +
                        `**Pattern Overview**:\n${targetGuide.pattern_overview}\n\n` +
                        `**Key Selection Rounds**:\n` +
                        rounds.map(r => `• **Round ${r.round}: ${r.name}** (${r.duration}) - ${r.focus}`).join('\n') +
                        `\n\n**Commonly Asked Interview Questions**:\n` +
                        questions.slice(0, 3).map(ques => `• "${ques}"`).join('\n') +
                        `\n\n💡 **Preparation Strategy Tip**: ${targetGuide.prep_tips}`;
                dataReferences.push(`Company Guide Repository: ${targetGuide.company_name}`);
            } else {
                reply = 'We have company guides available for TCS, Infosys, Accenture, and Capgemini. Which company would you like preparation details for?';
            }
        }

        // 7. General Assistant Response
        else {
            intent = 'general_assistant';
            reply = `👋 **Hello! I am your PlacementHub Assistant.**\n\n` +
                    `I have secure access to your authorized academic and placement records. Here are some questions you can ask me:\n\n` +
                    `• *"Am I eligible for TCS or Infosys?"*\n` +
                    `• *"What are my missing skills for Software Developer?"*\n` +
                    `• *"What is the status of my job applications?"*\n` +
                    `• *"When are the upcoming placement drive deadlines?"*\n` +
                    `• *"What is the average placement salary this year?"*\n` +
                    `• *"How should I prepare for Accenture technical rounds?"*\n\n` +
                    `Feel free to ask any query regarding your drives or preparation!`;
        }

        return res.status(200).json({
            success: true,
            reply,
            intent,
            dataReferences,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Assistant chat error:', err);
        return res.status(500).json({ success: false, message: 'Server error processing assistant query.' });
    }
};
