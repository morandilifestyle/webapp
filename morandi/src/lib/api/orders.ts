import { 
  Order, 
  OrderListResponse, 
  OrderTracking, 
  OrderReturn, 
  ReturnRequest,
  OrderFilters,
  OrderAnalytics 
} from '@/types/order';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Get user orders
export async function getUserOrders(
  page: number = 1, 
  limit: number = 10,
  filters?: OrderFilters
): Promise<OrderListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);

  const response = await fetch(`${API_BASE_URL}/orders?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add authentication header
      'user-id': 'test-user-id', // Replace with actual user ID
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  return response.json();
}

// Get single order
export async function getOrder(orderId: string): Promise<Order> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: {
      'Content-Type': 'application/json',
      'user-id': 'test-user-id', // Replace with actual user ID
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch order');
  }

  const data = await response.json();
  return data.order;
}

// Get order tracking
export async function getOrderTracking(orderId: string): Promise<OrderTracking> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/tracking`, {
    headers: {
      'Content-Type': 'application/json',
      'user-id': 'test-user-id', // Replace with actual user ID
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch order tracking');
  }

  const data = await response.json();
  return data.data;
}

// Cancel order
export async function cancelOrder(orderId: string, reason?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-id': 'test-user-id', // Replace with actual user ID
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to cancel order');
  }
}

// Request return
export async function requestReturn(orderId: string, returnRequest: ReturnRequest): Promise<OrderReturn> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/return`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-id': 'test-user-id', // Replace with actual user ID
    },
    body: JSON.stringify(returnRequest),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create return request');
  }

  const data = await response.json();
  return data.data;
}

// Get order return
export async function getOrderReturn(orderId: string): Promise<OrderReturn | null> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/return`, {
    headers: {
      'Content-Type': 'application/json',
      'user-id': 'test-user-id', // Replace with actual user ID
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch return request');
  }

  const data = await response.json();
  return data.data;
}

// Get user returns
export async function getUserReturns(): Promise<OrderReturn[]> {
  const response = await fetch(`${API_BASE_URL}/orders/returns/list`, {
    headers: {
      'Content-Type': 'application/json',
      'user-id': 'test-user-id', // Replace with actual user ID
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch returns');
  }

  const data = await response.json();
  return data.data;
}

// Get return reasons
export async function getReturnReasons(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/orders/returns/reasons`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch return reasons');
  }

  const data = await response.json();
  return data.data;
}

// Get refund methods
export async function getRefundMethods(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/orders/returns/refund-methods`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch refund methods');
  }

  const data = await response.json();
  return data.data;
}

// Reorder items
export async function reorderItems(orderId: string): Promise<{ items: any[]; totalItems: number }> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'user-id': 'test-user-id', // Replace with actual user ID
    },
  });

  if (!response.ok) {
    throw new Error('Failed to reorder items');
  }

  const data = await response.json();
  return data.data;
}

// Download invoice
export async function downloadInvoice(orderId: string): Promise<{ order: Order; invoiceUrl: string }> {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/invoice`, {
    headers: {
      'Content-Type': 'application/json',
      'user-id': 'test-user-id', // Replace with actual user ID
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download invoice');
  }

  const data = await response.json();
  return data.data;
}

// Admin functions
export async function getAllOrders(
  page: number = 1,
  limit: number = 20,
  filters?: OrderFilters
): Promise<OrderListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters?.status) params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);

  const response = await fetch(`${API_BASE_URL}/orders/admin/all?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add admin authentication
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch orders');
  }

  return response.json();
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  description?: string,
  location?: string,
  trackingNumber?: string,
  courierName?: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add admin authentication
    },
    body: JSON.stringify({
      status,
      description,
      location,
      trackingNumber,
      courierName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update order status');
  }
}

export async function getOrderAnalytics(
  startDate?: string,
  endDate?: string
): Promise<OrderAnalytics> {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await fetch(`${API_BASE_URL}/orders/admin/analytics?${params}`, {
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add admin authentication
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }

  const data = await response.json();
  return data.data;
} 