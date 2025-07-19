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
      })),
      rpc: jest.fn(() => Promise.resolve({ data: true, error: null }))
    }))
  }))
}));

describe('Reviews API', () => {
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

  describe('GET /api/reviews/products/:productId/reviews', () => {
    it('should return product reviews without authentication', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          rating: 5,
          title: 'Great product!',
          review_text: 'This is an excellent product.',
          is_approved: true,
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      // Mock Supabase response
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(() => Promise.resolve({ data: mockReviews, error: null }))
              }))
            }))
          }))
        }))
      });

      const response = await request(app)
        .get('/api/reviews/products/product-1/reviews')
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('ratingDistribution');
    });

    it('should handle filtering by rating', async () => {
      const response = await request(app)
        .get('/api/reviews/products/product-1/reviews?rating=5')
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
    });

    it('should handle search parameter', async () => {
      const response = await request(app)
        .get('/api/reviews/products/product-1/reviews?search=great')
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
    });

    it('should handle sorting parameters', async () => {
      const response = await request(app)
        .get('/api/reviews/products/product-1/reviews?sortBy=date&sortOrder=desc')
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/reviews/products/product-1/reviews?page=2&limit=10')
        .expect(200);

      expect(response.body).toHaveProperty('reviews');
      expect(response.body).toHaveProperty('hasNextPage');
      expect(response.body).toHaveProperty('hasPreviousPage');
    });
  });

  describe('POST /api/reviews', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .send({
          productId: 'product-1',
          rating: 5,
          title: 'Great product!',
          reviewText: 'This is an excellent product.'
        })
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'product-1',
          rating: 5
          // Missing title and reviewText
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });

    it('should return 400 for invalid rating', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'product-1',
          rating: 6, // Invalid rating
          title: 'Great product!',
          reviewText: 'This is an excellent product.'
        })
        .expect(400);

      expect(response.body.error).toBe('Rating must be between 1 and 5');
    });

    it('should return 400 for short title', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'product-1',
          rating: 5,
          title: 'A', // Too short
          reviewText: 'This is an excellent product.'
        })
        .expect(400);

      expect(response.body.error).toBe('Title must be between 3 and 255 characters');
    });

    it('should return 400 for short review text', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'product-1',
          rating: 5,
          title: 'Great product!',
          reviewText: 'Short' // Too short
        })
        .expect(400);

      expect(response.body.error).toBe('Review text must be between 10 and 2000 characters');
    });

    it('should create review successfully', async () => {
      // Mock successful review creation
      const mockReview = {
        id: 'review-1',
        product_id: 'product-1',
        user_id: userId,
        rating: 5,
        title: 'Great product!',
        review_text: 'This is an excellent product.',
        is_verified_purchase: true,
        is_approved: false,
        created_at: '2024-01-01T00:00:00Z'
      };

      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.rpc.mockReturnValue(Promise.resolve({ data: true, error: null }));
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockReview, error: null }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: mockReview, error: null }))
      });

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'product-1',
          rating: 5,
          title: 'Great product!',
          reviewText: 'This is an excellent product.'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.rating).toBe(5);
      expect(response.body.title).toBe('Great product!');
      expect(response.body.isApproved).toBe(false);
    });

    it('should handle image uploads', async () => {
      const mockReview = {
        id: 'review-1',
        product_id: 'product-1',
        user_id: userId,
        rating: 5,
        title: 'Great product!',
        review_text: 'This is an excellent product.',
        is_verified_purchase: true,
        is_approved: false,
        created_at: '2024-01-01T00:00:00Z'
      };

      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.rpc.mockReturnValue(Promise.resolve({ data: true, error: null }));
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockReview, error: null }))
            }))
          }))
        })),
        insert: jest.fn(() => Promise.resolve({ data: mockReview, error: null }))
      });

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: 'product-1',
          rating: 5,
          title: 'Great product!',
          reviewText: 'This is an excellent product.',
          imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('PUT /api/reviews/:reviewId', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/reviews/review-1')
        .send({
          rating: 4,
          title: 'Updated review',
          reviewText: 'Updated review text.'
        })
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should update review successfully', async () => {
      const mockReview = {
        id: 'review-1',
        product_id: 'product-1',
        user_id: userId,
        rating: 4,
        title: 'Updated review',
        review_text: 'Updated review text.',
        is_verified_purchase: true,
        is_approved: false,
        is_edited: true,
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockReview, error: null }))
            }))
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockReview, error: null }))
            }))
          }))
        }))
      });

      const response = await request(app)
        .put('/api/reviews/review-1')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4,
          title: 'Updated review',
          reviewText: 'Updated review text.'
        })
        .expect(200);

      expect(response.body.rating).toBe(4);
      expect(response.body.title).toBe('Updated review');
      expect(response.body.isEdited).toBe(true);
    });

    it('should return 404 for non-existent review', async () => {
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
        .put('/api/reviews/non-existent-review')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          rating: 4,
          title: 'Updated review',
          reviewText: 'Updated review text.'
        })
        .expect(404);

      expect(response.body.error).toBe('Review not found or not authorized');
    });
  });

  describe('DELETE /api/reviews/:reviewId', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/reviews/review-1')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should delete review successfully', async () => {
      const mockReview = {
        id: 'review-1',
        product_id: 'product-1',
        user_id: userId,
        rating: 5,
        title: 'Great product!',
        review_text: 'This is an excellent product.',
        is_verified_purchase: true,
        is_approved: false
      };

      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from.mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: mockReview, error: null }))
            }))
          }))
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      });

      const response = await request(app)
        .delete('/api/reviews/review-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Review deleted successfully');
    });
  });

  describe('POST /api/reviews/:reviewId/vote', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/reviews/review-1/vote')
        .send({ voteType: 'helpful' })
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should vote on review successfully', async () => {
      const response = await request(app)
        .post('/api/reviews/review-1/vote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ voteType: 'helpful' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid vote type', async () => {
      const response = await request(app)
        .post('/api/reviews/review-1/vote')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ voteType: 'invalid' })
        .expect(400);

      expect(response.body.error).toBe('Invalid vote type');
    });
  });

  describe('POST /api/reviews/:reviewId/report', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/reviews/review-1/report')
        .send({
          reportReason: 'inappropriate',
          reportDescription: 'This review violates guidelines.'
        })
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should report review successfully', async () => {
      const response = await request(app)
        .post('/api/reviews/review-1/report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportReason: 'inappropriate',
          reportDescription: 'This review violates guidelines.'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 when report reason is missing', async () => {
      const response = await request(app)
        .post('/api/reviews/review-1/report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          reportDescription: 'This review violates guidelines.'
        })
        .expect(400);

      expect(response.body.error).toBe('Report reason is required');
    });
  });

  describe('GET /api/reviews/products/:productId/can-review', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/reviews/products/product-1/can-review')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    it('should return review eligibility', async () => {
      const response = await request(app)
        .get('/api/reviews/products/product-1/can-review')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('canReview');
      expect(response.body).toHaveProperty('hasPurchase');
      expect(response.body).toHaveProperty('hasReview');
      expect(typeof response.body.canReview).toBe('boolean');
    });
  });

  describe('GET /api/reviews/products/:productId/reviews/analytics', () => {
    it('should return review analytics', async () => {
      const response = await request(app)
        .get('/api/reviews/products/product-1/reviews/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('productId');
      expect(response.body).toHaveProperty('totalReviews');
      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('ratingDistribution');
    });
  });
}); 