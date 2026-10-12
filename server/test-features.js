const http = require('http');

// Small helper to make HTTP requests
function request(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path,
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch(e) {
                    resolve({ status: res.statusCode, raw: body });
                }
            });
        });

        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- STARTING COMPREHENSIVE BACKEND VERIFICATION ---');

    // 1. Login as Student (Rahul)
    const loginRes = await request('POST', '/api/auth/login', {
        email: 'rahul@student.edu',
        password: 'Student@123',
        role: 'STUDENT'
    });
    console.log('1. Student Login:', loginRes.status === 200 ? 'PASS' : 'FAIL', loginRes.data.user?.name);
    const studentToken = loginRes.data.token;

    // Login as Admin
    const adminLogin = await request('POST', '/api/auth/login', {
        email: 'admin@placement.edu',
        password: 'Admin@123',
        role: 'ADMIN'
    });
    console.log('2. Admin Login:', adminLogin.status === 200 ? 'PASS' : 'FAIL');
    const adminToken = adminLogin.data.token;

    // Feature 1: Recommendations Engine
    const recRes = await request('GET', '/api/recommendations/jobs', null, studentToken);
    console.log('3. Job Recommendations:', recRes.status === 200 && recRes.data.recommendations?.length > 0 ? 'PASS' : 'FAIL',
        'Top Rec:', recRes.data.recommendations?.[0]?.company, '| Tier:', recRes.data.recommendations?.[0]?.recommendationTier);

    // Feature 2: Skill Gap Analyzer
    const skillRes = await request('GET', '/api/recommendations/skill-gap?jobId=1', null, studentToken);
    console.log('4. Skill Gap Analyzer:', skillRes.status === 200 ? 'PASS' : 'FAIL',
        'Target:', skillRes.data.analysis?.targetTitle, '| Missing Skills:', skillRes.data.analysis?.missingSkills);

    // Feature 3: Resume Analysis Module
    const sampleResume = `
        Rahul Patil - rahul@student.edu - 9876543210 - github.com/rahulpatil
        Objective: Ambitious Computer Engineering student passionate about backend software architecture and distributed systems.
        Education: B.Tech in Computer Engineering from Mumbai University, CGPA: 8.4/10.0 (Graduation 2026).
        Technical Skills: Java, Spring Boot, SQL, PostgreSQL, REST API, Git, Docker, Data Structures.
        Projects:
        - Placement Portal Management System: Developed high-performance backend microservices in Spring Boot and SQLite. Reduced query execution latency by 35% and supported 500+ student applicants.
        - Real-Time Chat Engine: Architected WebSocket-based messaging system handling 1,000+ concurrent messages with zero packet loss.
        Certifications: AWS Certified Cloud Practitioner, HackerRank 5-Star Java.
    `;
    const resumeRes = await request('POST', '/api/resume/analyze', { resumeText: sampleResume, jobId: 1 }, studentToken);
    console.log('5. Resume Analyzer:', resumeRes.status === 200 ? 'PASS' : 'FAIL',
        'Overall Score:', resumeRes.data.analysis?.overallScore, '| Disclaimer present:', Boolean(resumeRes.data.disclaimer));

    // Feature 4: Preparation Zone (Aptitude & Coding & Mock Interview)
    const aptRes = await request('GET', '/api/prep/aptitude', null, studentToken);
    console.log('6. Aptitude Questions:', aptRes.status === 200 && aptRes.data.count > 0 ? 'PASS' : 'FAIL', 'Questions count:', aptRes.data.count);

    const codeSubmit = await request('POST', '/api/prep/coding/submit', {
        challengeId: 1,
        code: `function twoSum(nums, target) {
            const map = new Map();
            for (let i = 0; i < nums.length; i++) {
                const diff = target - nums[i];
                if (map.has(diff)) return [map.get(diff), i];
                map.set(nums[i], i);
            }
            return [];
        }`
    }, studentToken);
    console.log('7. Coding Sandbox Submission:', codeSubmit.status === 200 && codeSubmit.data.allPassed ? 'PASS' : 'FAIL', codeSubmit.data.summary);

    const mockEval = await request('POST', '/api/prep/mock-interview/evaluate', {
        role: 'Software Engineer',
        answers: [
            {
                questionId: 1,
                answerText: 'A process is an executing instance of a program with its own dedicated memory address space, stack, and heap. A thread is a lightweight unit of execution within a process sharing the same address space. Context switching between threads has lower overhead than processes.'
            }
        ]
    }, studentToken);
    console.log('8. Mock Interview Evaluation:', mockEval.status === 200 ? 'PASS' : 'FAIL', 'Score:', mockEval.data.overallScore);

    // Feature 5: Transparent Eligibility Checker
    const eligRes = await request('GET', '/api/eligibility/job/1', null, studentToken);
    console.log('9. Eligibility Checker:', eligRes.status === 200 ? 'PASS' : 'FAIL', 'Eligible:', eligRes.data.isEligible, '| Summary:', eligRes.data.summaryExplanation);

    // Feature 6: Placement Readiness Dashboard
    const readinessRes = await request('GET', '/api/prep/readiness', null, studentToken);
    console.log('10. Placement Readiness:', readinessRes.status === 200 ? 'PASS' : 'FAIL', 'Readiness Score:', readinessRes.data.readiness?.totalScore, '| Tier:', readinessRes.data.readiness?.tier);

    // Feature 7: Timeline & Calendar & Notifications
    const timeRes = await request('GET', '/api/timeline/application/1', null, studentToken);
    console.log('11. Application Timeline:', timeRes.status === 200 ? 'PASS' : 'FAIL', 'Milestones count:', timeRes.data.timeline?.length);

    const notifRes = await request('GET', '/api/timeline/notifications', null, studentToken);
    console.log('12. In-App Notifications:', notifRes.status === 200 ? 'PASS' : 'FAIL', 'Unread count:', notifRes.data.unreadCount);

    // Feature 8: Alumni Experiences & Moderation
    const alumniRes = await request('GET', '/api/alumni/experiences', null, studentToken);
    console.log('13. Alumni Experiences:', alumniRes.status === 200 ? 'PASS' : 'FAIL', 'Approved experiences:', alumniRes.data.count);

    // Feature 9: Offer Comparison Tool
    const offerComp = await request('POST', '/api/offers/compare', {
        offers: [
            { companyName: 'TCS Digital', jobRole: 'Software Developer', ctc: 6.5, baseSalary: 5.2, bonus: 1.3, location: 'Mumbai', workMode: 'Hybrid', bondMonths: 12 },
            { companyName: 'Infosys DSE', jobRole: 'Digital Specialist Engineer', ctc: 6.2, baseSalary: 5.0, bonus: 1.2, location: 'Pune', workMode: 'Hybrid', bondMonths: 12 },
            { companyName: 'Accenture', jobRole: 'Associate Software Engineer', ctc: 7.2, baseSalary: 6.0, bonus: 1.2, location: 'Bangalore', workMode: 'On-Site', bondMonths: 0 }
        ]
    }, studentToken);
    console.log('14. Offer Comparison Tool:', offerComp.status === 200 ? 'PASS' : 'FAIL', 'Recommended:', offerComp.data.summary?.recommendedOffer);

    // Feature 10: Real Database Analytics Dashboard
    const analyticsRes = await request('GET', '/api/analytics/overview', null, adminToken);
    console.log('15. Institutional Analytics:', analyticsRes.status === 200 ? 'PASS' : 'FAIL',
        'Placement Rate:', analyticsRes.data.kpis?.overallPlacementPercentage + '%',
        'Highest Package:', analyticsRes.data.kpis?.salaryStats?.highestLPA);

    // Feature 11: Personalized Placement Assistant
    const chatRes = await request('POST', '/api/assistant/chat', {
        message: 'Am I eligible for TCS, and what is my current application status?'
    }, studentToken);
    console.log('16. AI Placement Assistant:', chatRes.status === 200 ? 'PASS' : 'FAIL', 'Intent:', chatRes.data.intent);

    console.log('--- ALL BACKEND CHECKS EXECUTED SUCCESSFULLY ---');
    process.exit(0);
}

runTests().catch(err => {
    console.error('Test script error:', err);
    process.exit(1);
});
