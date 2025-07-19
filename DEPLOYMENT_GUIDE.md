# 🚀 Morandi E-commerce Platform - Deployment Guide

**Project**: Morandi Lifestyle E-commerce Platform  
**Status**: 🔍 **UNDER REVIEW** - Critical fixes required before deployment  
**Last Updated**: December 2024

---

## 📋 Pre-Deployment Checklist

### ❌ Critical Issues (Must Fix Before Deployment)

1. **Build System Failures**
   - [ ] Fix frontend compilation errors
   - [ ] Resolve duplicate imports in `src/app/products/page.tsx`
   - [ ] Update Next.js configuration
   - [ ] Ensure TypeScript compilation passes

2. **Test Configuration Issues**
   - [ ] Install missing test dependencies
   - [ ] Fix Jest configuration for ES modules
   - [ ] Add proper test setup with context providers
   - [ ] Resolve TypeScript compilation errors

3. **Environment Configuration**
   - [ ] Configure Supabase project URL and keys
   - [ ] Set up Razorpay payment credentials
   - [ ] Configure all required environment variables
   - [ ] Test database connectivity

4. **Security Validation**
   - [ ] Validate payment integration
   - [ ] Test authentication flow
   - [ ] Verify Row Level Security (RLS) policies
   - [ ] Check for security vulnerabilities

---

## 🛠️ Environment Setup

### 1. Supabase Configuration

#### Create Supabase Project
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Create new project
supabase projects create morandi-lifestyle
```

#### Get Project Credentials
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings > API**
4. Copy the following values:
   - **Project URL**
   - **anon public key**
   - **service_role secret key**

#### Configure Environment Variables
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your Supabase credentials
nano .env
```

Update your `.env` file:
```env
# Supabase Configuration (CRITICAL)
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Push Database Schema
```bash
# Push migrations to Supabase
supabase db push

# Verify schema
supabase db diff
```

### 2. Payment Gateway Setup

#### Razorpay Configuration
1. Create account at [Razorpay](https://razorpay.com)
2. Go to **Settings > API Keys**
3. Generate new API keys
4. Update your `.env` file:

```env
# Razorpay Configuration (CRITICAL)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret_here
```

#### Test Payment Flow
```bash
# Use test credentials for development
# Test payment verification
# Validate webhook handling
```

### 3. Email Service Setup

#### SendGrid Configuration
1. Create account at [SendGrid](https://sendgrid.com)
2. Generate API key
3. Verify sender email
4. Update your `.env` file:

```env
# Email Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@morandi-lifestyle.com
SENDGRID_FROM_NAME=Morandi Lifestyle
```

### 4. Complete Environment Variables

```env
# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h

# Email Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@morandi-lifestyle.com
SENDGRID_FROM_NAME=Morandi Lifestyle

# Razorpay Configuration
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Redis Configuration (if using)
REDIS_URL=redis://your-redis-url:6379

# AWS S3 Configuration (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=morandi-lifestyle-assets

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## 🔧 Fix Critical Issues

### 1. Fix Build System Issues

#### Resolve Frontend Build Errors
```bash
cd morandi

# Check for duplicate imports
grep -r "ProductFilters" src/

# Fix duplicate imports in products page
# Update import statements to avoid conflicts

# Fix Next.js configuration
# Remove deprecated options from next.config.js
```

#### Fix TypeScript Compilation
```bash
# Run TypeScript check
npm run type-check

# Fix any compilation errors
# Ensure all types are properly defined
```

### 2. Fix Test Configuration

#### Install Missing Dependencies
```bash
# Frontend dependencies
cd morandi
npm install --save-dev @types/bcrypt @types/jsonwebtoken

# Backend dependencies
cd ../backend
npm install --save-dev @types/bcrypt @types/jsonwebtoken
```

#### Fix Jest Configuration
```bash
# Update Jest config for ES modules
# Fix module resolution
# Add proper test setup
```

### 3. Validate Environment Setup

#### Test Database Connectivity
```bash
# Test Supabase connection
curl -X GET "https://your-project-ref.supabase.co/rest/v1/" \
  -H "apikey: your-anon-key"
```

#### Test Payment Integration
```bash
# Test Razorpay connection
# Verify webhook endpoints
# Test payment flow
```

---

## 🚀 Deployment Steps

### Phase 1: Staging Deployment

#### 1. Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy frontend
cd morandi
vercel --prod
```

**Environment Variables for Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

#### 2. Backend Deployment (Railway)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy backend
cd backend
railway up
```

**Environment Variables for Railway:**
- All backend environment variables from `.env`

#### 3. Database Deployment (Supabase)

```bash
# Push schema to production
supabase db push --project-ref your-project-ref

# Verify deployment
supabase db diff --project-ref your-project-ref
```

### Phase 2: Production Deployment

#### 1. Domain Configuration
1. Configure custom domain in Vercel
2. Set up SSL certificates
3. Configure DNS records

#### 2. CDN Setup
1. Configure Vercel CDN
2. Set up image optimization
3. Configure caching headers

#### 3. Monitoring Setup
1. Set up error tracking (Sentry)
2. Configure performance monitoring
3. Set up uptime monitoring

---

## 🧪 Testing & Validation

### 1. Pre-Deployment Testing

#### Run Complete Test Suite
```bash
# Frontend tests
cd morandi && npm run test

# Backend tests
cd ../backend && npm run test

# Integration tests
npm run test:integration
```

#### End-to-End Testing
```bash
# Test user registration
# Test product browsing
# Test cart functionality
# Test checkout process
# Test payment processing
# Test order tracking
```

### 2. Post-Deployment Validation

#### Health Checks
```bash
# API health check
curl https://your-api-domain.com/health

# Frontend health check
curl https://your-domain.com/api/health
```

#### Functionality Tests
- [ ] User registration and login
- [ ] Product catalog and search
- [ ] Shopping cart functionality
- [ ] Checkout process
- [ ] Payment processing
- [ ] Order tracking
- [ ] Admin dashboard access

#### Performance Tests
```bash
# Load testing
npm run test:load

# Performance monitoring
# Check Core Web Vitals
# Monitor API response times
```

---

## 🔒 Security Checklist

### 1. Authentication & Authorization
- [ ] JWT tokens properly configured
- [ ] Password hashing implemented
- [ ] Rate limiting enabled
- [ ] CORS properly configured

### 2. Payment Security
- [ ] Razorpay signature verification
- [ ] Payment data not stored locally
- [ ] HTTPS enforced
- [ ] PCI compliance checked

### 3. Data Protection
- [ ] Row Level Security (RLS) enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled

### 4. Infrastructure Security
- [ ] Environment variables secured
- [ ] API keys rotated
- [ ] Database access restricted
- [ ] Backup procedures in place

---

## 📊 Monitoring & Maintenance

### 1. Performance Monitoring
```bash
# Set up monitoring tools
# Configure alerts
# Monitor key metrics
```

### 2. Error Tracking
```bash
# Configure Sentry
# Set up error alerts
# Monitor application errors
```

### 3. Backup Procedures
```bash
# Database backups
# File storage backups
# Configuration backups
```

### 4. Update Procedures
```bash
# Dependency updates
# Security patches
# Feature deployments
```

---

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache
npm run clean
rm -rf node_modules
npm install

# Check TypeScript errors
npm run type-check
```

#### Database Connection Issues
```bash
# Verify Supabase credentials
# Check network connectivity
# Validate RLS policies
```

#### Payment Integration Issues
```bash
# Verify Razorpay credentials
# Check webhook endpoints
# Test payment flow
```

#### Performance Issues
```bash
# Optimize images
# Enable caching
# Monitor bundle size
```

---

## 📞 Support & Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Razorpay Documentation](https://razorpay.com/docs)
- [Vercel Documentation](https://vercel.com/docs)

### Community
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord Community](https://discord.gg/your-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/morandi)

### Monitoring
- [Vercel Analytics](https://vercel.com/analytics)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Sentry Error Tracking](https://sentry.io)

---

## 🎯 Success Metrics

### Technical Metrics
- [ ] Build success rate: 100%
- [ ] Test coverage: >80%
- [ ] Page load time: <3s
- [ ] API response time: <500ms
- [ ] Uptime: >99.9%

### Business Metrics
- [ ] User registration: 1000+ users
- [ ] Product views: 5000+ views
- [ ] Cart conversion: 15%+
- [ ] Checkout completion: 80%+
- [ ] Payment success: 95%+

### Security Metrics
- [ ] Zero critical vulnerabilities
- [ ] PCI compliance maintained
- [ ] Data protection compliance
- [ ] Security audit passed

---

**Deployment Guide Version**: 1.0  
**Last Updated**: December 2024  
**Status**: 🔍 **UNDER REVIEW** - Critical fixes required  
**Next Update**: After build and test issues are resolved 