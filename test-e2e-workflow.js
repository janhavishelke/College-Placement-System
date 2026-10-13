const http = require('http');

const API_BASE = 'http://localhost:5000/api';

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path.startsWith('http') ? path : `${API_BASE}${path}`);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('========================================================');
    console.log('🚀 RUNNING COMPREHENSIVE E2E VERIFICATION TEST SUITE');
    console.log('========================================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            failed++;
        }
    }

    try {
        // 1. Health check & Security Headers
        console.log('1. Testing System Health & Security Headers...');
        const health = await request('GET', '/health');
        assert(health.status === 200 && health.body.status === 'UP', 'Health check is operational');
        assert(health.headers['x-content-type-options'] === 'nosniff', 'Security Header: X-Content-Type-Options: nosniff enforced');
        assert(health.headers['x-frame-options'] === 'SAMEORIGIN', 'Security Header: X-Frame-Options: SAMEORIGIN enforced');

        // 1b. Public Visiting Drives Retrieval
        console.log('\n1b. Testing Visiting Placement Drives Retrieval...');
        const visitingRes = await request('GET', '/companies/visiting');
        assert(visitingRes.status === 200 && Array.isArray(visitingRes.body.companies), 'Public visiting drives loaded successfully');
        assert(visitingRes.body.companies.length > 0, `Retrieved ${visitingRes.body.companies.length} active visiting placement drives`);
        const sampleDrive = visitingRes.body.companies[0];
        assert(Boolean(sampleDrive.company_name && sampleDrive.title && sampleDrive.salary), 'Visiting drive contains essential fields (company_name, title, salary)');

        // 2. Auth Tests for all 5 roles & Security Defenses
        console.log('\n2. Testing Authentication for all 5 roles & Security Controls...');
        const headLogin = await request('POST', '/auth/login', {
            email: 'tpo@placement.edu',
            password: 'Head@123',
            role: 'PLACEMENT_HEAD'
        });
        assert(headLogin.status === 200 && headLogin.body.token, 'Placement Head login (tpo@placement.edu)');
        const headToken = headLogin.body.token;

        const coordLogin = await request('POST', '/auth/login', {
            email: 'coordinator@placement.edu',
            password: 'Coord@123',
            role: 'COORDINATOR'
        });
        assert(coordLogin.status === 200 && coordLogin.body.token, 'Placement Coordinator login (coordinator@placement.edu)');
        const coordToken = coordLogin.body.token;

        const studentLogin = await request('POST', '/auth/login', {
            email: 'rahul@student.edu',
            password: 'Student@123',
            role: 'STUDENT'
        });
        assert(studentLogin.status === 200 && studentLogin.body.token, 'Student login (rahul@student.edu)');
        const studentToken = studentLogin.body.token;

        const adminLogin = await request('POST', '/auth/login', {
            email: 'admin@placement.edu',
            password: 'Admin@123',
            role: 'ADMIN'
        });
        assert(adminLogin.status === 200 && adminLogin.body.token, 'Admin login (admin@placement.edu)');

        const recruiterLogin = await request('POST', '/auth/login', {
            email: 'tcs@placement.edu',
            password: 'Company@123',
            role: 'COMPANY'
        });
        assert(recruiterLogin.status === 200 && recruiterLogin.body.token, 'Recruiter login (tcs@placement.edu)');

        // 2b. Privilege Escalation Defense
        console.log('\n2b. Testing Privilege Escalation Defense...');
        const adminRegAttempt = await request('POST', '/auth/register', {
            name: 'Attacker Admin',
            email: `hacker.${Date.now()}@domain.com`,
            password: 'Password@123',
            role: 'ADMIN'
        });
        assert(adminRegAttempt.status === 403, 'Privilege escalation rejected: Cannot self-register as ADMIN (HTTP 403)');

        // 2c. Anti-Account Enumeration
        console.log('\n2c. Testing Anti-Account Enumeration Defense...');
        const badLogin = await request('POST', '/auth/login', {
            email: 'nonexistent.user@placement.edu',
            password: 'WrongPassword@123',
            role: 'STUDENT'
        });
        assert(badLogin.status === 401 && badLogin.body.message === 'Invalid email, password, or role selection.', 'Anti-enumeration: Uniform error message for non-existent account');

        const badPasswordLogin = await request('POST', '/auth/login', {
            email: 'rahul@student.edu',
            password: 'IncorrectPassword',
            role: 'STUDENT'
        });
        assert(badPasswordLogin.status === 401 && badPasswordLogin.body.message === 'Invalid email, password, or role selection.', 'Anti-enumeration: Uniform error message for incorrect password');

        // 3. Coordinator Workload & Stats
        console.log('\n3. Testing Coordinator Workload & Stats...');
        const coordStats = await request('GET', '/coordinators/stats', null, coordToken);
        assert(coordStats.status === 200 && coordStats.body.success, 'Coordinator KPI stats loaded');

        // 4. Multi-Stage Drive Approval Flow
        console.log('\n4. Testing Multi-Stage Drive Approval Flow...');
        // Coordinator submits a new drive proposal
        const testCompany = `FinTech Innovations ${Date.now() % 10000}`;
        const createDriveRes = await request('POST', '/jobs', {
            companyName: testCompany,
            jobTitle: 'Backend Systems Engineer',
            salary: '16.5 LPA',
            visitDate: '2026-11-20',
            deadline: '2026-11-15',
            minimumCgpa: 7.5,
            maxBacklogs: 0,
            eligibleBranches: 'Computer Engineering, Information Technology',
            skills: 'Node.js, PostgreSQL, Distributed Systems',
            description: 'Round 1: Online Coding Test. Round 2: System Design & Algorithms. Round 3: HR Discussion.',
            approvalStatus: 'Pending Approval',
            industry: 'FinTech',
            available_positions: 15
        }, coordToken);

        assert(createDriveRes.status === 201 && createDriveRes.body.success, `Coordinator created drive proposal for ${testCompany}`);
        const driveId = createDriveRes.body.job.id;

        // Student checks drives -> must NOT be visible yet
        const studentJobsBefore = await request('GET', '/jobs', null, studentToken);
        const isVisibleToStudentBefore = studentJobsBefore.body.jobs.some(j => j.id === driveId);
        assert(!isVisibleToStudentBefore, 'Pending drive is properly HIDDEN from students before approval');

        // Placement Head approves drive
        const approveRes = await request('POST', `/jobs/${driveId}/approve`, null, headToken);
        assert(approveRes.status === 200 && approveRes.body.success, 'Placement Head approved drive proposal');

        // Student checks drives again -> must NOW be visible!
        const studentJobsAfter = await request('GET', '/jobs', null, studentToken);
        const isVisibleToStudentAfter = studentJobsAfter.body.jobs.some(j => j.id === driveId);
        assert(isVisibleToStudentAfter, 'Approved drive is immediately VISIBLE to students');

        // 4b. Student CGPA Eligibility Gate Enforcement
        console.log('\n4b. Testing Eligibility Enforcement (CGPA Cutoff)...');
        const eliteDriveRes = await request('POST', '/jobs', {
            companyName: `Elite Research Labs ${Date.now() % 10000}`,
            jobTitle: 'Principal Research Scientist',
            salary: '45 LPA',
            skills: 'Deep Learning, Quantum Computing, PyTorch',
            visitDate: '2026-12-01',
            deadline: '2026-11-28',
            minimumCgpa: 9.5, // Rahul has CGPA 8.7
            maxBacklogs: 0,
            eligibleBranches: 'Computer Engineering',
            approvalStatus: 'Approved'
        }, headToken);
        assert(eliteDriveRes.status === 201 && eliteDriveRes.body.job, 'Placement Head created high-CGPA research drive');
        const eliteDriveId = eliteDriveRes.body.job.id;

        const ineligibleApply = await request('POST', '/applications', { jobId: eliteDriveId }, studentToken);
        assert(ineligibleApply.status === 403 && ineligibleApply.body.message.includes('Eligibility criteria not met'), 'CGPA Gate: Ineligible student blocked from applying (HTTP 403)');

        // 5. Student Application & Candidate Progression
        console.log('\n5. Testing Application & Selection Round Progression...');
        const applyRes = await request('POST', '/applications', {
            jobId: driveId
        }, studentToken);
        assert(applyRes.status === 201 && applyRes.body.success, 'Student successfully applied to approved drive');
        const applicationId = applyRes.body.applicationId || (applyRes.body.application && applyRes.body.application.id);

        // Coordinator advances candidate through interview rounds
        const advanceRes1 = await request('PUT', `/applications/${applicationId}/status`, {
            status: 'Shortlisted',
            notes: 'Candidate passed online algorithmic assessment with 95% score'
        }, coordToken);
        assert(advanceRes1.status === 200 && advanceRes1.body.success, 'Coordinator advanced candidate to "Shortlisted"');

        const advanceRes2 = await request('PUT', `/applications/${applicationId}/status`, {
            status: 'Selected',
            notes: 'Offered Full-time Backend Systems Engineer position at 16.5 LPA'
        }, coordToken);
        assert(advanceRes2.status === 200 && advanceRes2.body.success, 'Coordinator marked candidate as "Selected" / Placed');

        // 6. Placement Head Coordinator Management
        console.log('\n6. Testing Placement Head Coordinator Management...');
        const listCoords = await request('GET', '/coordinators', null, headToken);
        assert(listCoords.status === 200 && Array.isArray(listCoords.body.coordinators), 'Placement Head retrieved coordinator roster');

        const newCoordRes = await request('POST', '/coordinators', {
            name: 'Prof. Sneha Deshmukh',
            email: `coord.entc.${Date.now() % 1000}@placement.edu`,
            password: 'Coord@12345',
            department: 'Electronics & Telecom',
            phone: '+91 99887 76655'
        }, headToken);
        assert(newCoordRes.status === 201 && newCoordRes.body.success, 'Placement Head added new faculty coordinator');
        const createdCoordId = newCoordRes.body.coordinator.id;

        // Assign drive to coordinator
        const assignRes = await request('POST', `/jobs/${driveId}/assign-coordinator`, {
            coordinator_id: createdCoordId,
            coordinator_name: 'Prof. Sneha Deshmukh'
        }, headToken);
        assert(assignRes.status === 200 && assignRes.body.success, 'Placement Head assigned drive coordination responsibility');

        // 7. Campus Announcements Broadcast
        console.log('\n7. Testing Campus Announcements Broadcast...');
        const postAnnRes = await request('POST', '/announcements', {
            title: `Campus Drive: ${testCompany} Final Schedule`,
            message: 'Reporting at Lab 401 at 8:30 AM with college ID card.',
            target_role: 'STUDENT',
            category: 'DRIVE',
            priority: 'HIGH',
            job_id: driveId
        }, headToken);
        assert(postAnnRes.status === 201 && postAnnRes.body.success, 'Placement Head published campus announcement');

        const getAnnRes = await request('GET', '/announcements', null, studentToken);
        const hasAnn = getAnnRes.body.announcements.some(a => a.title.includes(testCompany));
        assert(hasAnn, 'Student retrieved published campus announcement');

        // 8. Institutional Reports & CSV Exports
        console.log('\n8. Testing Reports & CSV Exports...');
        const summaryRes = await request('GET', '/reports/summary', null, headToken);
        assert(summaryRes.status === 200 && summaryRes.body.overview, 'Placement Head retrieved institutional summary metrics');

        const csvStudents = await request('GET', '/reports/export/students', null, headToken);
        assert(csvStudents.status === 200 && typeof csvStudents.body === 'string' && csvStudents.body.includes('Full Name'), 'Export Students CSV generated correctly');

        const csvDrives = await request('GET', '/reports/export/drives', null, headToken);
        assert(csvDrives.status === 200 && typeof csvDrives.body === 'string' && csvDrives.body.includes('Company Name'), 'Export Drives CSV generated correctly');

        const csvOffers = await request('GET', '/reports/export/selections', null, headToken);
        assert(csvOffers.status === 200 && typeof csvOffers.body === 'string' && csvOffers.body.includes('Package CTC'), 'Export Selections CSV generated correctly');

        // 9. Administrative Audit Trail
        console.log('\n9. Testing Administrative Audit Trail...');
        const auditRes = await request('GET', '/audit-logs', null, headToken);
        assert(auditRes.status === 200 && Array.isArray(auditRes.body.logs) && auditRes.body.logs.length > 0, 'Audit trail captured all administrative activities');

        console.log('\n========================================================');
        console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
        console.log('========================================================');

        if (failed === 0) {
            console.log('🎉 ALL SYSTEM MODULES AND WORKFLOWS VERIFIED 100% OPERATIONAL!\n');
            process.exit(0);
        } else {
            process.exit(1);
        }
    } catch (e) {
        console.error('Fatal test error:', e);
        process.exit(1);
    }
}

runTests();
