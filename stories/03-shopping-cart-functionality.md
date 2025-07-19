# User Story: Shopping Cart Functionality

## Story Information
- **Story ID**: US-003
- **Epic**: Shopping Experience
- **Priority**: High
- **Story Points**: 5

## User Story
**As a** customer  
**I want** to add products to my cart and manage quantities  
**So that** I can purchase multiple items efficiently and review my selections before checkout

## Acceptance Criteria
1. **Add to Cart Functionality**
   - User can add products to cart from product detail pages
   - User can add products to cart from product listing pages
   - Quantity selector allows 1-99 items per product
   - Cart updates immediately when items are added
   - Visual feedback confirms item was added to cart
   - Cart icon shows current item count

2. **Cart Management**
   - Cart persists across browser sessions (localStorage/cookies)
   - User can view all items in cart with details
   - User can update quantities for each item
   - User can remove individual items from cart
   - User can clear entire cart
   - Cart shows subtotal, tax, and total calculations
   - Cart shows estimated shipping cost

3. **Cart Display**
   - Cart drawer/sidebar opens from cart icon
   - Cart page shows full cart details
   - Each item shows image, name, price, and quantity
   - Stock availability is checked and displayed
   - Out-of-stock items are clearly marked
   - Price changes are reflected immediately

4. **Cart Validation**
   - Stock availability is validated before adding to cart
   - Maximum quantity limits are enforced
   - Duplicate items are merged with quantity addition
   - Cart updates when product prices change
   - Cart clears expired items automatically

5. **Guest Cart Support**
   - Guest users can add items to cart without registration
   - Guest cart is saved in browser storage
   - Guest cart transfers to user account upon login
   - Guest checkout option is available

6. **Cart Optimization**
   - Cart loads quickly (< 1 second)
   - Cart updates are smooth and responsive
   - Mobile-friendly cart interface
   - Cart state is synchronized across tabs

## Technical Implementation Notes

### Frontend Implementation
- **Cart Context**: React context for cart state management
- **Cart Drawer**: Slide-out cart panel for quick access
- **Quantity Controls**: Increment/decrement buttons with input
- **Cart Page**: Full cart view with detailed information
- **Local Storage**: Persist cart data in browser
- **Real-time Updates**: WebSocket or polling for price updates

### Backend Implementation
- **Cart Service**: Handle cart operations and calculations
- **Stock Service**: Real-time stock validation
- **Price Service**: Calculate taxes and shipping
- **Session Management**: Cart persistence across sessions
- **Validation**: Stock and price validation

### Database Schema
```sql
-- Cart items for guest users (session-based)
CREATE TABLE guest_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, product_id)
);

-- Cart items for registered users
CREATE TABLE user_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Cart sessions for tracking
CREATE TABLE cart_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints
```
GET    /api/cart                    # Get cart items
POST   /api/cart/items              # Add item to cart
PUT    /api/cart/items/:id          # Update cart item quantity
DELETE /api/cart/items/:id          # Remove item from cart
POST   /api/cart/clear              # Clear entire cart
GET    /api/cart/count              # Get cart item count
POST   /api/cart/merge              # Merge guest cart with user cart
```

### Cart State Management
```typescript
interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  salePrice?: number;
  quantity: number;
  image: string;
  stock: number;
  maxQuantity: number;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
}

interface CartContextType {
  cart: CartState;
  addItem: (product: Product, quantity: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  mergeGuestCart: () => void;
}
```

## Dependencies and Prerequisites
- **Product System**: Products must be available and searchable
- **User System**: User authentication for registered user carts
- **Session Management**: Browser session handling for guest carts
- **Stock System**: Real-time stock validation
- **Price System**: Tax and shipping calculation

## Definition of Done
- [ ] Users can add products to cart from any product page
- [ ] Cart persists across browser sessions
- [ ] Users can update quantities and remove items
- [ ] Cart calculations are accurate (subtotal, tax, shipping, total)
- [ ] Stock validation prevents adding unavailable items
- [ ] Guest cart transfers to user account upon login
- [ ] Cart updates are immediate and smooth
- [ ] Mobile cart interface is touch-friendly
- [ ] Cart state is synchronized across browser tabs
- [ ] Cart performance is under 1 second for all operations
- [ ] Unit tests cover all cart operations
- [ ] Integration tests verify cart functionality
- [ ] Cart accessibility meets WCAG 2.1 AA standards
- [ ] Cart works correctly with different product types
- [ ] Error handling for stock/price validation failures

## Story Points Estimation
**5 Story Points** - This is a medium complexity story involving state management, persistence, and real-time validation.

## Risk Assessment
- **Medium Risk**: Cart synchronization across multiple tabs
- **Low Risk**: Stock validation timing issues
- **Mitigation**: Implement proper state management and real-time stock checking

## Notes
- Consider implementing cart abandonment recovery emails
- Plan for cart expiration after extended inactivity
- Ensure cart works with product variants and customizations
- Consider implementing save for later functionality 