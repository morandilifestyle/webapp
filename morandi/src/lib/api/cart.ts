import { CartResponse, AddToCartRequest, UpdateCartItemRequest } from '@/types/cart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class CartAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Cart API error:', error);
      throw error;
    }
  }

  // Get cart items
  async getCart(): Promise<CartResponse> {
    return this.request<CartResponse>('/cart');
  }

  // Get cart item count
  async getCartCount(): Promise<{ count: number }> {
    return this.request<{ count: number }>('/cart/count');
  }

  // Add item to cart
  async addToCart(data: AddToCartRequest): Promise<CartResponse> {
    return this.request<CartResponse>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update cart item quantity
  async updateCartItem(itemId: string, data: UpdateCartItemRequest): Promise<CartResponse> {
    return this.request<CartResponse>(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Remove item from cart
  async removeCartItem(itemId: string): Promise<CartResponse> {
    return this.request<CartResponse>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Clear entire cart
  async clearCart(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/cart/clear', {
      method: 'POST',
    });
  }

  // Merge guest cart with user cart (after login)
  async mergeGuestCart(): Promise<CartResponse> {
    return this.request<CartResponse>('/cart/merge', {
      method: 'POST',
    });
  }
}

export const cartAPI = new CartAPI(); 