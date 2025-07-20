import express from 'express';

const router = express.Router();

// Test endpoint that doesn't require database
router.get('/ping', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock products endpoint for testing
router.get('/products', (req, res) => {
  const mockProducts = [
    {
      id: '1',
      name: 'Organic Cotton Maternity Dress',
      slug: 'organic-cotton-maternity-dress',
      description: 'Comfortable and breathable maternity dress made from 100% organic cotton.',
      short_description: 'Comfortable organic cotton maternity dress',
      price: 89.99,
      sale_price: 79.99,
      images: ['/images/products/maternity-dress-1.jpg'],
      is_featured: true,
      stock_quantity: 25
    },
    {
      id: '2',
      name: 'Sustainable Maternity Leggings',
      slug: 'sustainable-maternity-leggings',
      description: 'Eco-friendly maternity leggings with stretch fabric for maximum comfort during pregnancy.',
      short_description: 'Eco-friendly stretch maternity leggings',
      price: 45.99,
      sale_price: null,
      images: ['/images/products/maternity-leggings-1.jpg'],
      is_featured: false,
      stock_quantity: 30
    }
  ];
  
  res.json({ products: mockProducts });
});

export default router; 