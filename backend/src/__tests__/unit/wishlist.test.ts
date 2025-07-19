import request from 'supertest';
import app from '../../index';
import { generateToken } from '../../middleware/auth';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }))
}));

describe('Wishlist API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(() => {
    userId = 'test-user-123';
    authToken = generateToken({
      userId,
      email: 'test@example.com',
      role: 'user'
    });
  });

  describe('GET /api/wishlist', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/wishlist')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return wishlist items with authentication', async () => {
      // Mock successful response
      const mockWishlistItems = [
        {
          id: 'wishlist-1',
          added_at: '2024-01-01T00:00:00Z',
          products: {
            id: 'product-1',
            name: 'Test Product',
            slug: 'test-product',
            price: 99.99,
            images: ['image1.jpg']
          }
        }
      ];

      // Mock Supabase response
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({
              range: jest.fn(() => Promise.resolve({ data: mockWishlistItems, error: null }))
            }))
          }))
        }))
      });

      const response = await request(app)
        .get('/api/wishlist')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('totalCount');
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/wishlist?page=2&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('totalCount');
    });
  });

  describe('POST /api/wishlist/items', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/wishlist/items')
        .send({ productId: 'test-product' })
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 when productId is missing', async () => {
      const response = await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Product ID is required');
    });

    it('should add item to wishlist successfully', async () => {
      // Mock successful product check
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: { id: 'product-1', is_active: true }, 
                error: null 
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
      });

      const response = await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'product-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Added to wishlist successfully');
    });

    it('should return 404 for non-existent product', async () => {
      // Mock product not found
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } }))
            }))
          }))
        }))
      });

      const response = await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'non-existent-product' })
        .expect(404);

      expect(response.body.error).toBe('Product not found or inactive');
    });

    it('should return 409 for duplicate item', async () => {
      // Mock existing item
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: { id: 'product-1', is_active: true }, 
                error: null 
              }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ 
          data: null, 
          error: { code: '23505', message: 'Duplicate key' } 
        }))
      });

      const response = await request(app)
        .post('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'product-1' })
        .expect(409);

      expect(response.body.error).toBe('Product already in wishlist');
    });
  });

  describe('DELETE /api/wishlist/items', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/wishlist/items')
        .send({ productId: 'test-product' })
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 when productId is missing', async () => {
      const response = await request(app)
        .delete('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Product ID is required');
    });

    it('should remove item from wishlist successfully', async () => {
      const response = await request(app)
        .delete('/api/wishlist/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'product-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Removed from wishlist successfully');
    });
  });

  describe('GET /api/wishlist/check/:productId', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/wishlist/check/product-1')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return wishlist status', async () => {
      const response = await request(app)
        .get('/api/wishlist/check/product-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('isInWishlist');
      expect(typeof response.body.isInWishlist).toBe('boolean');
    });
  });

  describe('GET /api/wishlist/count', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/wishlist/count')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return wishlist count', async () => {
      const response = await request(app)
        .get('/api/wishlist/count')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
    });
  });

  describe('DELETE /api/wishlist/clear', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/wishlist/clear')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should clear wishlist successfully', async () => {
      const response = await request(app)
        .delete('/api/wishlist/clear')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Wishlist cleared successfully');
    });
  });

  describe('POST /api/wishlist/items/move', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/wishlist/items/move')
        .send({ productId: 'test-product' })
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 when productId is missing', async () => {
      const response = await request(app)
        .post('/api/wishlist/items/move')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Product ID is required');
    });

    it('should move item to cart successfully', async () => {
      const response = await request(app)
        .post('/api/wishlist/items/move')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'product-1', quantity: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Moved to cart successfully');
    });

    it('should return 404 for item not in wishlist', async () => {
      // Mock item not found in wishlist
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: { message: 'Not found' } }))
            }))
          }))
        }))
      });

      const response = await request(app)
        .post('/api/wishlist/items/move')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ productId: 'non-existent-product' })
        .expect(404);

      expect(response.body.error).toBe('Product not found in wishlist');
    });
  });
}); 