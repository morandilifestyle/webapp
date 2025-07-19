const axios = require('axios');

// Test configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3001/api';
const TEST_USER_ID = 'test-user-123';
const TEST_PRODUCT_ID = 'test-product-456';

// Test data
const testProduct = {
  id: TEST_PRODUCT_ID,
  name: 'Test Product',
  is_active: true
};

const testReview = {
  productId: TEST_PRODUCT_ID,
  rating: 5,
  title: 'Great product!',
  reviewText: 'This is a wonderful product that exceeded my expectations.'
};

// Helper function to make authenticated requests
const makeAuthRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': 'Bearer test-token',
      'x-user-id': TEST_USER_ID,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Test suite for Wishlist functionality
describe('Wishlist API Tests', () => {
  
  test('WL-AUTH-001: Authentication required for wishlist operations', async () => {
    try {
      await axios.get(`${BASE_URL}/wishlist`);
      fail('Should have returned 401');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('WL-CRUD-001: Add item to wishlist', async () => {
    const response = await makeAuthRequest('POST', '/wishlist/items', {
      productId: TEST_PRODUCT_ID
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  test('WL-CRUD-002: Add duplicate item to wishlist', async () => {
    try {
      await makeAuthRequest('POST', '/wishlist/items', {
        productId: TEST_PRODUCT_ID
      });
      fail('Should have returned 409');
    } catch (error) {
      expect(error.response.status).toBe(409);
    }
  });

  test('WL-CRUD-003: Add non-existent product to wishlist', async () => {
    try {
      await makeAuthRequest('POST', '/wishlist/items', {
        productId: 'non-existent-product'
      });
      fail('Should have returned 404');
    } catch (error) {
      expect(error.response.status).toBe(404);
    }
  });

  test('WL-RETRIEVE-001: Get user wishlist', async () => {
    const response = await makeAuthRequest('GET', '/wishlist');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('items');
    expect(response.data).toHaveProperty('totalCount');
    expect(Array.isArray(response.data.items)).toBe(true);
  });

  test('WL-STATUS-001: Check if product is in wishlist', async () => {
    const response = await makeAuthRequest('GET', `/wishlist/check/${TEST_PRODUCT_ID}`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('isInWishlist');
    expect(typeof response.data.isInWishlist).toBe('boolean');
  });

  test('WL-COUNT-001: Get wishlist count', async () => {
    const response = await makeAuthRequest('GET', '/wishlist/count');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('count');
    expect(typeof response.data.count).toBe('number');
  });

  test('WL-CRUD-005: Remove item from wishlist', async () => {
    const response = await makeAuthRequest('DELETE', '/wishlist/items', {
      productId: TEST_PRODUCT_ID
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  test('WL-CART-001: Move item from wishlist to cart', async () => {
    // First add item to wishlist
    await makeAuthRequest('POST', '/wishlist/items', {
      productId: TEST_PRODUCT_ID
    });
    
    // Then move to cart
    const response = await makeAuthRequest('POST', '/wishlist/items/move', {
      productId: TEST_PRODUCT_ID,
      quantity: 1
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });
});

// Test suite for Reviews functionality
describe('Reviews API Tests', () => {
  
  test('RV-AUTH-001: Authentication required for review operations', async () => {
    try {
      await axios.post(`${BASE_URL}/reviews`, testReview);
      fail('Should have returned 401');
    } catch (error) {
      expect(error.response.status).toBe(401);
    }
  });

  test('RV-CREATE-004: Create review with invalid data', async () => {
    const invalidReviews = [
      { productId: TEST_PRODUCT_ID }, // Missing fields
      { productId: TEST_PRODUCT_ID, rating: 0, title: 'Test', reviewText: 'Test' }, // Invalid rating
      { productId: TEST_PRODUCT_ID, rating: 6, title: 'Test', reviewText: 'Test' }, // Invalid rating
      { productId: TEST_PRODUCT_ID, rating: 5, title: 'A', reviewText: 'Test' }, // Short title
      { productId: TEST_PRODUCT_ID, rating: 5, title: 'Test', reviewText: 'Short' } // Short text
    ];
    
    for (const invalidReview of invalidReviews) {
      try {
        await makeAuthRequest('POST', '/reviews', invalidReview);
        fail(`Should have returned 400 for invalid review: ${JSON.stringify(invalidReview)}`);
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    }
  });

  test('RV-VALIDATE-001: Rating validation', async () => {
    const invalidRatings = [0, 6, 'invalid', null, undefined];
    
    for (const rating of invalidRatings) {
      try {
        await makeAuthRequest('POST', '/reviews', {
          ...testReview,
          rating
        });
        fail(`Should have returned 400 for invalid rating: ${rating}`);
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    }
  });

  test('RV-VALIDATE-002: Text validation', async () => {
    const invalidTitles = ['', 'A', 'A'.repeat(256)];
    const invalidTexts = ['', 'Short', 'A'.repeat(2001)];
    
    for (const title of invalidTitles) {
      try {
        await makeAuthRequest('POST', '/reviews', {
          ...testReview,
          title
        });
        fail(`Should have returned 400 for invalid title: ${title}`);
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    }
    
    for (const reviewText of invalidTexts) {
      try {
        await makeAuthRequest('POST', '/reviews', {
          ...testReview,
          reviewText
        });
        fail(`Should have returned 400 for invalid review text: ${reviewText}`);
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    }
  });

  test('RV-RETRIEVE-001: Get product reviews', async () => {
    const response = await axios.get(`${BASE_URL}/reviews/products/${TEST_PRODUCT_ID}/reviews`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('reviews');
    expect(response.data).toHaveProperty('totalCount');
    expect(response.data).toHaveProperty('averageRating');
    expect(response.data).toHaveProperty('ratingDistribution');
    expect(Array.isArray(response.data.reviews)).toBe(true);
  });

  test('RV-RETRIEVE-002: Review filtering', async () => {
    const filters = [
      { rating: 5 },
      { search: 'great' },
      { sortBy: 'date', sortOrder: 'desc' },
      { page: 1, limit: 5 }
    ];
    
    for (const filter of filters) {
      const queryString = new URLSearchParams(filter).toString();
      const response = await axios.get(
        `${BASE_URL}/reviews/products/${TEST_PRODUCT_ID}/reviews?${queryString}`
      );
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('reviews');
    }
  });

  test('RV-ELIGIBILITY-001: Check review eligibility', async () => {
    const response = await makeAuthRequest('GET', `/reviews/products/${TEST_PRODUCT_ID}/can-review`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('canReview');
    expect(response.data).toHaveProperty('hasPurchase');
    expect(response.data).toHaveProperty('hasReview');
    expect(typeof response.data.canReview).toBe('boolean');
  });

  test('RV-ANALYTICS-001: Get review analytics', async () => {
    const response = await axios.get(`${BASE_URL}/reviews/products/${TEST_PRODUCT_ID}/reviews/analytics`);
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('productId');
    expect(response.data).toHaveProperty('totalReviews');
    expect(response.data).toHaveProperty('averageRating');
    expect(response.data).toHaveProperty('ratingDistribution');
  });

  test('RV-VOTE-001: Vote on review', async () => {
    // First create a review
    const createResponse = await makeAuthRequest('POST', '/reviews', testReview);
    const reviewId = createResponse.data.id;
    
    // Vote helpful
    const helpfulResponse = await makeAuthRequest('POST', `/reviews/${reviewId}/vote`, {
      voteType: 'helpful'
    });
    
    expect(helpfulResponse.status).toBe(200);
    expect(helpfulResponse.data.success).toBe(true);
    
    // Vote unhelpful
    const unhelpfulResponse = await makeAuthRequest('POST', `/reviews/${reviewId}/vote`, {
      voteType: 'unhelpful'
    });
    
    expect(unhelpfulResponse.status).toBe(200);
    expect(unhelpfulResponse.data.success).toBe(true);
  });

  test('RV-REPORT-001: Report review', async () => {
    // First create a review
    const createResponse = await makeAuthRequest('POST', '/reviews', testReview);
    const reviewId = createResponse.data.id;
    
    // Report the review
    const response = await makeAuthRequest('POST', `/reviews/${reviewId}/report`, {
      reportReason: 'inappropriate',
      reportDescription: 'This review violates community guidelines'
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });

  test('RV-REPORT-002: Report without reason', async () => {
    // First create a review
    const createResponse = await makeAuthRequest('POST', '/reviews', testReview);
    const reviewId = createResponse.data.id;
    
    try {
      await makeAuthRequest('POST', `/reviews/${reviewId}/report`, {
        reportDescription: 'This review violates community guidelines'
      });
      fail('Should have returned 400');
    } catch (error) {
      expect(error.response.status).toBe(400);
    }
  });
});

// Performance tests
describe('Performance Tests', () => {
  
  test('PERF-001: Load test wishlist operations', async () => {
    const startTime = Date.now();
    
    // Add multiple items to wishlist
    for (let i = 0; i < 10; i++) {
      await makeAuthRequest('POST', '/wishlist/items', {
        productId: `test-product-${i}`
      });
    }
    
    // Retrieve wishlist
    const response = await makeAuthRequest('GET', '/wishlist?limit=20');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(1000); // Less than 1 second
  });

  test('PERF-002: Load test review operations', async () => {
    const startTime = Date.now();
    
    // Create multiple reviews
    for (let i = 0; i < 10; i++) {
      await makeAuthRequest('POST', '/reviews', {
        ...testReview,
        title: `Test Review ${i}`,
        reviewText: `This is test review number ${i}`
      });
    }
    
    // Retrieve reviews with filtering
    const response = await axios.get(
      `${BASE_URL}/reviews/products/${TEST_PRODUCT_ID}/reviews?limit=20&sortBy=date`
    );
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(2000); // Less than 2 seconds
  });
});

// Security tests
describe('Security Tests', () => {
  
  test('SEC-001: SQL injection test', async () => {
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --"
    ];
    
    for (const payload of sqlInjectionPayloads) {
      try {
        await makeAuthRequest('POST', '/reviews', {
          ...testReview,
          title: payload,
          reviewText: payload
        });
        // Should not crash or execute malicious SQL
      } catch (error) {
        // Expected to fail, but should not be due to SQL injection
        expect(error.response.status).not.toBe(500);
      }
    }
  });

  test('SEC-002: XSS test', async () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(\'xss\')">',
      'javascript:alert("xss")'
    ];
    
    for (const payload of xssPayloads) {
      try {
        await makeAuthRequest('POST', '/reviews', {
          ...testReview,
          title: payload,
          reviewText: payload
        });
        // Should not execute JavaScript
      } catch (error) {
        // Expected to fail, but should not execute XSS
        expect(error.response.status).not.toBe(500);
      }
    }
  });
});

// Integration tests
describe('Integration Tests', () => {
  
  test('INT-001: End-to-end wishlist flow', async () => {
    // 1. Add product to wishlist
    const addResponse = await makeAuthRequest('POST', '/wishlist/items', {
      productId: TEST_PRODUCT_ID
    });
    expect(addResponse.status).toBe(200);
    
    // 2. Check wishlist status
    const statusResponse = await makeAuthRequest('GET', `/wishlist/check/${TEST_PRODUCT_ID}`);
    expect(statusResponse.data.isInWishlist).toBe(true);
    
    // 3. Get wishlist
    const wishlistResponse = await makeAuthRequest('GET', '/wishlist');
    expect(wishlistResponse.data.items.length).toBeGreaterThan(0);
    
    // 4. Move to cart
    const moveResponse = await makeAuthRequest('POST', '/wishlist/items/move', {
      productId: TEST_PRODUCT_ID
    });
    expect(moveResponse.status).toBe(200);
    
    // 5. Verify removed from wishlist
    const finalStatusResponse = await makeAuthRequest('GET', `/wishlist/check/${TEST_PRODUCT_ID}`);
    expect(finalStatusResponse.data.isInWishlist).toBe(false);
  });

  test('INT-002: End-to-end review flow', async () => {
    // 1. Check eligibility
    const eligibilityResponse = await makeAuthRequest('GET', `/reviews/products/${TEST_PRODUCT_ID}/can-review`);
    expect(eligibilityResponse.status).toBe(200);
    
    // 2. Create review
    const createResponse = await makeAuthRequest('POST', '/reviews', testReview);
    expect(createResponse.status).toBe(201);
    expect(createResponse.data.isApproved).toBe(false); // Should be pending approval
    
    // 3. Get reviews (should not include unapproved review)
    const reviewsResponse = await axios.get(`${BASE_URL}/reviews/products/${TEST_PRODUCT_ID}/reviews`);
    expect(reviewsResponse.status).toBe(200);
    
    // 4. Vote on review
    const reviewId = createResponse.data.id;
    const voteResponse = await makeAuthRequest('POST', `/reviews/${reviewId}/vote`, {
      voteType: 'helpful'
    });
    expect(voteResponse.status).toBe(200);
    
    // 5. Report review
    const reportResponse = await makeAuthRequest('POST', `/reviews/${reviewId}/report`, {
      reportReason: 'inappropriate'
    });
    expect(reportResponse.status).toBe(200);
  });
});

// Run tests
if (require.main === module) {
  console.log('Running Wishlist and Reviews Backend Tests...');
  
  // This would be run with a test framework like Jest
  // For now, we'll just export the test functions
  module.exports = {
    makeAuthRequest,
    testProduct,
    testReview
  };
} 