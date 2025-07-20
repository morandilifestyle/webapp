import { 
  Product, 
  ProductCategory, 
  ProductFilters, 
  ProductsResponse, 
  CategoryProductsResponse,
  SearchSuggestionsResponse,
  RelatedProductsResponse
} from '@/types/product';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ProductsAPI {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get all products with filters
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    // Temporarily use test endpoint for development
    return this.request<ProductsResponse>(`/test/products?${params.toString()}`);
  }

  // Get single product by slug
  async getProduct(slug: string): Promise<{ product: Product }> {
    return this.request<{ product: Product }>(`/products/${slug}`);
  }

  // Get products by category
  async getProductsByCategory(categorySlug: string, filters: ProductFilters = {}): Promise<CategoryProductsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<CategoryProductsResponse>(`/products/category/${categorySlug}?${params.toString()}`);
  }

  // Get featured products
  async getFeaturedProducts(): Promise<{ products: Product[] }> {
    return this.request<{ products: Product[] }>('/products/featured/list');
  }

  // Get related products
  async getRelatedProducts(productId: string): Promise<RelatedProductsResponse> {
    return this.request<RelatedProductsResponse>(`/products/related/${productId}`);
  }

  // Get search suggestions
  async getSearchSuggestions(query: string): Promise<SearchSuggestionsResponse> {
    if (!query || query.length < 2) {
      return { suggestions: [] };
    }

    const params = new URLSearchParams({ q: query });
    return this.request<SearchSuggestionsResponse>(`/products/search/suggestions?${params.toString()}`);
  }

  // Get all categories
  async getCategories(): Promise<{ categories: ProductCategory[] }> {
    return this.request<{ categories: ProductCategory[] }>('/categories');
  }

  // Get single category
  async getCategory(slug: string): Promise<{ category: ProductCategory }> {
    return this.request<{ category: ProductCategory }>(`/categories/${slug}`);
  }

  // Get category with products
  async getCategoryProducts(categorySlug: string, filters: ProductFilters = {}): Promise<CategoryProductsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return this.request<CategoryProductsResponse>(`/categories/${categorySlug}/products?${params.toString()}`);
  }
}

export const productsAPI = new ProductsAPI(); 