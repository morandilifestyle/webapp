export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  subcategories?: ProductCategory[];
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  price: number;
  sale_price?: number;
  cost_price?: number;
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  attributes?: {
    material?: string;
    color?: string;
    size?: string;
    organic_certified?: boolean;
    [key: string]: any;
  };
  images?: string[];
  is_active: boolean;
  is_featured: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
  product_categories?: {
    name: string;
    slug: string;
    description?: string;
  };
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  material?: string;
  organicCertified?: boolean;
  featured?: boolean;
  sort?: 'created_at' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'popularity';
  page?: number;
  limit?: number;
}

export interface ProductSearchSuggestion {
  name: string;
  slug: string;
  short_description?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

export interface CategoryProductsResponse {
  category: ProductCategory;
  products: Product[];
  pagination: PaginationInfo;
}

export interface SearchSuggestionsResponse {
  suggestions: ProductSearchSuggestion[];
}

export interface RelatedProductsResponse {
  products: Product[];
} 