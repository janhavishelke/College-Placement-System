const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'placement.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to SQLite database:', err.message);
    } else {
        console.log(`Connected to SQLite database at ${dbPath}`);
    }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Promisified helper methods
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row || null);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

// Safe helper to add missing column to an existing table
async function ensureColumn(table, column, definition) {
    try {
        const columns = await query(`PRAGMA table_info(${table})`);
        const exists = columns.some(c => c.name === column);
        if (!exists) {
            await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        }
    } catch (err) {
        console.warn(`Column check/add for ${table}.${column}:`, err.message);
    }
}

// Initialize schema and seed default data
async function initDatabase() {
    // 1. Core tables
    await run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL COLLATE NOCASE,
            password TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('STUDENT', 'COMPANY', 'ADMIN', 'PLACEMENT_HEAD', 'COORDINATOR')),
            branch TEXT DEFAULT '',
            cgpa REAL DEFAULT 0.0,
            skills TEXT DEFAULT '',
            department TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Ensure users table CHECK constraint supports PLACEMENT_HEAD and COORDINATOR
    try {
        const usersSqlRow = await get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'");
        if (usersSqlRow && usersSqlRow.sql && (!usersSqlRow.sql.includes('COORDINATOR') || !usersSqlRow.sql.includes('PLACEMENT_HEAD'))) {
            console.log('Migrating users table schema to support PLACEMENT_HEAD and COORDINATOR roles...');
            await run('PRAGMA foreign_keys = OFF');
            await run(`
                CREATE TABLE IF NOT EXISTS users_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
                    password TEXT NOT NULL,
                    role TEXT NOT NULL CHECK(role IN ('STUDENT', 'COMPANY', 'ADMIN', 'PLACEMENT_HEAD', 'COORDINATOR')),
                    branch TEXT DEFAULT '',
                    cgpa REAL DEFAULT 0.0,
                    skills TEXT DEFAULT '',
                    backlogs INTEGER DEFAULT 0,
                    batch TEXT DEFAULT '2026',
                    interests TEXT DEFAULT 'Software Engineering, Web Development',
                    resume_text TEXT DEFAULT '',
                    resume_filename TEXT DEFAULT '',
                    portfolio_url TEXT DEFAULT '',
                    projects TEXT DEFAULT '',
                    company_logo TEXT DEFAULT '',
                    company_website TEXT DEFAULT '',
                    company_description TEXT DEFAULT '',
                    department TEXT DEFAULT '',
                    phone TEXT DEFAULT '',
                    status TEXT DEFAULT 'Active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await run(`
                INSERT INTO users_new (id, name, email, password, role, branch, cgpa, skills, backlogs, batch, interests, resume_text, resume_filename, portfolio_url, projects, company_logo, company_website, company_description, department, phone, status, created_at)
                SELECT id, name, email, password, role, branch, cgpa, skills, COALESCE(backlogs, 0), COALESCE(batch, '2026'), COALESCE(interests, ''), COALESCE(resume_text, ''), COALESCE(resume_filename, ''), COALESCE(portfolio_url, ''), COALESCE(projects, ''), COALESCE(company_logo, ''), COALESCE(company_website, ''), COALESCE(company_description, ''), COALESCE(branch, ''), '', 'Active', created_at
                FROM users
            `);
            await run('DROP TABLE users');
            await run('ALTER TABLE users_new RENAME TO users');
            await run('PRAGMA foreign_keys = ON');
            console.log('Users table successfully migrated to support PLACEMENT_HEAD and COORDINATOR.');
        }
    } catch (uMigErr) {
        console.warn('Users table migration check:', uMigErr.message);
    }

    await run(`
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company_name TEXT NOT NULL,
            title TEXT NOT NULL,
            cgpa REAL NOT NULL DEFAULT 0.0,
            skills TEXT NOT NULL DEFAULT '',
            location TEXT NOT NULL DEFAULT '',
            salary TEXT NOT NULL DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
            student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'Applied' CHECK(status IN ('Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Not Selected', 'Offer Accepted', 'Offer Declined', 'Rejected')),
            stage TEXT DEFAULT 'Applied',
            stage_notes TEXT DEFAULT '',
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(job_id, student_id)
        )
    `);

    // Ensure extended columns on core tables
    await ensureColumn('users', 'backlogs', 'INTEGER DEFAULT 0');
    await ensureColumn('users', 'batch', "TEXT DEFAULT '2026'");
    await ensureColumn('users', 'interests', "TEXT DEFAULT 'Software Engineering, Web Development'");
    await ensureColumn('users', 'resume_text', "TEXT DEFAULT ''");
    await ensureColumn('users', 'resume_filename', "TEXT DEFAULT ''");
    await ensureColumn('users', 'portfolio_url', "TEXT DEFAULT ''");
    await ensureColumn('users', 'projects', "TEXT DEFAULT ''");
    await ensureColumn('users', 'department', "TEXT DEFAULT ''");
    await ensureColumn('users', 'phone', "TEXT DEFAULT ''");
    await ensureColumn('users', 'status', "TEXT DEFAULT 'Active'");

    await ensureColumn('jobs', 'eligible_branches', "TEXT DEFAULT 'Computer Engineering, Information Technology, AI & ML'");
    await ensureColumn('jobs', 'max_backlogs', 'INTEGER DEFAULT 0');
    await ensureColumn('jobs', 'deadline', "TEXT DEFAULT '2026-11-20'");
    await ensureColumn('jobs', 'description', "TEXT DEFAULT ''");
    await ensureColumn('jobs', 'role_category', "TEXT DEFAULT 'Software Engineering'");
    await ensureColumn('jobs', 'base_salary', "TEXT DEFAULT ''");
    await ensureColumn('jobs', 'bonus', "TEXT DEFAULT ''");
    await ensureColumn('jobs', 'bond_months', 'INTEGER DEFAULT 0');
    await ensureColumn('jobs', 'work_mode', "TEXT DEFAULT 'On-Site'");
    await ensureColumn('jobs', 'visit_date', "TEXT DEFAULT ''");
    await ensureColumn('jobs', 'test_date', "TEXT DEFAULT ''");
    await ensureColumn('jobs', 'interview_date', "TEXT DEFAULT ''");
    await ensureColumn('jobs', 'logo', "TEXT DEFAULT ''");
    await ensureColumn('jobs', 'website', "TEXT DEFAULT ''");
    await ensureColumn('jobs', 'recruitment_status', "TEXT DEFAULT 'Upcoming'");

    // Placement Coordinator & Head Workflow Columns
    await ensureColumn('jobs', 'approval_status', "TEXT DEFAULT 'Approved'");
    await ensureColumn('jobs', 'coordinator_id', 'INTEGER DEFAULT NULL');
    await ensureColumn('jobs', 'coordinator_name', "TEXT DEFAULT ''");
    await ensureColumn('jobs', 'industry', "TEXT DEFAULT 'Information Technology'");
    await ensureColumn('jobs', 'stipend', "TEXT DEFAULT ''");
    await ensureColumn('jobs', 'internship_duration', "TEXT DEFAULT ''");
    await ensureColumn('jobs', 'available_positions', 'INTEGER DEFAULT 10');
    await ensureColumn('jobs', 'selection_process', "TEXT DEFAULT 'Online Assessment -> Technical Interview -> HR Round'");
    await ensureColumn('jobs', 'graduation_year', "TEXT DEFAULT '2026'");
    await ensureColumn('jobs', 'approval_notes', "TEXT DEFAULT ''");
    await ensureColumn('jobs', 'is_archived', 'INTEGER DEFAULT 0');

    await ensureColumn('users', 'company_logo', "TEXT DEFAULT ''");
    await ensureColumn('users', 'company_website', "TEXT DEFAULT ''");
    await ensureColumn('users', 'company_description', "TEXT DEFAULT ''");

    await ensureColumn('applications', 'stage', "TEXT DEFAULT 'Applied'");
    await ensureColumn('applications', 'stage_notes', "TEXT DEFAULT ''");
    await ensureColumn('applications', 'updated_at', "TEXT DEFAULT ''");

    // Institutional Audit Logs
    await run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            user_name TEXT NOT NULL,
            user_role TEXT NOT NULL,
            action TEXT NOT NULL,
            target_type TEXT NOT NULL,
            target_id INTEGER,
            details TEXT NOT NULL,
            ip_address TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Placement Announcements
    await run(`
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            author_name TEXT NOT NULL,
            author_role TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            target_role TEXT NOT NULL DEFAULT 'ALL',
            job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
            priority TEXT NOT NULL DEFAULT 'NORMAL',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Ensure applications table CHECK constraint supports all 8 status workflows
    try {
        const tableSqlRow = await get("SELECT sql FROM sqlite_master WHERE type='table' AND name='applications'");
        if (tableSqlRow && tableSqlRow.sql && (!tableSqlRow.sql.includes('Under Review') || !tableSqlRow.sql.includes('Interview Scheduled'))) {
            console.log('Migrating applications table schema to support all 8 statuses...');
            await run('PRAGMA foreign_keys = OFF');
            await run(`
                CREATE TABLE IF NOT EXISTS applications_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    status TEXT NOT NULL DEFAULT 'Applied' CHECK(status IN ('Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Selected', 'Not Selected', 'Offer Accepted', 'Offer Declined', 'Rejected')),
                    stage TEXT DEFAULT 'Applied',
                    stage_notes TEXT DEFAULT '',
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(job_id, student_id)
                )
            `);
            await run(`
                INSERT INTO applications_new (id, job_id, student_id, status, stage, stage_notes, updated_at, applied_at)
                SELECT id, job_id, student_id, status, COALESCE(stage, status), COALESCE(stage_notes, ''), COALESCE(updated_at, CURRENT_TIMESTAMP), applied_at
                FROM applications
            `);
            await run('DROP TABLE applications');
            await run('ALTER TABLE applications_new RENAME TO applications');
            await run('PRAGMA foreign_keys = ON');
            console.log('Applications table successfully migrated to 8 statuses.');
        }
    } catch (migErr) {
        console.warn('Applications table migration check:', migErr.message);
    }

    // Populate default metadata for existing records if empty
    await run(`UPDATE users SET backlogs = 0, batch = '2026' WHERE backlogs IS NULL`);
    await run(`UPDATE users SET interests = 'Backend Development, Distributed Systems, Cloud' WHERE email = 'rahul@student.edu' AND (interests IS NULL OR interests = '')`);
    await run(`UPDATE users SET interests = 'Full Stack Development, Web Applications' WHERE email = 'priya@student.edu' AND (interests IS NULL OR interests = '')`);
    await run(`UPDATE users SET interests = 'Data Science, Machine Learning, AI Engineering' WHERE email = 'amit@student.edu' AND (interests IS NULL OR interests = '')`);
    await run(`UPDATE users SET interests = 'Software Engineering, Web Development' WHERE (interests IS NULL OR interests = '') AND role = 'STUDENT'`);

    await run(`UPDATE users SET projects = 'E-Commerce Microservices Platform (Spring Boot, React, MySQL, Docker) - Built resilient backend with JWT auth and payment gateway; Algorithmic Career Recommendation Engine (Python, Flask, SQLite) - Implemented multi-factor student-job match algorithm' WHERE email = 'rahul@student.edu' AND (projects IS NULL OR projects = '')`);
    await run(`UPDATE users SET projects = 'Full-Stack Campus Portal (React, Node.js, MongoDB) - Developed responsive dashboard with real-time notifications; Automated Code Evaluator (JavaScript, Docker sandbox)' WHERE email = 'priya@student.edu' AND (projects IS NULL OR projects = '')`);
    await run(`UPDATE users SET projects = 'Deep Learning Medical Image Classifier (PyTorch, OpenCV) - Achieved 94% accuracy on multi-class scan dataset; Real-time Stock Sentiment Analyzer (Python, NLP, Pandas)' WHERE email = 'amit@student.edu' AND (projects IS NULL OR projects = '')`);
    await run(`UPDATE users SET projects = 'Cloud-Native Task Manager (React, Node.js, SQLite) - Implemented real-time updates and task analytics' WHERE (projects IS NULL OR projects = '') AND role = 'STUDENT'`);

    // Ensure company users have logos and websites
    await run(`UPDATE users SET company_website = 'https://www.tcs.com', company_description = 'Global leader in IT services, consulting, and business solutions.' WHERE email = 'tcs@placement.edu' AND (company_website IS NULL OR company_website = '')`);
    await run(`UPDATE users SET company_website = 'https://www.infosys.com', company_description = 'Next-generation digital services and consulting leader.' WHERE email = 'infosys@placement.edu' AND (company_website IS NULL OR company_website = '')`);
    await run(`UPDATE users SET company_website = 'https://www.accenture.com', company_description = 'Global professional services company with leading capabilities in digital, cloud, and security.' WHERE email = 'accenture@placement.edu' AND (company_website IS NULL OR company_website = '')`);
    await run(`UPDATE users SET company_website = 'https://www.capgemini.com', company_description = 'Global leader in partnering with companies to transform and manage their business through technology.' WHERE email = 'capgemini@placement.edu' AND (company_website IS NULL OR company_website = '')`);

    // Ensure all jobs have complete visiting drive metadata (visit_date, website, logo, recruitment_status)
    await run(`UPDATE jobs SET eligible_branches = 'Computer Engineering, Information Technology, AI & ML, Electronics', max_backlogs = 0, deadline = '2026-11-20', visit_date = '2026-11-28', test_date = '2026-11-22', interview_date = '2026-11-29', role_category = 'Software Engineering', base_salary = '5.2 LPA', bonus = '1.3 LPA', bond_months = 12, work_mode = 'Hybrid', website = 'https://www.tcs.com', recruitment_status = 'Active' WHERE company_name LIKE '%TCS%' AND (visit_date IS NULL OR visit_date = '' OR website IS NULL OR website = '')`);
    await run(`UPDATE jobs SET eligible_branches = 'Computer Engineering, Information Technology, AI & ML', max_backlogs = 0, deadline = '2026-11-25', visit_date = '2026-12-02', test_date = '2026-11-27', interview_date = '2026-12-03', role_category = 'Software Engineering', base_salary = '4.8 LPA', bonus = '0.7 LPA', bond_months = 12, work_mode = 'On-Site', website = 'https://www.infosys.com', recruitment_status = 'Active' WHERE company_name LIKE '%Infosys%' AND (visit_date IS NULL OR visit_date = '' OR website IS NULL OR website = '')`);
    await run(`UPDATE jobs SET eligible_branches = 'Computer Engineering, Information Technology, Electronics', max_backlogs = 0, deadline = '2026-12-05', visit_date = '2026-12-10', test_date = '2026-12-07', interview_date = '2026-12-12', role_category = 'Full Stack & Cloud', base_salary = '6.0 LPA', bonus = '1.2 LPA', bond_months = 0, work_mode = 'Hybrid', website = 'https://www.accenture.com', recruitment_status = 'Upcoming' WHERE company_name LIKE '%Accenture%' AND (visit_date IS NULL OR visit_date = '' OR website IS NULL OR website = '')`);
    await run(`UPDATE jobs SET eligible_branches = 'All Branches', max_backlogs = 1, deadline = '2026-11-30', visit_date = '2026-12-05', test_date = '2026-12-02', interview_date = '2026-12-06', role_category = 'Software Engineering', base_salary = '4.5 LPA', bonus = '0.5 LPA', bond_months = 24, work_mode = 'On-Site', website = 'https://www.capgemini.com', recruitment_status = 'Upcoming' WHERE company_name LIKE '%Capgemini%' AND (visit_date IS NULL OR visit_date = '' OR website IS NULL OR website = '')`);
    await run(`UPDATE jobs SET eligible_branches = 'Computer Engineering, Information Technology, AI & ML', max_backlogs = 0, deadline = '2026-11-15', visit_date = '2026-11-25', test_date = '2026-11-18', interview_date = '2026-11-26', role_category = 'Software Engineering', base_salary = '14.5 LPA', bonus = '3.5 LPA', bond_months = 0, work_mode = 'On-Campus', website = 'https://careers.microsoft.com', recruitment_status = 'Active' WHERE company_name LIKE '%Microsoft%' AND (visit_date IS NULL OR visit_date = '' OR website IS NULL OR website = '')`);
    
    // Fallback: Ensure no job has blank visit_date or recruitment_status
    await run(`UPDATE jobs SET visit_date = COALESCE(NULLIF(deadline, ''), '2026-12-15') WHERE visit_date IS NULL OR visit_date = ''`);
    await run(`UPDATE jobs SET recruitment_status = 'Upcoming' WHERE recruitment_status IS NULL OR recruitment_status = ''`);

    // 2. Application Timeline
    await run(`
        CREATE TABLE IF NOT EXISTS application_timeline (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
            stage TEXT NOT NULL,
            title TEXT NOT NULL,
            notes TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 3. In-App Notifications
    await run(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'system',
            link TEXT DEFAULT '',
            is_read INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 4. Aptitude Questions & Test Attempts
    await run(`
        CREATE TABLE IF NOT EXISTS prep_aptitude_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            question TEXT NOT NULL,
            options TEXT NOT NULL,
            correct_index INTEGER NOT NULL,
            explanation TEXT NOT NULL
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS prep_test_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            category TEXT NOT NULL,
            score INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            percentage REAL NOT NULL,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 5. Coding Practice & Submissions
    await run(`
        CREATE TABLE IF NOT EXISTS prep_coding_challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'Data Structures',
            description TEXT NOT NULL,
            starter_code TEXT NOT NULL,
            test_cases TEXT NOT NULL,
            solution_notes TEXT DEFAULT ''
        )
    `);

    await run(`
        CREATE TABLE IF NOT EXISTS prep_coding_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            challenge_id INTEGER NOT NULL REFERENCES prep_coding_challenges(id) ON DELETE CASCADE,
            code TEXT NOT NULL,
            status TEXT NOT NULL,
            test_results TEXT DEFAULT '',
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 6. Mock Interview Sessions
    await run(`
        CREATE TABLE IF NOT EXISTS prep_mock_interviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role_type TEXT NOT NULL,
            transcript TEXT NOT NULL,
            score INTEGER NOT NULL,
            technical_rating REAL DEFAULT 0,
            communication_rating REAL DEFAULT 0,
            feedback TEXT NOT NULL,
            completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 7. Company Preparation Guides
    await run(`
        CREATE TABLE IF NOT EXISTS company_guides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL UNIQUE,
            industry TEXT NOT NULL DEFAULT 'IT & Software',
            overview TEXT NOT NULL,
            pattern_overview TEXT NOT NULL,
            rounds_info TEXT NOT NULL,
            common_questions TEXT NOT NULL,
            prep_tips TEXT NOT NULL
        )
    `);

    // 8. Alumni Experiences & Moderation
    await run(`
        CREATE TABLE IF NOT EXISTS alumni_experiences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            author_name TEXT NOT NULL,
            company_name TEXT NOT NULL,
            job_role TEXT NOT NULL,
            year_placed TEXT NOT NULL,
            salary_offered TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            rounds_detail TEXT NOT NULL,
            tips TEXT NOT NULL,
            is_anonymous INTEGER NOT NULL DEFAULT 0,
            is_approved INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 9. Alumni Mentorship Queries
    await run(`
        CREATE TABLE IF NOT EXISTS alumni_mentorship_queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            student_name TEXT NOT NULL,
            topic TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT DEFAULT '',
            answered_by TEXT DEFAULT '',
            status TEXT NOT NULL DEFAULT 'Open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            answered_at DATETIME
        )
    `);

    // 10. Saved Offers for Comparison
    await run(`
        CREATE TABLE IF NOT EXISTS saved_offers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            company_name TEXT NOT NULL,
            job_role TEXT NOT NULL,
            ctc REAL NOT NULL,
            base_salary REAL NOT NULL,
            bonus REAL NOT NULL DEFAULT 0,
            location TEXT NOT NULL,
            work_mode TEXT NOT NULL DEFAULT 'On-Site',
            bond_months INTEGER NOT NULL DEFAULT 0,
            benefits TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Seed default data if needed
    const userCount = await get(`SELECT COUNT(*) as count FROM users`);
    if (userCount.count === 0) {
        console.log('Seeding initial data into placement database...');
        const adminHash = bcrypt.hashSync('Admin@123', 10);
        const compHash = bcrypt.hashSync('Company@123', 10);
        const studHash = bcrypt.hashSync('Student@123', 10);

        // 1. Admin
        await run(
            `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
            ['Placement Administrator', 'admin@placement.edu', adminHash, 'ADMIN']
        );

        // 2. Companies
        const tcs = await run(
            `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
            ['TCS', 'tcs@placement.edu', compHash, 'COMPANY']
        );
        const infosys = await run(
            `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
            ['Infosys', 'infosys@placement.edu', compHash, 'COMPANY']
        );
        const accenture = await run(
            `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
            ['Accenture', 'accenture@placement.edu', compHash, 'COMPANY']
        );
        const capgemini = await run(
            `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`,
            ['Capgemini', 'capgemini@placement.edu', compHash, 'COMPANY']
        );

        // 3. Students
        const rahul = await run(
            `INSERT INTO users (name, email, password, role, branch, cgpa, skills, backlogs, batch, interests)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Rahul Patil', 'rahul@student.edu', studHash, 'STUDENT', 'Computer Engineering', 8.4, 'Java, SQL, Spring Boot, Git', 0, '2026', 'Backend Development, Distributed Systems, Cloud']
        );
        const priya = await run(
            `INSERT INTO users (name, email, password, role, branch, cgpa, skills, backlogs, batch, interests)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Priya Shah', 'priya@student.edu', studHash, 'STUDENT', 'Information Technology', 7.9, 'Java, Spring Boot, React, JavaScript', 0, '2026', 'Full Stack Development, Web Applications']
        );
        const amit = await run(
            `INSERT INTO users (name, email, password, role, branch, cgpa, skills, backlogs, batch, interests)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            ['Amit Joshi', 'amit@student.edu', studHash, 'STUDENT', 'AI & ML', 7.3, 'Java, Python, Machine Learning, SQL', 0, '2026', 'Data Science, Machine Learning, AI Engineering']
        );

        // 4. Jobs
        const j1 = await run(
            `INSERT INTO jobs (company_id, company_name, title, cgpa, skills, location, salary, eligible_branches, max_backlogs, deadline, description, role_category, base_salary, bonus, bond_months, work_mode)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [tcs.lastID, 'TCS', 'Software Developer', 7.0, 'Java, SQL, Spring Boot', 'Mumbai', '6.5 LPA', 'Computer Engineering, Information Technology, AI & ML, Electronics', 0, '2026-11-20', 'Designing and implementing scalable enterprise backend services and microservices.', 'Software Engineering', '5.2 LPA', '1.3 LPA', 12, 'Hybrid']
        );
        const j2 = await run(
            `INSERT INTO jobs (company_id, company_name, title, cgpa, skills, location, salary, eligible_branches, max_backlogs, deadline, description, role_category, base_salary, bonus, bond_months, work_mode)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [infosys.lastID, 'Infosys', 'Java Developer', 6.5, 'Java, Spring Boot', 'Pune', '5.5 LPA', 'Computer Engineering, Information Technology, AI & ML', 0, '2026-11-25', 'Developing mission-critical cloud-native services using Java ecosystem.', 'Software Engineering', '4.8 LPA', '0.7 LPA', 12, 'On-Site']
        );
        const j3 = await run(
            `INSERT INTO jobs (company_id, company_name, title, cgpa, skills, location, salary, eligible_branches, max_backlogs, deadline, description, role_category, base_salary, bonus, bond_months, work_mode)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [accenture.lastID, 'Accenture', 'Associate Software Engineer', 7.0, 'Java, Python, Cloud', 'Bangalore', '7.2 LPA', 'Computer Engineering, Information Technology, Electronics', 0, '2026-12-05', 'Building modern enterprise architectures, automated testing pipelines, and client solutions.', 'Full Stack & Cloud', '6.0 LPA', '1.2 LPA', 0, 'Hybrid']
        );
        const j4 = await run(
            `INSERT INTO jobs (company_id, company_name, title, cgpa, skills, location, salary, eligible_branches, max_backlogs, deadline, description, role_category, base_salary, bonus, bond_months, work_mode)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [capgemini.lastID, 'Capgemini', 'Software Engineer', 6.0, 'Java, SQL, HTML, JavaScript', 'Mumbai', '5.0 LPA', 'All Branches', 1, '2026-11-30', 'Software development and integration testing across financial services systems.', 'Software Engineering', '4.5 LPA', '0.5 LPA', 24, 'On-Site']
        );

        // 5. Applications
        const app1 = await run(
            `INSERT INTO applications (job_id, student_id, status, stage, stage_notes) VALUES (?, ?, ?, ?, ?)`,
            [j1.lastID, rahul.lastID, 'Selected', 'Selected', 'Offer released and accepted. Congratulations!']
        );
        const app2 = await run(
            `INSERT INTO applications (job_id, student_id, status, stage, stage_notes) VALUES (?, ?, ?, ?, ?)`,
            [j2.lastID, priya.lastID, 'Shortlisted', 'Technical Round', 'Cleared screening; Technical Interview scheduled.']
        );
        const app3 = await run(
            `INSERT INTO applications (job_id, student_id, status, stage, stage_notes) VALUES (?, ?, ?, ?, ?)`,
            [j4.lastID, amit.lastID, 'Applied', 'Applied', 'Application received and under initial screening.']
        );

        // Seed Timelines
        await run(`INSERT INTO application_timeline (application_id, stage, title, notes) VALUES (?, ?, ?, ?)`,
            [app1.lastID, 'Applied', 'Application Submitted', 'Submitted resume and portfolio']);
        await run(`INSERT INTO application_timeline (application_id, stage, title, notes) VALUES (?, ?, ?, ?)`,
            [app1.lastID, 'Shortlisted', 'Shortlisted for Technical Assessment', 'Cleared online screening criteria']);
        await run(`INSERT INTO application_timeline (application_id, stage, title, notes) VALUES (?, ?, ?, ?)`,
            [app1.lastID, 'Technical Round', 'Technical Interview Cleared', 'Evaluated on Core Java, Spring Boot, and System Design']);
        await run(`INSERT INTO application_timeline (application_id, stage, title, notes) VALUES (?, ?, ?, ?)`,
            [app1.lastID, 'Selected', 'Offer Extended', 'Selected for Software Developer role (6.5 LPA)']);

        await run(`INSERT INTO application_timeline (application_id, stage, title, notes) VALUES (?, ?, ?, ?)`,
            [app2.lastID, 'Applied', 'Application Submitted', 'Resume submitted for Java Developer']);
        await run(`INSERT INTO application_timeline (application_id, stage, title, notes) VALUES (?, ?, ?, ?)`,
            [app2.lastID, 'Technical Round', 'Technical Assessment Scheduled', 'Invited to Technical Round on 14th Nov']);

        await run(`INSERT INTO application_timeline (application_id, stage, title, notes) VALUES (?, ?, ?, ?)`,
            [app3.lastID, 'Applied', 'Application Submitted', 'Application under review']);

        // Seed Notifications
        await run(`INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
            [rahul.lastID, '🎉 Selection Offer Received', 'Congratulations! TCS has confirmed your selection for Software Developer (6.5 LPA).', 'status', 'student-dashboard.html']);
        await run(`INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
            [priya.lastID, '📅 Interview Round Scheduled', 'Infosys has shortlisted your profile for the Technical Interview round.', 'status', 'student-dashboard.html']);
        await run(`INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
            [amit.lastID, '⏰ Drive Registration Reminder', 'Accenture Associate Software Engineer drive deadline is approaching on Dec 5.', 'reminder', 'jobs.html']);

        console.log('Database seeded with base users, jobs, applications, and timeline.');
    }

    // Ensure existing applications have timeline entries
    const timelineCount = await get(`SELECT COUNT(*) as count FROM application_timeline`);
    if (timelineCount.count === 0) {
        const existingApps = await query(`SELECT id, status FROM applications`);
        for (const app of existingApps) {
            await run(`INSERT INTO application_timeline (application_id, stage, title, notes) VALUES (?, 'Applied', 'Application Submitted', 'Submitted application via portal')`, [app.id]);
            if (app.status === 'Shortlisted' || app.status === 'Selected') {
                await run(`INSERT INTO application_timeline (application_id, stage, title, notes) VALUES (?, 'Shortlisted', 'Profile Shortlisted', 'Cleared initial resume and eligibility screening')`, [app.id]);
                await run(`INSERT INTO application_timeline (application_id, stage, title, notes) VALUES (?, 'Technical Round', 'Technical Assessment Completed', 'Cleared online coding assessment and technical interview')`, [app.id]);
            }
            if (app.status === 'Selected') {
                await run(`INSERT INTO application_timeline (application_id, stage, title, notes) VALUES (?, 'Selected', 'Offer Letter Released', 'Selected for final placement offer! Congratulations!')`, [app.id]);
            }
        }
    }

    // Ensure rich notifications exist covering all 4 categories (new drives, deadlines, shortlisting, interviews)
    const notifCount = await get(`SELECT COUNT(*) as count FROM notifications`);
    if (notifCount.count < 8) {
        const students = await query(`SELECT id, name FROM users WHERE role = 'STUDENT'`);
        for (const s of students) {
            await run(`INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
                [s.id, '📢 New Campus Drive: Microsoft Azure', 'Microsoft has announced campus recruitment for Software Engineer (18.0 LPA). Check eligibility and apply before Nov 15.', 'drive', 'jobs.html']);
            await run(`INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
                [s.id, '⏳ Application Deadline Alert: TCS', 'TCS Software Developer drive registrations close in 48 hours. Submit your application now.', 'deadline', 'jobs.html']);
            await run(`INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
                [s.id, '🎯 Profile Shortlisted: Infosys Specialist Programmer', 'Congratulations! Your profile has been shortlisted for the next technical assessment round.', 'shortlist', 'student-dashboard.html']);
            await run(`INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
                [s.id, '🎤 Interview Scheduled: Capgemini Technical Round', 'Your technical interview is scheduled for Nov 18, 2026 at 10:30 AM in Lab 3. Review preparation guides.', 'interview', 'student-dashboard.html']);
        }
    }

    // Seed Aptitude Questions if empty
    const aptCount = await get(`SELECT COUNT(*) as count FROM prep_aptitude_questions`);
    if (aptCount.count === 0) {
        console.log('Seeding Aptitude Questions...');
        const questions = [
            // Quantitative
            {
                category: 'Quantitative',
                question: 'A can do a piece of work in 12 days and B can do it in 18 days. If they work together, how many days will they take to complete the work?',
                options: JSON.stringify(['7.2 days', '6.0 days', '8.4 days', '9.0 days']),
                correct_index: 0,
                explanation: 'A’s 1-day work = 1/12. B’s 1-day work = 1/18. Combined 1-day work = 1/12 + 1/18 = (3+2)/36 = 5/36. Total days = 36/5 = 7.2 days.'
            },
            {
                category: 'Quantitative',
                question: 'A train running at a speed of 72 km/h crosses a 200m long platform in 22 seconds. What is the length of the train?',
                options: JSON.stringify(['220 meters', '240 meters', '250 meters', '280 meters']),
                correct_index: 1,
                explanation: 'Speed = 72 * (5/18) = 20 m/s. Total distance in 22s = 20 * 22 = 440m. Length of train = 440 - 200 = 240 meters.'
            },
            {
                category: 'Quantitative',
                question: 'A shopkeeper marks an item 25% above cost price and allows a discount of 10%. What is his profit percentage?',
                options: JSON.stringify(['12.5%', '15.0%', '10.0%', '14.2%']),
                correct_index: 0,
                explanation: 'Let CP = 100. MP = 125. SP = 125 * 0.90 = 112.5. Profit = 112.5 - 100 = 12.5%.'
            },
            {
                category: 'Quantitative',
                question: 'In how many different ways can the letters of the word "ENGINE" be arranged?',
                options: JSON.stringify(['720', '360', '180', '120']),
                correct_index: 2,
                explanation: 'ENGINE has 6 letters: E appears 2 times, N appears 2 times, G appears 1 time, I appears 1 time. Total arrangements = 6! / (2! * 2!) = 720 / 4 = 180.'
            },
            // Logical
            {
                category: 'Logical',
                question: 'Look at this series: 2, 6, 12, 20, 30, ... What number comes next?',
                options: JSON.stringify(['40', '42', '44', '48']),
                correct_index: 1,
                explanation: 'Pattern: 1*2=2, 2*3=6, 3*4=12, 4*5=20, 5*6=30, next is 6*7 = 42.'
            },
            {
                category: 'Logical',
                question: 'Statements: All computers are machines. Some machines are smart. Conclusions: I. Some computers are smart. II. Some machines are computers.',
                options: JSON.stringify(['Only conclusion I follows', 'Only conclusion II follows', 'Both I and II follow', 'Neither I nor II follows']),
                correct_index: 1,
                explanation: 'Since all computers are machines, some machines are definitely computers (Conclusion II). There is no guaranteed overlap between computers and smart machines.'
            },
            {
                category: 'Logical',
                question: 'Pointing to a photograph, Rohit said, "She is the daughter of my grandfather\'s only son." How is the girl related to Rohit?',
                options: JSON.stringify(['Sister', 'Mother', 'Cousin', 'Aunt']),
                correct_index: 0,
                explanation: 'Rohit’s grandfather’s only son is Rohit’s father. The daughter of Rohit’s father is Rohit’s sister.'
            },
            {
                category: 'Logical',
                question: 'If "CLOUD" is coded as "ENQWF", what will "RAIN" be coded as in the same code?',
                options: JSON.stringify(['TCKP', 'SCJP', 'TDLQ', 'TBLQ']),
                correct_index: 0,
                explanation: 'Each letter is shifted by +2: R(+2)->T, A(+2)->C, I(+2)->K, N(+2)->P => TCKP.'
            },
            // Verbal
            {
                category: 'Verbal',
                question: 'Choose the word that is most nearly OPPOSITE in meaning to "CANDID":',
                options: JSON.stringify(['Deceitful', 'Outspoken', 'Frank', 'Genuine']),
                correct_index: 0,
                explanation: 'Candid means truthful and straightforward. Deceitful is the direct antonym.'
            },
            {
                category: 'Verbal',
                question: 'Identify the error: "Neither of the two candidates (A) / were selected (B) / for the executive role (C) / No error (D)"',
                options: JSON.stringify(['Part A', 'Part B', 'Part C', 'Part D']),
                correct_index: 1,
                explanation: '"Neither" takes a singular verb. The correct phrasing is "was selected" instead of "were selected".'
            },
            {
                category: 'Verbal',
                question: 'Select the synonym for "METICULOUS":',
                options: JSON.stringify(['Careless', 'Diligent', 'Hasty', 'Vague']),
                correct_index: 1,
                explanation: 'Meticulous means showing great attention to detail; very careful and precise (Diligent).'
            },
            {
                category: 'Verbal',
                question: 'Fill in the blank: "The committee has submitted its report _____ the board for review."',
                options: JSON.stringify(['to', 'for', 'with', 'towards']),
                correct_index: 0,
                explanation: '"Submit to" is the standard prepositional phrase used when submitting documentation to an authority.'
            }
        ];

        for (const q of questions) {
            await run(
                `INSERT INTO prep_aptitude_questions (category, question, options, correct_index, explanation)
                 VALUES (?, ?, ?, ?, ?)`,
                [q.category, q.question, q.options, q.correct_index, q.explanation]
            );
        }
    }

    // Seed Coding Challenges if empty
    const codeCount = await get(`SELECT COUNT(*) as count FROM prep_coding_challenges`);
    if (codeCount.count === 0) {
        console.log('Seeding Coding Challenges...');
        const challenges = [
            {
                title: 'Two Sum',
                difficulty: 'Easy',
                category: 'Arrays & Hashing',
                description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
                starter_code: `function twoSum(nums, target) {
    // Write your solution here
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
                test_cases: JSON.stringify([
                    { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
                    { input: [[3, 2, 4], 6], expected: [1, 2] },
                    { input: [[3, 3], 6], expected: [0, 1] }
                ]),
                solution_notes: 'Optimal Approach: Single pass hash map with O(n) time and O(n) space complexity.'
            },
            {
                title: 'Valid Parentheses',
                difficulty: 'Easy',
                category: 'Stacks',
                description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets in the correct order.',
                starter_code: `function isValid(s) {
    // Write your solution here
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const char of s) {
        if (char === '(' || char === '{' || char === '[') {
            stack.push(char);
        } else {
            if (stack.pop() !== map[char]) return false;
        }
    }
    return stack.length === 0;
}`,
                test_cases: JSON.stringify([
                    { input: ['()'], expected: true },
                    { input: ['()[]{}'], expected: true },
                    { input: ['(]'], expected: false },
                    { input: ['([)]'], expected: false }
                ]),
                solution_notes: 'Use a stack to keep track of opening brackets and match them against closing brackets in O(n) time.'
            },
            {
                title: 'Reverse String In-Place',
                difficulty: 'Easy',
                category: 'Two Pointers',
                description: 'Write a function that reverses a string or array of characters in-place. The input string is given as an array of characters.',
                starter_code: `function reverseString(s) {
    let left = 0, right = s.length - 1;
    while (left < right) {
        const temp = s[left];
        s[left] = s[right];
        s[right] = temp;
        left++;
        right--;
    }
    return s;
}`,
                test_cases: JSON.stringify([
                    { input: [['h', 'e', 'l', 'l', 'o']], expected: ['o', 'l', 'l', 'e', 'h'] },
                    { input: [['H', 'a', 'n', 'n', 'a', 'h']], expected: ['h', 'a', 'n', 'n', 'a', 'H'] }
                ]),
                solution_notes: 'Standard two-pointer technique swapping elements from opposite ends in O(n) time and O(1) space.'
            },
            {
                title: 'Best Time to Buy and Sell Stock',
                difficulty: 'Medium',
                category: 'Dynamic Programming',
                description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell. Return the maximum profit you can achieve.',
                starter_code: `function maxProfit(prices) {
    let minPrice = Infinity;
    let maxProfit = 0;
    for (let price of prices) {
        if (price < minPrice) {
            minPrice = price;
        } else if (price - minPrice > maxProfit) {
            maxProfit = price - minPrice;
        }
    }
    return maxProfit;
}`,
                test_cases: JSON.stringify([
                    { input: [[7, 1, 5, 3, 6, 4]], expected: 5 },
                    { input: [[7, 6, 4, 3, 1]], expected: 0 },
                    { input: [[2, 4, 1]], expected: 2 }
                ]),
                solution_notes: 'Keep track of the minimum price observed so far and compute profit at every step in O(n) time.'
            }
        ];

        for (const c of challenges) {
            await run(
                `INSERT INTO prep_coding_challenges (title, difficulty, category, description, starter_code, test_cases, solution_notes)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [c.title, c.difficulty, c.category, c.description, c.starter_code, c.test_cases, c.solution_notes]
            );
        }
    }

    // Seed Company Guides if empty
    const guideCount = await get(`SELECT COUNT(*) as count FROM company_guides`);
    if (guideCount.count === 0) {
        console.log('Seeding Company Guides...');
        const guides = [
            {
                company_name: 'TCS',
                industry: 'IT Services & Consulting',
                overview: 'Tata Consultancy Services (TCS) recruits heavily through TCS National Qualifier Test (NQT) offering Ninja (3.6 LPA) and Digital (7.0+ LPA) profiles.',
                pattern_overview: 'Round 1: NQT Online Assessment (Numerical Ability, Reasoning, Verbal, Advanced Coding). Round 2: Technical Interview. Round 3: Managerial & HR Interview.',
                rounds_info: JSON.stringify([
                    { round: 1, name: 'TCS NQT Assessment', duration: '180 mins', focus: 'Cognitive Skills & 2 Advanced Coding questions' },
                    { round: 2, name: 'Technical Interview', duration: '45 mins', focus: 'Core Java/C++, OOPS, DBMS, SQL, and Project Discussion' },
                    { round: 3, name: 'Managerial & HR', duration: '20 mins', focus: 'Situational judgment, relocation willingness, communication' }
                ]),
                common_questions: JSON.stringify([
                    'Explain OOP principles with real-life examples.',
                    'Difference between abstract class and interface in Java.',
                    'Write an SQL query to find the second highest salary.',
                    'Explain normal forms (1NF, 2NF, 3NF).',
                    'Walk me through the architecture of your final year project.'
                ]),
                prep_tips: 'Focus heavily on TCS NQT coding section. Clean code and passing all hidden test cases elevates you to the Digital profile band.'
            },
            {
                company_name: 'Infosys',
                industry: 'Information Technology',
                overview: 'Infosys hires across Systems Engineer (SE - 3.6 LPA), Digital Specialist Engineer (DSE - 6.25 LPA), and Specialist Programmer (SP - 9.5 LPA).',
                pattern_overview: 'Assessment consists of Pseudocode solving, Mathematical ability, Verbal analysis, and 3 Competitive Programming challenges (for DSE/SP).',
                rounds_info: JSON.stringify([
                    { round: 1, name: 'Online Test (InfyTQ/HackWithInfy)', duration: '150 mins', focus: 'Pseudocode, Data Structures, Algorithms' },
                    { round: 2, name: 'Technical Interview', duration: '40 mins', focus: 'DSA implementation, debugging, frameworks (Spring Boot/React)' },
                    { round: 3, name: 'HR Interview', duration: '15 mins', focus: 'Company values, adaptability, career goals' }
                ]),
                common_questions: JSON.stringify([
                    'How does HashMap handle collisions internally in Java?',
                    'Explain time and space complexity of Merge Sort vs Quick Sort.',
                    'Difference between Primary Key and Unique Key.',
                    'What are ACID properties in database transactions?',
                    'How do you optimize an API that has a high response time?'
                ]),
                prep_tips: 'Practice pseudocode tracing and dynamic programming. For Specialist Programmer roles, master Tree, Graph, and DP algorithms on LeetCode.'
            },
            {
                company_name: 'Accenture',
                industry: 'Strategy & Technology Consulting',
                overview: 'Accenture hires for Associate Software Engineer (4.5 LPA) and Advanced Associate Software Engineer (6.5 - 7.5 LPA).',
                pattern_overview: 'Cognitive & Technical Assessment (eliminatory) followed by Coding Round and a communication/video interview.',
                rounds_info: JSON.stringify([
                    { round: 1, name: 'Cognitive & Technical Assessment', duration: '90 mins', focus: 'Critical thinking, MS Office, Cloud, Networking fundamentals' },
                    { round: 2, name: 'Hands-on Coding Round', duration: '45 mins', focus: '2 coding challenges in C++, Java, or Python' },
                    { round: 3, name: 'Communication & Technical Round', duration: '30 mins', focus: 'Verbal communication, pronunciation, project walkthrough' }
                ]),
                common_questions: JSON.stringify([
                    'What is Cloud Computing and what are SaaS, PaaS, IaaS?',
                    'Explain deadlock conditions and prevention techniques in OS.',
                    'Write a program to check if two strings are anagrams.',
                    'Explain the difference between TCP and UDP protocols.',
                    'Describe how you worked in a cross-functional team.'
                ]),
                prep_tips: 'Accenture places strong weight on verbal fluency and fundamental computer science subjects (OS, CN, DBMS). Practice speaking clearly in the automated communication round.'
            },
            {
                company_name: 'Capgemini',
                industry: 'Consulting, Digital Transformation',
                overview: 'Capgemini offers Analyst and Senior Analyst roles with a game-based cognitive assessment model.',
                pattern_overview: 'Game-based Aptitude + Pseudocode + English Test + Spoken English Round followed by Technical & HR interview.',
                rounds_info: JSON.stringify([
                    { round: 1, name: 'Game-Based Cognitive Test', duration: '30 mins', focus: 'Pattern recognition, memory, speed calculation games' },
                    { round: 2, name: 'Pseudocode & Behavioral', duration: '40 mins', focus: 'C/C++ pseudocode snippets, looping, condition evaluation' },
                    { round: 3, name: 'Technical & HR Discussion', duration: '35 mins', focus: 'Core concepts, project explanation, cultural fit' }
                ]),
                common_questions: JSON.stringify([
                    'What are pointers and references in C/C++?',
                    'Explain the difference between synchronous and asynchronous calls.',
                    'What is a REST API and what are common HTTP status codes?',
                    'How do you manage stress during strict project deadlines?',
                    'What are your strengths and areas of improvement?'
                ]),
                prep_tips: 'Practice game-based puzzles and practice dry-running nested loops in pseudocode questions.'
            }
        ];

        for (const g of guides) {
            await run(
                `INSERT INTO company_guides (company_name, industry, overview, pattern_overview, rounds_info, common_questions, prep_tips)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [g.company_name, g.industry, g.overview, g.pattern_overview, g.rounds_info, g.common_questions, g.prep_tips]
            );
        }
    }

    // Seed Alumni Experiences if empty
    const expCount = await get(`SELECT COUNT(*) as count FROM alumni_experiences`);
    if (expCount.count === 0) {
        console.log('Seeding Alumni Experiences...');
        await run(
            `INSERT INTO alumni_experiences (author_name, company_name, job_role, year_placed, salary_offered, difficulty, rounds_detail, tips, is_anonymous, is_approved)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Rahul Patil',
                'TCS',
                'Software Developer (Digital)',
                '2025',
                '6.5 LPA',
                'Medium',
                'Round 1: TCS NQT with 2 coding problems (string manipulation and 2D matrix DP). Round 2: Technical Interview focused on Spring Boot REST APIs, Hibernate vs JDBC, and SQL window functions. Round 3: HR round discussing willingness to relocate to Pune/Mumbai.',
                'Master SQL queries and do at least 100 LeetCode easy/medium questions. Be ready to explain your projects line-by-line without hesitation.',
                0,
                1 // Approved
            ]
        );

        await run(
            `INSERT INTO alumni_experiences (author_name, company_name, job_role, year_placed, salary_offered, difficulty, rounds_detail, tips, is_anonymous, is_approved)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Sneha Kulkarni',
                'Infosys',
                'Specialist Programmer',
                '2025',
                '9.5 LPA',
                'Hard',
                'Cleared HackWithInfy grand finale. Interview had 2 live coding problems on graph traversal (Dijkstra) and Trie prefix matching. Panel asked about microservices resilience and Docker containerization.',
                'Do not ignore graphs and trees. Make sure you build a full-stack project deployed on AWS or Render to stand out during the interview.',
                0,
                1 // Approved
            ]
        );

        await run(
            `INSERT INTO alumni_experiences (author_name, company_name, job_role, year_placed, salary_offered, difficulty, rounds_detail, tips, is_anonymous, is_approved)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                'Anonymous Alumni',
                'Accenture',
                'Associate Software Engineer',
                '2025',
                '7.2 LPA',
                'Medium',
                'Round 1 had cognitive, pseudocode, and 2 coding questions (sliding window and array rotation). Communication test was AI-graded. Interviewer was very friendly and asked about OOP principles and Agile methodology.',
                'Wear formal attire, maintain good eye contact in the video interview, and explain your thought process out loud while writing code.',
                1, // Anonymous
                0 // Pending moderation for Admin to approve!
            ]
        );
    }

    // Seed Mentorship Queries if empty
    const mentorCount = await get(`SELECT COUNT(*) as count FROM alumni_mentorship_queries`);
    if (mentorCount.count === 0) {
        console.log('Seeding Mentorship Queries...');
        await run(
            `INSERT INTO alumni_mentorship_queries (student_id, student_name, topic, question, answer, answered_by, status, answered_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [
                3, // Amit Joshi
                'Amit Joshi',
                'Resume & Core Projects',
                'How should I showcase my Machine Learning projects when applying for standard Software Engineering roles?',
                'Highlight the software engineering aspects of your ML projects: explain how you packaged the model into a REST API using Flask/FastAPI, how data was ingested from SQL databases, and include performance metrics (e.g. inference latency, throughput).',
                'Rahul Patil (Alumni - TCS Digital)',
                'Answered'
            ]
        );
        await run(
            `INSERT INTO alumni_mentorship_queries (student_id, student_name, topic, question, status)
             VALUES (?, ?, ?, ?, ?)`,
            [
                2, // Priya Shah
                'Priya Shah',
                'Preparation Strategy',
                'How many months of aptitude practice is typically required before campus drives start in August?',
                'Open'
            ]
        );
    }

    // Seed Test Attempts & Mock Interviews for Rahul & Priya for realistic readiness analytics
    const testCount = await get(`SELECT COUNT(*) as count FROM prep_test_attempts`);
    if (testCount.count === 0) {
        await run(`INSERT INTO prep_test_attempts (student_id, category, score, total_questions, percentage) VALUES (1, 'Quantitative', 4, 4, 100.0)`);
        await run(`INSERT INTO prep_test_attempts (student_id, category, score, total_questions, percentage) VALUES (1, 'Logical', 3, 4, 75.0)`);
        await run(`INSERT INTO prep_coding_submissions (student_id, challenge_id, code, status, test_results) VALUES (1, 1, 'function twoSum...', 'Passed', 'All 3 test cases passed')`);
        await run(`INSERT INTO prep_mock_interviews (student_id, role_type, transcript, score, technical_rating, communication_rating, feedback)
            VALUES (1, 'Software Engineer', '[]', 88, 9.0, 8.5, 'Strong command of data structures and clean explanations.')`);
    }

    // Ensure Placement Head (TPO) exists
    const tpoExists = await get("SELECT id FROM users WHERE email = 'tpo@placement.edu'");
    if (!tpoExists) {
        const tpoHash = bcrypt.hashSync('Head@123', 10);
        await run(
            `INSERT INTO users (name, email, password, role, department, phone, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Dr. Rajesh Sharma (Placement Head)', 'tpo@placement.edu', tpoHash, 'PLACEMENT_HEAD', 'Training & Placement Cell', '+91 98765 00001', 'Active']
        );
        console.log('Seeded Placement Head user: tpo@placement.edu');
    }

    // Ensure Placement Coordinators exist
    let coordId = 1;
    const coordExists = await get("SELECT id FROM users WHERE email = 'coordinator@placement.edu'");
    if (!coordExists) {
        const coordHash = bcrypt.hashSync('Coord@123', 10);
        const coordRes = await run(
            `INSERT INTO users (name, email, password, role, department, phone, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Prof. Sneha Deshmukh (Placement Coordinator)', 'coordinator@placement.edu', coordHash, 'COORDINATOR', 'Computer Engineering', '+91 98765 11111', 'Active']
        );
        coordId = coordRes.lastID;
        console.log('Seeded Placement Coordinator user: coordinator@placement.edu');
    } else {
        coordId = coordExists.id;
    }

    const coord2Exists = await get("SELECT id FROM users WHERE email = 'coord.it@placement.edu'");
    if (!coord2Exists) {
        const coordHash = bcrypt.hashSync('Coord@123', 10);
        await run(
            `INSERT INTO users (name, email, password, role, department, phone, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ['Prof. Amit Verma (Placement Coordinator)', 'coord.it@placement.edu', coordHash, 'COORDINATOR', 'Information Technology', '+91 98765 22222', 'Active']
        );
        console.log('Seeded Placement Coordinator user: coord.it@placement.edu');
    }

    // Assign coordinators to existing jobs if unassigned
    await run(
        `UPDATE jobs SET coordinator_id = ?, coordinator_name = 'Prof. Sneha Deshmukh', approval_status = 'Approved', industry = 'Information Technology' WHERE coordinator_id IS NULL OR coordinator_id = 0`,
        [coordId]
    );

    // Seed Campus Announcements
    const annCount = await get("SELECT COUNT(*) as count FROM announcements");
    if (annCount.count === 0) {
        await run(
            `INSERT INTO announcements (author_name, author_role, title, content, target_role, priority)
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['Dr. Rajesh Sharma (Placement Head)', 'PLACEMENT_HEAD', '🎓 Academic Session 2026 Campus Recruitment Kickoff', 'Campus recruitment drives have commenced for the 2026 graduating batch. Verify your CGPA cutoffs, active backlogs, and updated resume in your student portal before registering.', 'ALL', 'HIGH']
        );
        await run(
            `INSERT INTO announcements (author_name, author_role, title, content, target_role, priority)
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['Prof. Sneha Deshmukh (Placement Coordinator)', 'COORDINATOR', '📋 TCS Software Developer Online Assessment Venue', 'The online coding round for shortlisted TCS candidates is scheduled for Nov 22, 2026 at 09:30 AM in Computer Labs 1 & 2. College ID and registration slip are mandatory.', 'STUDENT', 'URGENT']
        );
        await run(
            `INSERT INTO announcements (author_name, author_role, title, content, target_role, priority)
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['Dr. Rajesh Sharma (Placement Head)', 'PLACEMENT_HEAD', '📌 Placement Coordinator Guidelines & Drive Verification Notice', 'Coordinators are requested to submit verified visiting company CTC breakdowns and eligibility criteria matrices for administrative review at least 5 days prior to on-campus arrival.', 'COORDINATOR', 'NORMAL']
        );
    }

    // Seed Institutional Audit Trail
    const auditCount = await get("SELECT COUNT(*) as count FROM audit_logs");
    if (auditCount.count === 0) {
        await run(
            `INSERT INTO audit_logs (user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['Dr. Rajesh Sharma', 'PLACEMENT_HEAD', 'APPROVE_DRIVE', 'DRIVE', 1, 'Approved TCS Software Developer recruitment drive with 6.5 LPA CTC.']
        );
        await run(
            `INSERT INTO audit_logs (user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['Prof. Sneha Deshmukh', 'COORDINATOR', 'UPDATE_DRIVE', 'DRIVE', 2, 'Updated Infosys eligibility criteria and technical interview schedule.']
        );
        await run(
            `INSERT INTO audit_logs (user_name, user_role, action, target_type, target_id, details)
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['Dr. Rajesh Sharma', 'PLACEMENT_HEAD', 'ASSIGN_COORDINATOR', 'DRIVE', 1, 'Assigned Prof. Sneha Deshmukh as primary coordinator for TCS drive.']
        );
    }

    console.log('Database schema and rich test data initialized successfully.');
}

module.exports = {
    db,
    query,
    get,
    run,
    initDatabase
};
