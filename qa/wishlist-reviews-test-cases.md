# Wishlist and Reviews Test Cases

## Test Suite: Wishlist Functionality

### 1. Authentication Tests
**Test Case ID**: WL-AUTH-001
**Description**: Verify authentication is required for wishlist operations
**Steps**:
1. Make request to `/api/wishlist` without authorization header
2. Make request to `/api/wishlist/items` without authorization header
3. Make request to `/api/wishlist/check/:productId` without authorization header
**Expected Result**: All requests should return 401 Unauthorized
**Priority**: High

**Test Case ID**: WL-AUTH-002
**Description**: Verify valid authentication allows access
**Steps**:
1. Make request with valid authorization header
2. Verify user-specific data is returned
**Expected Result**: Requests should succeed and return user-specific data
**Priority**: High

### 2. Wishlist CRUD Operations

**Test Case ID**: WL-CRUD-001
**Description**: Add item to wishlist
**Steps**:
1. Authenticate as user
2. Send POST to `/api/wishlist/items` with valid productId
3. Verify item is added to wishlist
4. Check wishlist count increases
**Expected Result**: Item successfully added, count increases
**Priority**: High

**Test Case ID**: WL-CRUD-002
**Description**: Add duplicate item to wishlist
**Steps**:
1. Add item to wishlist
2. Try to add same item again
**Expected Result**: Should return 409 Conflict
**Priority**: Medium

**Test Case ID**: WL-CRUD-003
**Description**: Add non-existent product to wishlist
**Steps**:
1. Try to add product with invalid ID
**Expected Result**: Should return 404 Not Found
**Priority**: Medium

**Test Case ID**: WL-CRUD-004
**Description**: Add inactive product to wishlist
**Steps**:
1. Try to add product that is not active
**Expected Result**: Should return 404 Not Found
**Priority**: Medium

**Test Case ID**: WL-CRUD-005
**Description**: Remove item from wishlist
**Steps**:
1. Add item to wishlist
2. Remove item from wishlist
3. Verify item is removed
**Expected Result**: Item successfully removed
**Priority**: High

**Test Case ID**: WL-CRUD-006
**Description**: Remove non-existent item from wishlist
**Steps**:
1. Try to remove item not in wishlist
**Expected Result**: Should return 404 Not Found or handle gracefully
**Priority**: Medium

### 3. Wishlist Retrieval

**Test Case ID**: WL-RETRIEVE-001
**Description**: Get user's wishlist
**Steps**:
1. Add multiple items to wishlist
2. Retrieve wishlist
3. Verify all items are returned
**Expected Result**: All wishlist items returned with product details
**Priority**: High

**Test Case ID**: WL-RETRIEVE-002
**Description**: Pagination test
**Steps**:
1. Add more than 20 items to wishlist
2. Test pagination with different page sizes
3. Verify pagination metadata
**Expected Result**: Correct pagination behavior
**Priority**: Medium

**Test Case ID**: WL-RETRIEVE-003
**Description**: Empty wishlist test
**Steps**:
1. Clear wishlist
2. Retrieve wishlist
**Expected Result**: Empty array returned
**Priority**: Medium

### 4. Wishlist to Cart Operations

**Test Case ID**: WL-CART-001
**Description**: Move item from wishlist to cart
**Steps**:
1. Add item to wishlist
2. Move item to cart
3. Verify item appears in cart
4. Verify item is removed from wishlist
**Expected Result**: Item moved successfully
**Priority**: High

**Test Case ID**: WL-CART-002
**Description**: Move item to cart with quantity
**Steps**:
1. Add item to wishlist
2. Move to cart with quantity > 1
3. Verify cart quantity is correct
**Expected Result**: Correct quantity in cart
**Priority**: Medium

### 5. Wishlist Count and Status

**Test Case ID**: WL-COUNT-001
**Description**: Get wishlist count
**Steps**:
1. Add items to wishlist
2. Get count
3. Remove items
4. Get count again
**Expected Result**: Count reflects actual items
**Priority**: Medium

**Test Case ID**: WL-STATUS-001
**Description**: Check if product is in wishlist
**Steps**:
1. Check status of product not in wishlist
2. Add product to wishlist
3. Check status again
**Expected Result**: Status reflects actual state
**Priority**: Medium

## Test Suite: Reviews Functionality

### 1. Review Creation

**Test Case ID**: RV-CREATE-001
**Description**: Create valid review
**Steps**:
1. Authenticate as user who purchased product
2. Create review with valid data
3. Verify review is created with pending approval
**Expected Result**: Review created successfully
**Priority**: High

**Test Case ID**: RV-CREATE-002
**Description**: Create review without purchase
**Steps**:
1. Try to review product without purchasing
**Expected Result**: Should return 403 Forbidden
**Priority**: High

**Test Case ID**: RV-CREATE-003
**Description**: Create duplicate review
**Steps**:
1. Create review for product
2. Try to create another review for same product
**Expected Result**: Should return 403 Forbidden
**Priority**: High

**Test Case ID**: RV-CREATE-004
**Description**: Create review with invalid data
**Steps**:
1. Try to create review with missing fields
2. Try to create review with invalid rating
3. Try to create review with invalid text length
**Expected Result**: Should return 400 Bad Request
**Priority**: Medium

### 2. Review Validation

**Test Case ID**: RV-VALIDATE-001
**Description**: Rating validation
**Steps**:
1. Try to create review with rating < 1
2. Try to create review with rating > 5
3. Try to create review with non-numeric rating
**Expected Result**: Should return 400 Bad Request
**Priority**: High

**Test Case ID**: RV-VALIDATE-002
**Description**: Text validation
**Steps**:
1. Try to create review with title < 3 characters
2. Try to create review with title > 255 characters
3. Try to create review with text < 10 characters
4. Try to create review with text > 2000 characters
**Expected Result**: Should return 400 Bad Request
**Priority**: Medium

### 3. Review Retrieval

**Test Case ID**: RV-RETRIEVE-001
**Description**: Get approved reviews
**Steps**:
1. Create multiple reviews
2. Approve some reviews
3. Retrieve reviews for product
**Expected Result**: Only approved reviews returned
**Priority**: High

**Test Case ID**: RV-RETRIEVE-002
**Description**: Review filtering
**Steps**:
1. Create reviews with different ratings
2. Filter by rating
3. Filter by search term
**Expected Result**: Correct filtering behavior
**Priority**: Medium

**Test Case ID**: RV-RETRIEVE-003
**Description**: Review sorting
**Steps**:
1. Create reviews with different helpful votes
2. Sort by helpful votes
3. Sort by date
4. Sort by rating
**Expected Result**: Correct sorting behavior
**Priority**: Medium

**Test Case ID**: RV-RETRIEVE-004
**Description**: Review pagination
**Steps**:
1. Create many reviews
2. Test pagination with different limits
3. Verify pagination metadata
**Expected Result**: Correct pagination behavior
**Priority**: Medium

### 4. Review Updates

**Test Case ID**: RV-UPDATE-001
**Description**: Update review within 30 days
**Steps**:
1. Create review
2. Update review within 30 days
3. Verify changes are saved
**Expected Result**: Review updated successfully
**Priority**: High

**Test Case ID**: RV-UPDATE-002
**Description**: Update review after 30 days
**Steps**:
1. Create review
2. Wait 30 days (or mock)
3. Try to update review
**Expected Result**: Should return 403 Forbidden
**Priority**: Medium

**Test Case ID**: RV-UPDATE-003
**Description**: Update another user's review
**Steps**:
1. Create review as user A
2. Try to update as user B
**Expected Result**: Should return 404 Not Found
**Priority**: High

### 5. Review Deletion

**Test Case ID**: RV-DELETE-001
**Description**: Delete own review
**Steps**:
1. Create review
2. Delete review
3. Verify review is removed
**Expected Result**: Review deleted successfully
**Priority**: High

**Test Case ID**: RV-DELETE-002
**Description**: Delete another user's review
**Steps**:
1. Create review as user A
2. Try to delete as user B
**Expected Result**: Should return 404 Not Found
**Priority**: High

### 6. Review Voting

**Test Case ID**: RV-VOTE-001
**Description**: Vote on review
**Steps**:
1. Create review
2. Vote helpful on review
3. Vote unhelpful on review
4. Verify vote counts
**Expected Result**: Votes recorded correctly
**Priority**: Medium

**Test Case ID**: RV-VOTE-002
**Description**: Change vote
**Steps**:
1. Vote helpful on review
2. Change vote to unhelpful
3. Verify vote is updated
**Expected Result**: Vote updated correctly
**Priority**: Medium

### 7. Review Reporting

**Test Case ID**: RV-REPORT-001
**Description**: Report review
**Steps**:
1. Create review
2. Report review with reason
3. Verify report is created
**Expected Result**: Report created successfully
**Priority**: Medium

**Test Case ID**: RV-REPORT-002
**Description**: Report without reason
**Steps**:
1. Try to report review without reason
**Expected Result**: Should return 400 Bad Request
**Priority**: Medium

### 8. Review Analytics

**Test Case ID**: RV-ANALYTICS-001
**Description**: Get review analytics
**Steps**:
1. Create multiple reviews with different ratings
2. Get analytics for product
3. Verify average rating and distribution
**Expected Result**: Correct analytics data
**Priority**: Medium

### 9. Review Eligibility

**Test Case ID**: RV-ELIGIBILITY-001
**Description**: Check review eligibility
**Steps**:
1. Check eligibility for user who hasn't purchased
2. Purchase product
3. Check eligibility again
4. Create review
5. Check eligibility again
**Expected Result**: Correct eligibility status
**Priority**: High

## Performance Tests

**Test Case ID**: PERF-001
**Description**: Load test wishlist operations
**Steps**:
1. Add 100 items to wishlist
2. Retrieve wishlist with pagination
3. Measure response time
**Expected Result**: Response time < 1 second
**Priority**: Medium

**Test Case ID**: PERF-002
**Description**: Load test review operations
**Steps**:
1. Create 1000 reviews for a product
2. Retrieve reviews with filtering and pagination
3. Measure response time
**Expected Result**: Response time < 2 seconds
**Priority**: Medium

## Security Tests

**Test Case ID**: SEC-001
**Description**: SQL injection test
**Steps**:
1. Try to inject SQL in search parameters
2. Try to inject SQL in review text
**Expected Result**: No SQL injection vulnerabilities
**Priority**: High

**Test Case ID**: SEC-002
**Description**: XSS test
**Steps**:
1. Try to inject JavaScript in review text
2. Try to inject JavaScript in review title
**Expected Result**: XSS prevented
**Priority**: High

**Test Case ID**: SEC-003
**Description**: CSRF test
**Steps**:
1. Try to perform operations without proper CSRF protection
**Expected Result**: CSRF attacks prevented
**Priority**: High

## Integration Tests

**Test Case ID**: INT-001
**Description**: End-to-end wishlist flow
**Steps**:
1. User logs in
2. User adds product to wishlist
3. User views wishlist
4. User moves item to cart
5. User completes purchase
6. User can now review product
**Expected Result**: Complete flow works correctly
**Priority**: High

**Test Case ID**: INT-002
**Description**: End-to-end review flow
**Steps**:
1. User purchases product
2. User creates review
3. Admin approves review
4. Review appears on product page
5. Other users can vote on review
**Expected Result**: Complete flow works correctly
**Priority**: High 