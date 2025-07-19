export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  salePrice?: number;
  quantity: number;
  image: string;
  stock: number;
  maxQuantity: number;
  slug: string;
  attributes?: {
    material?: string;
    color?: string;
    size?: string;
    organic_certified?: boolean;
    [key: string]: any;
  };
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface CartContextType {
  cart: CartState;
  addItem: (product: any, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

export interface CartItemResponse {
  id: string;
  product_id: string;
  quantity: number;
  added_at: string;
  updated_at: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    sale_price?: number;
    stock_quantity: number;
    images?: string[];
    attributes?: {
      material?: string;
      color?: string;
      size?: string;
      organic_certified?: boolean;
      [key: string]: any;
    };
  };
}

export interface CartResponse {
  items: CartItemResponse[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
} 