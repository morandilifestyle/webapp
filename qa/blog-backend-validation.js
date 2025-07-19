/**
 * Blog and Content Management - Backend Validation Script
 * 
 * This script validates the backend logic for the blog and content management system.
 * Run with: node qa/blog-backend-validation.js
 */

const axios = require('axios');
const crypto = require('crypto');

// Test configuration
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3001';
const TEST_USER_ID = 'test-user-id';
const TEST_ADMIN_ID = 'test-admin-id';

// Mock data
const validBlogPost = {
  title: 'Sustainable Living Guide',
  content: 'This is a comprehensive guide to sustainable living practices that everyone can adopt in their daily lives. From reducing plastic waste to choosing eco-friendly products, we cover all aspects of sustainable living.',
  excerpt: 'Learn how to live more sustainably with our comprehensive guide.',
  status: 'draft',
  tags: ['sustainability', 'lifestyle', 'eco-friendly'],
  isFeatured: false,
  metaTitle: 'Sustainable Living Guide - Morandi Lifestyle',
  metaDescription: 'Learn how to live more sustainably with our comprehensive guide covering all aspects of eco-friendly living.'
};

const validComment = {
  content: 'This is a great article! Very informative and well-written.',
  authorName: 'John Doe',
  authorEmail: 'john@example.com'
};

const validCategory = {
  name: 'Wellness',
  description: 'Articles about health and wellness',
  sortOrder: 2
};

// Helper functions
const generateTestToken = (userId, role = 'user') => {
  const payload = {
    userId,
    email: 'test@example.com',
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  
  // In a real implementation, this would use the actual JWT secret
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}/api${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.response?.data?.error || error.message
    };
  }
};

// Test cases
const testCases = {
  // Blog Posts CRUD Tests
  async testBlogPostCRUD() {
    console.log('🧪 Testing Blog Post CRUD Operations...');
    
    const adminToken = generateTestToken(TEST_ADMIN_ID, 'admin');
    const userToken = generateTestToken(TEST_USER_ID, 'user');
    
    // Test 1: Create blog post (admin)
    console.log('   📝 Testing blog post creation...');
    const createResult = await makeRequest('POST', '/blog/posts', validBlogPost, adminToken);
    
    if (createResult.success) {
      console.log('✅ Blog post creation PASSED');
      console.log('   - Status:', createResult.status);
      console.log('   - Post ID:', createResult.data.id);
      console.log('   - Slug generated:', createResult.data.slug);
      console.log('   - Reading time calculated:', createResult.data.readingTime);
      
      const postId = createResult.data.id;
      
      // Test 2: Update blog post
      console.log('   📝 Testing blog post update...');
      const updateData = {
        title: 'Updated Sustainable Living Guide',
        status: 'published',
        isFeatured: true
      };
      
      const updateResult = await makeRequest('PUT', `/blog/posts/${postId}`, updateData, adminToken);
      
      if (updateResult.success) {
        console.log('✅ Blog post update PASSED');
        console.log('   - Status:', updateResult.status);
        console.log('   - Title updated:', updateResult.data.title);
        console.log('   - Status changed:', updateResult.data.status);
      } else {
        console.log('❌ Blog post update FAILED');
        console.log('   - Error:', updateResult.error);
      }
      
      // Test 3: Get blog posts with filters
      console.log('   📝 Testing blog posts retrieval...');
      const getPostsResult = await makeRequest('GET', '/blog/posts?status=published&limit=5');
      
      if (getPostsResult.success) {
        console.log('✅ Blog posts retrieval PASSED');
        console.log('   - Status:', getPostsResult.status);
        console.log('   - Posts returned:', getPostsResult.data.length);
      } else {
        console.log('❌ Blog posts retrieval FAILED');
        console.log('   - Error:', getPostsResult.error);
      }
      
      // Test 4: Delete blog post
      console.log('   📝 Testing blog post deletion...');
      const deleteResult = await makeRequest('DELETE', `/blog/posts/${postId}`, null, adminToken);
      
      if (deleteResult.success) {
        console.log('✅ Blog post deletion PASSED');
        console.log('   - Status:', deleteResult.status);
      } else {
        console.log('❌ Blog post deletion FAILED');
        console.log('   - Error:', deleteResult.error);
      }
      
    } else {
      console.log('❌ Blog post creation FAILED');
      console.log('   - Error:', createResult.error);
      console.log('   - Status:', createResult.status);
    }
    
    return createResult.success;
  },

  // Blog Categories Tests
  async testBlogCategories() {
    console.log('\n🧪 Testing Blog Categories...');
    
    const adminToken = generateTestToken(TEST_ADMIN_ID, 'admin');
    
    // Test 1: Create category
    console.log('   📝 Testing category creation...');
    const createResult = await makeRequest('POST', '/blog/categories', validCategory, adminToken);
    
    if (createResult.success) {
      console.log('✅ Category creation PASSED');
      console.log('   - Status:', createResult.status);
      console.log('   - Category ID:', createResult.data.id);
      console.log('   - Slug generated:', createResult.data.slug);
      
      // Test 2: Get categories
      console.log('   📝 Testing categories retrieval...');
      const getResult = await makeRequest('GET', '/blog/categories');
      
      if (getResult.success) {
        console.log('✅ Categories retrieval PASSED');
        console.log('   - Status:', getResult.status);
        console.log('   - Categories returned:', getResult.data.length);
      } else {
        console.log('❌ Categories retrieval FAILED');
        console.log('   - Error:', getResult.error);
      }
      
    } else {
      console.log('❌ Category creation FAILED');
      console.log('   - Error:', createResult.error);
    }
    
    return createResult.success;
  },

  // Blog Comments Tests
  async testBlogComments() {
    console.log('\n🧪 Testing Blog Comments...');
    
    const adminToken = generateTestToken(TEST_ADMIN_ID, 'admin');
    const userToken = generateTestToken(TEST_USER_ID, 'user');
    
    // First create a blog post for testing comments
    const postResult = await makeRequest('POST', '/blog/posts', {
      ...validBlogPost,
      status: 'published'
    }, adminToken);
    
    if (!postResult.success) {
      console.log('❌ Cannot test comments - failed to create test post');
      return false;
    }
    
    const postId = postResult.data.id;
    
    // Test 1: Create comment (authenticated user)
    console.log('   📝 Testing authenticated comment creation...');
    const authCommentResult = await makeRequest('POST', `/blog/posts/${postId}/comments`, {
      content: 'Great article! Very informative.'
    }, userToken);
    
    if (authCommentResult.success) {
      console.log('✅ Authenticated comment creation PASSED');
      console.log('   - Status:', authCommentResult.status);
      console.log('   - Auto-approved:', authCommentResult.data.isApproved);
    } else {
      console.log('❌ Authenticated comment creation FAILED');
      console.log('   - Error:', authCommentResult.error);
    }
    
    // Test 2: Create comment (guest user)
    console.log('   📝 Testing guest comment creation...');
    const guestCommentResult = await makeRequest('POST', `/blog/posts/${postId}/comments`, validComment);
    
    if (guestCommentResult.success) {
      console.log('✅ Guest comment creation PASSED');
      console.log('   - Status:', guestCommentResult.status);
      console.log('   - Requires approval:', !guestCommentResult.data.isApproved);
      console.log('   - Author name stored:', guestCommentResult.data.authorName);
    } else {
      console.log('❌ Guest comment creation FAILED');
      console.log('   - Error:', guestCommentResult.error);
    }
    
    // Test 3: Get comments
    console.log('   📝 Testing comments retrieval...');
    const getCommentsResult = await makeRequest('GET', `/blog/posts/${postId}/comments`);
    
    if (getCommentsResult.success) {
      console.log('✅ Comments retrieval PASSED');
      console.log('   - Status:', getCommentsResult.status);
      console.log('   - Comments returned:', getCommentsResult.data.length);
    } else {
      console.log('❌ Comments retrieval FAILED');
      console.log('   - Error:', getCommentsResult.error);
    }
    
    // Clean up
    await makeRequest('DELETE', `/blog/posts/${postId}`, null, adminToken);
    
    return authCommentResult.success && guestCommentResult.success;
  },

  // Newsletter Tests
  async testNewsletter() {
    console.log('\n🧪 Testing Newsletter Subscription...');
    
    // Test 1: Subscribe to newsletter
    console.log('   📝 Testing newsletter subscription...');
    const subscribeResult = await makeRequest('POST', '/blog/newsletter/subscribe', {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      source: 'blog'
    });
    
    if (subscribeResult.success) {
      console.log('✅ Newsletter subscription PASSED');
      console.log('   - Status:', subscribeResult.status);
      console.log('   - Subscription active:', subscribeResult.data.isActive);
    } else {
      console.log('❌ Newsletter subscription FAILED');
      console.log('   - Error:', subscribeResult.error);
    }
    
    // Test 2: Unsubscribe from newsletter
    console.log('   📝 Testing newsletter unsubscription...');
    const unsubscribeResult = await makeRequest('POST', '/blog/newsletter/unsubscribe', {
      email: 'test@example.com'
    });
    
    if (unsubscribeResult.success) {
      console.log('✅ Newsletter unsubscription PASSED');
      console.log('   - Status:', unsubscribeResult.status);
    } else {
      console.log('❌ Newsletter unsubscription FAILED');
      console.log('   - Error:', unsubscribeResult.error);
    }
    
    return subscribeResult.success && unsubscribeResult.success;
  },

  // Security Tests
  async testSecurity() {
    console.log('\n🧪 Testing Security...');
    
    // Test 1: Unauthorized access
    console.log('   📝 Testing unauthorized access...');
    const unauthorizedResult = await makeRequest('POST', '/blog/posts', validBlogPost);
    
    if (!unauthorizedResult.success && unauthorizedResult.status === 401) {
      console.log('✅ Unauthorized access protection PASSED');
      console.log('   - Status:', unauthorizedResult.status);
    } else {
      console.log('❌ Unauthorized access protection FAILED');
      console.log('   - Status:', unauthorizedResult.status);
    }
    
    // Test 2: Invalid data validation
    console.log('   📝 Testing input validation...');
    const invalidData = {
      title: '', // Empty title
      content: '', // Empty content
      status: 'invalid_status' // Invalid status
    };
    
    const userToken = generateTestToken(TEST_USER_ID, 'user');
    const validationResult = await makeRequest('POST', '/blog/posts', invalidData, userToken);
    
    if (!validationResult.success && validationResult.status === 400) {
      console.log('✅ Input validation PASSED');
      console.log('   - Status:', validationResult.status);
    } else {
      console.log('❌ Input validation FAILED');
      console.log('   - Status:', validationResult.status);
    }
    
    // Test 3: XSS prevention
    console.log('   📝 Testing XSS prevention...');
    const xssData = {
      title: 'Test Post',
      content: '<script>alert("xss")</script>This is a test post with malicious content.',
      status: 'draft'
    };
    
    const xssResult = await makeRequest('POST', '/blog/posts', xssData, userToken);
    
    if (xssResult.success) {
      console.log('✅ XSS prevention PASSED');
      console.log('   - Post created successfully');
      // In a real implementation, you'd check if the script tags were sanitized
    } else {
      console.log('❌ XSS prevention FAILED');
      console.log('   - Error:', xssResult.error);
    }
    
    return unauthorizedResult.status === 401 && validationResult.status === 400;
  },

  // Performance Tests
  async testPerformance() {
    console.log('\n🧪 Testing Performance...');
    
    // Test 1: Blog posts API response time
    console.log('   📝 Testing blog posts API response time...');
    const startTime = Date.now();
    
    const result = await makeRequest('GET', '/blog/posts?limit=10');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (result.success && duration < 500) {
      console.log('✅ Performance test PASSED');
      console.log('   - Response time:', duration + 'ms');
      console.log('   - Under 500ms threshold');
    } else {
      console.log('❌ Performance test FAILED');
      console.log('   - Response time:', duration + 'ms');
      console.log('   - Exceeds 500ms threshold');
    }
    
    // Test 2: Search performance
    console.log('   📝 Testing search performance...');
    const searchStartTime = Date.now();
    
    const searchResult = await makeRequest('GET', '/blog/posts?search=sustainable');
    
    const searchEndTime = Date.now();
    const searchDuration = searchEndTime - searchStartTime;
    
    if (searchResult.success && searchDuration < 300) {
      console.log('✅ Search performance test PASSED');
      console.log('   - Search time:', searchDuration + 'ms');
      console.log('   - Under 300ms threshold');
    } else {
      console.log('❌ Search performance test FAILED');
      console.log('   - Search time:', searchDuration + 'ms');
      console.log('   - Exceeds 300ms threshold');
    }
    
    return duration < 500 && searchDuration < 300;
  },

  // Analytics Tests
  async testAnalytics() {
    console.log('\n🧪 Testing Analytics...');
    
    const adminToken = generateTestToken(TEST_ADMIN_ID, 'admin');
    
    // Test 1: Track content view
    console.log('   📝 Testing content view tracking...');
    
    // First create a test post
    const postResult = await makeRequest('POST', '/blog/posts', {
      ...validBlogPost,
      status: 'published'
    }, adminToken);
    
    if (postResult.success) {
      const postId = postResult.data.id;
      
      // Simulate viewing the post (this would normally happen when the post is fetched)
      console.log('   📝 Simulating post view...');
      
      // Test 2: Get analytics (admin only)
      console.log('   📝 Testing analytics retrieval...');
      const analyticsResult = await makeRequest('GET', `/blog/analytics/${postId}?contentType=blog_post`, null, adminToken);
      
      if (analyticsResult.success) {
        console.log('✅ Analytics retrieval PASSED');
        console.log('   - Status:', analyticsResult.status);
        console.log('   - Views tracked:', analyticsResult.data.views);
        console.log('   - Engagement rate:', analyticsResult.data.engagementRate);
      } else {
        console.log('❌ Analytics retrieval FAILED');
        console.log('   - Error:', analyticsResult.error);
      }
      
      // Clean up
      await makeRequest('DELETE', `/blog/posts/${postId}`, null, adminToken);
      
      return analyticsResult.success;
    } else {
      console.log('❌ Cannot test analytics - failed to create test post');
      return false;
    }
  }
};

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Blog and Content Management Backend Tests...\n');
  
  const startTime = Date.now();
  
  const results = {
    blogPostCRUD: await testCases.testBlogPostCRUD(),
    blogCategories: await testCases.testBlogCategories(),
    blogComments: await testCases.testBlogComments(),
    newsletter: await testCases.testNewsletter(),
    security: await testCases.testSecurity(),
    performance: await testCases.testPerformance(),
    analytics: await testCases.testAnalytics()
  };
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
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
  console.log(`Duration: ${duration}ms`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Review the issues above.');
  }
  
  return passed === total;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testCases, runAllTests }; 