# Test Cases - Morandi Lifestyle E-commerce Platform

## 📋 Test Case Categories

### 1. Authentication & User Management
### 2. Product Catalog & Search
### 3. Shopping Cart & Checkout
### 4. Order Management
### 5. User Profile & Settings
### 6. Admin Dashboard
### 7. Performance & Security
### 8. Mobile & Responsive Design

---

## 🔐 Authentication & User Management

### TC001: User Registration - Valid Data
**Priority**: High | **Severity**: Critical
- **Precondition**: User is on registration page
- **Test Data**: Valid email, password, first name, last name
- **Steps**:
  1. Navigate to registration page
  2. Enter valid email address
  3. Enter strong password (8+ chars, uppercase, lowercase, number)
  4. Enter first name and last name
  5. Click "Register" button
- **Expected Result**: User account created, verification email sent, redirect to login
- **Actual Result**: [To be filled during testing]

### TC002: User Registration - Invalid Email
**Priority**: High | **Severity**: Major
- **Precondition**: User is on registration page
- **Test Data**: Invalid email format
- **Steps**:
  1. Navigate to registration page
  2. Enter invalid email (e.g., "invalid-email")
  3. Enter valid password and names
  4. Click "Register" button
- **Expected Result**: Error message displayed, form not submitted
- **Actual Result**: [To be filled during testing]

### TC003: User Login - Valid Credentials
**Priority**: High | **Severity**: Critical
- **Precondition**: User account exists and is verified
- **Test Data**: Valid email and password
- **Steps**:
  1. Navigate to login page
  2. Enter valid email address
  3. Enter correct password
  4. Click "Login" button
- **Expected Result**: User logged in, redirected to dashboard
- **Actual Result**: [To be filled during testing]

### TC004: User Login - Invalid Credentials
**Priority**: High | **Severity**: Major
- **Precondition**: User account exists
- **Test Data**: Invalid email or password
- **Steps**:
  1. Navigate to login page
  2. Enter invalid email or password
  3. Click "Login" button
- **Expected Result**: Error message displayed, login failed
- **Actual Result**: [To be filled during testing]

### TC005: Password Reset
**Priority**: Medium | **Severity**: Major
- **Precondition**: User account exists
- **Test Data**: Valid email address
- **Steps**:
  1. Navigate to login page
  2. Click "Forgot Password" link
  3. Enter valid email address
  4. Click "Send Reset Link" button
- **Expected Result**: Reset email sent, confirmation message displayed
- **Actual Result**: [To be filled during testing]

---

## 🛍️ Product Catalog & Search

### TC006: Product Listing - Pagination
**Priority**: High | **Severity**: Critical
- **Precondition**: Products exist in database
- **Test Data**: Multiple products across categories
- **Steps**:
  1. Navigate to products page
  2. Verify products are displayed
  3. Scroll to bottom of page
  4. Click "Load More" or pagination
- **Expected Result**: Additional products load, pagination works correctly
- **Actual Result**: [To be filled during testing]

### TC007: Product Filtering - Category
**Priority**: High | **Severity**: Major
- **Precondition**: Products exist in different categories
- **Test Data**: Products in "Maternity & Baby Care" category
- **Steps**:
  1. Navigate to products page
  2. Click on "Maternity & Baby Care" filter
  3. Verify filtered results
- **Expected Result**: Only products from selected category displayed
- **Actual Result**: [To be filled during testing]

### TC008: Product Search - Valid Query
**Priority**: High | **Severity**: Major
- **Precondition**: Products exist in database
- **Test Data**: Search term "organic"
- **Steps**:
  1. Navigate to products page
  2. Enter "organic" in search box
  3. Press Enter or click search button
- **Expected Result**: Products containing "organic" in name/description displayed
- **Actual Result**: [To be filled during testing]

### TC009: Product Detail Page
**Priority**: High | **Severity**: Critical
- **Precondition**: Product exists in database
- **Test Data**: Specific product ID
- **Steps**:
  1. Navigate to product listing
  2. Click on a product
  3. Verify product details page loads
- **Expected Result**: Product details, images, price, description displayed
- **Actual Result**: [To be filled during testing]

---

## 🛒 Shopping Cart & Checkout

### TC010: Add Product to Cart
**Priority**: High | **Severity**: Critical
- **Precondition**: User is on product detail page
- **Test Data**: Product with available stock
- **Steps**:
  1. Navigate to product detail page
  2. Select quantity (if applicable)
  3. Click "Add to Cart" button
- **Expected Result**: Product added to cart, cart count updated
- **Actual Result**: [To be filled during testing]

### TC011: Remove Product from Cart
**Priority**: High | **Severity**: Major
- **Precondition**: Cart contains products
- **Test Data**: Product in cart
- **Steps**:
  1. Navigate to cart page
  2. Click "Remove" button for a product
  3. Confirm removal
- **Expected Result**: Product removed from cart, total updated
- **Actual Result**: [To be filled during testing]

### TC012: Update Cart Quantity
**Priority**: Medium | **Severity**: Major
- **Precondition**: Cart contains products
- **Test Data**: Product with quantity > 1
- **Steps**:
  1. Navigate to cart page
  2. Change quantity for a product
  3. Verify total updates
- **Expected Result**: Quantity updated, total recalculated
- **Actual Result**: [To be filled during testing]

### TC013: Guest Checkout
**Priority**: High | **Severity**: Critical
- **Precondition**: Cart contains products
- **Test Data**: Guest user information
- **Steps**:
  1. Navigate to checkout page
  2. Select "Guest Checkout"
  3. Fill in shipping information
  4. Fill in billing information
  5. Select payment method
  6. Complete payment
- **Expected Result**: Order placed successfully, confirmation page displayed
- **Actual Result**: [To be filled during testing]

### TC014: User Checkout
**Priority**: High | **Severity**: Critical
- **Precondition**: User is logged in, cart contains products
- **Test Data**: Logged-in user with saved addresses
- **Steps**:
  1. Navigate to checkout page
  2. Verify saved addresses are available
  3. Select shipping address
  4. Select billing address
  5. Select payment method
  6. Complete payment
- **Expected Result**: Order placed successfully, confirmation page displayed
- **Actual Result**: [To be filled during testing]

---

## 📦 Order Management

### TC015: Order Confirmation Email
**Priority**: Medium | **Severity**: Major
- **Precondition**: Order placed successfully
- **Test Data**: Order details
- **Steps**:
  1. Complete checkout process
  2. Check email inbox
- **Expected Result**: Order confirmation email received with order details
- **Actual Result**: [To be filled during testing]

### TC016: Order Tracking
**Priority**: Medium | **Severity**: Major
- **Precondition**: Order exists in system
- **Test Data**: Order number
- **Steps**:
  1. Navigate to order tracking page
  2. Enter order number
  3. Click "Track Order"
- **Expected Result**: Order status and tracking information displayed
- **Actual Result**: [To be filled during testing]

### TC017: Order History
**Priority**: Medium | **Severity**: Minor
- **Precondition**: User has placed orders
- **Test Data**: User account with order history
- **Steps**:
  1. Log in to user account
  2. Navigate to "My Orders"
- **Expected Result**: List of previous orders displayed
- **Actual Result**: [To be filled during testing]

---

## 👤 User Profile & Settings

### TC018: Update Profile Information
**Priority**: Medium | **Severity**: Major
- **Precondition**: User is logged in
- **Test Data**: Updated user information
- **Steps**:
  1. Navigate to profile page
  2. Update first name and last name
  3. Click "Save Changes"
- **Expected Result**: Profile information updated successfully
- **Actual Result**: [To be filled during testing]

### TC019: Add Shipping Address
**Priority**: Medium | **Severity**: Major
- **Precondition**: User is logged in
- **Test Data**: New shipping address
- **Steps**:
  1. Navigate to "My Addresses"
  2. Click "Add New Address"
  3. Fill in address details
  4. Click "Save Address"
- **Expected Result**: New address added to user's address book
- **Actual Result**: [To be filled during testing]

### TC020: Wishlist Management
**Priority**: Low | **Severity**: Minor
- **Precondition**: User is logged in
- **Test Data**: Product to add to wishlist
- **Steps**:
  1. Navigate to product detail page
  2. Click "Add to Wishlist"
  3. Navigate to wishlist page
- **Expected Result**: Product added to wishlist, visible in wishlist page
- **Actual Result**: [To be filled during testing]

---

## 🖥️ Admin Dashboard

### TC021: Admin Login
**Priority**: High | **Severity**: Critical
- **Precondition**: Admin account exists
- **Test Data**: Admin credentials
- **Steps**:
  1. Navigate to admin login page
  2. Enter admin email and password
  3. Click "Login"
- **Expected Result**: Admin logged in, redirected to dashboard
- **Actual Result**: [To be filled during testing]

### TC022: Product Management - Add Product
**Priority**: High | **Severity**: Critical
- **Precondition**: Admin is logged in
- **Test Data**: New product information
- **Steps**:
  1. Navigate to "Products" section
  2. Click "Add New Product"
  3. Fill in product details
  4. Upload product images
  5. Click "Save Product"
- **Expected Result**: New product created and visible in catalog
- **Actual Result**: [To be filled during testing]

### TC023: Order Management - Update Status
**Priority**: High | **Severity**: Major
- **Precondition**: Order exists in system
- **Test Data**: Order status update
- **Steps**:
  1. Navigate to "Orders" section
  2. Find specific order
  3. Click "Update Status"
  4. Select new status
  5. Click "Save"
- **Expected Result**: Order status updated, customer notified
- **Actual Result**: [To be filled during testing]

---

## ⚡ Performance & Security

### TC024: Page Load Performance
**Priority**: High | **Severity**: Major
- **Precondition**: Application is deployed
- **Test Data**: Various page URLs
- **Steps**:
  1. Open browser developer tools
  2. Navigate to homepage
  3. Check page load time
- **Expected Result**: Page loads in < 3 seconds
- **Actual Result**: [To be filled during testing]

### TC025: Security - SQL Injection Prevention
**Priority**: High | **Severity**: Critical
- **Precondition**: Search functionality available
- **Test Data**: SQL injection attempt
- **Steps**:
  1. Navigate to search page
  2. Enter SQL injection string
  3. Submit search
- **Expected Result**: Search fails safely, no database error
- **Actual Result**: [To be filled during testing]

### TC026: Security - XSS Prevention
**Priority**: High | **Severity**: Critical
- **Precondition**: User input fields available
- **Test Data**: XSS script
- **Steps**:
  1. Navigate to contact form
  2. Enter XSS script in text field
  3. Submit form
- **Expected Result**: Script not executed, safely escaped
- **Actual Result**: [To be filled during testing]

---

## 📱 Mobile & Responsive Design

### TC027: Mobile Navigation
**Priority**: Medium | **Severity**: Major
- **Precondition**: Mobile device or browser
- **Test Data**: Mobile viewport
- **Steps**:
  1. Open site on mobile device
  2. Test hamburger menu
  3. Navigate through menu items
- **Expected Result**: Mobile menu works correctly, navigation smooth
- **Actual Result**: [To be filled during testing]

### TC028: Responsive Product Grid
**Priority**: Medium | **Severity**: Major
- **Precondition**: Products page accessible
- **Test Data**: Different screen sizes
- **Steps**:
  1. Open products page
  2. Resize browser window
  3. Check product grid layout
- **Expected Result**: Product grid adapts to screen size
- **Actual Result**: [To be filled during testing]

### TC029: Touch Interactions
**Priority**: Medium | **Severity**: Minor
- **Precondition**: Mobile device
- **Test Data**: Touch gestures
- **Steps**:
  1. Open product detail page on mobile
  2. Swipe through product images
  3. Test pinch-to-zoom
- **Expected Result**: Touch interactions work smoothly
- **Actual Result**: [To be filled during testing]

---

## 📊 Test Execution Summary

| Test Category | Total Cases | Passed | Failed | Blocked | Not Executed |
|---------------|-------------|--------|--------|---------|--------------|
| Authentication | 5 | 0 | 0 | 0 | 5 |
| Product Catalog | 4 | 0 | 0 | 0 | 4 |
| Shopping Cart | 5 | 0 | 0 | 0 | 5 |
| Order Management | 3 | 0 | 0 | 0 | 3 |
| User Profile | 3 | 0 | 0 | 0 | 3 |
| Admin Dashboard | 3 | 0 | 0 | 0 | 3 |
| Performance | 3 | 0 | 0 | 0 | 3 |
| Mobile Design | 3 | 0 | 0 | 0 | 3 |
| **Total** | **29** | **0** | **0** | **0** | **29** |

---

## 🎯 Test Execution Guidelines

### Test Environment Setup
1. **Development Environment**: Local setup with test database
2. **Staging Environment**: Production-like environment
3. **Production Environment**: Live site testing

### Test Data Management
- Use dedicated test accounts
- Create test products and orders
- Maintain separate test database
- Reset test data between test runs

### Bug Reporting
- Use provided bug report template
- Include screenshots and console logs
- Specify browser and device information
- Assign priority and severity levels

### Test Execution Schedule
- **Unit Tests**: Run on every code commit
- **Integration Tests**: Run daily
- **E2E Tests**: Run weekly
- **Performance Tests**: Run monthly
- **Security Tests**: Run bi-weekly

---

**Document Version**: 1.0
**Last Updated**: [Date]
**Prepared By**: QA Team
**Approved By**: [Name] 