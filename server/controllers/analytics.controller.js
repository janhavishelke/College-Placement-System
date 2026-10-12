const { query, get } = require('../config/db');

exports.getPlacementAnalytics = async (req, res) => {
    try {
        // 1. Branch-wise placement rates
        const branchStats = await query(`
            SELECT 
                u.branch,
                COUNT(DISTINCT u.id) as total_students,
                COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN u.id END) as placed_students,
                COUNT(DISTINCT CASE WHEN a.status = 'Shortlisted' THEN u.id END) as shortlisted_students,
                ROUND(CAST(COUNT(DISTINCT CASE WHEN a.status = 'Selected' THEN u.id END) AS REAL) / 
                      MAX(COUNT(DISTINCT u.id), 1) * 100, 1) as placement_rate
            FROM users u
            LEFT JOIN applications a ON u.id = a.student_id
            WHERE u.role = 'STUDENT' AND u.branch IS NOT NULL AND u.branch != ''
            GROUP BY u.branch
            ORDER BY placement_rate DESC, total_students DESC
        `);

        // 2. Company-wise selections and offers
        const companyStats = await query(`
            SELECT 
                j.company_name,
                COUNT(DISTINCT j.id) as jobs_posted,
                COUNT(a.id) as total_applications,
                COUNT(CASE WHEN a.status = 'Shortlisted' THEN 1 END) as shortlisted_count,
                COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) as selected_count,
                ROUND(CAST(COUNT(CASE WHEN a.status = 'Selected' THEN 1 END) AS REAL) / 
                      MAX(COUNT(a.id), 1) * 100, 1) as selection_rate,
                MAX(j.salary) as highest_package
            FROM jobs j
            LEFT JOIN applications a ON j.id = a.job_id
            GROUP BY j.company_name
            ORDER BY selected_count DESC, total_applications DESC
        `);

        // 3. Real Salary statistics (Calculated from jobs and placed offers)
        const allJobs = await query('SELECT salary FROM jobs');
        const salaries = allJobs.map(j => {
            const match = (j.salary || '').match(/(\d+(\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0;
        }).filter(s => s > 0).sort((a, b) => a - b);

        let minSalary = 0;
        let maxSalary = 0;
        let avgSalary = 0;
        let medianSalary = 0;

        if (salaries.length > 0) {
            minSalary = salaries[0];
            maxSalary = salaries[salaries.length - 1];
            avgSalary = parseFloat((salaries.reduce((sum, s) => sum + s, 0) / salaries.length).toFixed(2));
            const mid = Math.floor(salaries.length / 2);
            medianSalary = salaries.length % 2 !== 0 ? salaries[mid] : parseFloat(((salaries[mid - 1] + salaries[mid]) / 2).toFixed(2));
        }

        // 4. Recruitment Conversion Funnel
        const totalApps = await get('SELECT COUNT(*) as count FROM applications');
        const shortlistedApps = await get("SELECT COUNT(*) as count FROM applications WHERE status IN ('Shortlisted', 'Selected')");
        const selectedApps = await get("SELECT COUNT(*) as count FROM applications WHERE status = 'Selected'");
        const rejectedApps = await get("SELECT COUNT(*) as count FROM applications WHERE status = 'Rejected'");

        const totalApplications = totalApps.count || 0;
        const totalShortlisted = shortlistedApps.count || 0;
        const totalSelected = selectedApps.count || 0;
        const totalRejected = rejectedApps.count || 0;

        const applicationToShortlistRate = totalApplications > 0
            ? parseFloat(((totalShortlisted / totalApplications) * 100).toFixed(1))
            : 0;

        const shortlistToSelectionRate = totalShortlisted > 0
            ? parseFloat(((totalSelected / totalShortlisted) * 100).toFixed(1))
            : 0;

        const overallConversionRate = totalApplications > 0
            ? parseFloat(((totalSelected / totalApplications) * 100).toFixed(1))
            : 0;

        const funnel = [
            { stage: '1. Applications Received', count: totalApplications, percentage: 100, dropoff: totalApplications - totalShortlisted },
            { stage: '2. Shortlisted Candidates', count: totalShortlisted, percentage: applicationToShortlistRate, dropoff: totalShortlisted - totalSelected },
            { stage: '3. Final Job Offers / Selected', count: totalSelected, percentage: overallConversionRate, dropoff: 0 }
        ];

        // Overall institutional counts
        const studentCount = await get("SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'");
        const companyCount = await get("SELECT COUNT(*) as count FROM users WHERE role = 'COMPANY'");
        const jobCount = await get("SELECT COUNT(*) as count FROM jobs");
        const placedStudentCount = await get("SELECT COUNT(DISTINCT student_id) as count FROM applications WHERE status = 'Selected'");

        return res.status(200).json({
            success: true,
            kpis: {
                totalRegisteredStudents: studentCount.count,
                totalPartnerCompanies: companyCount.count,
                totalDrivesConducted: jobCount.count,
                totalStudentsPlaced: placedStudentCount.count,
                overallPlacementPercentage: studentCount.count > 0 
                    ? parseFloat(((placedStudentCount.count / studentCount.count) * 100).toFixed(1)) 
                    : 0,
                salaryStats: {
                    highestLPA: `${maxSalary} LPA`,
                    averageLPA: `${avgSalary} LPA`,
                    medianLPA: `${medianSalary} LPA`,
                    lowestLPA: `${minSalary} LPA`
                }
            },
            branchStats,
            companyStats,
            funnel,
            conversionRates: {
                applicationToShortlist: `${applicationToShortlistRate}%`,
                shortlistToSelection: `${shortlistToSelectionRate}%`,
                overallFunnelConversion: `${overallConversionRate}%`
            }
        });
    } catch (err) {
        console.error('Placement analytics error:', err);
        return res.status(500).json({ success: false, message: 'Server error retrieving analytics.' });
    }
};
