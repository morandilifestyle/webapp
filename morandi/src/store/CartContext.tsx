'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartState, CartContextType, CartItem } from '@/types/cart';
import { cartAPI } from '@/lib/api/cart';

// Initial cart state
const initialState: CartState = {
  items: [],
  subtotal: 0,
  tax: 0,
  shipping: 0,
  total: 0,
  itemCount: 0,
  isLoading: false,
  error: null,
};

// Cart action types
type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: any }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' };

// Cart reducer
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_CART':
      return {
        ...state,
        items: action.payload.items || [],
        subtotal: action.payload.subtotal || 0,
        tax: action.payload.tax || 0,
        shipping: action.payload.shipping || 0,
        total: action.payload.total || 0,
        itemCount: action.payload.itemCount || 0,
        error: null,
      };
    
    case 'ADD_ITEM':
      const existingItemIndex = state.items.findIndex(
        item => item.productId === action.payload.productId
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + action.payload.quantity,
        };
        return { ...state, items: updatedItems };
      } else {
        // Add new item
        return { ...state, items: [...state.items, action.payload] };
      }
    
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    
    case 'CLEAR_CART':
      return { ...initialState };
    
    default:
      return state;
  }
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart on mount
  useEffect(() => {
    refreshCart();
  }, []);

  // Calculate cart totals whenever items change
  useEffect(() => {
    const subtotal = state.items.reduce((sum, item) => {
      const price = item.salePrice || item.price;
      return sum + (price * item.quantity);
    }, 0);

    const tax = subtotal * 0.08; // 8% tax rate
    const shipping = subtotal > 50 ? 0 : 5.99; // Free shipping over $50
    const total = subtotal + tax + shipping;
    const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

    dispatch({
      type: 'SET_CART',
      payload: {
        items: state.items,
        subtotal,
        tax,
        shipping,
        total,
        itemCount,
      },
    });
  }, [state.items]);

  const refreshCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const cartData = await cartAPI.getCart();
      
      // Transform API response to CartItem format
      const transformedItems: CartItem[] = (cartData.items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        name: item.product.name,
        price: item.product.price,
        salePrice: item.product.sale_price,
        quantity: item.quantity,
        image: item.product.images?.[0] || '/images/placeholder-product.jpg',
        stock: item.product.stock_quantity,
        maxQuantity: Math.min(99, item.product.stock_quantity),
        slug: item.product.slug,
        attributes: item.product.attributes,
      }));

      dispatch({
        type: 'SET_CART',
        payload: {
          items: transformedItems,
          subtotal: cartData.subtotal,
          tax: cartData.tax,
          shipping: cartData.shipping,
          total: cartData.total,
          itemCount: cartData.itemCount,
        },
      });
    } catch (error) {
      console.error('Failed to refresh cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addItem = async (product: any, quantity: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Validate stock availability
      if (quantity > product.stock_quantity) {
        throw new Error('Requested quantity exceeds available stock');
      }

      await cartAPI.addToCart({
        productId: product.id,
        quantity,
      });

      await refreshCart();
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add item to cart' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }

      await cartAPI.updateCartItem(itemId, { quantity });
      await refreshCart();
    } catch (error) {
      console.error('Failed to update cart item:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update item quantity' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await cartAPI.removeCartItem(itemId);
      await refreshCart();
    } catch (error) {
      console.error('Failed to remove cart item:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to remove item from cart' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await cartAPI.clearCart();
      dispatch({ type: 'CLEAR_CART' });
    } catch (error) {
      console.error('Failed to clear cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to clear cart' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const mergeGuestCart = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      await cartAPI.mergeGuestCart();
      await refreshCart();
    } catch (error) {
      console.error('Failed to merge guest cart:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to merge guest cart' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value: CartContextType = {
    cart: state,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    mergeGuestCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 