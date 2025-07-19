/**
 * Performance Testing Helpers for Checkout and Payment System
 * 
 * This file contains utilities for testing the performance and reliability
 * of the checkout and payment implementation.
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';
const TEST_TIMEOUT = 30000; // 30 seconds

// Performance thresholds
const THRESHOLDS = {
  checkoutInit: 5000, // 5 seconds
  paymentVerify: 3000, // 3 seconds
  orderCreation: 2000, // 2 seconds
  concurrentUsers: 50,
  errorRate: 0.05, // 5%
};

// Test data generator
const generateTestData = {
  checkoutData: (userId = 'test-user') => ({
    items: [
      {
        product_id: 'test-product-1',
        quantity: 2,
        unit_price: 100,
        total_price: 200,
        attributes: { color: 'blue', size: 'M' }
      }
    ],
    shipping_address: {
      first_name: 'John',
      last_name: 'Doe',
      address_line_1: '123 Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400001',
      country: 'India',
      phone: '9876543210'
    },
    shipping_method_id: 'standard-shipping',
    payment_method: 'razorpay',
    user_id: userId
  }),

  paymentData: (orderId, razorpayOrderId) => ({
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: 'pay_test123',
    razorpay_signature: generateTestSignature(razorpayOrderId, 'pay_test123'),
    order_id: orderId
  })
};

// Helper functions
const generateTestSignature = (orderId, paymentId, secret = 'test_secret') => {
  const text = `${orderId}|${paymentId}`;
  return crypto.createHmac('sha256', secret).update(text).digest('hex');
};

const measurePerformance = async (operation, threshold) => {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: true,
      duration,
      withinThreshold: duration <= threshold,
      result
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: false,
      duration,
      withinThreshold: false,
      error: error.message
    };
  }
};

const runConcurrentTest = async (operation, concurrency = 10) => {
  const promises = [];
  const startTime = Date.now();
  
  for (let i = 0; i < concurrency; i++) {
    promises.push(operation());
  }
  
  const results = await Promise.allSettled(promises);
  const endTime = Date.now();
  
  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');
  
  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: successful.length / results.length,
    duration: endTime - startTime,
    averageDuration: (endTime - startTime) / results.length,
    errors: failed.map(r => r.reason)
  };
};

// Performance test functions
const performanceTests = {
  // Test checkout initialization performance
  async testCheckoutInitPerformance() {
    console.log('🧪 Testing checkout initialization performance...');
    
    const testData = generateTestData.checkoutData();
    
    const result = await measurePerformance(
      () => axios.post(`${BASE_URL}/api/orders/checkout/init`, testData, {
        headers: { 'Content-Type': 'application/json' }
      }),
      THRESHOLDS.checkoutInit
    );
    
    console.log(`  Duration: ${result.duration}ms`);
    console.log(`  Threshold: ${THRESHOLDS.checkoutInit}ms`);
    console.log(`  Status: ${result.withinThreshold ? '✅ PASS' : '❌ FAIL'}`);
    
    return result;
  },

  // Test concurrent checkout requests
  async testConcurrentCheckout() {
    console.log('🧪 Testing concurrent checkout requests...');
    
    const result = await runConcurrentTest(async () => {
      const testData = generateTestData.checkoutData(`user-${Date.now()}`);
      return axios.post(`${BASE_URL}/api/orders/checkout/init`, testData, {
        headers: { 'Content-Type': 'application/json' }
      });
    }, 10);
    
    console.log(`  Total requests: ${result.total}`);
    console.log(`  Successful: ${result.successful}`);
    console.log(`  Failed: ${result.failed}`);
    console.log(`  Success rate: ${(result.successRate * 100).toFixed(1)}%`);
    console.log(`  Average duration: ${result.averageDuration.toFixed(0)}ms`);
    
    return result;
  },

  // Test payment verification performance
  async testPaymentVerificationPerformance() {
    console.log('🧪 Testing payment verification performance...');
    
    // First create an order
    const checkoutData = generateTestData.checkoutData();
    const checkoutResponse = await axios.post(`${BASE_URL}/api/orders/checkout/init`, checkoutData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    const orderId = checkoutResponse.data.data.order_id;
    const razorpayOrderId = checkoutResponse.data.data.razorpay_order_id;
    
    const paymentData = generateTestData.paymentData(orderId, razorpayOrderId);
    
    const result = await measurePerformance(
      () => axios.post(`${BASE_URL}/api/orders/payment/verify`, paymentData, {
        headers: { 'Content-Type': 'application/json' }
      }),
      THRESHOLDS.paymentVerify
    );
    
    console.log(`  Duration: ${result.duration}ms`);
    console.log(`  Threshold: ${THRESHOLDS.paymentVerify}ms`);
    console.log(`  Status: ${result.withinThreshold ? '✅ PASS' : '❌ FAIL'}`);
    
    return result;
  },

  // Test load with multiple users
  async testLoadWithMultipleUsers() {
    console.log('🧪 Testing load with multiple users...');
    
    const userCount = 20;
    const results = [];
    
    for (let i = 0; i < userCount; i++) {
      const userId = `load-test-user-${i}`;
      const testData = generateTestData.checkoutData(userId);
      
      const result = await measurePerformance(
        () => axios.post(`${BASE_URL}/api/orders/checkout/init`, testData, {
          headers: { 'Content-Type': 'application/json' }
        }),
        THRESHOLDS.checkoutInit
      );
      
      results.push(result);
    }
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const withinThreshold = results.filter(r => r.withinThreshold);
    
    console.log(`  Total users: ${userCount}`);
    console.log(`  Successful: ${successful.length}`);
    console.log(`  Failed: ${failed.length}`);
    console.log(`  Within threshold: ${withinThreshold.length}`);
    console.log(`  Success rate: ${(successful.length / userCount * 100).toFixed(1)}%`);
    
    return {
      total: userCount,
      successful: successful.length,
      failed: failed.length,
      withinThreshold: withinThreshold.length,
      successRate: successful.length / userCount,
      results
    };
  },

  // Test error handling under load
  async testErrorHandlingUnderLoad() {
    console.log('🧪 Testing error handling under load...');
    
    const invalidRequests = [
      // Missing required fields
      { items: [] },
      // Invalid product
      { ...generateTestData.checkoutData(), items: [{ product_id: 'invalid', quantity: 1 }] },
      // Invalid shipping method
      { ...generateTestData.checkoutData(), shipping_method_id: 'invalid' },
      // Invalid payment method
      { ...generateTestData.checkoutData(), payment_method: 'invalid' }
    ];
    
    const results = [];
    
    for (const invalidData of invalidRequests) {
      const result = await measurePerformance(
        () => axios.post(`${BASE_URL}/api/orders/checkout/init`, invalidData, {
          headers: { 'Content-Type': 'application/json' }
        }),
        2000 // Should fail quickly
      );
      
      results.push({
        data: invalidData,
        result
      });
    }
    
    const properErrors = results.filter(r => !r.result.success && r.result.error);
    
    console.log(`  Total invalid requests: ${invalidRequests.length}`);
    console.log(`  Proper error responses: ${properErrors.length}`);
    console.log(`  Error handling rate: ${(properErrors.length / invalidRequests.length * 100).toFixed(1)}%`);
    
    return {
      total: invalidRequests.length,
      properErrors: properErrors.length,
      errorHandlingRate: properErrors.length / invalidRequests.length,
      results
    };
  }
};

// Race condition test
const raceConditionTests = {
  // Test inventory race condition
  async testInventoryRaceCondition() {
    console.log('🧪 Testing inventory race condition...');
    
    const productId = 'test-product-1';
    const concurrentOrders = 10;
    const stockQuantity = 5;
    
    // Setup: Create product with limited stock
    await axios.post(`${BASE_URL}/api/test/setup`, {
      products: [{
        id: productId,
        name: 'Test Product',
        price: 100,
        stock_quantity: stockQuantity,
        is_active: true
      }]
    });
    
    // Act: Create concurrent orders
    const orderPromises = [];
    
    for (let i = 0; i < concurrentOrders; i++) {
      const testData = {
        ...generateTestData.checkoutData(`race-test-user-${i}`),
        items: [{ product_id: productId, quantity: 1, unit_price: 100, total_price: 100 }]
      };
      
      orderPromises.push(
        axios.post(`${BASE_URL}/api/orders/checkout/init`, testData, {
          headers: { 'Content-Type': 'application/json' }
        }).catch(error => ({ error: error.response?.data || error.message }))
      );
    }
    
    const results = await Promise.all(orderPromises);
    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);
    
    // Check final stock
    const stockResponse = await axios.get(`${BASE_URL}/api/test/product/${productId}`);
    const finalStock = stockResponse.data.stock_quantity;
    
    console.log(`  Initial stock: ${stockQuantity}`);
    console.log(`  Concurrent orders: ${concurrentOrders}`);
    console.log(`  Successful orders: ${successful.length}`);
    console.log(`  Failed orders: ${failed.length}`);
    console.log(`  Final stock: ${finalStock}`);
    
    // Check for race condition
    const oversold = successful.length > stockQuantity;
    const stockMismatch = finalStock < 0;
    
    console.log(`  Race condition detected: ${oversold || stockMismatch ? '❌ YES' : '✅ NO'}`);
    
    return {
      initialStock: stockQuantity,
      concurrentOrders,
      successfulOrders: successful.length,
      failedOrders: failed.length,
      finalStock,
      raceConditionDetected: oversold || stockMismatch
    };
  }
};

// Security test helpers
const securityTests = {
  // Test SQL injection prevention
  async testSQLInjectionPrevention() {
    console.log('🧪 Testing SQL injection prevention...');
    
    const maliciousInputs = [
      "'; DROP TABLE products; --",
      "' OR 1=1; --",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      "'; UPDATE products SET price = 0; --"
    ];
    
    const results = [];
    
    for (const input of maliciousInputs) {
      try {
        const response = await axios.get(`${BASE_URL}/api/products?search=${encodeURIComponent(input)}`);
        results.push({
          input,
          success: true,
          status: response.status
        });
      } catch (error) {
        results.push({
          input,
          success: false,
          error: error.response?.status || error.message
        });
      }
    }
    
    const safe = results.filter(r => r.success);
    const vulnerable = results.filter(r => !r.success);
    
    console.log(`  Total malicious inputs: ${maliciousInputs.length}`);
    console.log(`  Safe responses: ${safe.length}`);
    console.log(`  Vulnerable responses: ${vulnerable.length}`);
    console.log(`  Security status: ${vulnerable.length === 0 ? '✅ SECURE' : '❌ VULNERABLE'}`);
    
    return {
      total: maliciousInputs.length,
      safe: safe.length,
      vulnerable: vulnerable.length,
      secure: vulnerable.length === 0,
      results
    };
  },

  // Test XSS prevention
  async testXSSPrevention() {
    console.log('🧪 Testing XSS prevention...');
    
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(\'xss\')">',
      'javascript:alert("xss")',
      '<iframe src="javascript:alert(\'xss\')"></iframe>'
    ];
    
    const results = [];
    
    for (const input of maliciousInputs) {
      const testData = {
        ...generateTestData.checkoutData(),
        notes: input
      };
      
      try {
        const response = await axios.post(`${BASE_URL}/api/orders/checkout/init`, testData, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Check if malicious content was sanitized
        const orderId = response.data.data.order_id;
        const orderResponse = await axios.get(`${BASE_URL}/api/orders/${orderId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        const order = orderResponse.data.order;
        const sanitized = !order.notes?.includes('<script>') && !order.notes?.includes('javascript:');
        
        results.push({
          input,
          success: true,
          sanitized
        });
      } catch (error) {
        results.push({
          input,
          success: false,
          error: error.response?.data || error.message
        });
      }
    }
    
    const sanitized = results.filter(r => r.success && r.sanitized);
    const vulnerable = results.filter(r => r.success && !r.sanitized);
    
    console.log(`  Total malicious inputs: ${maliciousInputs.length}`);
    console.log(`  Properly sanitized: ${sanitized.length}`);
    console.log(`  Vulnerable: ${vulnerable.length}`);
    console.log(`  Security status: ${vulnerable.length === 0 ? '✅ SECURE' : '❌ VULNERABLE'}`);
    
    return {
      total: maliciousInputs.length,
      sanitized: sanitized.length,
      vulnerable: vulnerable.length,
      secure: vulnerable.length === 0,
      results
    };
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Performance and Security Tests for Checkout System\n');
  
  const results = {
    performance: {},
    raceCondition: {},
    security: {}
  };
  
  try {
    // Performance tests
    console.log('📊 PERFORMANCE TESTS');
    console.log('====================');
    
    results.performance.checkoutInit = await performanceTests.testCheckoutInitPerformance();
    console.log('');
    
    results.performance.concurrent = await performanceTests.testConcurrentCheckout();
    console.log('');
    
    results.performance.paymentVerify = await performanceTests.testPaymentVerificationPerformance();
    console.log('');
    
    results.performance.loadTest = await performanceTests.testLoadWithMultipleUsers();
    console.log('');
    
    results.performance.errorHandling = await performanceTests.testErrorHandlingUnderLoad();
    console.log('');
    
    // Race condition tests
    console.log('🏁 RACE CONDITION TESTS');
    console.log('========================');
    
    results.raceCondition.inventory = await raceConditionTests.testInventoryRaceCondition();
    console.log('');
    
    // Security tests
    console.log('🔒 SECURITY TESTS');
    console.log('==================');
    
    results.security.sqlInjection = await securityTests.testSQLInjectionPrevention();
    console.log('');
    
    results.security.xss = await securityTests.testXSSPrevention();
    console.log('');
    
    // Summary
    console.log('📋 TEST SUMMARY');
    console.log('===============');
    
    const performancePassed = Object.values(results.performance).filter(r => r.success !== false).length;
    const performanceTotal = Object.keys(results.performance).length;
    
    const securityPassed = Object.values(results.security).filter(r => r.secure).length;
    const securityTotal = Object.keys(results.security).length;
    
    console.log(`Performance Tests: ${performancePassed}/${performanceTotal} passed`);
    console.log(`Security Tests: ${securityPassed}/${securityTotal} passed`);
    console.log(`Race Condition: ${results.raceCondition.inventory.raceConditionDetected ? '❌ DETECTED' : '✅ NONE'}`);
    
    const overallSuccess = performancePassed === performanceTotal && 
                          securityPassed === securityTotal && 
                          !results.raceCondition.inventory.raceConditionDetected;
    
    console.log(`\nOverall Status: ${overallSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    return {
      success: overallSuccess,
      results
    };
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export for use in other test files
module.exports = {
  performanceTests,
  raceConditionTests,
  securityTests,
  runAllTests,
  generateTestData,
  THRESHOLDS,
  measurePerformance,
  runConcurrentTest
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
} 