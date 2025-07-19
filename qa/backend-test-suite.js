/**
 * Backend Test Suite: Checkout and Payment Process
 * 
 * This test suite validates the backend logic for the checkout and payment process.
 * Run with: npm test -- --testPathPattern=backend-test-suite.js
 */

const axios = require('axios');
const crypto = require('crypto');

// Test configuration
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';
const TEST_USER_ID = 'test-user-id';

// Mock data
const validCheckoutData = {
  items: [
    {
      product_id: 'test-product-1',
      quantity: 2,
      unit_price: 100,
      total_price: 200,
      attributes: { color: 'blue', size: 'M' }
    },
    {
      product_id: 'test-product-2',
      quantity: 1,
      unit_price: 50,
      total_price: 50,
      attributes: { material: 'cotton' }
    }
  ],
  shipping_address: {
    first_name: 'John',
    last_name: 'Doe',
    company: 'Test Company',
    address_line_1: '123 Test Street',
    address_line_2: 'Apt 4B',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400001',
    country: 'India',
    phone: '9876543210'
  },
  billing_address: {
    first_name: 'John',
    last_name: 'Doe',
    company: 'Test Company',
    address_line_1: '123 Test Street',
    address_line_2: 'Apt 4B',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400001',
    country: 'India',
    phone: '9876543210'
  },
  shipping_method_id: 'standard-shipping',
  payment_method: 'razorpay'
};

// Helper functions
const generateTestSignature = (orderId, paymentId, secret) => {
  const text = `${orderId}|${paymentId}`;
  return crypto.createHmac('sha256', secret).update(text).digest('hex');
};

const setupTestData = async () => {
  // Create test products
  await axios.post(`${BASE_URL}/api/test/setup`, {
    products: [
      {
        id: 'test-product-1',
        name: 'Test Product 1',
        price: 100,
        stock_quantity: 10,
        is_active: true
      },
      {
        id: 'test-product-2',
        name: 'Test Product 2',
        price: 50,
        stock_quantity: 5,
        is_active: true
      }
    ]
  });
};

const cleanupTestData = async () => {
  await axios.post(`${BASE_URL}/api/test/cleanup`);
};

// Test Suite: Checkout Flow
describe('Checkout Flow Tests', () => {
  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Checkout Initialization', () => {
    test('should initialize checkout successfully with valid data', async () => {
      const response = await axios.post(`${BASE_URL}/api/orders/checkout/init`, validCheckoutData, {
        headers: {
          'Content-Type': 'application/json',
          'user-id': TEST_USER_ID
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.order_id).toBeDefined();
      expect(response.data.data.razorpay_order_id).toBeDefined();
      expect(response.data.data.total_amount).toBe(295); // 250 + 45 tax + 0 shipping
    });

    test('should reject checkout with invalid product', async () => {
      const invalidData = {
        ...validCheckoutData,
        items: [{ product_id: 'non-existent', quantity: 1, unit_price: 100, total_price: 100 }]
      };

      try {
        await axios.post(`${BASE_URL}/api/orders/checkout/init`, invalidData, {
          headers: {
            'Content-Type': 'application/json',
            'user-id': TEST_USER_ID
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Product not found');
      }
    });

    test('should reject checkout with insufficient stock', async () => {
      const oversellingData = {
        ...validCheckoutData,
        items: [{ product_id: 'test-product-1', quantity: 999, unit_price: 100, total_price: 99900 }]
      };

      try {
        await axios.post(`${BASE_URL}/api/orders/checkout/init`, oversellingData, {
          headers: {
            'Content-Type': 'application/json',
            'user-id': TEST_USER_ID
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Insufficient stock');
      }
    });

    test('should reject checkout with invalid shipping method', async () => {
      const invalidShippingData = {
        ...validCheckoutData,
        shipping_method_id: 'invalid-shipping-method'
      };

      try {
        await axios.post(`${BASE_URL}/api/orders/checkout/init`, invalidShippingData, {
          headers: {
            'Content-Type': 'application/json',
            'user-id': TEST_USER_ID
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Invalid shipping method');
      }
    });
  });

  describe('Shipping Methods', () => {
    test('should return available shipping methods', async () => {
      const response = await axios.get(`${BASE_URL}/api/orders/shipping/methods`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      const shippingMethod = response.data.data[0];
      expect(shippingMethod).toHaveProperty('id');
      expect(shippingMethod).toHaveProperty('name');
      expect(shippingMethod).toHaveProperty('base_rate');
      expect(shippingMethod).toHaveProperty('weight_rate');
      expect(shippingMethod).toHaveProperty('estimated_days');
    });
  });

  describe('Shipping Cost Calculation', () => {
    test('should calculate shipping cost correctly', async () => {
      const response = await axios.post(`${BASE_URL}/api/orders/shipping/calculate`, {
        items: validCheckoutData.items,
        shipping_method_id: 'standard-shipping'
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('shipping_cost');
      expect(typeof response.data.data.shipping_cost).toBe('number');
      expect(response.data.data.shipping_cost).toBeGreaterThanOrEqual(0);
    });

    test('should reject shipping calculation with invalid method', async () => {
      try {
        await axios.post(`${BASE_URL}/api/orders/shipping/calculate`, {
          items: validCheckoutData.items,
          shipping_method_id: 'invalid-method'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Invalid shipping method');
      }
    });
  });
});

// Test Suite: Payment Processing
describe('Payment Processing Tests', () => {
  let testOrderId;
  let testRazorpayOrderId;

  beforeAll(async () => {
    await setupTestData();
    
    // Create a test order
    const checkoutResponse = await axios.post(`${BASE_URL}/api/orders/checkout/init`, validCheckoutData, {
      headers: {
        'Content-Type': 'application/json',
        'user-id': TEST_USER_ID
      }
    });
    
    testOrderId = checkoutResponse.data.data.order_id;
    testRazorpayOrderId = checkoutResponse.data.data.razorpay_order_id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Payment Verification', () => {
    test('should reject payment with invalid signature', async () => {
      const invalidPaymentData = {
        razorpay_order_id: testRazorpayOrderId,
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: 'invalid_signature',
        order_id: testOrderId
      };

      try {
        await axios.post(`${BASE_URL}/api/orders/payment/verify`, invalidPaymentData, {
          headers: {
            'Content-Type': 'application/json',
            'user-id': TEST_USER_ID
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
        expect(error.response.data.error).toBe('Invalid payment signature');
      }
    });

    test('should reject payment with missing parameters', async () => {
      const incompletePaymentData = {
        razorpay_order_id: testRazorpayOrderId,
        order_id: testOrderId
        // Missing razorpay_payment_id and razorpay_signature
      };

      try {
        await axios.post(`${BASE_URL}/api/orders/payment/verify`, incompletePaymentData, {
          headers: {
            'Content-Type': 'application/json',
            'user-id': TEST_USER_ID
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('All payment verification parameters are required');
      }
    });

    test('should handle valid payment verification (mocked)', async () => {
      // This test would require mocking the Razorpay API
      // In a real scenario, you'd mock the external API calls
      const validPaymentData = {
        razorpay_order_id: testRazorpayOrderId,
        razorpay_payment_id: 'pay_test123',
        razorpay_signature: generateTestSignature(testRazorpayOrderId, 'pay_test123', 'test_secret'),
        order_id: testOrderId
      };

      // Mock the Razorpay verification to return true
      // This would require setting up proper mocking in the test environment
      
      const response = await axios.post(`${BASE_URL}/api/orders/payment/verify`, validPaymentData, {
        headers: {
          'Content-Type': 'application/json',
          'user-id': TEST_USER_ID
        }
      });

      // The actual result depends on whether the signature verification passes
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success');
    });
  });

  describe('Payment Methods', () => {
    test('should return available payment methods', async () => {
      const response = await axios.get(`${BASE_URL}/api/orders/payment/methods`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      const paymentMethod = response.data.data[0];
      expect(paymentMethod).toHaveProperty('id');
      expect(paymentMethod).toHaveProperty('name');
      expect(paymentMethod).toHaveProperty('description');
      expect(paymentMethod).toHaveProperty('icon');
    });
  });
});

// Test Suite: Order Management
describe('Order Management Tests', () => {
  let testOrderId;

  beforeAll(async () => {
    await setupTestData();
    
    // Create a test order
    const checkoutResponse = await axios.post(`${BASE_URL}/api/orders/checkout/init`, validCheckoutData, {
      headers: {
        'Content-Type': 'application/json',
        'user-id': TEST_USER_ID
      }
    });
    
    testOrderId = checkoutResponse.data.data.order_id;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Order Retrieval', () => {
    test('should retrieve user orders', async () => {
      const response = await axios.get(`${BASE_URL}/api/orders`, {
        headers: {
          'user-id': TEST_USER_ID
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('orders');
      expect(response.data).toHaveProperty('pagination');
      expect(Array.isArray(response.data.orders)).toBe(true);
    });

    test('should retrieve specific order', async () => {
      const response = await axios.get(`${BASE_URL}/api/orders/${testOrderId}`, {
        headers: {
          'user-id': TEST_USER_ID
        }
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('order');
      expect(response.data.order.id).toBe(testOrderId);
    });

    test('should reject access to other user orders', async () => {
      try {
        await axios.get(`${BASE_URL}/api/orders/${testOrderId}`, {
          headers: {
            'user-id': 'different-user-id'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('Order not found');
      }
    });
  });

  describe('Order Status Updates', () => {
    test('should update order status', async () => {
      const response = await axios.patch(`${BASE_URL}/api/orders/${testOrderId}/status`, {
        status: 'processing'
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Order status updated successfully');
      expect(response.data.order.status).toBe('processing');
    });

    test('should reject invalid status updates', async () => {
      try {
        await axios.patch(`${BASE_URL}/api/orders/${testOrderId}/status`, {
          status: 'invalid_status'
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});

// Test Suite: Security Tests
describe('Security Tests', () => {
  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('SQL Injection Prevention', () => {
    test('should prevent SQL injection in product search', async () => {
      const maliciousInputs = [
        "'; DROP TABLE products; --",
        "' OR 1=1; --",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --"
      ];

      for (const input of maliciousInputs) {
        const response = await axios.get(`${BASE_URL}/api/products?search=${encodeURIComponent(input)}`);
        expect(response.status).toBe(200);
        
        // Verify the search didn't cause any malicious effects
        const productsResponse = await axios.get(`${BASE_URL}/api/products`);
        expect(productsResponse.status).toBe(200);
      }
    });
  });

  describe('XSS Prevention', () => {
    test('should sanitize user input in order notes', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(\'xss\')">',
        'javascript:alert("xss")'
      ];

      for (const input of maliciousInputs) {
        const orderData = {
          ...validCheckoutData,
          notes: input
        };

        const response = await axios.post(`${BASE_URL}/api/orders/checkout/init`, orderData, {
          headers: {
            'Content-Type': 'application/json',
            'user-id': TEST_USER_ID
          }
        });

        expect(response.status).toBe(200);
        
        // Verify the notes don't contain malicious content
        const orderResponse = await axios.get(`${BASE_URL}/api/orders/${response.data.data.order_id}`, {
          headers: {
            'user-id': TEST_USER_ID
          }
        });

        const order = orderResponse.data.order;
        if (order.notes) {
          expect(order.notes).not.toContain('<script>');
          expect(order.notes).not.toContain('javascript:');
        }
      }
    });
  });
});

// Test Suite: Performance Tests
describe('Performance Tests', () => {
  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Response Time', () => {
    test('should complete checkout initialization within 5 seconds', async () => {
      const startTime = Date.now();
      
      const response = await axios.post(`${BASE_URL}/api/orders/checkout/init`, validCheckoutData, {
        headers: {
          'Content-Type': 'application/json',
          'user-id': TEST_USER_ID
        }
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(response.status).toBe(200);
    });

    test('should handle concurrent checkout requests', async () => {
      const concurrentRequests = 5;
      const promises = [];
      
      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          axios.post(`${BASE_URL}/api/orders/checkout/init`, validCheckoutData, {
            headers: {
              'Content-Type': 'application/json',
              'user-id': TEST_USER_ID
            }
          })
        );
      }
      
      const results = await Promise.allSettled(promises);
      const successfulResults = results.filter(r => r.status === 'fulfilled');
      
      expect(successfulResults.length).toBe(concurrentRequests);
    });
  });
});

// Test Suite: Error Handling
describe('Error Handling Tests', () => {
  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Network Failures', () => {
    test('should handle invalid API endpoints gracefully', async () => {
      try {
        await axios.get(`${BASE_URL}/api/non-existent-endpoint`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    test('should handle malformed JSON requests', async () => {
      try {
        await axios.post(`${BASE_URL}/api/orders/checkout/init`, 'invalid json', {
          headers: {
            'Content-Type': 'application/json',
            'user-id': TEST_USER_ID
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('Validation Errors', () => {
    test('should handle missing required fields', async () => {
      const incompleteData = {
        items: validCheckoutData.items
        // Missing shipping_address, shipping_method_id, payment_method
      };

      try {
        await axios.post(`${BASE_URL}/api/orders/checkout/init`, incompleteData, {
          headers: {
            'Content-Type': 'application/json',
            'user-id': TEST_USER_ID
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Shipping address is required');
      }
    });

    test('should handle invalid data types', async () => {
      const invalidData = {
        ...validCheckoutData,
        items: [
          {
            product_id: 'test-product-1',
            quantity: 'invalid', // Should be number
            unit_price: 100,
            total_price: 100
          }
        ]
      };

      try {
        await axios.post(`${BASE_URL}/api/orders/checkout/init`, invalidData, {
          headers: {
            'Content-Type': 'application/json',
            'user-id': TEST_USER_ID
          }
        });
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});

// Export test utilities for other test files
module.exports = {
  validCheckoutData,
  generateTestSignature,
  setupTestData,
  cleanupTestData,
  BASE_URL,
  TEST_USER_ID
}; 