const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load initial seed data
let seedPath = path.join(__dirname, '..', 'data', 'seed-data.json');
let initialData = {};
try {
    if (fs.existsSync(seedPath)) {
        initialData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    }
} catch (e) {
    console.warn('Could not read seed-data.json, starting with clean memory store:', e.message);
}

// Clone data store so mutations don't alter the source file unexpectedly
const tables = {
    users: (initialData.users || []).map(u => ({ ...u })),
    jobs: (initialData.jobs || []).map(j => ({ ...j })),
    applications: (initialData.applications || []).map(a => ({ ...a })),
    application_timeline: (initialData.application_timeline || []).map(t => ({ ...t })),
    notifications: (initialData.notifications || []).map(n => ({ ...n })),
    prep_aptitude_questions: (initialData.prep_aptitude_questions || []).map(q => ({ ...q })),
    announcements: (initialData.announcements || []).map(an => ({ ...an })),
    audit_logs: (initialData.audit_logs || []).map(l => ({ ...l })),
    interview_experiences: (initialData.interview_experiences || []).map(x => ({ ...x })),
    career_milestones: (initialData.career_milestones || []).map(m => ({ ...m })),
    alumni_mentors: (initialData.alumni_mentors || []).map(al => ({ ...al }))
};

// Auto-increment trackers
const maxIds = {};
for (const [name, rows] of Object.entries(tables)) {
    maxIds[name] = rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0);
}

function getNextId(tableName) {
    if (!maxIds[tableName]) maxIds[tableName] = 0;
    maxIds[tableName]++;
    return maxIds[tableName];
}

// Helper: Normalize query string
function cleanSql(sql) {
    return sql.replace(/\s+/g, ' ').trim();
}

// Helper: Extract table name from simple SQL
function extractTableName(sql) {
    const fromMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (fromMatch) return fromMatch[1].toLowerCase();
    const intoMatch = sql.match(/INTO\s+([a-zA-Z0-9_]+)/i);
    if (intoMatch) return intoMatch[1].toLowerCase();
    const updateMatch = sql.match(/UPDATE\s+([a-zA-Z0-9_]+)/i);
    if (updateMatch) return updateMatch[1].toLowerCase();
    const deleteMatch = sql.match(/FROM\s+([a-zA-Z0-9_]+)/i);
    if (deleteMatch) return deleteMatch[1].toLowerCase();
    return null;
}

// In-Memory Query Engine
async function query(sql, params = []) {
    const cSql = cleanSql(sql);
    const upper = cSql.toUpperCase();

    // PRAGMA or DDL statements - no-op success
    if (upper.startsWith('PRAGMA') || upper.startsWith('CREATE') || upper.startsWith('ALTER') || upper.startsWith('DROP')) {
        return [];
    }

    // 1. SELECT queries
    if (upper.startsWith('SELECT')) {
        // Table schema check via sqlite_master
        if (cSql.includes('sqlite_master')) {
            return [{ sql: 'CREATE TABLE users (id INTEGER PRIMARY KEY, role TEXT)' }];
        }

        // Table info check
        if (cSql.includes('PRAGMA table_info')) {
            return [];
        }

        const tableName = extractTableName(cSql);
        const sourceTable = tables[tableName] || [];

        // Handle COUNT queries like SELECT COUNT(*) as count FROM <table>
        if (cSql.match(/SELECT\s+COUNT\(\*\)\s+as\s+count\s+FROM/i)) {
            // Check for simple WHERE filters
            let filtered = sourceTable;
            if (cSql.match(/WHERE\s+user_id\s*=\s*\?/i) && params.length > 0) {
                filtered = sourceTable.filter(r => r.user_id == params[0]);
            }
            return [{ count: filtered.length }];
        }

        // Handle Jobs query with JOIN users (visiting companies, all jobs)
        if (tableName === 'jobs') {
            let results = sourceTable.map(job => {
                const user = (tables.users || []).find(u => u.id == job.company_id) || {};
                const appCount = (tables.applications || []).filter(a => a.job_id == job.id).length;
                return {
                    ...job,
                    company_logo: user.company_logo || job.logo || '',
                    company_website: user.company_website || job.website || '',
                    company_description: user.company_description || job.description || '',
                    applicant_count: appCount
                };
            });

            // Access control / status filters
            let paramIdx = 0;

            // Search filtering
            if (cSql.includes('LIKE ?')) {
                const term = (params[paramIdx] || '').replace(/%/g, '').toLowerCase();
                // Advance paramIdx for 5 LIKE params
                paramIdx += 5;
                if (term) {
                    results = results.filter(j =>
                        (j.title || '').toLowerCase().includes(term) ||
                        (j.company_name || '').toLowerCase().includes(term) ||
                        (j.skills || '').toLowerCase().includes(term) ||
                        (j.location || '').toLowerCase().includes(term) ||
                        (j.role_category || '').toLowerCase().includes(term)
                    );
                }
            }

            // Recruitment status filter
            if (cSql.includes('LOWER(j.recruitment_status) = ?') || cSql.includes('LOWER(recruitment_status) = ?')) {
                const stat = (params[paramIdx] || '').toLowerCase();
                paramIdx++;
                if (stat && stat !== 'all') {
                    results = results.filter(j => (j.recruitment_status || '').toLowerCase() === stat);
                }
            }

            // Public visibility: approval_status = 'Approved' and is_archived = 0
            if (cSql.includes("approval_status = 'Approved'") || cSql.includes("j.approval_status = 'Approved'")) {
                results = results.filter(j => (j.approval_status === 'Approved' || !j.approval_status) && (!j.is_archived || j.is_archived == 0));
            }

            // Company id filter
            if (cSql.includes('company_id = ?') || cSql.includes('j.company_id = ?')) {
                const compId = params[paramIdx];
                if (compId !== undefined) {
                    results = results.filter(j => j.company_id == compId);
                    paramIdx++;
                }
            }

            // Specific job id filter
            if (cSql.includes('j.id = ?') || cSql.includes('jobs.id = ?') || cSql.includes('WHERE id = ?')) {
                const jId = params[paramIdx];
                if (jId !== undefined) {
                    results = results.filter(j => j.id == jId);
                    paramIdx++;
                }
            }

            // Ordering
            results.sort((a, b) => (b.id || 0) - (a.id || 0));

            return results;
        }

        // Generic table querying with common filters
        let results = [...sourceTable];

        if (cSql.includes('WHERE')) {
            let pIdx = 0;

            if (cSql.includes('email = ?') || cSql.includes('EMAIL = ?')) {
                const emailParam = (params[pIdx] || '').toLowerCase().trim();
                results = results.filter(r => (r.email || '').toLowerCase().trim() === emailParam);
                pIdx++;
            }

            if (cSql.includes('id = ?')) {
                const idParam = params[pIdx];
                results = results.filter(r => r.id == idParam);
                pIdx++;
            }

            if (cSql.includes('student_id = ?')) {
                const sParam = params[pIdx];
                results = results.filter(r => r.student_id == sParam);
                pIdx++;
            }

            if (cSql.includes('job_id = ?')) {
                const jParam = params[pIdx];
                results = results.filter(r => r.job_id == jParam);
                pIdx++;
            }

            if (cSql.includes('user_id = ?')) {
                const uParam = params[pIdx];
                results = results.filter(r => r.user_id == uParam);
                pIdx++;
            }

            if (cSql.includes('role = ?')) {
                const rParam = params[pIdx];
                results = results.filter(r => r.role === rParam);
                pIdx++;
            }

            if (cSql.includes('application_id = ?')) {
                const apParam = params[pIdx];
                results = results.filter(r => r.application_id == apParam);
                pIdx++;
            }
        }

        // For applications query, enrich with job details if JOIN is present
        if (tableName === 'applications' && (cSql.includes('JOIN jobs') || cSql.includes('jobs j'))) {
            results = results.map(app => {
                const job = (tables.jobs || []).find(j => j.id == app.job_id) || {};
                const student = (tables.users || []).find(u => u.id == app.student_id) || {};
                return {
                    ...app,
                    title: job.title || '',
                    company_name: job.company_name || '',
                    location: job.location || '',
                    salary: job.salary || '',
                    student_name: student.name || '',
                    student_email: student.email || '',
                    branch: student.branch || '',
                    cgpa: student.cgpa || 0
                };
            });
        }

        // Ordering (default by id DESC)
        if (cSql.includes('ORDER BY')) {
            results.sort((a, b) => (b.id || 0) - (a.id || 0));
        }

        // Limit
        if (cSql.includes('LIMIT')) {
            const limitMatch = cSql.match(/LIMIT\s+(\d+|\?)/i);
            if (limitMatch) {
                const limit = limitMatch[1] === '?' ? Number(params[params.length - 1]) : Number(limitMatch[1]);
                if (!isNaN(limit)) {
                    results = results.slice(0, limit);
                }
            }
        }

        return results;
    }

    // 2. INSERT queries
    if (upper.startsWith('INSERT')) {
        const tableName = extractTableName(cSql);
        if (!tables[tableName]) tables[tableName] = [];

        // Extract column names
        const colMatch = cSql.match(/\(([^)]+)\)\s+VALUES/i);
        const newRecord = { id: getNextId(tableName), created_at: new Date().toISOString() };

        if (colMatch) {
            const cols = colMatch[1].split(',').map(c => c.trim());
            cols.forEach((col, idx) => {
                newRecord[col] = params[idx] !== undefined ? params[idx] : null;
            });
        }

        tables[tableName].push(newRecord);
        return { lastID: newRecord.id, changes: 1 };
    }

    // 3. UPDATE queries
    if (upper.startsWith('UPDATE')) {
        const tableName = extractTableName(cSql);
        const table = tables[tableName] || [];

        // Determine target by WHERE clause
        let targetId = null;
        let targetEmail = null;

        if (cSql.includes('WHERE id = ?')) {
            targetId = params[params.length - 1];
        } else if (cSql.includes('WHERE email = ?')) {
            targetEmail = (params[params.length - 1] || '').toLowerCase().trim();
        }

        // Parse SET clauses
        const setMatch = cSql.match(/SET\s+(.+?)\s+WHERE/i);
        let changes = 0;

        if (setMatch) {
            const setParts = setMatch[1].split(',').map(p => p.trim());
            const updateFields = {};
            setParts.forEach((part, idx) => {
                const col = part.split('=')[0].trim();
                updateFields[col] = params[idx];
            });

            table.forEach(row => {
                const matchId = targetId !== null && row.id == targetId;
                const matchEmail = targetEmail !== null && (row.email || '').toLowerCase().trim() === targetEmail;

                if (matchId || matchEmail || (!targetId && !targetEmail)) {
                    Object.assign(row, updateFields);
                    changes++;
                }
            });
        }

        return { changes };
    }

    // 4. DELETE queries
    if (upper.startsWith('DELETE')) {
        const tableName = extractTableName(cSql);
        let count = 0;
        if (tables[tableName]) {
            if (cSql.includes('WHERE id = ?') && params.length > 0) {
                const idToDelete = params[0];
                const initialLen = tables[tableName].length;
                tables[tableName] = tables[tableName].filter(r => r.id != idToDelete);
                count = initialLen - tables[tableName].length;
            }
        }
        return { changes: count };
    }

    return [];
}

async function get(sql, params = []) {
    const rows = await query(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

async function run(sql, params = []) {
    return query(sql, params);
}

async function initDatabase() {
    console.log('In-Memory database engine initialized with pre-seeded test data.');
    return true;
}

module.exports = {
    tables,
    query,
    get,
    run,
    initDatabase
};
