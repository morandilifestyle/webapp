'use client';

import { useState } from 'react';
import { useCart } from '@/store/CartContext';
import { Product } from '@/types/product';

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  variant?: 'default' | 'full' | 'compact';
}

export default function AddToCartButton({ 
  product, 
  className = '', 
  variant = 'default' 
}: AddToCartButtonProps) {
  const { addItem, cart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isInStock = product.stock_quantity > 0;
  const maxQuantity = Math.min(99, product.stock_quantity);
  const isAlreadyInCart = cart.items.some(item => item.productId === product.id);

  const handleAddToCart = async () => {
    if (!isInStock) return;

    setIsLoading(true);
    try {
      await addItem(product, quantity);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={handleAddToCart}
        disabled={!isInStock || isLoading}
        className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      >
        {isLoading ? 'Adding...' : isInStock ? 'Add to Cart' : 'Out of Stock'}
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Quantity Selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
            Quantity:
          </label>
          <div className="flex items-center border rounded-lg">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <input
              type="number"
              id="quantity"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="w-16 text-center border-x py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= maxQuantity}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <span className="text-sm text-gray-500">
            {maxQuantity} available
          </span>
        </div>

        {/* Price Display */}
        <div className="flex items-center gap-2">
          {product.sale_price && product.sale_price < product.price ? (
            <>
              <span className="text-2xl font-bold text-gray-900">
                {formatPrice(product.sale_price)}
              </span>
              <span className="text-lg text-gray-500 line-through">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="text-2xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={!isInStock || isLoading}
          className={`w-full py-4 px-6 rounded-lg font-medium text-lg transition-colors ${
            showSuccess
              ? 'bg-green-600 text-white'
              : isInStock
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } ${className}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Adding to Cart...
            </div>
          ) : showSuccess ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Added to Cart!
            </div>
          ) : isInStock ? (
            isAlreadyInCart ? 'Already in Cart' : 'Add to Cart'
          ) : (
            'Out of Stock'
          )}
        </button>

        {/* Stock Status */}
        {!isInStock && (
          <p className="text-sm text-red-600">
            This item is currently out of stock
          </p>
        )}

        {isInStock && product.stock_quantity <= product.low_stock_threshold && (
          <p className="text-sm text-orange-600">
            Only {product.stock_quantity} left in stock
          </p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Quantity Selector */}
      <div className="flex items-center border rounded-lg">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={quantity <= 1}
          className="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        
        <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
          {quantity}
        </span>
        
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={quantity >= maxQuantity}
          className="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!isInStock || isLoading}
        className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
          showSuccess ? 'bg-green-600' : ''
        }`}
      >
        {isLoading ? 'Adding...' : showSuccess ? 'Added!' : isInStock ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  );
} 