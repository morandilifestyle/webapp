import { WishlistResponse, AddToWishlistRequest, RemoveFromWishlistRequest, MoveToCartRequest } from '@/types/wishlist';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class WishlistAPI {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Get user's wishlist
  static async getWishlist(page = 1, limit = 20): Promise<WishlistResponse> {
    return this.request<WishlistResponse>(`/wishlist?page=${page}&limit=${limit}`);
  }

  // Add item to wishlist
  static async addToWishlist(data: AddToWishlistRequest): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/wishlist/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Remove item from wishlist
  static async removeFromWishlist(data: RemoveFromWishlistRequest): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/wishlist/items', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // Move item from wishlist to cart
  static async moveToCart(data: MoveToCartRequest): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/wishlist/items/move', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Check if product is in wishlist
  static async isInWishlist(productId: string): Promise<{ isInWishlist: boolean }> {
    return this.request<{ isInWishlist: boolean }>(`/wishlist/check/${productId}`);
  }

  // Get wishlist count
  static async getWishlistCount(): Promise<{ count: number }> {
    return this.request<{ count: number }>('/wishlist/count');
  }

  // Clear wishlist
  static async clearWishlist(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/wishlist/clear', {
      method: 'DELETE',
    });
  }
} 