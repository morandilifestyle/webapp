'use client';

import { useEffect } from 'react';
import { useCart } from '@/store/CartContext';
import Header from '@/components/ui/Header';
import { CartItem } from '@/types/cart';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
  const { cart, updateQuantity, removeItem, clearCart, refreshCart } = useCart();

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleQuantityChange = async (item: CartItem, newQuantity: number) => {
    if (newQuantity > item.maxQuantity) {
      return; // Don't allow quantity above max
    }
    await updateQuantity(item.id, newQuantity);
  };

  const handleRemoveItem = async (itemId: string) => {
    await removeItem(itemId);
  };

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  if (cart.isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
            <div className="lg:col-span-7">
              {/* Cart Header */}
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
                {cart.items.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Cart Items */}
              {cart.items.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
                  <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
                  <Link
                    href="/products"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.items.map((item) => (
                    <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover rounded-lg"
                            sizes="96px"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-gray-900 mb-1">
                                <Link href={`/products/${item.slug}`} className="hover:text-blue-600">
                                  {item.name}
                                </Link>
                              </h3>
                              
                              {/* Attributes */}
                              {item.attributes && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {item.attributes.material && (
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      {item.attributes.material}
                                    </span>
                                  )}
                                  {item.attributes.color && (
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      {item.attributes.color}
                                    </span>
                                  )}
                                  {item.attributes.size && (
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      {item.attributes.size}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Price */}
                              <div className="flex items-center gap-2 mb-3">
                                {item.salePrice ? (
                                  <>
                                    <span className="text-lg font-bold text-gray-900">
                                      {formatPrice(item.salePrice)}
                                    </span>
                                    <span className="text-sm text-gray-500 line-through">
                                      {formatPrice(item.price)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-lg font-bold text-gray-900">
                                    {formatPrice(item.price)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              aria-label="Remove item"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <label className="text-sm font-medium text-gray-700">Quantity:</label>
                              <div className="flex items-center border rounded-lg">
                                <button
                                  onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                  className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                
                                <span className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                
                                <button
                                  onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                  disabled={item.quantity >= item.maxQuantity}
                                  className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                              
                              <span className="text-sm text-gray-500">
                                {item.maxQuantity} available
                              </span>
                            </div>

                            {/* Item Total */}
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {formatPrice((item.salePrice || item.price) * item.quantity)}
                              </p>
                            </div>
                          </div>

                          {/* Stock Warning */}
                          {item.quantity >= item.maxQuantity && (
                            <p className="text-sm text-orange-600 mt-2">
                              Maximum quantity reached
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-5 mt-8 lg:mt-0">
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Summary</h2>
                
                {cart.items.length > 0 ? (
                  <>
                    {/* Summary Details */}
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal ({cart.itemCount} items)</span>
                        <span>{formatPrice(cart.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax</span>
                        <span>{formatPrice(cart.tax)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shipping</span>
                        <span>{cart.shipping === 0 ? 'Free' : formatPrice(cart.shipping)}</span>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex justify-between text-lg font-semibold">
                          <span>Total</span>
                          <span>{formatPrice(cart.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <Link
                      href="/checkout"
                      className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 transition-colors inline-block text-center"
                    >
                      Proceed to Checkout
                    </Link>

                    {/* Continue Shopping */}
                    <Link
                      href="/products"
                      className="block w-full text-center mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Continue Shopping
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No items in cart</p>
                    <Link
                      href="/products"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Start Shopping
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 