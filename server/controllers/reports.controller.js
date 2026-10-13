const { query } = require('../config/db');

// Helper to sanitize CSV field
function csvEscape(field) {
    if (field === null || field === undefined) return '""';
    const str = field.toString().replace(/"/g, '""');
    return `"${str}"`;
}

// Aggregated institutional placement reports summary
exports.getReportsSummary = async (req, res) => {
    try {
        // 1. Department & Branch Summary
        const branchSummary = await query(`
            SELECT 
                u.branch,
                COUNT(DISTINCT u.id) as total_students,
                COUNT(DISTINCT CASE WHEN a.status IN ('Selected', 'Offer Accepted') THEN u.id END) as placed_students,
                ROUND(CAST(COUNT(DISTINCT CASE WHEN a.status IN ('Selected', 'Offer Accepted') THEN u.id END) AS REAL) / 
                      MAX(COUNT(DISTINCT u.id), 1) * 100, 1) as placement_percentage
            FROM users u
            LEFT JOIN applications a ON u.id = a.student_id
            WHERE u.role = 'STUDENT' AND u.branch IS NOT NULL AND u.branch != ''
            GROUP BY u.branch
            ORDER BY placement_percentage DESC, total_students DESC
        `);

        // 2. Company Selections Summary
        const companySummary = await query(`
            SELECT 
                j.company_name,
                COUNT(DISTINCT j.id) as total_drives,
                COUNT(a.id) as total_applicants,
                COUNT(CASE WHEN a.status IN ('Selected', 'Offer Accepted') THEN 1 END) as selections_count,
                MAX(j.salary) as package_offered
            FROM jobs j
            LEFT JOIN applications a ON j.id = a.job_id
            GROUP BY j.company_name
            ORDER BY selections_count DESC, total_applicants DESC
        `);

        // 3. Batch/Year-wise Summary
        const yearSummary = await query(`
            SELECT 
                COALESCE(u.batch, '2026') as batch_year,
                COUNT(DISTINCT u.id) as total_enrolled,
                COUNT(DISTINCT CASE WHEN a.status IN ('Selected', 'Offer Accepted') THEN u.id END) as placed_candidates
            FROM users u
            LEFT JOIN applications a ON u.id = a.student_id
            WHERE u.role = 'STUDENT'
            GROUP BY u.batch
        `);

        return res.status(200).json({
            success: true,
            overview: {
                totalBranches: branchSummary.length,
                totalCompanies: companySummary.length,
                totalBatches: yearSummary.length
            },
            branchSummary,
            companySummary,
            yearSummary,
            departmentBreakdown: branchSummary,
            companyBreakdown: companySummary
        });
    } catch (err) {
        console.error('Reports summary error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving reports summary.' });
    }
};

// Export Students Registry as CSV
exports.exportStudentsCsv = async (req, res) => {
    try {
        const students = await query(`
            SELECT u.id, u.name, u.email, u.branch, u.cgpa, u.backlogs, u.batch, u.phone,
                   (SELECT j.company_name FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.student_id = u.id AND a.status IN ('Selected', 'Offer Accepted') LIMIT 1) as placed_company,
                   (SELECT j.salary FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.student_id = u.id AND a.status IN ('Selected', 'Offer Accepted') LIMIT 1) as placed_salary
            FROM users u
            WHERE u.role = 'STUDENT'
            ORDER BY u.id ASC
        `);

        const headers = ['Student ID', 'Full Name', 'Email Address', 'Branch / Department', 'CGPA', 'Active Backlogs', 'Batch Year', 'Phone', 'Placement Status', 'Placed Company', 'Salary Package'];
        const rows = students.map(s => [
            s.id,
            s.name,
            s.email,
            s.branch || 'General',
            s.cgpa || 0,
            s.backlogs || 0,
            s.batch || '2026',
            s.phone || '',
            s.placed_company ? 'Placed' : 'In Pipeline',
            s.placed_company || 'N/A',
            s.placed_salary || 'N/A'
        ].map(csvEscape).join(','));

        const csvContent = [headers.map(csvEscape).join(','), ...rows].join('\r\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="PlacementHub_Students_Report.csv"');
        return res.send(csvContent);
    } catch (err) {
        console.error('Export students CSV error:', err);
        return res.status(500).json({ success: false, message: 'Server error exporting students CSV.' });
    }
};

// Export Campus Drives as CSV
exports.exportDrivesCsv = async (req, res) => {
    try {
        const drives = await query(`
            SELECT j.*, 
                   (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count,
                   (SELECT COUNT(*) FROM applications WHERE job_id = j.id AND status IN ('Selected', 'Offer Accepted')) as selected_count
            FROM jobs j
            ORDER BY j.created_at DESC
        `);

        const headers = ['Drive ID', 'Company Name', 'Job Role', 'Package CTC', 'Location', 'Min CGPA', 'Max Backlogs', 'Eligible Branches', 'Visit Date', 'Deadline', 'Recruitment Status', 'Approval Status', 'Coordinator', 'Applicants', 'Selected'];
        const rows = drives.map(d => [
            d.id,
            d.company_name,
            d.title,
            d.salary,
            d.location || 'On-Campus',
            d.cgpa || 0,
            d.max_backlogs !== undefined ? d.max_backlogs : 0,
            d.eligible_branches || 'All Branches',
            d.visit_date || d.deadline,
            d.deadline || '',
            d.recruitment_status || 'Upcoming',
            d.approval_status || 'Approved',
            d.coordinator_name || 'Unassigned',
            d.applicant_count || 0,
            d.selected_count || 0
        ].map(csvEscape).join(','));

        const csvContent = [headers.map(csvEscape).join(','), ...rows].join('\r\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="PlacementHub_Campus_Drives_Report.csv"');
        return res.send(csvContent);
    } catch (err) {
        console.error('Export drives CSV error:', err);
        return res.status(500).json({ success: false, message: 'Server error exporting drives CSV.' });
    }
};

// Export Final Selections & Offers as CSV
exports.exportSelectionsCsv = async (req, res) => {
    try {
        const selections = await query(`
            SELECT a.id as application_id, a.applied_at, a.updated_at, a.status,
                   u.name as student_name, u.email as student_email, u.branch, u.cgpa, u.batch,
                   j.company_name, j.title as role_offered, j.salary as package_ctc, j.location
            FROM applications a
            JOIN users u ON a.student_id = u.id
            JOIN jobs j ON a.job_id = j.id
            WHERE a.status IN ('Selected', 'Offer Accepted', 'Shortlisted')
            ORDER BY a.updated_at DESC
        `);

        const headers = ['Selection ID', 'Student Name', 'Student Email', 'Department / Branch', 'CGPA', 'Batch', 'Company', 'Role Offered', 'Package CTC', 'Location', 'Current Stage', 'Offer Date'];
        const rows = selections.map(s => [
            s.application_id,
            s.student_name,
            s.student_email,
            s.branch,
            s.cgpa,
            s.batch || '2026',
            s.company_name,
            s.role_offered,
            s.package_ctc,
            s.location || 'On-Campus',
            s.status,
            s.updated_at || s.applied_at
        ].map(csvEscape).join(','));

        const csvContent = [headers.map(csvEscape).join(','), ...rows].join('\r\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="PlacementHub_Selections_Report.csv"');
        return res.send(csvContent);
    } catch (err) {
        console.error('Export selections CSV error:', err);
        return res.status(500).json({ success: false, message: 'Server error exporting selections CSV.' });
    }
};
