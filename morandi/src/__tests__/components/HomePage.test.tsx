import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../../app/page';
import { CartProvider } from '../../store/CartContext';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>
    {children}
  </CartProvider>
);

describe('HomePage Component', () => {
  it('renders hero section with correct content', () => {
    render(<HomePage />, { wrapper: TestWrapper });

    // Check for main heading
    expect(screen.getByText('Sustainable Wellness Textiles')).toBeInTheDocument();

    // Check for hero description
    expect(screen.getByText(/Premium organic materials for maternity/)).toBeInTheDocument();

    // Check for CTA buttons
    expect(screen.getByText('Shop Now')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('renders product categories section', () => {
    render(<HomePage />, { wrapper: TestWrapper });

    // Check for section heading
    expect(screen.getByText('Our Collections')).toBeInTheDocument();

    // Check for all category cards
    expect(screen.getByText('Maternity & Baby Care')).toBeInTheDocument();
    expect(screen.getByText('Healthcare Textiles')).toBeInTheDocument();
    expect(screen.getByText('Home & Bedding')).toBeInTheDocument();
    expect(screen.getByText('Hospitality Solutions')).toBeInTheDocument();
  });

  it('renders features section with benefits', () => {
    render(<HomePage />, { wrapper: TestWrapper });

    // Check for section heading
    expect(screen.getByText('Why Choose Morandi?')).toBeInTheDocument();

    // Check for feature cards
    expect(screen.getByText('100% Organic')).toBeInTheDocument();
    expect(screen.getByText('Eco-Friendly')).toBeInTheDocument();
    expect(screen.getByText('Premium Quality')).toBeInTheDocument();
  });

  it('displays correct category descriptions', () => {
    render(<HomePage />, { wrapper: TestWrapper });

    // Check category descriptions
    expect(screen.getByText(/Safe, organic products for expecting mothers/)).toBeInTheDocument();
    expect(screen.getByText(/Premium medical-grade textiles/)).toBeInTheDocument();
    expect(screen.getByText(/Comfortable, sustainable home textiles/)).toBeInTheDocument();
    expect(screen.getByText(/Luxury textiles for hotels/)).toBeInTheDocument();
  });

  it('displays correct feature descriptions', () => {
    render(<HomePage />, { wrapper: TestWrapper });

    // Check feature descriptions
    expect(screen.getByText(/All our materials are certified organic/)).toBeInTheDocument();
    expect(screen.getByText(/Committed to reducing environmental impact/)).toBeInTheDocument();
    expect(screen.getByText(/Exceptional craftsmanship and attention to detail/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<HomePage />, { wrapper: TestWrapper });

    // Check for semantic HTML structure
    expect(screen.getByRole('main')).toBeInTheDocument();
    
    // Check for proper heading hierarchy
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders with correct styling classes', () => {
    const { container } = render(<HomePage />, { wrapper: TestWrapper });

    // Check for Tailwind classes
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    expect(container.querySelector('.container-custom')).toBeInTheDocument();
    expect(container.querySelector('.text-gradient')).toBeInTheDocument();
  });

  it('displays emoji icons in category cards', () => {
    render(<HomePage />, { wrapper: TestWrapper });

    // Check for emoji icons (🏥)
    const emojiElements = screen.getAllByText('🏥');
    expect(emojiElements.length).toBeGreaterThan(0);
  });

  it('displays emoji icons in feature section', () => {
    render(<HomePage />, { wrapper: TestWrapper });

    // Check for feature emojis
    expect(screen.getByText('🌱')).toBeInTheDocument();
    expect(screen.getByText('♻️')).toBeInTheDocument();
    expect(screen.getByText('✨')).toBeInTheDocument();
  });
}); 