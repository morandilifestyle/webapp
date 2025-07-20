import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import session from 'express-session';
import { supabase } from './config/database';
import securityMiddleware from './middleware/security';

const app = express();
const PORT = process.env.NODE_ENV === 'test' ? 0 : (process.env.PORT || 3001);

// Load environment variables
dotenv.config();

// Security middleware
app.use(helmet({
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

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Session middleware (must come before other middleware)
app.use(session(securityMiddleware.sessionConfig));

// Security middleware
app.use(securityMiddleware.validateRequest);
app.use(securityMiddleware.ipBlocking);
app.use(securityMiddleware.securityLogging);
app.use(securityMiddleware.sessionManagement);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes with security middleware
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import cartRoutes from './routes/cart';
import adminRoutes from './routes/admin';
import wishlistRoutes from './routes/wishlist';
import reviewRoutes from './routes/reviews';
import blogRoutes from './routes/blog';
import testRoutes from './routes/test';

// Apply rate limiting to different route groups
app.use('/api/auth', securityMiddleware.rateLimitConfig.auth, authRoutes);
app.use('/api/products', securityMiddleware.rateLimitConfig.general, productRoutes);
app.use('/api/categories', securityMiddleware.rateLimitConfig.general, categoryRoutes);
app.use('/api/users', securityMiddleware.rateLimitConfig.general, userRoutes);
app.use('/api/cart', securityMiddleware.rateLimitConfig.general, cartRoutes);
app.use('/api/admin', securityMiddleware.rateLimitConfig.general, adminRoutes);
app.use('/api/wishlist', securityMiddleware.rateLimitConfig.general, wishlistRoutes);
app.use('/api/reviews', securityMiddleware.rateLimitConfig.general, reviewRoutes);
app.use('/api/blog', securityMiddleware.rateLimitConfig.general, blogRoutes);
app.use('/api/test', securityMiddleware.rateLimitConfig.general, testRoutes);

// Payment and checkout routes with enhanced security
app.use('/api/orders', 
  securityMiddleware.rateLimitConfig.checkout,
  securityMiddleware.paymentSecurity,
  securityMiddleware.csrfProtection,
  orderRoutes
);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  // Log security-related errors
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

// Start server
const server = app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security middleware enabled`);
    console.log(`💳 Payment security enhanced`);
  }
});

export { server, supabase };
export default app; 