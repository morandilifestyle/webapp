'use client';

import { useState } from 'react';
import { useCart } from '@/store/CartContext';
import CartDrawer from './CartDrawer';

export default function CartIcon() {
  const { cart } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleCartClick = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <>
      <div className="relative">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
          />
        </svg>
        
        {/* Cart item count badge */}
        {cart.itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {cart.itemCount > 99 ? '99+' : cart.itemCount}
          </span>
        )}
      </div>

      <CartDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} />
    </>
  );
} 