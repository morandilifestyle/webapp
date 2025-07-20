"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityLogging = exports.ipBlocking = exports.validateRequest = exports.paymentSecurity = exports.sessionManagement = exports.rateLimitConfig = exports.sessionConfig = exports.csrfProtection = exports.validateCSRFToken = exports.generateCSRFToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const ioredis_1 = __importDefault(require("ioredis"));
const SKIP_SECURITY = process.env.NODE_ENV === 'test';
const redis = process.env.REDIS_DISABLED === 'true'
    ? null
    : new ioredis_1.default({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
    });
const generateCSRFToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateCSRFToken = generateCSRFToken;
const validateCSRFToken = (token, sessionToken) => {
    if (!token || !sessionToken) {
        return false;
    }
    return crypto_1.default.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(sessionToken, 'hex'));
};
exports.validateCSRFToken = validateCSRFToken;
const csrfProtection = (req, res, next) => {
    if (SKIP_SECURITY)
        return next();
    if (req.method === 'GET' || req.path.startsWith('/api/health')) {
        return next();
    }
    const csrfToken = req.headers['x-csrf-token'];
    const sessionToken = req.session?.csrfToken;
    if (!(0, exports.validateCSRFToken)(csrfToken, sessionToken)) {
        res.status(403).json({
            error: 'CSRF token validation failed',
            code: 'CSRF_ERROR'
        });
        return;
    }
    next();
};
exports.csrfProtection = csrfProtection;
exports.sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    name: 'morandi.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict',
    },
    rolling: true,
};
exports.rateLimitConfig = {
    general: (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: {
            error: 'Too many requests from this IP, please try again later',
            code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
    payment: (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 10,
        message: {
            error: 'Too many payment attempts, please try again later',
            code: 'PAYMENT_RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    }),
    auth: (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: {
            error: 'Too many authentication attempts, please try again later',
            code: 'AUTH_RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
    checkout: (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 20,
        message: {
            error: 'Too many checkout attempts, please try again later',
            code: 'CHECKOUT_RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
    }),
};
if (SKIP_SECURITY) {
    Object.keys(exports.rateLimitConfig).forEach((key) => {
        exports.rateLimitConfig[key] = (_req, _res, next) => next();
    });
}
const sessionManagement = (req, res, next) => {
    if (SKIP_SECURITY)
        return next();
    if (!req.session.csrfToken) {
        req.session.csrfToken = (0, exports.generateCSRFToken)();
    }
    res.setHeader('X-CSRF-Token', req.session.csrfToken);
    if (req.sessionID) {
        res.setHeader('X-Session-ID', req.sessionID);
    }
    next();
};
exports.sessionManagement = sessionManagement;
const paymentSecurity = (req, res, next) => {
    if (SKIP_SECURITY)
        return next();
    const origin = req.headers.origin;
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        'http://localhost:3000',
        'https://morandi.vercel.app'
    ].filter(Boolean);
    if (origin && !allowedOrigins.includes(origin)) {
        res.status(403).json({
            error: 'Invalid request origin',
            code: 'INVALID_ORIGIN'
        });
        return;
    }
    if (req.method === 'POST' && !req.headers['content-type']?.includes('application/json')) {
        res.status(400).json({
            error: 'Invalid content type',
            code: 'INVALID_CONTENT_TYPE'
        });
        return;
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
};
exports.paymentSecurity = paymentSecurity;
const validateRequest = (req, res, next) => {
    if (SKIP_SECURITY)
        return next();
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxSize = 1024 * 1024;
    if (contentLength > maxSize) {
        res.status(413).json({
            error: 'Request too large',
            code: 'REQUEST_TOO_LARGE'
        });
        return;
    }
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!allowedMethods.includes(req.method)) {
        res.status(405).json({
            error: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });
        return;
    }
    next();
};
exports.validateRequest = validateRequest;
const ipBlocking = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const blockedIPs = process.env.BLOCKED_IPS?.split(',') || [];
    if (blockedIPs.includes(clientIP)) {
        res.status(403).json({
            error: 'Access denied',
            code: 'IP_BLOCKED'
        });
        return;
    }
    next();
};
exports.ipBlocking = ipBlocking;
const securityLogging = (req, res, next) => {
    const startTime = Date.now();
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const method = req.method;
    const path = req.path;
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        if (statusCode >= 400) {
            console.warn('Security Event:', {
                timestamp: new Date().toISOString(),
                ip: clientIP,
                method,
                path,
                statusCode,
                userAgent,
                duration,
                userId: req.user?.userId || 'anonymous'
            });
        }
        if (path.includes('/payment') || path.includes('/checkout')) {
            console.info('Payment Request:', {
                timestamp: new Date().toISOString(),
                ip: clientIP,
                method,
                path,
                statusCode,
                userId: req.user?.userId || 'anonymous',
                sessionId: req.sessionID
            });
        }
    });
    next();
};
exports.securityLogging = securityLogging;
exports.default = {
    csrfProtection: exports.csrfProtection,
    sessionManagement: exports.sessionManagement,
    paymentSecurity: exports.paymentSecurity,
    validateRequest: exports.validateRequest,
    ipBlocking: exports.ipBlocking,
    securityLogging: exports.securityLogging,
    rateLimitConfig: exports.rateLimitConfig,
    sessionConfig: exports.sessionConfig,
    generateCSRFToken: exports.generateCSRFToken,
    validateCSRFToken: exports.validateCSRFToken
};
//# sourceMappingURL=security.js.map