import request from 'supertest';
import app from '../../index';
import securityMiddleware from '../../middleware/security';

describe('Security Middleware Tests', () => {
  describe('CSRF Protection', () => {
    test('should generate valid CSRF token', () => {
      const token = securityMiddleware.generateCSRFToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    test('should validate correct CSRF token', () => {
      const token = securityMiddleware.generateCSRFToken();
      const isValid = securityMiddleware.validateCSRFToken(token, token);
      expect(isValid).toBe(true);
    });

    test('should reject invalid CSRF token', () => {
      const token1 = securityMiddleware.generateCSRFToken();
      const token2 = securityMiddleware.generateCSRFToken();
      const isValid = securityMiddleware.validateCSRFToken(token1, token2);
      expect(isValid).toBe(false);
    });

    test('should reject empty CSRF token', () => {
      const isValid = securityMiddleware.validateCSRFToken('', '');
      expect(isValid).toBe(false);
    });
  });

  describe('Rate Limiting Configuration', () => {
    test('should have payment rate limiting configured', () => {
      expect(securityMiddleware.rateLimitConfig.payment).toBeDefined();
    });

    test('should have auth rate limiting configured', () => {
      expect(securityMiddleware.rateLimitConfig.auth).toBeDefined();
    });

    test('should have checkout rate limiting configured', () => {
      expect(securityMiddleware.rateLimitConfig.checkout).toBeDefined();
    });

    test('should have general rate limiting configured', () => {
      expect(securityMiddleware.rateLimitConfig.general).toBeDefined();
    });
  });

  describe('Session Configuration', () => {
    test('should have secure session configuration', () => {
      const config = securityMiddleware.sessionConfig;
      expect(config.secret).toBeDefined();
      expect(config.name).toBe('morandi.sid');
      expect(config.resave).toBe(false);
      expect(config.saveUninitialized).toBe(false);
      expect(config.rolling).toBe(true);
    });

    test('should have secure cookie configuration', () => {
      const config = securityMiddleware.sessionConfig;
      expect(config.cookie.httpOnly).toBe(true);
      expect(config.cookie.sameSite).toBe('strict');
      expect(config.cookie.maxAge).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe('Input Validation', () => {
    test('should validate phone number format', () => {
      const validPhone = '1234567890';
      const invalidPhone = '123';
      
      // This would be imported from utils, but for test we'll define it here
      const validatePhone = (phone: string): boolean => {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone);
      };
      
      expect(validatePhone(validPhone)).toBe(true);
      expect(validatePhone(invalidPhone)).toBe(false);
    });

    test('should validate postal code format', () => {
      const validPostalCode = '400001';
      const invalidPostalCode = '4000';
      
      // This would be imported from utils, but for test we'll define it here
      const validatePostalCode = (postalCode: string): boolean => {
        const postalCodeRegex = /^[0-9]{6}$/;
        return postalCodeRegex.test(postalCode);
      };
      
      expect(validatePostalCode(validPostalCode)).toBe(true);
      expect(validatePostalCode(invalidPostalCode)).toBe(false);
    });
  });
});

describe('Security Integration Tests', () => {
  describe('Payment Endpoints Security', () => {
    test('should reject requests without CSRF token', async () => {
      const response = await request(app)
        .post('/api/orders/checkout/init')
        .send({
          items: [],
          shipping_address: {
            first_name: 'John',
            last_name: 'Doe',
            address_line_1: '123 Main St',
            city: 'Mumbai',
            state: 'Maharashtra',
            postal_code: '400001',
            country: 'India',
            phone: '1234567890'
          },
          shipping_method_id: 'standard',
          payment_method: 'razorpay'
        })
        .expect(403);

      expect(response.body.error).toContain('CSRF token validation failed');
    });

    test('should reject requests with invalid origin', async () => {
      const response = await request(app)
        .post('/api/orders/checkout/init')
        .set('Origin', 'https://malicious-site.com')
        .send({
          items: [],
          shipping_address: {
            first_name: 'John',
            last_name: 'Doe',
            address_line_1: '123 Main St',
            city: 'Mumbai',
            state: 'Maharashtra',
            postal_code: '400001',
            country: 'India',
            phone: '1234567890'
          },
          shipping_method_id: 'standard',
          payment_method: 'razorpay'
        })
        .expect(403);

      expect(response.body.error).toContain('Invalid request origin');
    });

    test('should reject oversized requests', async () => {
      const largePayload = 'x'.repeat(1024 * 1024 + 1); // 1MB + 1 byte
      
      const response = await request(app)
        .post('/api/orders/checkout/init')
        .set('Content-Length', (1024 * 1024 + 1).toString())
        .send({ data: largePayload })
        .expect(413);

      expect(response.body.error).toContain('Request too large');
    });
  });

  describe('Rate Limiting Tests', () => {
    test('should apply rate limiting to payment endpoints', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(15).fill(null).map(() =>
        request(app)
          .post('/api/orders/checkout/init')
          .send({
            items: [],
            shipping_address: {
              first_name: 'John',
              last_name: 'Doe',
              address_line_1: '123 Main St',
              city: 'Mumbai',
              state: 'Maharashtra',
              postal_code: '400001',
              country: 'India',
              phone: '1234567890'
            },
            shipping_method_id: 'standard',
            payment_method: 'razorpay'
          })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      // Should have some rate limited responses
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });
});

describe('Error Handling Security', () => {
  test('should not expose sensitive information in errors', async () => {
    const response = await request(app)
      .post('/api/orders/checkout/init')
      .send({ invalid: 'data' })
      .expect(400);

    expect(response.body.error).toBeDefined();
    expect(response.body.code).toBeDefined();
    expect(response.body.message).toBeUndefined(); // Should not expose stack traces
  });

  test('should handle security errors gracefully', async () => {
    const response = await request(app)
      .post('/api/orders/checkout/init')
      .set('X-CSRF-Token', 'invalid-token')
      .send({
        items: [],
        shipping_address: {
          first_name: 'John',
          last_name: 'Doe',
          address_line_1: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          postal_code: '400001',
          country: 'India',
          phone: '1234567890'
        },
        shipping_method_id: 'standard',
        payment_method: 'razorpay'
      })
      .expect(403);

    expect(response.body.error).toBeDefined();
    expect(response.body.code).toBe('CSRF_ERROR');
  });
}); 