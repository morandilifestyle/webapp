export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  addedAt: Date;
}

export interface WishlistResponse {
  items: WishlistItem[];
  totalCount: number;
}

export interface AddToWishlistRequest {
  productId: string;
}

export interface RemoveFromWishlistRequest {
  productId: string;
}

export interface MoveToCartRequest {
  productId: string;
  quantity?: number;
}

// Re-export Product type for convenience
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice?: number;
  images: string[];
  isActive: boolean;
  stockQuantity: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
} 