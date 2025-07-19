# 🎨 Morandi E-commerce Platform - Application Overview

**Project**: Morandi Lifestyle E-commerce Platform  
**Status**: 🔍 **UNDER REVIEW** - Critical fixes required  
**Last Updated**: December 2024

---

## 🖥️ Frontend Overview (Next.js 14)

### 🏠 Homepage Design

The homepage features a modern, clean design with:

#### Hero Section
```tsx
// Beautiful gradient background with compelling copy
<section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
  <h1 className="text-5xl md:text-6xl font-bold text-gradient mb-6">
    Sustainable Wellness Textiles
  </h1>
  <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
    Premium organic materials for maternity, healthcare, home, and hospitality.
  </p>
</section>
```

**Features:**
- ✅ Responsive design with mobile-first approach
- ✅ Modern gradient backgrounds
- ✅ Clear call-to-action buttons
- ✅ Professional typography

#### Category Showcase
```tsx
// Four main categories with icons and descriptions
{[
  {
    title: 'Maternity & Baby Care',
    description: 'Safe, organic products for expecting mothers and newborns',
    icon: '🏥'
  },
  // ... other categories
]}
```

**Categories:**
- 🏥 **Maternity & Baby Care** - Organic products for mothers and babies
- 🏥 **Healthcare Textiles** - Medical-grade sustainable textiles
- 🏠 **Home & Bedding** - Comfortable, sustainable home textiles
- 🏨 **Hospitality Solutions** - Luxury textiles for hotels and hospitality

#### Features Section
```tsx
// Three key value propositions
{[
  { icon: '🌱', title: '100% Organic', description: 'Certified organic materials' },
  { icon: '♻️', title: 'Eco-Friendly', description: 'Sustainable practices' },
  { icon: '✨', title: 'Premium Quality', description: 'Exceptional craftsmanship' }
]}
```

### 🛍️ Product Catalog

#### Product Card Component
```tsx
// Advanced product card with hover effects
<div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
  {/* Image with hover effect */}
  <Image src={mainImage} alt={product.name} className="object-cover" />
  
  {/* Product badges */}
  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
    Organic
  </span>
  
  {/* Product info */}
  <h3 className="font-medium text-gray-900">{product.name}</h3>
  <span className="text-lg font-bold">{formatPrice(product.price)}</span>
  
  {/* Add to cart button */}
  <AddToCartButton product={product} />
</div>
```

**Features:**
- ✅ Image hover effects with secondary images
- ✅ Product badges (Organic, Sale, Featured)
- ✅ Price formatting with sale prices
- ✅ Stock status indicators
- ✅ Quick action buttons (wishlist, cart)
- ✅ Responsive design

### 🛒 Shopping Cart

#### Cart Icon Component
```tsx
// Cart icon with item count
<div className="relative">
  <svg className="w-6 h-6" fill="none" stroke="currentColor">
    {/* Shopping cart icon */}
  </svg>
  {cartItemCount > 0 && (
    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
      {cartItemCount}
    </span>
  )}
</div>
```

#### Cart Drawer
```tsx
// Slide-out cart drawer
<div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50">
  <div className="flex items-center justify-between p-4 border-b">
    <h2 className="text-lg font-semibold">Shopping Cart</h2>
    <button className="p-2 text-gray-400 hover:text-gray-600">
      {/* Close button */}
    </button>
  </div>
  {/* Cart items list */}
  {/* Cart total and checkout button */}
</div>
```

### 🎨 Design System

#### Color Palette
```css
/* Primary colors */
--primary-50: #eff6ff;
--primary-600: #2563eb;
--primary-700: #1d4ed8;

/* Secondary colors */
--secondary-50: #fdf4ff;
--secondary-600: #c026d3;
--secondary-700: #a21caf;

/* Accent colors */
--accent-500: #f59e0b;
```

#### Typography
- **Headings**: Inter (sans-serif) for UI text
- **Body**: Inter for readability
- **Display**: Playfair Display for headings

#### Components
- **Buttons**: Primary, secondary, outline variants
- **Cards**: Product cards, category cards, feature cards
- **Forms**: Input fields, select dropdowns, checkboxes
- **Navigation**: Header, footer, breadcrumbs

---

## ⚙️ Backend Overview (Express.js)

### 🏗️ Server Architecture

#### Main Server Setup
```typescript
// Express.js server with security middleware
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
```

#### API Routes Structure
```typescript
// RESTful API endpoints
app.use('/api/auth', require('./routes/auth'));        // Authentication
app.use('/api/products', require('./routes/products')); // Product catalog
app.use('/api/categories', require('./routes/categories')); // Categories
app.use('/api/orders', require('./routes/orders'));     // Order management
app.use('/api/users', require('./routes/users'));       // User management
app.use('/api/cart', require('./routes/cart'));         // Shopping cart
app.use('/api/admin', require('./routes/admin'));       // Admin dashboard
app.use('/api/wishlist', require('./routes/wishlist')); // Wishlist
app.use('/api/reviews', require('./routes/reviews'));   // Product reviews
app.use('/api/blog', require('./routes/blog'));         // Blog content
```

### 📊 Database Schema (Supabase/PostgreSQL)

#### Core Tables
```sql
-- Product categories with hierarchy
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    is_active BOOLEAN DEFAULT true
);

-- Products with search optimization
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES product_categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    attributes JSONB, -- {material, color, size, organic_certified}
    images JSONB, -- Array of image URLs
    stock_quantity INTEGER DEFAULT 0,
    search_vector tsvector -- For full-text search
);

-- Users with authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true
);

-- Shopping cart
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders and order items
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 🔐 Security Features

#### Authentication & Authorization
```typescript
// JWT-based authentication
const jwt = require('jsonwebtoken');

// Password hashing with bcrypt
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);

// Row Level Security (RLS) policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);
```

#### Payment Security
```typescript
// Razorpay signature verification
const crypto = require('crypto');

const verifyPayment = (paymentId, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(paymentId + '|' + orderId)
    .digest('hex');
  
  return expectedSignature === signature;
};
```

### 📈 API Endpoints

#### Product API
```typescript
// Get all products with filtering and search
GET /api/products?page=1&limit=12&category=maternity&search=organic&sort=price_asc

// Get single product
GET /api/products/:slug

// Get products by category
GET /api/products/category/:categorySlug

// Get featured products
GET /api/products/featured/list
```

#### Cart API
```typescript
// Get user cart
GET /api/cart

// Add item to cart
POST /api/cart/add
{
  "product_id": "uuid",
  "quantity": 2
}

// Update cart item
PUT /api/cart/update
{
  "item_id": "uuid",
  "quantity": 3
}

// Remove item from cart
DELETE /api/cart/remove/:id
```

#### Order API
```typescript
// Get user orders
GET /api/orders

// Create new order
POST /api/orders
{
  "items": [...],
  "shipping_address": {...},
  "payment_method": "razorpay"
}

// Get order details
GET /api/orders/:id

// Update order status
PATCH /api/orders/:id/status
{
  "status": "shipped"
}
```

---

## 🔄 Frontend-Backend Integration

### 📡 API Communication

#### Product Fetching
```typescript
// Frontend API call
const fetchProducts = async (params) => {
  const response = await fetch(`/api/products?${new URLSearchParams(params)}`);
  const data = await response.json();
  return data;
};

// Backend response
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 150,
    "totalPages": 13
  }
}
```

#### Cart State Management
```typescript
// React Context for cart state
const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const addToCart = async (productId, quantity) => {
    setLoading(true);
    try {
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity })
      });
      const data = await response.json();
      setCartItems(data.cart_items);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, loading }}>
      {children}
    </CartContext.Provider>
  );
};
```

### 🔐 Authentication Flow

#### Login Process
```typescript
// Frontend login
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    setUser(data.user);
  }
};

// Backend login handler
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Verify user credentials
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({ token, user: { id: user.id, email: user.email, name: user.first_name } });
});
```

---

## 🎯 Key Features Overview

### ✅ Implemented Features

#### User Experience
- 🏠 **Modern Homepage** - Beautiful hero section with category showcase
- 🛍️ **Product Catalog** - Advanced filtering, search, and sorting
- 🛒 **Shopping Cart** - Real-time updates with persistent storage
- 💳 **Checkout Process** - Multi-step wizard with payment integration
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS

#### Admin Features
- 📊 **Admin Dashboard** - Product, order, and user management
- 📝 **Content Management** - Blog posts and product descriptions
- 📈 **Analytics** - Sales reports and user insights
- 🔧 **Inventory Management** - Stock tracking and low stock alerts

#### Technical Features
- 🔐 **Authentication** - JWT-based auth with password hashing
- 🔒 **Security** - RLS policies, CORS, rate limiting, Helmet
- 💳 **Payment Integration** - Razorpay with signature verification
- 📧 **Email Notifications** - Order confirmations and status updates
- 🔍 **Search** - Full-text search with PostgreSQL
- 📱 **PWA Ready** - Service workers and offline capabilities

### ❌ Current Issues

#### Build System
- Frontend compilation errors with duplicate imports
- Tailwind CSS configuration issues
- TypeScript compilation errors

#### Testing
- Missing test dependencies
- Jest configuration problems
- Context provider setup needed

#### Environment
- Supabase credentials not configured
- Payment gateway setup incomplete
- Environment variables missing

---

## 🚀 Deployment Architecture

### Frontend (Vercel)
```
morandi-frontend/
├── src/
│   ├── app/                    # Next.js 14 app directory
│   │   ├── page.tsx           # Homepage
│   │   ├── products/          # Product pages
│   │   ├── cart/              # Cart page
│   │   ├── checkout/          # Checkout flow
│   │   └── admin/             # Admin dashboard
│   ├── components/            # React components
│   ├── lib/                   # Utility libraries
│   └── types/                 # TypeScript types
├── public/                    # Static assets
└── package.json
```

### Backend (Railway/Render)
```
morandi-backend/
├── src/
│   ├── routes/               # API routes
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Custom middleware
│   ├── services/             # Business logic
│   └── types/               # TypeScript types
├── dist/                    # Compiled JavaScript
└── package.json
```

### Database (Supabase)
```
supabase/
├── migrations/              # Database migrations
├── config.toml             # Supabase configuration
└── seed.sql               # Sample data
```

---

## 📊 Performance Metrics

### Frontend Performance
- **Bundle Size**: Optimized with Next.js
- **Image Optimization**: Automatic with Next.js Image component
- **Caching**: Static generation and ISR
- **Core Web Vitals**: Optimized for LCP, FID, CLS

### Backend Performance
- **Response Time**: < 500ms target
- **Database Queries**: Optimized with indexes
- **Rate Limiting**: 100 requests per 15 minutes
- **Caching**: Redis for session storage

### Database Performance
- **Full-text Search**: PostgreSQL GIN indexes
- **Query Optimization**: Proper indexing strategy
- **Connection Pooling**: Supabase managed
- **Backup**: Automatic daily backups

---

**Application Overview Generated**: December 2024  
**Status**: 🔍 **UNDER REVIEW** - All features implemented, deployment blocked by technical issues  
**Next Update**: After critical fixes are implemented 