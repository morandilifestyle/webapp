import { supabase } from '../index';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface CheckoutItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  attributes?: Record<string, any>;
}

export interface ShippingAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}

export interface BillingAddress extends ShippingAddress {}

export interface CheckoutRequest {
  items: CheckoutItem[];
  shipping_address: ShippingAddress;
  billing_address?: BillingAddress;
  shipping_method_id: string;
  payment_method: string;
  user_id?: string;
}

export interface CheckoutResponse {
  order_id: string;
  order_number: string;
  razorpay_order_id: string;
  total_amount: number;
  shipping_amount: number;
  tax_amount: number;
  subtotal: number;
}

export class CheckoutService {
  /**
   * Initialize checkout process
   */
  static async initializeCheckout(data: CheckoutRequest): Promise<CheckoutResponse> {
    try {
      // Validate cart items
      await this.validateCartItems(data.items);
      
      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + item.total_price, 0);
      const taxAmount = subtotal * 0.18; // 18% GST
      
      // Get shipping cost
      const shippingAmount = await this.calculateShippingCost(data.items, data.shipping_method_id);
      
      const totalAmount = subtotal + taxAmount + shippingAmount;
      
      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // Convert to paise
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        notes: {
          user_id: data.user_id || 'guest',
          items_count: data.items.length.toString(),
        },
      });
      
      // Create order in database
      const orderNumber = await this.generateOrderNumber();
      
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: data.user_id,
          order_number: orderNumber,
          status: 'pending',
          subtotal,
          tax_amount: taxAmount,
          shipping_amount: shippingAmount,
          total_amount: totalAmount,
          payment_method: data.payment_method,
          razorpay_order_id: razorpayOrder.id,
          shipping_address: data.shipping_address,
          billing_address: data.billing_address || data.shipping_address,
          shipping_method: data.shipping_method_id,
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create order: ${error.message}`);
      }
      
      // Create order items
      const orderItems = data.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: '', // Will be filled from product data
        product_sku: '', // Will be filled from product data
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        attributes: item.attributes,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }
      
      return {
        order_id: order.id,
        order_number: order.order_number,
        razorpay_order_id: razorpayOrder.id,
        total_amount: totalAmount,
        shipping_amount: shippingAmount,
        tax_amount: taxAmount,
        subtotal,
      };
    } catch (error) {
      console.error('Checkout initialization error:', error);
      throw error;
    }
  }
  
  /**
   * Validate cart items (stock, pricing, etc.)
   */
  static async validateCartItems(items: CheckoutItem[]): Promise<void> {
    for (const item of items) {
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, sku, price, sale_price, stock_quantity, is_active')
        .eq('id', item.product_id)
        .single();
      
      if (error || !product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }
      
      if (!product.is_active) {
        throw new Error(`Product is not available: ${product.name}`);
      }
      
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
      
      const currentPrice = product.sale_price || product.price;
      if (Math.abs(currentPrice - item.unit_price) > 0.01) {
        throw new Error(`Price mismatch for ${product.name}`);
      }
    }
  }
  
  /**
   * Calculate shipping cost based on items and shipping method
   */
  static async calculateShippingCost(items: CheckoutItem[], shippingMethodId: string): Promise<number> {
    // Calculate total weight (assuming average weight per item)
    const totalWeight = items.reduce((sum, item) => sum + (item.quantity * 0.5), 0); // 0.5kg per item
    
    const { data: shippingMethod, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('id', shippingMethodId)
      .eq('is_active', true)
      .single();
    
    if (error || !shippingMethod) {
      throw new Error('Invalid shipping method');
    }
    
    const shippingCost = shippingMethod.base_rate + (totalWeight * shippingMethod.weight_rate);
    return Math.max(shippingCost, 0);
  }
  
  /**
   * Generate unique order number
   */
  static async generateOrderNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_order_number');
    
    if (error) {
      throw new Error(`Failed to generate order number: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Verify payment with Razorpay
   */
  static async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<boolean> {
    try {
      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(text)
        .digest('hex');
      
      if (signature !== razorpaySignature) {
        return false;
      }
      
      // Verify with Razorpay API
      const payment = await razorpay.payments.fetch(razorpayPaymentId);
      return payment.status === 'captured';
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }
  
  /**
   * Process successful payment
   */
  static async processSuccessfulPayment(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string
  ): Promise<void> {
    try {
      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          razorpay_payment_id: razorpayPaymentId,
        })
        .eq('id', orderId);
      
      if (orderError) {
        throw new Error(`Failed to update order: ${orderError.message}`);
      }
      
      // Create payment transaction record
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          order_id: orderId,
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          amount: 0, // Will be filled from order
          currency: 'INR',
          status: 'success',
          payment_method: 'razorpay',
          gateway_response: {},
        });
      
      if (transactionError) {
        throw new Error(`Failed to create payment transaction: ${transactionError.message}`);
      }
      
      // Update inventory
      await this.updateInventory(orderId);
      
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }
  
  /**
   * Update inventory after successful payment
   */
  static async updateInventory(orderId: string): Promise<void> {
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', orderId);
    
    if (error) {
      throw new Error(`Failed to get order items: ${error.message}`);
    }
    
          for (const item of orderItems) {
        // Get current stock quantity
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();
        
        if (fetchError) {
          console.error(`Failed to fetch product ${item.product_id}:`, fetchError);
          continue;
        }
        
        // Update stock quantity
        const { error: updateError } = await supabase
          .from('products')
          .update({
            stock_quantity: Math.max(0, (product?.stock_quantity || 0) - item.quantity),
          })
          .eq('id', item.product_id);
        
        if (updateError) {
          console.error(`Failed to update inventory for product ${item.product_id}:`, updateError);
        }
      }
  }
  
  /**
   * Get shipping methods
   */
  static async getShippingMethods(): Promise<any[]> {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) {
      throw new Error(`Failed to get shipping methods: ${error.message}`);
    }
    
    return data || [];
  }
} 