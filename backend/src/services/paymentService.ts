import Razorpay from 'razorpay';
import crypto from 'crypto';
import { supabase } from '../index';
import { CheckoutService } from './checkoutService';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface PaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string;
}

export interface PaymentRefundRequest {
  order_id: string;
  amount?: number;
  reason?: string;
}

export class PaymentService {
  /**
   * Create Razorpay order
   */
  static async createRazorpayOrder(amount: number, receipt: string, notes?: Record<string, string>) {
    try {
      const order = await razorpay.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt,
        notes,
      });
      
      return order;
    } catch (error) {
      console.error('Razorpay order creation error:', error);
      throw new Error('Failed to create payment order');
    }
  }
  
  /**
   * Verify payment signature
   */
  static verifyPaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): boolean {
    try {
      const text = `${razorpayOrderId}|${razorpayPaymentId}`;
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(text)
        .digest('hex');
      
      return signature === razorpaySignature;
    } catch (error) {
      console.error('Payment signature verification error:', error);
      return false;
    }
  }
  
  /**
   * Verify payment with Razorpay API
   */
  static async verifyPaymentWithRazorpay(razorpayPaymentId: string): Promise<boolean> {
    try {
      const payment = await razorpay.payments.fetch(razorpayPaymentId);
      return payment.status === 'captured';
    } catch (error) {
      console.error('Razorpay payment verification error:', error);
      return false;
    }
  }
  
  /**
   * Process payment verification
   */
  static async processPaymentVerification(data: PaymentVerificationRequest): Promise<{
    success: boolean;
    message: string;
    order?: any;
  }> {
    try {
      // Verify signature
      const signatureValid = this.verifyPaymentSignature(
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature
      );
      
      if (!signatureValid) {
        return {
          success: false,
          message: 'Invalid payment signature',
        };
      }
      
      // Verify with Razorpay API
      const paymentValid = await this.verifyPaymentWithRazorpay(data.razorpay_payment_id);
      
      if (!paymentValid) {
        return {
          success: false,
          message: 'Payment verification failed',
        };
      }
      
      // Process successful payment
      await CheckoutService.processSuccessfulPayment(
        data.order_id,
        data.razorpay_order_id,
        data.razorpay_payment_id
      );
      
      // Get updated order
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', data.order_id)
        .single();
      
      if (error) {
        console.error('Failed to fetch updated order:', error);
      }
      
      return {
        success: true,
        message: 'Payment processed successfully',
        order,
      };
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        message: 'Payment processing failed',
      };
    }
  }
  
  /**
   * Process payment refund
   */
  static async processRefund(data: PaymentRefundRequest): Promise<{
    success: boolean;
    message: string;
    refund_id?: string;
  }> {
    try {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('razorpay_payment_id, total_amount')
        .eq('id', data.order_id)
        .single();
      
      if (orderError || !order) {
        return {
          success: false,
          message: 'Order not found',
        };
      }
      
      if (!order.razorpay_payment_id) {
        return {
          success: false,
          message: 'No payment found for this order',
        };
      }
      
      // Create refund with Razorpay
      const refundAmount = data.amount || order.total_amount;
      const refund = await razorpay.payments.refund(
        order.razorpay_payment_id,
        {
          amount: Math.round(refundAmount * 100), // Convert to paise
          notes: {
            reason: data.reason || 'Customer request',
          },
        }
      );
      
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'refunded',
          status: 'cancelled',
        })
        .eq('id', data.order_id);
      
      if (updateError) {
        console.error('Failed to update order status:', updateError);
      }
      
      // Create refund transaction record
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          order_id: data.order_id,
          razorpay_payment_id: order.razorpay_payment_id,
          amount: -refundAmount, // Negative amount for refund
          currency: 'INR',
          status: 'refunded',
          payment_method: 'razorpay',
          gateway_response: refund,
        });
      
      if (transactionError) {
        console.error('Failed to create refund transaction:', transactionError);
      }
      
      return {
        success: true,
        message: 'Refund processed successfully',
        refund_id: refund.id,
      };
    } catch (error) {
      console.error('Refund processing error:', error);
      return {
        success: false,
        message: 'Refund processing failed',
      };
    }
  }
  
  /**
   * Get payment transaction details
   */
  static async getPaymentTransaction(orderId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        throw new Error(`Failed to get payment transaction: ${error.message}`);
      }
      
      return data;
    } catch (error) {
      console.error('Get payment transaction error:', error);
      throw error;
    }
  }
  
  /**
   * Get payment methods
   */
  static getPaymentMethods(): Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }> {
    return [
      {
        id: 'razorpay',
        name: 'Razorpay',
        description: 'Pay with UPI, cards, net banking, or wallets',
        icon: '💳',
      },
      {
        id: 'cod',
        name: 'Cash on Delivery',
        description: 'Pay when you receive your order',
        icon: '💰',
      },
    ];
  }
} 