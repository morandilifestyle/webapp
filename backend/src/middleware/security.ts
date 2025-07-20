import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import Redis from 'ioredis';

// Redis client for session storage
const redis = process.env.REDIS_DISABLED === 'true'
  ? null
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    } as any);

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    csrfToken?: string;
    userId?: string;
  }
}

// CSRF token generation
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// CSRF token validation
export const validateCSRFToken = (token: string, sessionToken: string): boolean => {
  if (!token || !sessionToken) {
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(sessionToken, 'hex')
  );
};

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Skip CSRF for GET requests and API endpoints that don't modify data
  if (req.method === 'GET' || req.path.startsWith('/api/health')) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string;
  const sessionToken = req.session?.csrfToken;

  if (!validateCSRFToken(csrfToken, sessionToken)) {
    res.status(403).json({ 
      error: 'CSRF token validation failed',
      code: 'CSRF_ERROR'
    });
    return;
  }

  next();
};

// Session configuration
export const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  name: 'morandi.sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const,
  },
  rolling: true,
};

// Rate limiting configurations
export const rateLimitConfig = {
  // General API rate limiting
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Payment endpoints rate limiting (more restrictive)
  payment: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 payment requests per windowMs
    message: {
      error: 'Too many payment attempts, please try again later',
      code: 'PAYMENT_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  }),

  // Authentication endpoints rate limiting
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
      error: 'Too many authentication attempts, please try again later',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Checkout endpoints rate limiting
  checkout: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 checkout requests per windowMs
    message: {
      error: 'Too many checkout attempts, please try again later',
      code: 'CHECKOUT_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

// Session management middleware
export const sessionManagement = (req: Request, res: Response, next: NextFunction): void => {
  // Generate CSRF token for new sessions
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }

  // Add session info to response headers for frontend
  res.setHeader('X-CSRF-Token', req.session.csrfToken);
  
  // Add session ID to response for tracking
  if (req.sessionID) {
    res.setHeader('X-Session-ID', req.sessionID);
  }

  next();
};

// Payment-specific security middleware
export const paymentSecurity = (req: Request, res: Response, next: NextFunction): void => {
  // Validate request origin for payment endpoints
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

  // Validate content type for payment requests
  if (req.method === 'POST' && !req.headers['content-type']?.includes('application/json')) {
    res.status(400).json({
      error: 'Invalid content type',
      code: 'INVALID_CONTENT_TYPE'
    });
    return;
  }

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Validate request size
  const contentLength = parseInt(req.headers['content-length'] || '0');
  const maxSize = 1024 * 1024; // 1MB

  if (contentLength > maxSize) {
    res.status(413).json({
      error: 'Request too large',
      code: 'REQUEST_TOO_LARGE'
    });
    return;
  }

  // Validate request method
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

// IP-based blocking middleware
export const ipBlocking = (req: Request, res: Response, next: NextFunction): void => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Simple IP blocking (in production, use a proper IP blocking service)
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

// Security logging middleware
export const securityLogging = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const method = req.method;
  const path = req.path;

  // Log security events
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log suspicious activities
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

    // Log payment-related requests
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

// Export all security middleware
export default {
  csrfProtection,
  sessionManagement,
  paymentSecurity,
  validateRequest,
  ipBlocking,
  securityLogging,
  rateLimitConfig,
  sessionConfig,
  generateCSRFToken,
  validateCSRFToken
}; 