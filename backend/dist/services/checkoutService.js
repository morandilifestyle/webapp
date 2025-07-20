"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
const database_1 = require("../config/database");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
class CheckoutService {
    static async initializeCheckout(data) {
        try {
            await this.validateCartItems(data.items);
            const subtotal = data.items.reduce((sum, item) => sum + item.total_price, 0);
            const taxAmount = subtotal * 0.18;
            const shippingAmount = await this.calculateShippingCost(data.items, data.shipping_method_id);
            const totalAmount = subtotal + taxAmount + shippingAmount;
            const razorpayOrder = await razorpay.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: 'INR',
                receipt: `order_${Date.now()}`,
                notes: {
                    user_id: data.user_id || 'guest',
                    items_count: data.items.length.toString(),
                },
            });
            const orderNumber = await this.generateOrderNumber();
            const { data: order, error } = await database_1.supabase
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
            const orderItems = data.items.map(item => ({
                order_id: order.id,
                product_id: item.product_id,
                product_name: '',
                product_sku: '',
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
                attributes: item.attributes,
            }));
            const { error: itemsError } = await database_1.supabase
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
        }
        catch (error) {
            console.error('Checkout initialization error:', error);
            throw error;
        }
    }
    static async validateCartItems(items) {
        for (const item of items) {
            const { data: product, error } = await database_1.supabase
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
    static async calculateShippingCost(items, shippingMethodId) {
        const totalWeight = items.reduce((sum, item) => sum + (item.quantity * 0.5), 0);
        const { data: shippingMethod, error } = await database_1.supabase
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
    static async generateOrderNumber() {
        const { data, error } = await database_1.supabase.rpc('generate_order_number');
        if (error) {
            throw new Error(`Failed to generate order number: ${error.message}`);
        }
        return data;
    }
    static async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
        try {
            const text = `${razorpayOrderId}|${razorpayPaymentId}`;
            const signature = crypto_1.default
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(text)
                .digest('hex');
            if (signature !== razorpaySignature) {
                return false;
            }
            const payment = await razorpay.payments.fetch(razorpayPaymentId);
            return payment.status === 'captured';
        }
        catch (error) {
            console.error('Payment verification error:', error);
            return false;
        }
    }
    static async processSuccessfulPayment(orderId, razorpayOrderId, razorpayPaymentId) {
        try {
            const { error: orderError } = await database_1.supabase
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
            const { error: transactionError } = await database_1.supabase
                .from('payment_transactions')
                .insert({
                order_id: orderId,
                razorpay_order_id: razorpayOrderId,
                razorpay_payment_id: razorpayPaymentId,
                amount: 0,
                currency: 'INR',
                status: 'success',
                payment_method: 'razorpay',
                gateway_response: {},
            });
            if (transactionError) {
                throw new Error(`Failed to create payment transaction: ${transactionError.message}`);
            }
            await this.updateInventory(orderId);
        }
        catch (error) {
            console.error('Payment processing error:', error);
            throw error;
        }
    }
    static async updateInventory(orderId) {
        const { data: orderItems, error } = await database_1.supabase
            .from('order_items')
            .select('product_id, quantity')
            .eq('order_id', orderId);
        if (error) {
            throw new Error(`Failed to get order items: ${error.message}`);
        }
        for (const item of orderItems) {
            const { data: product, error: fetchError } = await database_1.supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', item.product_id)
                .single();
            if (fetchError) {
                console.error(`Failed to fetch product ${item.product_id}:`, fetchError);
                continue;
            }
            const { error: updateError } = await database_1.supabase
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
    static async getShippingMethods() {
        const { data, error } = await database_1.supabase
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
exports.CheckoutService = CheckoutService;
//# sourceMappingURL=checkoutService.js.map