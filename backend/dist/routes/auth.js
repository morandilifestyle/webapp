"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("../index");
const router = express_1.default.Router();
const validateRegistration = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    (0, express_validator_1.body)('firstName').trim().notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').trim().notEmpty().withMessage('Last name is required'),
];
const validateLogin = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
const validatePasswordReset = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail(),
];
const validateNewPassword = [
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    (0, express_validator_1.body)('token').notEmpty().withMessage('Reset token is required'),
];
const validateAddress = [
    (0, express_validator_1.body)('address_type').isIn(['billing', 'shipping']).withMessage('Address type must be billing or shipping'),
    (0, express_validator_1.body)('address_line1').trim().notEmpty().withMessage('Address line 1 is required'),
    (0, express_validator_1.body)('city').trim().notEmpty().withMessage('City is required'),
    (0, express_validator_1.body)('state').trim().notEmpty().withMessage('State is required'),
    (0, express_validator_1.body)('postal_code').trim().notEmpty().withMessage('Postal code is required'),
];
const authenticateToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password, firstName, lastName } = req.body;
        const { data: existingUser } = await index_1.supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const saltRounds = 12;
        const passwordHash = await bcrypt_1.default.hash(password, saltRounds);
        const { data: user, error } = await index_1.supabase
            .from('users')
            .insert({
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
        })
            .select()
            .single();
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Failed to create user' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
            },
            token,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/login', validateLogin, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        const { data: user, error } = await index_1.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = await bcrypt_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
            },
            token,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        res.json({ message: 'Logout successful' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        const token = jsonwebtoken_1.default.sign({ userId: req.user.userId, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
        res.json({ token });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/forgot-password', validatePasswordReset, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email } = req.body;
        const { data: user } = await index_1.supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        if (!user) {
            return res.json({ message: 'If an account exists, a reset link has been sent' });
        }
        const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({
            message: 'If an account exists, a reset link has been sent',
            resetToken
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/reset-password', validateNewPassword, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { password, token } = req.body;
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const saltRounds = 12;
        const passwordHash = await bcrypt_1.default.hash(password, saltRounds);
        const { error } = await index_1.supabase
            .from('users')
            .update({ password_hash: passwordHash })
            .eq('id', decoded.userId);
        if (error) {
            console.error('Password reset error:', error);
            return res.status(500).json({ error: 'Failed to reset password' });
        }
        res.json({ message: 'Password reset successful' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(400).json({ error: 'Invalid or expired reset token' });
    }
});
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const { data: user, error } = await index_1.supabase
            .from('users')
            .select('id, email, first_name, last_name, created_at')
            .eq('id', req.user.userId)
            .single();
        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                createdAt: user.created_at,
            },
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const updateData = {};
        if (firstName)
            updateData.first_name = firstName;
        if (lastName)
            updateData.last_name = lastName;
        if (phone)
            updateData.phone = phone;
        const { data: user, error } = await index_1.supabase
            .from('users')
            .update(updateData)
            .eq('id', req.user.userId)
            .select()
            .single();
        if (error) {
            console.error('Profile update error:', error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
            },
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/addresses', authenticateToken, async (req, res) => {
    try {
        const { data: addresses, error } = await index_1.supabase
            .from('user_addresses')
            .select('*')
            .eq('user_id', req.user.userId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Get addresses error:', error);
            return res.status(500).json({ error: 'Failed to get addresses' });
        }
        res.json({ addresses });
    }
    catch (error) {
        console.error('Get addresses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/addresses', authenticateToken, validateAddress, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { address_type, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;
        if (is_default) {
            await index_1.supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', req.user.userId)
                .eq('address_type', address_type);
        }
        const { data: address, error } = await index_1.supabase
            .from('user_addresses')
            .insert({
            user_id: req.user.userId,
            address_type,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country: country || 'India',
            is_default: is_default || false,
        })
            .select()
            .single();
        if (error) {
            console.error('Add address error:', error);
            return res.status(500).json({ error: 'Failed to add address' });
        }
        res.status(201).json({
            message: 'Address added successfully',
            address,
        });
    }
    catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/addresses/:id', authenticateToken, validateAddress, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        const { address_type, address_line1, address_line2, city, state, postal_code, country, is_default } = req.body;
        const { data: existingAddress } = await index_1.supabase
            .from('user_addresses')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .single();
        if (!existingAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }
        if (is_default) {
            await index_1.supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', req.user.userId)
                .eq('address_type', address_type)
                .neq('id', id);
        }
        const { data: address, error } = await index_1.supabase
            .from('user_addresses')
            .update({
            address_type,
            address_line1,
            address_line2,
            city,
            state,
            postal_code,
            country: country || 'India',
            is_default: is_default || false,
        })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Update address error:', error);
            return res.status(500).json({ error: 'Failed to update address' });
        }
        res.json({
            message: 'Address updated successfully',
            address,
        });
    }
    catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/addresses/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: existingAddress } = await index_1.supabase
            .from('user_addresses')
            .select('id')
            .eq('id', id)
            .eq('user_id', req.user.userId)
            .single();
        if (!existingAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }
        const { error } = await index_1.supabase
            .from('user_addresses')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Delete address error:', error);
            return res.status(500).json({ error: 'Failed to delete address' });
        }
        res.json({ message: 'Address deleted successfully' });
    }
    catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map