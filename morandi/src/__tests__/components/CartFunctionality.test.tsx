import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartProvider } from '@/store/CartContext';
import CartIcon from '@/components/ui/CartIcon';
import AddToCartButton from '@/components/ui/AddToCartButton';
import { Product } from '@/types/product';

// Mock the cart API
jest.mock('@/lib/api/cart', () => ({
  cartAPI: {
    getCart: jest.fn().mockResolvedValue({
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      itemCount: 0,
    }),
    addToCart: jest.fn().mockResolvedValue({
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      total: 0,
      itemCount: 0,
    }),
    updateCartItem: jest.fn(),
    removeCartItem: jest.fn(),
    clearCart: jest.fn(),
    mergeGuestCart: jest.fn(),
  },
}));

const mockProduct: Product = {
  id: '1',
  category_id: '1',
  name: 'Test Product',
  slug: 'test-product',
  description: 'A test product',
  price: 29.99,
  sale_price: 24.99,
  stock_quantity: 10,
  low_stock_threshold: 5,
  is_active: true,
  is_featured: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('Cart Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('CartIcon displays correct item count', async () => {
    render(
      <TestWrapper>
        <CartIcon />
      </TestWrapper>
    );

    // Initially should show 0 items
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    
    // Wait for cart to load
    await waitFor(() => {
      expect(screen.getByLabelText('Shopping cart')).toBeInTheDocument();
    });
  });

  test('AddToCartButton renders correctly', () => {
    render(
      <TestWrapper>
        <AddToCartButton product={mockProduct} />
      </TestWrapper>
    );

    expect(screen.getByText('Add to Cart')).toBeInTheDocument();
  });

  test('AddToCartButton shows out of stock for unavailable products', () => {
    const outOfStockProduct = { ...mockProduct, stock_quantity: 0 };
    
    render(
      <TestWrapper>
        <AddToCartButton product={outOfStockProduct} />
      </TestWrapper>
    );

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  test('AddToCartButton quantity controls work', () => {
    render(
      <TestWrapper>
        <AddToCartButton product={mockProduct} />
      </TestWrapper>
    );

    // Find quantity controls
    const decrementButton = screen.getByRole('button', { name: /decrease quantity/i });
    const incrementButton = screen.getByRole('button', { name: /increase quantity/i });
    const quantityDisplay = screen.getByText('1');

    expect(quantityDisplay).toBeInTheDocument();
    expect(decrementButton).toBeDisabled(); // Should be disabled when quantity is 1

    // Test increment
    fireEvent.click(incrementButton);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('AddToCartButton respects max quantity', () => {
    const lowStockProduct = { ...mockProduct, stock_quantity: 2 };
    
    render(
      <TestWrapper>
        <AddToCartButton product={lowStockProduct} />
      </TestWrapper>
    );

    const incrementButton = screen.getByRole('button', { name: /increase quantity/i });
    
    // Click increment twice to reach max
    fireEvent.click(incrementButton);
    fireEvent.click(incrementButton);
    
    // Should be disabled at max quantity
    expect(incrementButton).toBeDisabled();
  });
}); 