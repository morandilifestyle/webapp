import express from 'express';
import { supabase } from '../config/database';
import { CheckoutService } from '../services/checkoutService';
import { PaymentService } from '../services/paymentService';
import { OrderTrackingService } from '../services/orderTrackingService';
import { OrderReturnService } from '../services/orderReturnService';

const router = express.Router();

// Get user orders
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // TODO: Add authentication middleware to get user ID
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ 
        error: 'User not authenticated',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const { data: orders, error, count } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch orders',
        code: 'DATABASE_ERROR'
      });
    }

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ 
        error: 'User not authenticated',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !order) {
      return res.status(404).json({ 
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    res.json({ order });
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod } = req.body;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ 
        error: 'User not authenticated',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Order items are required',
        code: 'INVALID_REQUEST'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({ 
        error: 'Shipping address is required',
        code: 'INVALID_REQUEST'
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const taxAmount = subtotal * 0.18; // 18% GST
    const shippingAmount = 0; // Free shipping for now
    const totalAmount = subtotal + taxAmount + shippingAmount;

    // Generate order number
    const orderNumber = `MOR${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
        billing_address: billingAddress,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ 
        error: 'Failed to create order',
        code: 'DATABASE_ERROR'
      });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ 
        error: 'Status is required',
        code: 'INVALID_REQUEST'
      });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error || !order) {
      return res.status(404).json({ 
        error: 'Order not found',
        code: 'ORDER_NOT_FOUND'
      });
    }

    res.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Initialize checkout
router.post('/checkout/init', async (req, res) => {
  try {
    const { items, shipping_address, billing_address, shipping_method_id, payment_method } = req.body;
    const userId = req.headers['user-id'] as string;

    // Enhanced validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Cart items are required',
        code: 'INVALID_REQUEST'
      });
    }

    if (!shipping_address) {
      return res.status(400).json({ 
        error: 'Shipping address is required',
        code: 'INVALID_REQUEST'
      });
    }

    if (!shipping_method_id) {
      return res.status(400).json({ 
        error: 'Shipping method is required',
        code: 'INVALID_REQUEST'
      });
    }

    if (!payment_method) {
      return res.status(400).json({ 
        error: 'Payment method is required',
        code: 'INVALID_REQUEST'
      });
    }

    // Validate shipping address fields
    const requiredFields = ['first_name', 'last_name', 'address_line_1', 'city', 'state', 'postal_code', 'country', 'phone'];
    for (const field of requiredFields) {
      if (!shipping_address[field]) {
        return res.status(400).json({ 
          error: `${field.replace('_', ' ')} is required`,
          code: 'INVALID_REQUEST'
        });
      }
    }

    const checkoutData = {
      items,
      shipping_address,
      billing_address,
      shipping_method_id,
      payment_method,
      user_id: userId,
    };

    const result = await CheckoutService.initializeCheckout(checkoutData);

    res.json({
      success: true,
      message: 'Checkout initialized successfully',
      data: result,
    });
  } catch (error) {
    console.error('Checkout initialization error:', error);
    
    // Enhanced error handling
    let errorMessage = 'Checkout initialization failed';
    let errorCode = 'CHECKOUT_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('Product not found')) {
        errorCode = 'PRODUCT_NOT_FOUND';
      } else if (error.message.includes('Insufficient stock')) {
        errorCode = 'INSUFFICIENT_STOCK';
      } else if (error.message.includes('Price mismatch')) {
        errorCode = 'PRICE_MISMATCH';
      } else if (error.message.includes('Invalid shipping method')) {
        errorCode = 'INVALID_SHIPPING_METHOD';
      }
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      code: errorCode
    });
  }
});

// Get shipping methods
router.get('/shipping/methods', async (req, res) => {
  try {
    const shippingMethods = await CheckoutService.getShippingMethods();
    
    res.json({
      success: true,
      data: shippingMethods,
    });
  } catch (error) {
    console.error('Get shipping methods error:', error);
    res.status(500).json({ error: 'Failed to get shipping methods' });
  }
});

// Calculate shipping cost
router.post('/shipping/calculate', async (req, res) => {
  try {
    const { items, shipping_method_id } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    if (!shipping_method_id) {
      return res.status(400).json({ error: 'Shipping method is required' });
    }

    const shippingCost = await CheckoutService.calculateShippingCost(items, shipping_method_id);

    res.json({
      success: true,
      data: {
        shipping_cost: shippingCost,
      },
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate shipping cost',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Verify payment
router.post('/payment/verify', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      order_id 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return res.status(400).json({ error: 'All payment verification parameters are required' });
    }

    const result = await PaymentService.processPaymentVerification({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
    });

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.order,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Process refund
router.post('/payment/refund', async (req, res) => {
  try {
    const { order_id, amount, reason } = req.body;
    const userId = req.headers['user-id'] as string;

    if (!order_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Verify user owns the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', order_id)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const result = await PaymentService.processRefund({
      order_id,
      amount,
      reason,
    });

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          refund_id: result.refund_id,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    console.error('Refund processing error:', error);
    res.status(500).json({ error: 'Refund processing failed' });
  }
});

// Get payment methods
router.get('/payment/methods', async (req, res) => {
  try {
    const paymentMethods = PaymentService.getPaymentMethods();
    
    res.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

// Get order tracking
router.get('/:id/tracking', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify user owns the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const tracking = await OrderTrackingService.getOrderTracking(id);

    if (!tracking) {
      return res.status(404).json({ error: 'Tracking information not found' });
    }

    res.json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error('Get order tracking error:', error);
    res.status(500).json({ error: 'Failed to get order tracking' });
  }
});

// Cancel order
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify user owns the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }

    const success = await OrderTrackingService.updateOrderStatus(
      id,
      'cancelled',
      reason || 'Cancelled by customer',
      undefined,
      'customer'
    );

    if (!success) {
      return res.status(500).json({ error: 'Failed to cancel order' });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Request return
router.post('/:id/return', async (req, res) => {
  try {
    const { id } = req.params;
    const { returnReason, returnDescription, refundAmount, refundMethod } = req.body;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!returnReason) {
      return res.status(400).json({ error: 'Return reason is required' });
    }

    const returnRequest = await OrderReturnService.createReturnRequest({
      orderId: id,
      returnReason,
      returnDescription,
      refundAmount,
      refundMethod,
    });

    if (!returnRequest) {
      return res.status(400).json({ error: 'Failed to create return request' });
    }

    res.json({
      success: true,
      message: 'Return request created successfully',
      data: returnRequest,
    });
  } catch (error) {
    console.error('Create return request error:', error);
    res.status(500).json({ 
      error: 'Failed to create return request',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get order return
router.get('/:id/return', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const returnRequest = await OrderReturnService.getOrderReturn(id);

    if (!returnRequest) {
      return res.status(404).json({ error: 'Return request not found' });
    }

    res.json({
      success: true,
      data: returnRequest,
    });
  } catch (error) {
    console.error('Get return request error:', error);
    res.status(500).json({ error: 'Failed to get return request' });
  }
});

// Get user returns
router.get('/returns/list', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const returns = await OrderReturnService.getUserReturns(userId);

    res.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    console.error('Get user returns error:', error);
    res.status(500).json({ error: 'Failed to get user returns' });
  }
});

// Get return reasons
router.get('/returns/reasons', async (req, res) => {
  try {
    const reasons = await OrderReturnService.getReturnReasons();
    
    res.json({
      success: true,
      data: reasons,
    });
  } catch (error) {
    console.error('Get return reasons error:', error);
    res.status(500).json({ error: 'Failed to get return reasons' });
  }
});

// Get refund methods
router.get('/returns/refund-methods', async (req, res) => {
  try {
    const methods = await OrderReturnService.getRefundMethods();
    
    res.json({
      success: true,
      data: methods,
    });
  } catch (error) {
    console.error('Get refund methods error:', error);
    res.status(500).json({ error: 'Failed to get refund methods' });
  }
});

// Reorder items
router.post('/:id/reorder', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get order items
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, unit_price')
      .eq('order_id', id);

    if (itemsError || !orderItems) {
      return res.status(404).json({ error: 'Order items not found' });
    }

    // Add items to cart
    const cartItems = orderItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
    }));

    // TODO: Add items to user's cart
    // This would integrate with the cart service

    res.json({
      success: true,
      message: 'Items added to cart for reorder',
      data: {
        items: cartItems,
        totalItems: cartItems.length,
      },
    });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Failed to reorder items' });
  }
});

// Download invoice (placeholder)
router.get('/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Verify user owns the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // TODO: Generate PDF invoice
    // For now, return order data as JSON
    res.json({
      success: true,
      message: 'Invoice data retrieved',
      data: {
        order,
        invoiceUrl: `/api/orders/${id}/invoice/pdf`, // Placeholder
      },
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

// Admin endpoints
// Get all orders (admin)
router.get('/admin/all', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`order_number.ilike.%${search}%,user_id.ilike.%${search}%`);
    }

    const { data: orders, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status (admin)
router.put('/admin/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, description, location, trackingNumber, courierName } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const success = await OrderTrackingService.updateOrderStatus(
      id,
      status,
      description,
      location,
      'admin'
    );

    if (!success) {
      return res.status(500).json({ error: 'Failed to update order status' });
    }

    // If tracking number provided, create/update tracking
    if (trackingNumber && courierName) {
      await OrderTrackingService.createOrderTracking(
        id,
        trackingNumber,
        courierName,
        undefined,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      );
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('Admin update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Get order analytics (admin)
router.get('/admin/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `WHERE created_at >= '${startDate}' AND created_at <= '${endDate}'`;
    }

    // Get order statistics
    const { data: stats, error: statsError } = await supabase.rpc('get_order_analytics', {
      p_start_date: startDate || null,
      p_end_date: endDate || null
    });

    if (statsError) {
      console.error('Analytics error:', statsError);
    }

    // Get status distribution
    const { data: statusDistribution, error: statusError } = await supabase
      .from('orders')
      .select('status')
      .gte('created_at', startDate || '2024-01-01')
      .lte('created_at', endDate || new Date().toISOString());

    if (statusError) {
      console.error('Status distribution error:', statusError);
    }

    const statusCounts = (statusDistribution || []).reduce((acc: any, order: any) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        statistics: stats || {},
        statusDistribution: statusCounts,
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

export default router; 