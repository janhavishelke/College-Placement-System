const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get, run } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields (name, email, password, role) are required.'
            });
        }

        // Public registration is restricted to STUDENT and COMPANY only.
        // Administrative roles (ADMIN, PLACEMENT_HEAD, COORDINATOR) must be created by administrators.
        const allowedPublicRoles = ['STUDENT', 'COMPANY'];
        const normalizedRole = role.toUpperCase();
        if (!allowedPublicRoles.includes(normalizedRole)) {
            return res.status(403).json({
                success: false,
                message: 'Public self-registration is only permitted for STUDENT and COMPANY roles. Institutional roles must be provisioned by the Placement Office.'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long.'
            });
        }

        // Check for existing user with this email
        const existing = await get('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await run(
            'INSERT INTO users (name, email, password, role, department, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [name.trim(), email.trim().toLowerCase(), hashedPassword, normalizedRole, req.body.department || '', req.body.phone || '']
        );

        return res.status(201).json({
            success: true,
            message: 'Registration successful! You can now log in.',
            user: {
                id: result.lastID,
                name: name.trim(),
                email: email.trim().toLowerCase(),
                role: normalizedRole
            }
        });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error during registration.'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, password, and role.'
            });
        }

        const normalizedRole = role.toUpperCase();
        const user = await get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email, password, or role selection.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email, password, or role selection.'
            });
        }

        // Normalize role matching: ADMIN and PLACEMENT_HEAD can authenticate interchangeably
        const isRoleMatch = user.role === normalizedRole ||
            (normalizedRole === 'ADMIN' && user.role === 'PLACEMENT_HEAD') ||
            (normalizedRole === 'PLACEMENT_HEAD' && user.role === 'ADMIN');

        if (!isRoleMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email, password, or role selection.'
            });
        }

        // Sign token
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department || user.branch || '',
            phone: user.phone || ''
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: payload
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error during login.'
        });
    }
};

exports.me = async (req, res) => {
    try {
        const user = await get('SELECT id, name, email, role, branch, cgpa, skills, department, phone, status, created_at FROM users WHERE id = ?', [req.user.id]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        return res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        console.error('Me error:', err);
        return res.status(500).json({ success: false, message: 'Server error fetching user.' });
    }
};
