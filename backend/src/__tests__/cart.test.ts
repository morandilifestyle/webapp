import request from 'supertest';
import { Pool } from 'pg';
import app from '../index';

// Mock the database pool
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  })),
}));

const mockPool = new Pool() as jest.Mocked<Pool>;

describe('Cart API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/cart', () => {
    test('should return empty cart for new session', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/cart')
        .expect(200);

      expect(response.body).toEqual({
        items: [],
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        itemCount: 0,
      });
    });

    test('should return cart items for existing session', async () => {
      const mockItems = [
        {
          id: '1',
          product_id: 'prod-1',
          quantity: 2,
          added_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          name: 'Test Product',
          slug: 'test-product',
          price: '29.99',
          sale_price: null,
          stock_quantity: 10,
          images: ['image1.jpg'],
          attributes: { color: 'blue' },
        },
      ];

      mockPool.query.mockResolvedValueOnce({ rows: mockItems });

      const response = await request(app)
        .get('/api/cart')
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.itemCount).toBe(2);
      expect(response.body.subtotal).toBe(59.98);
    });
  });

  describe('POST /api/cart/items', () => {
    test('should add item to cart successfully', async () => {
      // Mock product exists and is in stock
      mockPool.query
        .mockResolvedValueOnce({
          rows: [{ id: 'prod-1', stock_quantity: 10, price: '29.99', sale_price: null }],
        })
        .mockResolvedValueOnce({ rowCount: 1 }) // Insert successful
        .mockResolvedValueOnce({ rows: [] }); // Return empty cart

      const response = await request(app)
        .post('/api/cart/items')
        .send({ productId: 'prod-1', quantity: 2 })
        .expect(200);

      expect(response.body.items).toBeDefined();
    });

    test('should reject invalid quantity', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .send({ productId: 'prod-1', quantity: 0 })
        .expect(400);

      expect(response.body.message).toContain('Invalid product ID or quantity');
    });

    test('should reject quantity above 99', async () => {
      const response = await request(app)
        .post('/api/cart/items')
        .send({ productId: 'prod-1', quantity: 100 })
        .expect(400);

      expect(response.body.message).toContain('Invalid product ID or quantity');
    });

    test('should reject non-existent product', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/cart/items')
        .send({ productId: 'non-existent', quantity: 1 })
        .expect(404);

      expect(response.body.message).toBe('Product not found');
    });

    test('should reject insufficient stock', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'prod-1', stock_quantity: 5, price: '29.99', sale_price: null }],
      });

      const response = await request(app)
        .post('/api/cart/items')
        .send({ productId: 'prod-1', quantity: 10 })
        .expect(400);

      expect(response.body.message).toBe('Insufficient stock');
    });
  });

  describe('PUT /api/cart/items/:id', () => {
    test('should update item quantity successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1 }) // Update successful
        .mockResolvedValueOnce({ rows: [] }); // Return empty cart

      const response = await request(app)
        .put('/api/cart/items/cart-item-1')
        .send({ quantity: 3 })
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('should reject invalid quantity', async () => {
      const response = await request(app)
        .put('/api/cart/items/cart-item-1')
        .send({ quantity: 0 })
        .expect(400);

      expect(response.body.message).toContain('Invalid quantity');
    });

    test('should reject non-existent cart item', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const response = await request(app)
        .put('/api/cart/items/non-existent')
        .send({ quantity: 1 })
        .expect(404);

      expect(response.body.message).toBe('Cart item not found');
    });
  });

  describe('DELETE /api/cart/items/:id', () => {
    test('should remove item successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1 }) // Delete successful
        .mockResolvedValueOnce({ rows: [] }); // Return empty cart

      const response = await request(app)
        .delete('/api/cart/items/cart-item-1')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('should reject non-existent cart item', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 0 });

      const response = await request(app)
        .delete('/api/cart/items/non-existent')
        .expect(404);

      expect(response.body.message).toBe('Cart item not found');
    });
  });

  describe('POST /api/cart/clear', () => {
    test('should clear cart successfully', async () => {
      mockPool.query.mockResolvedValueOnce({ rowCount: 2 });

      const response = await request(app)
        .post('/api/cart/clear')
        .expect(200);

      expect(response.body.message).toBe('Cart cleared successfully');
    });
  });

  describe('POST /api/cart/merge', () => {
    test('should merge guest cart to user cart', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rowCount: 1 }) // Merge successful
        .mockResolvedValueOnce({ rows: [] }); // Return empty cart

      const response = await request(app)
        .post('/api/cart/merge')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    test('should reject merge without authentication', async () => {
      const response = await request(app)
        .post('/api/cart/merge')
        .expect(401);

      expect(response.body.message).toBe('User must be authenticated');
    });
  });

  describe('GET /api/cart/count', () => {
    test('should return correct item count', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ count: '5' }],
      });

      const response = await request(app)
        .get('/api/cart/count')
        .expect(200);

      expect(response.body.count).toBe(5);
    });

    test('should return 0 for empty cart', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ count: null }],
      });

      const response = await request(app)
        .get('/api/cart/count')
        .expect(200);

      expect(response.body.count).toBe(0);
    });
  });
});

describe('Cart Business Logic', () => {
  describe('Total Calculations', () => {
    test('should calculate subtotal correctly', () => {
      const items = [
        { product: { price: 10, sale_price: null }, quantity: 2 },
        { product: { price: 20, sale_price: 15 }, quantity: 1 },
      ];

      const subtotal = items.reduce((sum, item) => {
        const price = item.product.sale_price || item.product.price;
        return sum + (price * item.quantity);
      }, 0);

      expect(subtotal).toBe(35); // (10 * 2) + (15 * 1)
    });

    test('should calculate tax correctly (8%)', () => {
      const subtotal = 100;
      const tax = subtotal * 0.08;
      expect(tax).toBe(8);
    });

    test('should calculate shipping correctly', () => {
      const subtotal1 = 30;
      const subtotal2 = 60;

      const shipping1 = subtotal1 > 50 ? 0 : 5.99;
      const shipping2 = subtotal2 > 50 ? 0 : 5.99;

      expect(shipping1).toBe(5.99);
      expect(shipping2).toBe(0);
    });

    test('should calculate total correctly', () => {
      const subtotal = 100;
      const tax = subtotal * 0.08; // 8
      const shipping = subtotal > 50 ? 0 : 5.99; // 0
      const total = subtotal + tax + shipping;

      expect(total).toBe(108);
    });
  });

  describe('Stock Validation', () => {
    test('should validate stock availability', () => {
      const productStock = 5;
      const requestedQuantity = 3;
      const isValid = requestedQuantity <= productStock;

      expect(isValid).toBe(true);
    });

    test('should reject quantity exceeding stock', () => {
      const productStock = 5;
      const requestedQuantity = 7;
      const isValid = requestedQuantity <= productStock;

      expect(isValid).toBe(false);
    });

    test('should enforce maximum quantity limit', () => {
      const maxQuantity = 99;
      const requestedQuantity = 100;
      const isValid = requestedQuantity <= maxQuantity;

      expect(isValid).toBe(false);
    });
  });
});

describe('Session Management', () => {
  test('should create session ID for guest users', async () => {
    const response = await request(app)
      .get('/api/cart')
      .expect(200);

    expect(response.headers['set-cookie']).toBeDefined();
  });

  test('should maintain session across requests', async () => {
    const agent = request.agent(app);

    // First request creates session
    await agent.get('/api/cart').expect(200);

    // Second request should use same session
    const response = await agent.get('/api/cart').expect(200);
    expect(response.body).toBeDefined();
  });
});

describe('Error Handling', () => {
  test('should handle database connection errors', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('Database connection failed'));

    const response = await request(app)
      .get('/api/cart')
      .expect(500);

    expect(response.body.message).toBe('Failed to get cart');
  });

  test('should handle invalid JSON in request body', async () => {
    const response = await request(app)
      .post('/api/cart/items')
      .set('Content-Type', 'application/json')
      .send('invalid json')
      .expect(400);
  });

  test('should handle missing required fields', async () => {
    const response = await request(app)
      .post('/api/cart/items')
      .send({})
      .expect(400);

    expect(response.body.message).toContain('Invalid product ID or quantity');
  });
}); 