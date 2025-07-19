import { 
  BlogPost, 
  BlogCategory, 
  BlogComment, 
  PromotionalContent,
  NewsletterSubscription,
  BlogPostCreateRequest,
  BlogPostUpdateRequest,
  BlogCommentCreateRequest,
  BlogFilters,
  ContentAnalyticsSummary
} from '@/types/blog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Helper function to handle API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Blog Posts API
export const blogApi = {
  // Get blog posts with filters
  getPosts: async (filters: BlogFilters = {}): Promise<BlogPost[]> => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.authorId) params.append('authorId', filters.authorId);
    if (filters.isFeatured !== undefined) params.append('isFeatured', filters.isFeatured.toString());
    if (filters.tags) params.append('tags', filters.tags.join(','));
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    return apiRequest<BlogPost[]>(`/blog/posts${queryString ? `?${queryString}` : ''}`);
  },

  // Get a single blog post by slug
  getPostBySlug: async (slug: string): Promise<BlogPost> => {
    return apiRequest<BlogPost>(`/blog/posts/${slug}`);
  },

  // Get a single blog post by ID
  getPostById: async (id: string): Promise<BlogPost> => {
    return apiRequest<BlogPost>(`/blog/posts/${id}`);
  },

  // Create a new blog post
  createPost: async (postData: BlogPostCreateRequest): Promise<BlogPost> => {
    return apiRequest<BlogPost>('/blog/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  // Update a blog post
  updatePost: async (id: string, postData: BlogPostUpdateRequest): Promise<BlogPost> => {
    return apiRequest<BlogPost>(`/blog/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  },

  // Delete a blog post
  deletePost: async (id: string): Promise<void> => {
    return apiRequest<void>(`/blog/posts/${id}`, {
      method: 'DELETE',
    });
  },

  // Get blog categories
  getCategories: async (): Promise<BlogCategory[]> => {
    return apiRequest<BlogCategory[]>('/blog/categories');
  },

  // Create a blog category
  createCategory: async (categoryData: Partial<BlogCategory>): Promise<BlogCategory> => {
    return apiRequest<BlogCategory>('/blog/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  // Get comments for a blog post
  getComments: async (postId: string): Promise<BlogComment[]> => {
    return apiRequest<BlogComment[]>(`/blog/posts/${postId}/comments`);
  },

  // Create a comment
  createComment: async (commentData: BlogCommentCreateRequest): Promise<BlogComment> => {
    return apiRequest<BlogComment>(`/blog/posts/${commentData.postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },

  // Update a comment
  updateComment: async (id: string, content: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/blog/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  // Delete a comment
  deleteComment: async (id: string): Promise<void> => {
    return apiRequest<void>(`/blog/comments/${id}`, {
      method: 'DELETE',
    });
  },

  // Approve a comment
  approveComment: async (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/blog/comments/${id}/approve`, {
      method: 'PUT',
    });
  },

  // Get promotional content
  getPromotionalContent: async (location?: string): Promise<PromotionalContent[]> => {
    const params = location ? `?location=${location}` : '';
    return apiRequest<PromotionalContent[]>(`/blog/promotional${params}`);
  },

  // Subscribe to newsletter
  subscribeToNewsletter: async (
    email: string, 
    firstName?: string, 
    lastName?: string, 
    source?: string
  ): Promise<NewsletterSubscription> => {
    return apiRequest<NewsletterSubscription>('/blog/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, firstName, lastName, source }),
    });
  },

  // Unsubscribe from newsletter
  unsubscribeFromNewsletter: async (email: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>('/blog/newsletter/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Get content analytics (admin only)
  getContentAnalytics: async (contentId: string, contentType: string): Promise<ContentAnalyticsSummary> => {
    return apiRequest<ContentAnalyticsSummary>(`/blog/analytics/${contentId}?contentType=${contentType}`);
  },

  // Admin: Get all content
  getAdminContent: async (filters: BlogFilters = {}): Promise<BlogPost[]> => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    return apiRequest<BlogPost[]>(`/blog/admin/content${queryString ? `?${queryString}` : ''}`);
  },

  // Admin: Get content analytics
  getAdminAnalytics: async (contentId: string, contentType: string): Promise<ContentAnalyticsSummary> => {
    return apiRequest<ContentAnalyticsSummary>(`/blog/admin/content/analytics?contentId=${contentId}&contentType=${contentType}`);
  },
};

// Utility functions for blog operations
export const blogUtils = {
  // Generate a slug from a title
  generateSlug: (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  },

  // Calculate reading time
  calculateReadingTime: (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  },

  // Format date for display
  formatDate: (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  // Format reading time
  formatReadingTime: (minutes: number): string => {
    if (minutes < 1) return 'Less than 1 min read';
    if (minutes === 1) return '1 min read';
    return `${minutes} min read`;
  },

  // Truncate text
  truncateText: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  },

  // Extract tags from content
  extractTags: (content: string): string[] => {
    const tagRegex = /#(\w+)/g;
    const matches = content.match(tagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  },

  // Generate meta description from content
  generateMetaDescription: (content: string, maxLength: number = 160): string => {
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, '');
    return blogUtils.truncateText(plainText, maxLength);
  },
}; 