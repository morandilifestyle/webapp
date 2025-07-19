"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimit = exports.refreshToken = exports.optionalAuth = exports.requireUser = exports.requireAdmin = exports.requireRole = exports.authenticateToken = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
};
exports.verifyToken = verifyToken;
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        const decoded = (0, exports.verifyToken)(token);
        if (!decoded) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp < currentTime) {
            res.status(401).json({ error: 'Token expired' });
            return;
        }
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)(['admin']);
exports.requireUser = (0, exports.requireRole)(['user', 'admin']);
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const decoded = (0, exports.verifyToken)(token);
            if (decoded) {
                req.user = {
                    userId: decoded.userId,
                    email: decoded.email,
                    role: decoded.role
                };
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token required' });
            return;
        }
        const decoded = (0, exports.verifyToken)(refreshToken);
        if (!decoded) {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }
        const newToken = (0, exports.generateToken)({
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        });
        res.json({
            accessToken: newToken,
            expiresIn: 24 * 60 * 60
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
};
exports.refreshToken = refreshToken;
exports.authRateLimit = {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later'
};
exports.default = {
    authenticateToken: exports.authenticateToken,
    requireRole: exports.requireRole,
    requireAdmin: exports.requireAdmin,
    requireUser: exports.requireUser,
    optionalAuth: exports.optionalAuth,
    refreshToken: exports.refreshToken,
    generateToken: exports.generateToken,
    verifyToken: exports.verifyToken
};
//# sourceMappingURL=auth.js.map