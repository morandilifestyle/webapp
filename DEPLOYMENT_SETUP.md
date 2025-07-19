# 🚀 Morandi E-commerce Platform - Deployment Setup

## 📋 Prerequisites

Before deploying, ensure you have:
- [GitHub](https://github.com) account
- [Vercel](https://vercel.com) account (for frontend)
- [Supabase](https://supabase.com) account (for database)
- [Railway](https://railway.app) account (for backend) - Optional

---

## 🗄️ Step 1: Set up Supabase Database

### 1.1 Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `morandi-ecommerce`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 1.2 Configure Database
1. Go to **Settings** → **API**
2. Copy your project URL and anon key
3. Go to **SQL Editor**
4. Run the migrations in order:
   ```sql
   -- Run each migration file from supabase/migrations/
   -- 20241201000000_product_catalog_schema.sql
   -- 20241201000001_sample_products.sql
   -- 20241201000002_cart_schema.sql
   -- 20241201000003_checkout_schema.sql
   -- 20241201000004_order_tracking_schema.sql
   -- 20241201000005_wishlist_reviews_schema.sql
   -- 20241201000006_blog_content_schema.sql
   ```

### 1.3 Set up Authentication
1. Go to **Authentication** → **Settings**
2. Configure your site URL (will be your Vercel domain)
3. Add redirect URLs for your domain
4. Enable email confirmations if needed

### 1.4 Configure Storage
1. Go to **Storage** → **Policies**
2. Set up RLS policies for file uploads
3. Configure bucket permissions

---

## 🎨 Step 2: Deploy Frontend to Vercel

### 2.1 Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `morandi`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.2 Configure Environment Variables
In Vercel project settings, add these environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
NEXT_PUBLIC_API_URL=your_backend_api_url

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

### 2.3 Deploy
1. Vercel will automatically deploy on push to main branch
2. Your site will be available at: `https://your-project.vercel.app`

---

## ⚙️ Step 3: Deploy Backend (Optional)

### Option A: Railway (Recommended)
1. Go to [Railway Dashboard](https://railway.app)
2. Create new project
3. Connect your GitHub repository
4. Configure service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### Option B: Render
1. Go to [Render Dashboard](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### 3.1 Backend Environment Variables
Add these to your backend deployment:

```env
# Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT
JWT_SECRET=your_jwt_secret_key

# Payment (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_email

# CORS
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

---

## 🔗 Step 4: Connect Everything

### 4.1 Update Frontend API URL
1. In your Vercel environment variables, set:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
   ```

### 4.2 Update Supabase Auth Settings
1. Go to Supabase → Authentication → Settings
2. Add your Vercel domain to:
   - **Site URL**
   - **Redirect URLs**

### 4.3 Test the Integration
1. Visit your Vercel site
2. Test user registration/login
3. Test product browsing
4. Test cart functionality
5. Test checkout process

---

## 🔐 Step 5: Security Configuration

### 5.1 Supabase RLS Policies
Ensure these policies are active:

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Products are publicly readable
CREATE POLICY "Products are publicly readable" ON products
    FOR SELECT USING (true);

-- Cart items are user-specific
CREATE POLICY "Users can manage own cart" ON cart_items
    FOR ALL USING (auth.uid() = user_id);
```

### 5.2 CORS Configuration
In your backend, ensure CORS is configured for your Vercel domain:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

---

## 📊 Step 6: Monitoring & Analytics

### 6.1 Vercel Analytics
1. Enable Vercel Analytics in your project
2. Monitor performance and user behavior

### 6.2 Supabase Monitoring
1. Use Supabase Dashboard for database monitoring
2. Set up alerts for errors and performance issues

### 6.3 Error Tracking
Consider adding:
- [Sentry](https://sentry.io) for error tracking
- [LogRocket](https://logrocket.com) for session replay

---

## 🚀 Step 7: Production Checklist

### ✅ Pre-deployment
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates enabled
- [ ] Domain configured
- [ ] Error monitoring set up

### ✅ Post-deployment
- [ ] Test user registration
- [ ] Test product browsing
- [ ] Test cart functionality
- [ ] Test checkout process
- [ ] Test payment integration
- [ ] Test admin dashboard
- [ ] Test email notifications

### ✅ Security
- [ ] RLS policies active
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation working
- [ ] Payment security verified

---

## 🔧 Troubleshooting

### Common Issues

#### Frontend Build Failures
```bash
# Check for TypeScript errors
cd morandi && npm run type-check

# Fix Tailwind issues
npm install @tailwindcss/postcss
```

#### Backend Connection Issues
```bash
# Check environment variables
echo $SUPABASE_URL
echo $JWT_SECRET

# Test database connection
npm run test:db
```

#### Database Migration Issues
```bash
# Reset local database
supabase db reset

# Apply migrations manually
supabase db push
```

---

## 📞 Support

If you encounter issues:

1. **Check the logs** in Vercel/Railway dashboards
2. **Verify environment variables** are set correctly
3. **Test locally** with the same environment
4. **Check Supabase logs** for database issues
5. **Review the QA reports** in the `/qa` directory

---

**Deployment Status**: 🟡 **READY FOR DEPLOYMENT**  
**Last Updated**: December 2024  
**Next Steps**: Follow the steps above to deploy to production 