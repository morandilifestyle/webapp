# User Story: Checkout and Payment Process

## Story Information
- **Story ID**: US-004
- **Epic**: Shopping Experience
- **Priority**: High
- **Story Points**: 13

## User Story
**As a** customer  
**I want** to complete my purchase securely with multiple payment options  
**So that** I can buy sustainable textile products with confidence and convenience

## Acceptance Criteria
1. **Checkout Flow**
   - Multi-step checkout process (cart review → shipping → payment → confirmation)
   - Progress indicator shows current step
   - Users can navigate back to previous steps
   - Guest checkout option available
   - Order summary shows all items and costs
   - Real-time stock validation during checkout

2. **Shipping Information**
   - User can enter shipping address or select saved addresses
   - Address validation with auto-complete
   - Multiple shipping options (standard, express, premium)
   - Shipping cost calculation based on weight and location
   - Estimated delivery dates for each shipping option
   - International shipping support for select countries

3. **Payment Integration**
   - Razorpay integration for Indian payment methods
   - Support for UPI, credit/debit cards, net banking, wallets
   - Secure payment gateway with PCI compliance
   - Payment method selection with icons
   - Saved payment methods for registered users
   - Guest payment without account creation

4. **Order Processing**
   - Order confirmation with unique order number
   - Email confirmation sent to customer
   - SMS notification for order status
   - Inventory updated immediately after successful payment
   - Order tracking number generated for shipping
   - Order history accessible in user account

5. **Security and Validation**
   - SSL/TLS encryption for all payment data
   - Payment verification before order confirmation
   - Fraud detection and prevention measures
   - Address verification and validation
   - Stock availability final check before payment
   - Payment timeout handling

6. **Error Handling**
   - Clear error messages for payment failures
   - Retry mechanisms for failed payments
   - Cart preservation during payment issues
   - Graceful handling of network timeouts
   - Support for partial payment failures

## Technical Implementation Notes

### Frontend Implementation
- **Checkout Wizard**: Multi-step form with validation
- **Address Form**: Auto-complete with Google Places API
- **Payment Form**: Razorpay SDK integration
- **Order Summary**: Real-time calculation updates
- **Progress Indicator**: Visual step tracking
- **Error Handling**: User-friendly error messages

### Backend Implementation
- **Checkout Service**: Handle checkout flow and validation
- **Payment Service**: Razorpay integration and verification
- **Shipping Service**: Calculate shipping costs and options
- **Order Service**: Create and manage orders
- **Notification Service**: Email and SMS confirmations
- **Inventory Service**: Real-time stock management

### Database Schema
```sql
-- Orders table (extended from architecture)
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
    shipping_method VARCHAR(50),
    tracking_number VARCHAR(100),
    estimated_delivery DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    attributes JSONB, -- Selected product attributes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) NOT NULL, -- pending, success, failed, refunded
    payment_method VARCHAR(50),
    gateway_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints
```
POST /api/checkout/init              # Initialize checkout
POST /api/checkout/validate          # Validate checkout data
POST /api/checkout/shipping          # Calculate shipping options
POST /api/payments/create-order      # Create Razorpay order
POST /api/payments/verify            # Verify payment
POST /api/payments/refund            # Process refund
GET  /api/orders/:id                 # Get order details
GET  /api/orders/:id/tracking        # Get order tracking
```

### Razorpay Integration
```javascript
// Frontend payment integration
const options = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  amount: orderAmount * 100, // Convert to paise
  currency: "INR",
  name: "Morandi Lifestyle",
  description: "Sustainable Textile Products",
  order_id: razorpayOrderId,
  handler: function (response) {
    // Handle successful payment
    verifyPayment(response);
  },
  prefill: {
    name: user.name,
    email: user.email,
    contact: user.phone
  },
  theme: {
    color: "#10B981" // Morandi brand green
  }
};

const rzp = new Razorpay(options);
rzp.open();
```

### Checkout Flow
```typescript
interface CheckoutState {
  step: 'cart' | 'shipping' | 'payment' | 'confirmation';
  cart: CartItem[];
  shipping: {
    address: Address;
    method: ShippingMethod;
    cost: number;
  };
  payment: {
    method: PaymentMethod;
    razorpayOrderId?: string;
  };
  order: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
}
```

## Dependencies and Prerequisites
- **Cart System**: Shopping cart must be functional
- **User System**: User authentication and address management
- **Product System**: Product inventory and pricing
- **Payment Gateway**: Razorpay account and API credentials
- **Email Service**: SendGrid for order confirmations
- **SMS Service**: Twilio or similar for SMS notifications

## Definition of Done
- [ ] Multi-step checkout flow works smoothly
- [ ] Guest checkout is available and functional
- [ ] Address validation and auto-complete works
- [ ] Shipping cost calculation is accurate
- [ ] Razorpay payment integration works for all payment methods
- [ ] Order confirmation emails are sent successfully
- [ ] Order tracking numbers are generated
- [ ] Inventory is updated after successful payment
- [ ] Payment verification prevents fraud
- [ ] Error handling works for all failure scenarios
- [ ] Mobile checkout experience is optimized
- [ ] SSL/TLS encryption is properly implemented
- [ ] Unit tests cover all checkout functions
- [ ] Integration tests verify end-to-end checkout flow
- [ ] Performance testing shows checkout completion under 30 seconds
- [ ] Accessibility requirements are met (WCAG 2.1 AA)

## Story Points Estimation
**13 Story Points** - This is a large story involving complex payment integration, security considerations, and comprehensive order processing.

## Risk Assessment
- **High Risk**: Payment gateway integration complexity
- **Medium Risk**: Address validation and shipping calculation accuracy
- **Low Risk**: Email/SMS delivery reliability
- **Mitigation**: Thorough testing of payment flows and fallback mechanisms

## Notes
- Consider implementing order cancellation and refund processes
- Plan for international shipping and currency conversion
- Ensure compliance with Indian e-commerce regulations
- Consider implementing subscription/recurring payment options 