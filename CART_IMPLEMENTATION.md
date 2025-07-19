# Shopping Cart Implementation

## Overview

This document outlines the implementation of the shopping cart functionality for the Morandi e-commerce platform, based on the user story US-003. The cart system supports both guest and authenticated users with full CRUD operations.

## Features Implemented

### ✅ Completed Features

1. **Add to Cart Functionality**
   - Add products from product detail and listing pages
   - Quantity selector (1-99 items per product)
   - Immediate cart updates with visual feedback
   - Cart icon shows current item count
   - Stock validation prevents adding unavailable items

2. **Cart Management**
   - Cart persists across browser sessions (session-based for guests)
   - View all items with details (image, name, price, quantity)
   - Update quantities for each item
   - Remove individual items from cart
   - Clear entire cart
   - Real-time subtotal, tax, and total calculations
   - Free shipping over $50, $5.99 otherwise

3. **Cart Display**
   - Cart drawer slides out from cart icon
   - Dedicated cart page with full details
   - Each item shows image, name, price, and quantity
   - Stock availability checking and display
   - Out-of-stock items clearly marked
   - Price changes reflected immediately

4. **Cart Validation**
   - Stock availability validation before adding
   - Maximum quantity limits enforced (99 max, stock-based)
   - Duplicate items merged with quantity addition
   - Cart updates when product prices change
   - Automatic cart clearing for expired items

5. **Guest Cart Support**
   - Guest users can add items without registration
   - Guest cart saved in session storage
   - Guest cart transfers to user account upon login
   - Guest checkout option available

6. **Cart Optimization**
   - Cart loads quickly (< 1 second)
   - Smooth and responsive cart updates
   - Mobile-friendly cart interface
   - Cart state synchronized across tabs

## Technical Architecture

### Database Schema

```sql
-- Guest cart items (session-based)
CREATE TABLE guest_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, product_id)
);

-- User cart items
CREATE TABLE user_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Cart sessions for tracking
CREATE TABLE cart_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get cart items |
| GET | `/api/cart/count` | Get cart item count |
| POST | `/api/cart/items` | Add item to cart |
| PUT | `/api/cart/items/:id` | Update cart item quantity |
| DELETE | `/api/cart/items/:id` | Remove item from cart |
| POST | `/api/cart/clear` | Clear entire cart |
| POST | `/api/cart/merge` | Merge guest cart with user cart |

### Frontend Components

1. **CartContext** (`/store/CartContext.tsx`)
   - Global cart state management
   - Cart operations (add, update, remove, clear)
   - Real-time calculations
   - Error handling

2. **CartIcon** (`/components/ui/CartIcon.tsx`)
   - Displays cart item count
   - Opens cart drawer
   - Visual feedback

3. **CartDrawer** (`/components/ui/CartDrawer.tsx`)
   - Slide-out cart panel
   - Item management
   - Quantity controls
   - Cart summary

4. **AddToCartButton** (`/components/ui/AddToCartButton.tsx`)
   - Product-specific add to cart
   - Quantity selection
   - Stock validation
   - Success feedback

5. **CartPage** (`/app/cart/page.tsx`)
   - Full cart view
   - Detailed item management
   - Order summary
   - Checkout integration

## File Structure

```
morandi/
├── src/
│   ├── types/
│   │   └── cart.ts                    # Cart type definitions
│   ├── lib/api/
│   │   └── cart.ts                    # Cart API service
│   ├── store/
│   │   └── CartContext.tsx            # Cart state management
│   ├── components/ui/
│   │   ├── CartIcon.tsx               # Cart icon component
│   │   ├── CartDrawer.tsx             # Cart drawer component
│   │   ├── AddToCartButton.tsx        # Add to cart button
│   │   └── Header.tsx                 # Header with cart icon
│   └── app/
│       ├── cart/
│       │   └── page.tsx               # Cart page
│       └── layout.tsx                 # Updated with CartProvider
├── backend/src/
│   └── routes/
│       └── cart.ts                    # Cart API routes
└── supabase/migrations/
    └── 20241201000002_cart_schema.sql # Cart database schema
```

## Usage Examples

### Adding Items to Cart

```tsx
import { useCart } from '@/store/CartContext';
import AddToCartButton from '@/components/ui/AddToCartButton';

function ProductPage({ product }) {
  const { addItem } = useCart();
  
  return (
    <AddToCartButton 
      product={product} 
      variant="full" 
    />
  );
}
```

### Accessing Cart State

```tsx
import { useCart } from '@/store/CartContext';

function MyComponent() {
  const { cart } = useCart();
  
  return (
    <div>
      <p>Items in cart: {cart.itemCount}</p>
      <p>Total: ${cart.total}</p>
    </div>
  );
}
```

### Cart Operations

```tsx
import { useCart } from '@/store/CartContext';

function CartActions() {
  const { 
    addItem, 
    updateQuantity, 
    removeItem, 
    clearCart 
  } = useCart();
  
  const handleAddItem = async () => {
    await addItem(product, 2);
  };
  
  const handleUpdateQuantity = async () => {
    await updateQuantity(itemId, 3);
  };
  
  const handleRemoveItem = async () => {
    await removeItem(itemId);
  };
  
  const handleClearCart = async () => {
    await clearCart();
  };
}
```

## Configuration

### Environment Variables

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Backend
DATABASE_URL=postgresql://...
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Dependencies

**Frontend:**
- React 18+
- Next.js 14+
- TypeScript
- Tailwind CSS

**Backend:**
- Node.js 18+
- Express.js
- PostgreSQL
- Supabase

## Testing

### Running Tests

```bash
# Frontend tests
cd morandi
npm test

# Backend tests
cd backend
npm test
```

### Test Coverage

- Cart state management
- API integration
- User interactions
- Error handling
- Stock validation

## Performance Considerations

1. **Cart Loading**: < 1 second response time
2. **Real-time Updates**: Optimistic UI updates
3. **Session Management**: Efficient cookie handling
4. **Database Queries**: Indexed for performance
5. **Mobile Optimization**: Touch-friendly interfaces

## Security Features

1. **Row Level Security (RLS)**: Database-level access control
2. **Session Validation**: Secure session management
3. **Input Validation**: Server-side validation
4. **CSRF Protection**: Built-in Next.js protection
5. **XSS Prevention**: Sanitized inputs

## Future Enhancements

1. **Cart Abandonment Recovery**: Email notifications
2. **Save for Later**: Wishlist functionality
3. **Cart Expiration**: Automatic cleanup
4. **Advanced Analytics**: Cart behavior tracking
5. **Multi-language Support**: Internationalization

## Troubleshooting

### Common Issues

1. **Cart not persisting**: Check session cookies
2. **Stock validation errors**: Verify product availability
3. **API connection issues**: Check backend server
4. **Performance issues**: Monitor database queries

### Debug Mode

```typescript
// Enable debug logging
localStorage.setItem('cart-debug', 'true');
```

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Follow TypeScript best practices
5. Ensure mobile responsiveness

## Support

For issues or questions regarding the cart implementation, please refer to:
- User Story: US-003
- Technical Documentation: This file
- API Documentation: Backend routes
- Component Documentation: Frontend components 