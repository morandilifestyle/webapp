# System Architecture - Morandi Lifestyle E-commerce Website

## Technology Stack Selection

### Frontend Technology Stack

#### React.js with Next.js
**Rationale**: 
- **SEO Optimization**: Next.js provides server-side rendering (SSR) and static site generation (SSG) for better search engine visibility
- **Performance**: Built-in optimization features like image optimization, code splitting, and automatic bundling
- **Developer Experience**: Excellent developer tools, hot reloading, and TypeScript support
- **Ecosystem**: Rich ecosystem of libraries and components
- **Scalability**: Can handle complex e-commerce requirements with ease

#### Tailwind CSS with ShadCN UI
**Rationale**:
- **Rapid Development**: Utility-first CSS framework for fast styling
- **Design Consistency**: Pre-built components that follow your brand guidelines
- **Responsive Design**: Built-in responsive utilities
- **Customization**: Easy to customize colors, spacing, and components
- **Performance**: Small bundle size and optimized CSS

#### TypeScript
**Rationale**:
- **Type Safety**: Reduces bugs and improves code quality
- **Better IDE Support**: Enhanced autocomplete and error detection
- **Maintainability**: Easier to maintain and refactor code
- **Team Collaboration**: Clear interfaces and type definitions

### Backend Technology Stack

#### Node.js with Express.js
**Rationale**:
- **JavaScript Ecosystem**: Same language for frontend and backend
- **Performance**: Non-blocking I/O for handling concurrent requests
- **Scalability**: Easy to scale horizontally
- **Rich Ecosystem**: Extensive npm packages for e-commerce features
- **Rapid Development**: Quick to prototype and iterate

#### TypeScript for Backend
**Rationale**:
- **Consistency**: Same language across full stack
- **Type Safety**: Prevents runtime errors
- **Better APIs**: Self-documenting API interfaces
- **Maintainability**: Easier to maintain complex business logic

### Database Technology Stack

#### PostgreSQL
**Rationale**:
- **ACID Compliance**: Ensures data integrity for financial transactions
- **Complex Queries**: Excellent support for complex e-commerce queries
- **JSON Support**: Native JSONB for flexible product attributes
- **Scalability**: Can handle large datasets and concurrent users
- **Open Source**: Cost-effective and well-supported

#### Redis
**Rationale**:
- **Session Management**: Fast session storage
- **Caching**: Improve performance for frequently accessed data
- **Real-time Features**: Support for real-time notifications
- **Queue Management**: Handle background jobs and email queues

### Payment & Integrations

#### Razorpay
**Rationale**:
- **Indian Market**: Optimized for Indian payment methods
- **Multiple Payment Options**: UPI, cards, net banking, wallets
- **Security**: PCI DSS compliant
- **Developer Friendly**: Well-documented APIs
- **Analytics**: Built-in payment analytics

#### AWS S3
**Rationale**:
- **Scalability**: Handle large product image libraries
- **CDN Integration**: Global content delivery
- **Cost Effective**: Pay only for what you use
- **Security**: Built-in encryption and access controls

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Redis Cache   │    │   File Storage  │
│  (Cloudflare)   │    │   (Sessions)    │    │    (AWS S3)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Microservices Architecture

#### Core Services
1. **User Service**: Authentication, profiles, preferences
2. **Product Service**: Catalog, inventory, search
3. **Order Service**: Order processing, tracking
4. **Payment Service**: Razorpay integration, transactions
5. **Notification Service**: Email, SMS, push notifications
6. **Analytics Service**: Business intelligence, reporting

#### Communication Pattern
- **Synchronous**: REST APIs for immediate responses
- **Asynchronous**: Message queues for background processing
- **Event-Driven**: Real-time updates and notifications

## Database Design and Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Product Categories Table
```sql
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Products Table
```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES product_categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    weight DECIMAL(8,2),
    dimensions JSONB, -- {length, width, height}
    attributes JSONB, -- {material, color, size, etc.}
    images JSONB, -- Array of image URLs
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Orders Table
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed, refunded
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    shipping_address JSONB,
    billing_address JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes for Performance
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Products
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(price);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_razorpay_order_id ON orders(razorpay_order_id);

-- Full-text search
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || description));
```

## API Design and Endpoints

### RESTful API Structure

#### Authentication Endpoints
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
POST   /api/auth/refresh           # Refresh token
POST   /api/auth/forgot-password   # Forgot password
POST   /api/auth/reset-password    # Reset password
GET    /api/auth/profile           # Get user profile
PUT    /api/auth/profile           # Update user profile
```

#### Product Endpoints
```
GET    /api/products               # List products with filters
GET    /api/products/:id           # Get product details
GET    /api/products/:id/reviews   # Get product reviews
POST   /api/products/:id/reviews   # Create product review
GET    /api/categories             # List categories
GET    /api/categories/:id         # Get category with products
GET    /api/search                 # Search products
```

#### Cart Endpoints
```
GET    /api/cart                   # Get cart items
POST   /api/cart/items             # Add item to cart
PUT    /api/cart/items/:id         # Update cart item
DELETE /api/cart/items/:id         # Remove cart item
POST   /api/cart/clear             # Clear cart
```

#### Order Endpoints
```
GET    /api/orders                 # List user orders
POST   /api/orders                 # Create order
GET    /api/orders/:id             # Get order details
PUT    /api/orders/:id/cancel      # Cancel order
GET    /api/orders/:id/tracking    # Get order tracking
```

#### Payment Endpoints
```
POST   /api/payments/create-order  # Create Razorpay order
POST   /api/payments/verify        # Verify payment
POST   /api/payments/refund        # Process refund
```

### API Response Format
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

## Frontend Architecture and Components

### Component Structure

#### Core Components
```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Loading.tsx
│   │   └── ErrorBoundary.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navigation.tsx
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── ProductReviews.tsx
│   │   └── ProductFilters.tsx
│   ├── cart/
│   │   ├── CartItem.tsx
│   │   ├── CartSummary.tsx
│   │   └── CartDrawer.tsx
│   ├── checkout/
│   │   ├── CheckoutForm.tsx
│   │   ├── PaymentForm.tsx
│   │   └── OrderSummary.tsx
│   └── admin/
│       ├── Dashboard.tsx
│       ├── ProductManager.tsx
│       └── OrderManager.tsx
```

#### Page Structure
```
src/
├── pages/
│   ├── index.tsx                 # Homepage
│   ├── products/
│   │   ├── index.tsx            # Product listing
│   │   └── [slug].tsx           # Product detail
│   ├── cart.tsx                 # Shopping cart
│   ├── checkout.tsx             # Checkout process
│   ├── account/
│   │   ├── profile.tsx          # User profile
│   │   ├── orders.tsx           # Order history
│   │   └── wishlist.tsx         # Wishlist
│   ├── admin/
│   │   ├── dashboard.tsx        # Admin dashboard
│   │   ├── products.tsx         # Product management
│   │   └── orders.tsx           # Order management
│   └── api/                     # API routes
```

### State Management

#### Context Structure
```typescript
// App Context
interface AppContextType {
  user: User | null;
  cart: CartItem[];
  wishlist: Product[];
  loading: boolean;
  error: string | null;
}

// Cart Context
interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

// Auth Context
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  loading: boolean;
}
```

## Backend Architecture and Services

### Service Layer Structure

#### Core Services
```
src/
├── services/
│   ├── auth/
│   │   ├── authService.ts
│   │   ├── jwtService.ts
│   │   └── passwordService.ts
│   ├── product/
│   │   ├── productService.ts
│   │   ├── categoryService.ts
│   │   └── searchService.ts
│   ├── order/
│   │   ├── orderService.ts
│   │   ├── cartService.ts
│   │   └── wishlistService.ts
│   ├── payment/
│   │   ├── razorpayService.ts
│   │   └── paymentService.ts
│   ├── notification/
│   │   ├── emailService.ts
│   │   ├── smsService.ts
│   │   └── notificationService.ts
│   └── analytics/
│       ├── analyticsService.ts
│       └── reportService.ts
```

#### Middleware Structure
```
src/
├── middleware/
│   ├── auth.ts                  # Authentication middleware
│   ├── validation.ts            # Request validation
│   ├── errorHandler.ts          # Error handling
│   ├── rateLimiter.ts           # Rate limiting
│   └── cors.ts                  # CORS configuration
```

## Folder Structure and File Organization

### Complete Project Structure
```
morandi-ecommerce/
├── frontend/                    # Next.js frontend
│   ├── public/
│   │   ├── images/
│   │   ├── icons/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── types/
│   │   ├── styles/
│   │   └── constants/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── tsconfig.json
├── backend/                     # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── database/
│   │   ├── utils/
│   │   ├── types/
│   │   └── config/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── shared/                      # Shared types and utilities
│   ├── types/
│   ├── constants/
│   └── utils/
├── docs/                        # Documentation
│   ├── api/
│   ├── deployment/
│   └── architecture/
├── scripts/                     # Build and deployment scripts
├── docker/                      # Docker configuration
├── .github/                     # GitHub Actions
├── package.json
└── README.md
```

## Development Environment Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- Git

### Local Development Setup

#### 1. Clone and Setup
```bash
git clone <repository-url>
cd morandi-ecommerce
npm install
```

#### 2. Environment Configuration
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
NEXT_PUBLIC_RAZORPAY_KEY_SECRET=your_razorpay_secret

# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/morandi_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
SENDGRID_API_KEY=your_sendgrid_key
```

#### 3. Database Setup
```bash
# Create database
createdb morandi_db

# Run migrations
npm run migrate

# Seed data
npm run seed
```

#### 4. Development Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "test": "npm run test:frontend && npm run test:backend",
    "lint": "npm run lint:frontend && npm run lint:backend"
  }
}
```

## Deployment Architecture

### Production Environment

#### Frontend Deployment (Vercel)
```yaml
# vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/api/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.morandi.com",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID": "@razorpay_key_id",
    "NEXT_PUBLIC_RAZORPAY_KEY_SECRET": "@razorpay_key_secret"
  }
}
```

#### Backend Deployment (Railway)
```yaml
# railway.json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "on_failure"
  }
}
```

## Security Considerations

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Prevent brute force attacks
- **CORS Configuration**: Restrict cross-origin requests
- **Input Validation**: Sanitize all user inputs

### Data Protection
- **SSL/TLS**: Encrypt all data in transit
- **Database Encryption**: Encrypt sensitive data at rest
- **PCI Compliance**: Secure payment data handling
- **GDPR Compliance**: User data privacy protection
- **Regular Security Audits**: Automated security scanning

## Performance and Scalability Considerations

### Frontend Optimization
- **Code Splitting**: Lazy load components and routes
- **Image Optimization**: Next.js automatic image optimization
- **Caching**: Browser and CDN caching strategies
- **Bundle Analysis**: Monitor bundle size
- **Progressive Web App**: Offline capabilities

### Backend Optimization
- **Database Indexing**: Optimize query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for frequently accessed data
- **Load Balancing**: Distribute traffic across instances
- **Horizontal Scaling**: Auto-scaling based on demand

### Monitoring and Analytics
- **Application Monitoring**: Error tracking and performance
- **Database Monitoring**: Query performance and health
- **User Analytics**: Behavior tracking and insights
- **Business Metrics**: Sales and conversion tracking
- **Alerting**: Proactive issue detection

## Conclusion

This architecture provides a robust, scalable foundation for the Morandi Lifestyle e-commerce website. The technology stack is modern, well-supported, and optimized for performance and security. The modular design allows for easy maintenance and future enhancements while ensuring a smooth development experience.

The architecture supports all the requirements outlined in the PRD, including secure payment processing, comprehensive product management, user-friendly interfaces, and robust admin capabilities. The deployment strategy ensures high availability and performance in production. 