export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  billingAddress: Address;
  shippingMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  attributes?: Record<string, any>;
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface OrderTracking {
  orderId: string;
  trackingNumber: string;
  courierName: string;
  courierUrl: string;
  status: string;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  timeline: OrderStatusHistory[];
  location?: string;
}

export interface OrderStatusHistory {
  status: string;
  description?: string;
  location?: string;
  timestamp: Date;
  createdBy: string;
}

export interface OrderReturn {
  id: string;
  orderId: string;
  returnReason: string;
  returnDescription?: string;
  returnStatus: 'pending' | 'approved' | 'processed' | 'completed';
  refundAmount?: number;
  refundMethod?: string;
  returnTrackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReturnRequest {
  returnReason: string;
  returnDescription?: string;
  refundAmount?: number;
  refundMethod?: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderListResponse {
  orders: Order[];
  pagination: OrderPagination;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  statusDistribution: Record<OrderStatus, number>;
} 