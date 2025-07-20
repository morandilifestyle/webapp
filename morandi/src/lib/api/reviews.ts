import {
  ReviewsResponse,
  Review,
  CreateReviewRequest,
  UpdateReviewRequest,
  ReviewVoteRequest,
  ReportReviewRequest,
  ReviewFilters,
  CanReviewResponse,
  ReviewAnalytics,
} from '@/types/review';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ReviewsAPI {
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

  // Get product reviews
  static async getProductReviews(
    productId: string,
    filters: ReviewFilters = {}
  ): Promise<ReviewsResponse> {
    const params = new URLSearchParams();
    
    if (filters.rating) params.append('rating', filters.rating.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.search) params.append('search', filters.search);

    return this.request<ReviewsResponse>(`/products/${productId}/reviews?${params.toString()}`);
  }

  // Create review
  static async createReview(data: CreateReviewRequest): Promise<Review> {
    const formData = new FormData();
    formData.append('productId', data.productId);
    formData.append('rating', data.rating.toString());
    formData.append('title', data.title);
    formData.append('reviewText', data.reviewText);

    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const url = `${API_BASE_URL}/reviews`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Update review
  static async updateReview(
    reviewId: string,
    data: UpdateReviewRequest
  ): Promise<Review> {
    const formData = new FormData();
    
    if (data.rating) formData.append('rating', data.rating.toString());
    if (data.title) formData.append('title', data.title);
    if (data.reviewText) formData.append('reviewText', data.reviewText);

    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const url = `${API_BASE_URL}/reviews/${reviewId}`;
    const response = await fetch(url, {
      method: 'PUT',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Delete review
  static async deleteReview(reviewId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  }

  // Vote on review
  static async voteReview(
    reviewId: string,
    data: ReviewVoteRequest
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/reviews/${reviewId}/vote`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Report review
  static async reportReview(
    reviewId: string,
    data: ReportReviewRequest
  ): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/reviews/${reviewId}/report`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Check if user can review product
  static async canReviewProduct(productId: string): Promise<CanReviewResponse> {
    return this.request<CanReviewResponse>(`/products/${productId}/can-review`);
  }

  // Get review analytics
  static async getReviewAnalytics(productId: string): Promise<ReviewAnalytics> {
    return this.request<ReviewAnalytics>(`/products/${productId}/reviews/analytics`);
  }

  // Get user's reviews
  static async getUserReviews(page = 1, limit = 20): Promise<ReviewsResponse> {
    return this.request<ReviewsResponse>(`/reviews/my-reviews?page=${page}&limit=${limit}`);
  }

  // Get single review
  static async getReview(reviewId: string): Promise<Review> {
    return this.request<Review>(`/reviews/${reviewId}`);
  }

  // Get review by user for product
  static async getUserReviewForProduct(productId: string): Promise<Review | null> {
    return this.request<Review | null>(`/products/${productId}/my-review`);
  }
} 