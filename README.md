# Morandi Lifestyle E-commerce Platform

A premium e-commerce platform for sustainable wellness textiles, built with Next.js, Express.js, and Supabase.

## 🚀 Project Status

**Current Status**: 🔍 **UNDER REVIEW** - Critical fixes required before deployment  
**Last Updated**: December 2024  
**Deployment Readiness**: ❌ **NOT READY** - See [DEV_REVIEW_QA_REPORT.md](./DEV_REVIEW_QA_REPORT.md)

### 📊 Implementation Progress
- ✅ **User Stories**: All 8 user stories implemented
- ✅ **Database**: Complete schema with migrations
- ✅ **Frontend**: Modern UI with responsive design
- ❌ **Build System**: Critical compilation errors
- ❌ **Testing**: Multiple test failures
- ❌ **Environment**: Supabase configuration needed

## 🚨 Critical Issues (Must Fix Before Deployment)

1. **Build System Failures** - Frontend compilation errors
2. **Test Configuration Issues** - Missing dependencies and setup
3. **Environment Configuration** - Supabase keys not configured
4. **Payment Integration** - Razorpay credentials needed

See [DEV_REVIEW_QA_REPORT.md](./DEV_REVIEW_QA_REPORT.md) for detailed analysis.

## 🚀 Features

- **Modern Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Express.js
- **Authentication**: JWT-based auth with Supabase Auth
- **Database**: PostgreSQL with Supabase
- **Payment**: Razorpay integration
- **Responsive Design**: Mobile-first approach with DaisyUI
- **SEO Optimized**: Next.js SSR/SSG for better search visibility
- **Security**: Helmet, rate limiting, CORS protection

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase CLI
- Git
- Docker (for local Supabase)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd morandi
   ```

2. **Install dependencies**
   ```bash
   npm run setup
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start Supabase locally**
   ```bash
   supabase start
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start development servers**
   ```bash
   npm run dev
   ```

## 🔧 Environment Configuration

### Required Environment Variables

Copy `env.example` to `.env` and configure:

```env
# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Supabase Configuration (CRITICAL - Must be configured)
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=24h

# Email Configuration (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@morandi-lifestyle.com
SENDGRID_FROM_NAME=Morandi Lifestyle

# Razorpay Configuration (CRITICAL - Must be configured)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Redis Configuration
REDIS_URL=redis://localhost:6379

# AWS S3 Configuration (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=morandi-lifestyle-assets

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database (if using external PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/morandi
```

### Supabase Setup

1. **Create Supabase Project**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Create new project
   supabase projects create morandi-lifestyle
   ```

2. **Get Project Credentials**
   - Go to your Supabase dashboard
   - Navigate to Settings > API
   - Copy the Project URL and anon key
   - Update your `.env` file

3. **Push Database Schema**
   ```bash
   supabase db push
   ```

### Payment Gateway Setup

1. **Razorpay Account**
   - Create account at [razorpay.com](https://razorpay.com)
   - Get API keys from dashboard
   - Update `.env` with credentials

2. **Test Payment Flow**
   - Use test credentials for development
   - Validate payment verification

## 🏗️ Project Structure

```
morandi/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   └── package.json
├── morandi/                 # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js 14 app directory
│   │   ├── components/     # React components
│   │   ├── lib/            # Utility libraries
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # State management
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── package.json
├── supabase/               # Database and auth
│   ├── migrations/         # Database migrations
│   └── config.toml        # Supabase configuration
├── stories/               # User stories and requirements
├── planning/              # Project planning documents
└── package.json           # Root package.json
```

## 🚀 Development Commands

### Root Commands
```bash
npm run dev              # Start all development servers
npm run build            # Build frontend and backend
npm run test             # Run all tests
npm run lint             # Lint all code
npm run format           # Format code with Prettier
```

### Frontend Commands (morandi/)
```bash
cd morandi
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint TypeScript/React code
```

### Backend Commands (backend/)
```bash
cd backend
npm run dev              # Start Express.js dev server
npm run build            # Build TypeScript
npm run start            # Start production server
npm run test             # Run tests
```

### Database Commands
```bash
npm run db:reset         # Reset database
npm run db:migrate       # Apply migrations
npm run db:seed          # Seed database
npm run studio           # Open Supabase Studio
```

## 🌐 Available URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Supabase Studio**: http://localhost:54323
- **API Health Check**: http://localhost:3001/health

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/category/:slug` - Get products by category
- `GET /api/products/featured/list` - Get featured products

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove/:id` - Remove item from cart

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/addresses` - Get user addresses
- `POST /api/users/addresses` - Add new address
- `PUT /api/users/addresses/:id` - Update address
- `DELETE /api/users/addresses/:id` - Delete address

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts and profiles
- `user_addresses` - User shipping/billing addresses
- `product_categories` - Product categories
- `products` - Product catalog
- `cart_items` - Shopping cart items
- `orders` - Customer orders
- `order_items` - Order line items
- `order_tracking` - Order status tracking
- `wishlist_items` - User wishlist
- `reviews` - Product reviews
- `blog_posts` - Blog content

## 🎨 Design System

### Colors
- **Primary**: Blue (#0ea5e9)
- **Secondary**: Purple (#d946ef)
- **Accent**: Yellow (#eab308)

### Typography
- **Sans**: Inter (UI text)
- **Serif**: Playfair Display (headings)

### Components
- Built with DaisyUI and Tailwind CSS
- Custom component classes in `globals.css`
- Responsive design with mobile-first approach

## 🧪 Testing

```bash
# Frontend tests
cd morandi && npm run test

# Backend tests
cd backend && npm run test

# All tests
npm run test
```

**Note**: Tests currently have configuration issues that need to be resolved.

## 📦 Deployment

### Pre-Deployment Checklist
- [ ] Fix all build compilation errors
- [ ] Resolve test configuration issues
- [ ] Configure Supabase environment
- [ ] Set up payment gateway credentials
- [ ] Complete end-to-end testing
- [ ] Security review and validation

### Frontend Deployment (Vercel)
```bash
cd morandi
npm run build
# Deploy to Vercel
```

### Backend Deployment (Railway)
```bash
cd backend
npm run build
# Deploy to Railway
```

### Database Deployment (Supabase)
```bash
supabase db push
```

## 🚨 Known Issues

### Build Issues
- Frontend compilation errors with duplicate imports
- Next.js configuration warnings
- TypeScript compilation errors

### Test Issues
- Missing test dependencies
- Jest configuration problems
- Context provider setup needed

### Environment Issues
- Supabase credentials not configured
- Payment gateway setup incomplete
- Missing environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check [DEV_REVIEW_QA_REPORT.md](./DEV_REVIEW_QA_REPORT.md) for current status
- Review existing issues
- Create new issue with detailed description

---

**Last Updated**: December 2024  
**Status**: 🔍 **UNDER REVIEW** - Critical fixes required  
**Next Review**: After build and test issues are resolved 