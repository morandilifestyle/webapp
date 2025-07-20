"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = exports.server = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const database_1 = require("./config/database");
Object.defineProperty(exports, "supabase", { enumerable: true, get: function () { return database_1.supabase; } });
const security_1 = __importDefault(require("./middleware/security"));
const app = (0, express_1.default)();
const PORT = process.env.NODE_ENV === 'test' ? 0 : (process.env.PORT || 3001);
dotenv_1.default.config();
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "https://checkout.razorpay.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.razorpay.com"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use((0, express_session_1.default)(security_1.default.sessionConfig));
app.use(security_1.default.validateRequest);
app.use(security_1.default.ipBlocking);
app.use(security_1.default.securityLogging);
app.use(security_1.default.sessionManagement);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
const auth_1 = __importDefault(require("./routes/auth"));
const products_1 = __importDefault(require("./routes/products"));
const categories_1 = __importDefault(require("./routes/categories"));
const orders_1 = __importDefault(require("./routes/orders"));
const users_1 = __importDefault(require("./routes/users"));
const cart_1 = __importDefault(require("./routes/cart"));
const admin_1 = __importDefault(require("./routes/admin"));
const wishlist_1 = __importDefault(require("./routes/wishlist"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const blog_1 = __importDefault(require("./routes/blog"));
const test_1 = __importDefault(require("./routes/test"));
app.use('/api/auth', security_1.default.rateLimitConfig.auth, auth_1.default);
app.use('/api/products', security_1.default.rateLimitConfig.general, products_1.default);
app.use('/api/categories', security_1.default.rateLimitConfig.general, categories_1.default);
app.use('/api/users', security_1.default.rateLimitConfig.general, users_1.default);
app.use('/api/cart', security_1.default.rateLimitConfig.general, cart_1.default);
app.use('/api/admin', security_1.default.rateLimitConfig.general, admin_1.default);
app.use('/api/wishlist', security_1.default.rateLimitConfig.general, wishlist_1.default);
app.use('/api/reviews', security_1.default.rateLimitConfig.general, reviews_1.default);
app.use('/api/blog', security_1.default.rateLimitConfig.general, blog_1.default);
app.use('/api/test', security_1.default.rateLimitConfig.general, test_1.default);
app.use('/api/orders', security_1.default.rateLimitConfig.checkout, security_1.default.paymentSecurity, security_1.default.csrfProtection, orders_1.default);
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err.code && err.code.startsWith('SECURITY_')) {
        console.warn('Security Error:', {
            timestamp: new Date().toISOString(),
            ip: req.ip,
            path: req.path,
            method: req.method,
            error: err.message,
            code: err.code
        });
    }
    res.status(err.status || 500).json({
        error: err.message || 'Something went wrong!',
        code: err.code || 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.stack : 'Internal server error'
    });
});
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        code: 'ROUTE_NOT_FOUND'
    });
});
const server = app.listen(PORT, () => {
    if (process.env.NODE_ENV !== 'test') {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔒 Security middleware enabled`);
        console.log(`💳 Payment security enhanced`);
    }
});
exports.server = server;
exports.default = app;
//# sourceMappingURL=index.js.map