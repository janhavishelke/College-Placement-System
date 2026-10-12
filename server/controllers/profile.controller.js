const { get, run } = require('../config/db');

exports.getProfile = async (req, res) => {
    try {
        const user = await get(
            `SELECT id, name, email, role, branch, cgpa, skills, backlogs, batch, interests, projects, portfolio_url, resume_filename, created_at 
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        console.error('Get profile error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving profile.'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, branch, cgpa, skills, backlogs, batch, interests, projects, portfolioUrl } = req.body;

        const currentUser = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const updatedName = (name && name.trim()) || currentUser.name;
        const updatedBranch = branch !== undefined ? branch.trim() : currentUser.branch;
        const updatedCgpa = cgpa !== undefined && cgpa !== '' ? parseFloat(cgpa) : currentUser.cgpa;
        const updatedSkills = skills !== undefined ? skills.trim() : currentUser.skills;
        const updatedBacklogs = backlogs !== undefined ? parseInt(backlogs, 10) : (currentUser.backlogs || 0);
        const updatedBatch = batch !== undefined ? batch.trim() : (currentUser.batch || '2026');
        const updatedInterests = interests !== undefined ? interests.trim() : (currentUser.interests || '');
        const updatedProjects = projects !== undefined ? projects.trim() : (currentUser.projects || '');
        const updatedPortfolio = portfolioUrl !== undefined ? portfolioUrl.trim() : (currentUser.portfolio_url || '');

        if (isNaN(updatedCgpa) || updatedCgpa < 0 || updatedCgpa > 10) {
            return res.status(400).json({
                success: false,
                message: 'CGPA must be a valid number between 0 and 10.'
            });
        }

        if (isNaN(updatedBacklogs) || updatedBacklogs < 0) {
            return res.status(400).json({
                success: false,
                message: 'Backlogs must be a non-negative number.'
            });
        }

        await run(
            `UPDATE users 
             SET name = ?, branch = ?, cgpa = ?, skills = ?, backlogs = ?, batch = ?, interests = ?, projects = ?, portfolio_url = ?
             WHERE id = ?`,
            [updatedName, updatedBranch, updatedCgpa, updatedSkills, updatedBacklogs, updatedBatch, updatedInterests, updatedProjects, updatedPortfolio, req.user.id]
        );

        const updated = await get(
            `SELECT id, name, email, role, branch, cgpa, skills, backlogs, batch, interests, projects, portfolio_url, resume_filename
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully!',
            user: updated
        });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error updating profile.'
        });
    }
};
