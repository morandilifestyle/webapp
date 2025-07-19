# Test Cases for Story 001: User Registration and Authentication

## 📋 Test Case Overview
**Story ID**: US-001  
**Epic**: User Management System  
**Priority**: High  
**Test Coverage**: 100% of acceptance criteria

---

## 🔐 Registration Process Test Cases

### TC001-REG-001: Valid User Registration
**Priority**: High | **Severity**: Critical | **Type**: Positive
- **Precondition**: User is on registration page
- **Test Data**: 
  - Email: test@example.com
  - Password: TestPassword123!
  - First Name: John
  - Last Name: Doe
- **Steps**:
  1. Navigate to `/register`
  2. Enter valid email address
  3. Enter strong password (8+ chars, uppercase, lowercase, number)
  4. Enter first name and last name
  5. Click "Register" button
- **Expected Result**: 
  - User account created successfully
  - Verification email sent
  - Redirect to login page
  - Success message displayed
- **API Endpoint**: `POST /api/auth/register`
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-REG-002: Invalid Email Format
**Priority**: High | **Severity**: Major | **Type**: Negative
- **Test Data**: 
  - Email: invalid-email
  - Password: TestPassword123!
  - First Name: John
  - Last Name: Doe
- **Steps**:
  1. Navigate to `/register`
  2. Enter invalid email format
  3. Fill other fields with valid data
  4. Click "Register" button
- **Expected Result**: 
  - Error message displayed
  - Form not submitted
  - User stays on registration page
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-REG-003: Weak Password
**Priority**: High | **Severity**: Major | **Type**: Negative
- **Test Data**: 
  - Email: test@example.com
  - Password: 123
  - First Name: John
  - Last Name: Doe
- **Steps**:
  1. Navigate to `/register`
  2. Enter valid email
  3. Enter weak password (< 8 chars)
  4. Fill other fields
  5. Click "Register" button
- **Expected Result**: 
  - Password strength error displayed
  - Form not submitted
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-REG-004: Missing Required Fields
**Priority**: High | **Severity**: Major | **Type**: Negative
- **Test Data**: 
  - Email: test@example.com
  - Password: TestPassword123!
  - First Name: (empty)
  - Last Name: (empty)
- **Steps**:
  1. Navigate to `/register`
  2. Leave first name empty
  3. Leave last name empty
  4. Click "Register" button
- **Expected Result**: 
  - Validation errors displayed
  - Form not submitted
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-REG-005: Duplicate Email Registration
**Priority**: High | **Severity**: Major | **Type**: Negative
- **Precondition**: User account already exists
- **Test Data**: 
  - Email: existing@example.com
  - Password: TestPassword123!
  - First Name: John
  - Last Name: Doe
- **Steps**:
  1. Navigate to `/register`
  2. Enter existing email address
  3. Fill other fields with valid data
  4. Click "Register" button
- **Expected Result**: 
  - Error message: "User already exists"
  - Form not submitted
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

---

## 🔑 Login Process Test Cases

### TC001-LOGIN-001: Valid User Login
**Priority**: High | **Severity**: Critical | **Type**: Positive
- **Precondition**: User account exists and is verified
- **Test Data**: 
  - Email: test@example.com
  - Password: TestPassword123!
- **Steps**:
  1. Navigate to `/login`
  2. Enter valid email address
  3. Enter correct password
  4. Click "Login" button
- **Expected Result**: 
  - User logged in successfully
  - JWT token generated
  - Redirect to dashboard
  - User session established
- **API Endpoint**: `POST /api/auth/login`
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-LOGIN-002: Invalid Credentials
**Priority**: High | **Severity**: Major | **Type**: Negative
- **Test Data**: 
  - Email: test@example.com
  - Password: WrongPassword123!
- **Steps**:
  1. Navigate to `/login`
  2. Enter valid email
  3. Enter incorrect password
  4. Click "Login" button
- **Expected Result**: 
  - Error message: "Invalid credentials"
  - User not logged in
  - Failed attempt counter incremented
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-LOGIN-003: Non-existent User Login
**Priority**: High | **Severity**: Major | **Type**: Negative
- **Test Data**: 
  - Email: nonexistent@example.com
  - Password: TestPassword123!
- **Steps**:
  1. Navigate to `/login`
  2. Enter non-existent email
  3. Enter any password
  4. Click "Login" button
- **Expected Result**: 
  - Error message: "Invalid credentials"
  - User not logged in
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-LOGIN-004: Brute Force Protection
**Priority**: High | **Severity**: Critical | **Type**: Security
- **Precondition**: User account exists
- **Test Data**: 
  - Email: test@example.com
  - Password: WrongPassword123!
- **Steps**:
  1. Navigate to `/login`
  2. Attempt login with wrong password 5 times
  3. Try 6th attempt
- **Expected Result**: 
  - Account locked after 5 failed attempts
  - Error message: "Account temporarily locked"
  - Lockout duration: 15 minutes
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-LOGIN-005: Remember Me Functionality
**Priority**: Medium | **Severity**: Minor | **Type**: Positive
- **Test Data**: 
  - Email: test@example.com
  - Password: TestPassword123!
  - Remember Me: Checked
- **Steps**:
  1. Navigate to `/login`
  2. Enter valid credentials
  3. Check "Remember Me" checkbox
  4. Click "Login" button
  5. Close browser and reopen
  6. Navigate to protected page
- **Expected Result**: 
  - User remains logged in
  - Session persists across browser sessions
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

---

## 🔄 Password Reset Test Cases

### TC001-PWD-001: Forgot Password Request
**Priority**: High | **Severity**: Major | **Type**: Positive
- **Precondition**: User account exists
- **Test Data**: 
  - Email: test@example.com
- **Steps**:
  1. Navigate to `/forgot-password`
  2. Enter valid email address
  3. Click "Send Reset Link" button
- **Expected Result**: 
  - Reset email sent
  - Success message displayed
  - Email contains reset link
- **API Endpoint**: `POST /api/auth/forgot-password`
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-PWD-002: Password Reset with Valid Token
**Priority**: High | **Severity**: Major | **Type**: Positive
- **Precondition**: Reset email sent
- **Test Data**: 
  - New Password: NewPassword123!
  - Reset Token: (from email)
- **Steps**:
  1. Click reset link from email
  2. Enter new password
  3. Confirm new password
  4. Click "Reset Password" button
- **Expected Result**: 
  - Password updated successfully
  - User can login with new password
  - Old password no longer works
- **API Endpoint**: `POST /api/auth/reset-password`
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-PWD-003: Password Reset with Invalid Token
**Priority**: High | **Severity**: Major | **Type**: Negative
- **Test Data**: 
  - New Password: NewPassword123!
  - Reset Token: invalid-token
- **Steps**:
  1. Navigate to reset password page
  2. Enter invalid token
  3. Enter new password
  4. Click "Reset Password" button
- **Expected Result**: 
  - Error message displayed
  - Password not updated
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

---

## 👤 Profile Management Test Cases

### TC001-PROF-001: View User Profile
**Priority**: Medium | **Severity**: Major | **Type**: Positive
- **Precondition**: User is logged in
- **Steps**:
  1. Navigate to `/profile`
  2. Verify profile information displayed
- **Expected Result**: 
  - User profile information visible
  - Email, name, phone displayed
  - Edit button available
- **API Endpoint**: `GET /api/auth/profile`
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-PROF-002: Update User Profile
**Priority**: Medium | **Severity**: Major | **Type**: Positive
- **Test Data**: 
  - First Name: Jane
  - Last Name: Smith
  - Phone: +91-9876543210
- **Steps**:
  1. Navigate to `/profile`
  2. Click "Edit Profile"
  3. Update first name and last name
  4. Add phone number
  5. Click "Save Changes"
- **Expected Result**: 
  - Profile updated successfully
  - Changes reflected immediately
  - Success message displayed
- **API Endpoint**: `PUT /api/auth/profile`
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-PROF-003: Add Shipping Address
**Priority**: Medium | **Severity**: Major | **Type**: Positive
- **Test Data**: 
  - Address Type: shipping
  - Address Line 1: 123 Main Street
  - City: Mumbai
  - State: Maharashtra
  - Postal Code: 400001
  - Country: India
  - Is Default: true
- **Steps**:
  1. Navigate to `/profile/addresses`
  2. Click "Add New Address"
  3. Fill address details
  4. Set as default
  5. Click "Save Address"
- **Expected Result**: 
  - Address added successfully
  - Address appears in list
  - Default address set correctly
- **API Endpoint**: `POST /api/auth/addresses`
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-PROF-004: Update Address
**Priority**: Medium | **Severity**: Minor | **Type**: Positive
- **Test Data**: 
  - Updated City: Delhi
  - Updated State: Delhi
- **Steps**:
  1. Navigate to `/profile/addresses`
  2. Click "Edit" on existing address
  3. Update city and state
  4. Click "Save Changes"
- **Expected Result**: 
  - Address updated successfully
  - Changes reflected in list
- **API Endpoint**: `PUT /api/auth/addresses/:id`
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-PROF-005: Delete Address
**Priority**: Medium | **Severity**: Minor | **Type**: Positive
- **Steps**:
  1. Navigate to `/profile/addresses`
  2. Click "Delete" on address
  3. Confirm deletion
- **Expected Result**: 
  - Address deleted successfully
  - Address removed from list
- **API Endpoint**: `DELETE /api/auth/addresses/:id`
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

---

## 🔒 Security Test Cases

### TC001-SEC-001: Password Hashing Verification
**Priority**: High | **Severity**: Critical | **Type**: Security
- **Steps**:
  1. Register new user
  2. Check database for password storage
- **Expected Result**: 
  - Password stored as bcrypt hash
  - Plain text password not stored
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-SEC-002: JWT Token Validation
**Priority**: High | **Severity**: Critical | **Type**: Security
- **Steps**:
  1. Login user
  2. Capture JWT token
  3. Decode token structure
- **Expected Result**: 
  - Token contains user ID and email
  - Token has expiration time
  - Token is properly signed
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-SEC-003: Session Timeout
**Priority**: High | **Severity**: Major | **Type**: Security
- **Steps**:
  1. Login user
  2. Wait for session timeout (24 hours)
  3. Try to access protected page
- **Expected Result**: 
  - Session expires after 24 hours
  - User redirected to login
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-SEC-004: CSRF Protection
**Priority**: High | **Severity**: Critical | **Type**: Security
- **Steps**:
  1. Login user
  2. Attempt cross-site request
- **Expected Result**: 
  - CSRF protection active
  - Cross-site requests blocked
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-SEC-005: SQL Injection Prevention
**Priority**: High | **Severity**: Critical | **Type**: Security
- **Test Data**: 
  - Email: test@example.com' OR '1'='1
  - Password: TestPassword123!
- **Steps**:
  1. Navigate to `/login`
  2. Enter SQL injection payload
  3. Submit form
- **Expected Result**: 
  - SQL injection prevented
  - No database errors
  - Safe error handling
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

---

## 🌐 Social Login Test Cases

### TC001-SOCIAL-001: Google OAuth Login
**Priority**: Medium | **Severity**: Major | **Type**: Positive
- **Steps**:
  1. Navigate to `/login`
  2. Click "Login with Google"
  3. Complete Google OAuth flow
- **Expected Result**: 
  - User logged in via Google
  - User profile created/updated
  - Redirect to dashboard
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-SOCIAL-002: Google OAuth Registration
**Priority**: Medium | **Severity**: Major | **Type**: Positive
- **Steps**:
  1. Navigate to `/register`
  2. Click "Register with Google"
  3. Complete Google OAuth flow
- **Expected Result**: 
  - New user account created
  - Profile data mapped correctly
  - User logged in automatically
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

---

## 📱 Mobile Responsiveness Test Cases

### TC001-MOBILE-001: Mobile Registration Form
**Priority**: Medium | **Severity**: Major | **Type**: UI/UX
- **Device**: iPhone/Android
- **Steps**:
  1. Open registration page on mobile
  2. Fill registration form
  3. Submit form
- **Expected Result**: 
  - Form displays correctly on mobile
  - Touch interactions work properly
  - Form submission successful
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-MOBILE-002: Mobile Login Form
**Priority**: Medium | **Severity**: Major | **Type**: UI/UX
- **Device**: iPhone/Android
- **Steps**:
  1. Open login page on mobile
  2. Fill login form
  3. Submit form
- **Expected Result**: 
  - Form displays correctly on mobile
  - Touch interactions work properly
  - Login successful
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

---

## ♿ Accessibility Test Cases

### TC001-A11Y-001: Keyboard Navigation
**Priority**: Medium | **Severity**: Minor | **Type**: Accessibility
- **Steps**:
  1. Navigate to registration page
  2. Use Tab key to navigate form
  3. Use Enter key to submit
- **Expected Result**: 
  - All form elements accessible via keyboard
  - Focus indicators visible
  - Form submission works with keyboard
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-A11Y-002: Screen Reader Compatibility
**Priority**: Medium | **Severity**: Minor | **Type**: Accessibility
- **Steps**:
  1. Use screen reader on registration page
  2. Navigate through form elements
- **Expected Result**: 
  - Form elements properly labeled
  - Error messages announced
  - Success messages announced
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

---

## 📊 Performance Test Cases

### TC001-PERF-001: Registration Response Time
**Priority**: Medium | **Severity**: Minor | **Type**: Performance
- **Steps**:
  1. Measure registration form load time
  2. Measure registration submission time
- **Expected Result**: 
  - Form loads in < 2 seconds
  - Registration completes in < 3 seconds
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

### TC001-PERF-002: Login Response Time
**Priority**: Medium | **Severity**: Minor | **Type**: Performance
- **Steps**:
  1. Measure login form load time
  2. Measure login submission time
- **Expected Result**: 
  - Form loads in < 2 seconds
  - Login completes in < 2 seconds
- **Status**: [ ] Passed [ ] Failed [ ] Blocked

---

## 📋 Test Execution Summary

| Test Category | Total Cases | Passed | Failed | Blocked | Not Executed |
|---------------|-------------|--------|--------|---------|--------------|
| Registration | 5 | 0 | 0 | 0 | 5 |
| Login | 5 | 0 | 0 | 0 | 5 |
| Password Reset | 3 | 0 | 0 | 0 | 3 |
| Profile Management | 5 | 0 | 0 | 0 | 5 |
| Security | 5 | 0 | 0 | 0 | 5 |
| Social Login | 2 | 0 | 0 | 0 | 2 |
| Mobile | 2 | 0 | 0 | 0 | 2 |
| Accessibility | 2 | 0 | 0 | 0 | 2 |
| Performance | 2 | 0 | 0 | 0 | 2 |
| **Total** | **31** | **0** | **0** | **0** | **31** |

---

## 🎯 Test Execution Priority

### High Priority (Execute First)
1. TC001-REG-001: Valid User Registration
2. TC001-LOGIN-001: Valid User Login
3. TC001-SEC-001: Password Hashing Verification
4. TC001-SEC-002: JWT Token Validation
5. TC001-REG-002: Invalid Email Format
6. TC001-LOGIN-002: Invalid Credentials
7. TC001-LOGIN-004: Brute Force Protection

### Medium Priority (Execute Second)
1. TC001-PWD-001: Forgot Password Request
2. TC001-PROF-001: View User Profile
3. TC001-PROF-002: Update User Profile
4. TC001-SEC-005: SQL Injection Prevention
5. TC001-MOBILE-001: Mobile Registration Form

### Low Priority (Execute Last)
1. TC001-SOCIAL-001: Google OAuth Login
2. TC001-A11Y-001: Keyboard Navigation
3. TC001-PERF-001: Registration Response Time

---

**Document Version**: 1.0  
**Created By**: QA Engineer  
**Review Date**: [Date]  
**Approved By**: [Name] 