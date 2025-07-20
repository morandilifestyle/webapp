"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const checkoutService_1 = require("./checkoutService");
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
class PaymentService {
    static async createRazorpayOrder(amount, receipt, notes) {
        try {
            const order = await razorpay.orders.create({
                amount: Math.round(amount * 100),
                currency: 'INR',
                receipt,
                notes,
            });
            return order;
        }
        catch (error) {
            console.error('Razorpay order creation error:', error);
            throw new Error('Failed to create payment order');
        }
    }
    static verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
        try {
            const text = `${razorpayOrderId}|${razorpayPaymentId}`;
            const signature = crypto_1.default
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(text)
                .digest('hex');
            return signature === razorpaySignature;
        }
        catch (error) {
            console.error('Payment signature verification error:', error);
            return false;
        }
    }
    static async verifyPaymentWithRazorpay(razorpayPaymentId) {
        try {
            const payment = await razorpay.payments.fetch(razorpayPaymentId);
            return payment.status === 'captured';
        }
        catch (error) {
            console.error('Razorpay payment verification error:', error);
            return false;
        }
    }
    static async processPaymentVerification(data) {
        try {
            const signatureValid = this.verifyPaymentSignature(data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature);
            if (!signatureValid) {
                return {
                    success: false,
                    message: 'Invalid payment signature',
                };
            }
            const paymentValid = await this.verifyPaymentWithRazorpay(data.razorpay_payment_id);
            if (!paymentValid) {
                return {
                    success: false,
                    message: 'Payment verification failed',
                };
            }
            await checkoutService_1.CheckoutService.processSuccessfulPayment(data.order_id, data.razorpay_order_id, data.razorpay_payment_id);
            const { data: order, error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('Payment processing error:', error);
            return {
                success: false,
                message: 'Payment processing failed',
            };
        }
    }
    static async processRefund(data) {
        try {
            const { data: order, error: orderError } = await database_1.supabase
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
            const refundAmount = data.amount || order.total_amount;
            const refund = await razorpay.payments.refund(order.razorpay_payment_id, {
                amount: Math.round(refundAmount * 100),
                notes: {
                    reason: data.reason || 'Customer request',
                },
            });
            const { error: updateError } = await database_1.supabase
                .from('orders')
                .update({
                payment_status: 'refunded',
                status: 'cancelled',
            })
                .eq('id', data.order_id);
            if (updateError) {
                console.error('Failed to update order status:', updateError);
            }
            const { error: transactionError } = await database_1.supabase
                .from('payment_transactions')
                .insert({
                order_id: data.order_id,
                razorpay_payment_id: order.razorpay_payment_id,
                amount: -refundAmount,
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
        }
        catch (error) {
            console.error('Refund processing error:', error);
            return {
                success: false,
                message: 'Refund processing failed',
            };
        }
    }
    static async getPaymentTransaction(orderId) {
        try {
            const { data, error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('Get payment transaction error:', error);
            throw error;
        }
    }
    static getPaymentMethods() {
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
exports.PaymentService = PaymentService;
//# sourceMappingURL=paymentService.js.map