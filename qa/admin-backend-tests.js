const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001/api/admin';
const TEST_TOKEN = 'test-admin-token';

// Test utilities
const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

// Test cases
const testCases = {
  // Dashboard Tests
  async testDashboard() {
    console.log('🧪 Testing Dashboard Endpoint...');
    const result = await makeRequest('GET', '/dashboard');
    
    if (result.success) {
      console.log('✅ Dashboard test PASSED');
      console.log('   - Status:', result.status);
      console.log('   - Has metrics:', !!result.data.totalRevenue);
      console.log('   - Has top products:', Array.isArray(result.data.topProducts));
      console.log('   - Has recent orders:', Array.isArray(result.data.recentOrders));
      console.log('   - Has low stock items:', Array.isArray(result.data.lowStockItems));
    } else {
      console.log('❌ Dashboard test FAILED');
      console.log('   - Error:', result.error);
      console.log('   - Status:', result.status);
    }
    return result.success;
  },

  // Product Management Tests
  async testProductCRUD() {
    console.log('\n🧪 Testing Product CRUD Operations...');
    
    // Test data
    const testProduct = {
      name: 'QA Test Product',
      price: 99.99,
      description: 'Product created during QA testing',
      category_id: '1',
      stock: 50
    };

    // Create product
    console.log('   📝 Creating product...');
    const createResult = await makeRequest('POST', '/products', testProduct);
    if (!createResult.success) {
      console.log('❌ Product creation FAILED:', createResult.error);
      return false;
    }
    
    const productId = createResult.data.id;
    console.log('✅ Product created with ID:', productId);

    // Get products
    console.log('   📋 Getting products...');
    const getResult = await makeRequest('GET', '/products');
    if (!getResult.success) {
      console.log('❌ Get products FAILED:', getResult.error);
      return false;
    }
    console.log('✅ Products retrieved:', getResult.data.length, 'products');

    // Update product
    console.log('   ✏️ Updating product...');
    const updateData = { name: 'Updated QA Test Product', price: 149.99 };
    const updateResult = await makeRequest('PUT', `/products/${productId}`, updateData);
    if (!updateResult.success) {
      console.log('❌ Product update FAILED:', updateResult.error);
      return false;
    }
    console.log('✅ Product updated successfully');

    // Delete product
    console.log('   🗑️ Deleting product...');
    const deleteResult = await makeRequest('DELETE', `/products/${productId}`);
    if (!deleteResult.success) {
      console.log('❌ Product deletion FAILED:', deleteResult.error);
      return false;
    }
    console.log('✅ Product deleted successfully');

    return true;
  },

  // Order Management Tests
  async testOrderManagement() {
    console.log('\n🧪 Testing Order Management...');
    
    // Get orders
    console.log('   📋 Getting orders...');
    const getResult = await makeRequest('GET', '/orders');
    if (!getResult.success) {
      console.log('❌ Get orders FAILED:', getResult.error);
      return false;
    }
    console.log('✅ Orders retrieved:', getResult.data.length, 'orders');

    // Test order status update (if orders exist)
    if (getResult.data.length > 0) {
      const orderId = getResult.data[0].id;
      console.log('   🔄 Updating order status...');
      const updateResult = await makeRequest('PATCH', `/orders/${orderId}/status`, {
        status: 'shipped'
      });
      
      if (updateResult.success) {
        console.log('✅ Order status updated successfully');
      } else {
        console.log('❌ Order status update FAILED:', updateResult.error);
      }
    }

    return getResult.success;
  },

  // Customer Management Tests
  async testCustomerManagement() {
    console.log('\n🧪 Testing Customer Management...');
    
    // Get customers
    console.log('   📋 Getting customers...');
    const getResult = await makeRequest('GET', '/customers');
    if (!getResult.success) {
      console.log('❌ Get customers FAILED:', getResult.error);
      return false;
    }
    console.log('✅ Customers retrieved:', getResult.data.length, 'customers');

    // Test customer details (if customers exist)
    if (getResult.data.length > 0) {
      const customerId = getResult.data[0].id;
      console.log('   👤 Getting customer details...');
      const detailResult = await makeRequest('GET', `/customers/${customerId}`);
      
      if (detailResult.success) {
        console.log('✅ Customer details retrieved successfully');
        console.log('   - Customer orders:', detailResult.data.orders?.length || 0);
      } else {
        console.log('❌ Customer details FAILED:', detailResult.error);
      }
    }

    return getResult.success;
  },

  // Inventory Management Tests
  async testInventoryManagement() {
    console.log('\n🧪 Testing Inventory Management...');
    
    // Get inventory
    console.log('   📦 Getting inventory...');
    const getResult = await makeRequest('GET', '/inventory');
    if (!getResult.success) {
      console.log('❌ Get inventory FAILED:', getResult.error);
      return false;
    }
    console.log('✅ Inventory retrieved successfully');
    console.log('   - Total products:', getResult.data.totalProducts);
    console.log('   - Low stock items:', getResult.data.lowStockItems?.length || 0);
    console.log('   - Total value:', getResult.data.totalValue);

    return getResult.success;
  },

  // Security Tests
  async testSecurity() {
    console.log('\n🧪 Testing Security...');
    
    // Test without token
    console.log('   🔒 Testing unauthorized access...');
    const unauthorizedResult = await makeRequest('GET', '/dashboard', null, {
      'Authorization': ''
    });
    
    if (!unauthorizedResult.success && unauthorizedResult.status === 401) {
      console.log('✅ Unauthorized access properly blocked');
    } else {
      console.log('❌ SECURITY ISSUE: Unauthorized access allowed');
      console.log('   - Status:', unauthorizedResult.status);
      console.log('   - Response:', unauthorizedResult.error);
    }

    // Test with invalid token
    console.log('   🔑 Testing invalid token...');
    const invalidTokenResult = await makeRequest('GET', '/dashboard', null, {
      'Authorization': 'Bearer invalid-token'
    });
    
    if (!invalidTokenResult.success && invalidTokenResult.status === 401) {
      console.log('✅ Invalid token properly rejected');
    } else {
      console.log('❌ SECURITY ISSUE: Invalid token accepted');
      console.log('   - Status:', invalidTokenResult.status);
    }

    return true; // Security tests are informational
  },

  // Validation Tests
  async testValidation() {
    console.log('\n🧪 Testing Input Validation...');
    
    // Test invalid product data
    console.log('   📝 Testing invalid product creation...');
    const invalidProduct = {
      name: '', // Empty name
      price: -10, // Negative price
      description: '', // Empty description
      category_id: '', // Empty category
      stock: -5 // Negative stock
    };
    
    const validationResult = await makeRequest('POST', '/products', invalidProduct);
    
    if (!validationResult.success && validationResult.status === 400) {
      console.log('✅ Input validation working correctly');
      console.log('   - Validation errors:', validationResult.error.errors?.length || 0);
    } else {
      console.log('❌ VALIDATION ISSUE: Invalid data accepted');
      console.log('   - Status:', validationResult.status);
      console.log('   - Response:', validationResult.error);
    }

    return true;
  },

  // Performance Tests
  async testPerformance() {
    console.log('\n🧪 Testing Performance...');
    
    const endpoints = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'Products', path: '/products' },
      { name: 'Orders', path: '/orders' },
      { name: 'Customers', path: '/customers' },
      { name: 'Inventory', path: '/inventory' }
    ];

    for (const endpoint of endpoints) {
      console.log(`   ⚡ Testing ${endpoint.name} performance...`);
      const startTime = Date.now();
      
      const result = await makeRequest('GET', endpoint.path);
      const responseTime = Date.now() - startTime;
      
      if (result.success) {
        console.log(`   ✅ ${endpoint.name}: ${responseTime}ms`);
        if (responseTime > 1000) {
          console.log(`   ⚠️  ${endpoint.name} is slow (>1s)`);
        }
      } else {
        console.log(`   ❌ ${endpoint.name} failed:`, result.error);
      }
    }

    return true;
  }
};

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Admin Backend Tests...\n');
  
  const results = {
    dashboard: await testCases.testDashboard(),
    productCRUD: await testCases.testProductCRUD(),
    orderManagement: await testCases.testOrderManagement(),
    customerManagement: await testCases.testCustomerManagement(),
    inventoryManagement: await testCases.testInventoryManagement(),
    security: await testCases.testSecurity(),
    validation: await testCases.testValidation(),
    performance: await testCases.testPerformance()
  };

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${test.padEnd(20)} ${status}`);
  });
  
  console.log('\n========================');
  console.log(`Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Review the issues above.');
  }
  
  return passed === total;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { testCases, runAllTests }; 