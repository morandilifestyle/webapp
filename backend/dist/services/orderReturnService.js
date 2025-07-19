"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderReturnService = void 0;
const index_1 = require("../index");
const paymentService_1 = require("./paymentService");
class OrderReturnService {
    static async createReturnRequest(request) {
        try {
            const { data: order, error: orderError } = await index_1.supabase
                .from('orders')
                .select('id, status, total_amount')
                .eq('id', request.orderId)
                .single();
            if (orderError || !order) {
                throw new Error('Order not found');
            }
            if (!['delivered', 'shipped'].includes(order.status)) {
                throw new Error('Order is not eligible for return');
            }
            const { data: existingReturn, error: existingError } = await index_1.supabase
                .from('order_returns')
                .select('id')
                .eq('order_id', request.orderId)
                .single();
            if (existingReturn) {
                throw new Error('Return request already exists for this order');
            }
            const { data: returnRequest, error } = await index_1.supabase
                .from('order_returns')
                .insert({
                order_id: request.orderId,
                return_reason: request.returnReason,
                return_description: request.returnDescription,
                refund_amount: request.refundAmount || order.total_amount,
                refund_method: request.refundMethod || 'original_payment_method',
                return_status: 'pending'
            })
                .select()
                .single();
            if (error) {
                console.error('Error creating return request:', error);
                return null;
            }
            return {
                id: returnRequest.id,
                orderId: returnRequest.order_id,
                returnReason: returnRequest.return_reason,
                returnDescription: returnRequest.return_description,
                returnStatus: returnRequest.return_status,
                refundAmount: returnRequest.refund_amount,
                refundMethod: returnRequest.refund_method,
                returnTrackingNumber: returnRequest.return_tracking_number,
                createdAt: new Date(returnRequest.created_at),
                updatedAt: new Date(returnRequest.updated_at)
            };
        }
        catch (error) {
            console.error('Error creating return request:', error);
            return null;
        }
    }
    static async getOrderReturn(orderId) {
        try {
            const { data: returnRequest, error } = await index_1.supabase
                .from('order_returns')
                .select('*')
                .eq('order_id', orderId)
                .single();
            if (error || !returnRequest) {
                return null;
            }
            return {
                id: returnRequest.id,
                orderId: returnRequest.order_id,
                returnReason: returnRequest.return_reason,
                returnDescription: returnRequest.return_description,
                returnStatus: returnRequest.return_status,
                refundAmount: returnRequest.refund_amount,
                refundMethod: returnRequest.refund_method,
                returnTrackingNumber: returnRequest.return_tracking_number,
                createdAt: new Date(returnRequest.created_at),
                updatedAt: new Date(returnRequest.updated_at)
            };
        }
        catch (error) {
            console.error('Error getting order return:', error);
            return null;
        }
    }
    static async updateReturnStatus(returnId, status, refundAmount, returnTrackingNumber) {
        try {
            const updateData = {
                return_status: status,
                updated_at: new Date().toISOString()
            };
            if (refundAmount !== undefined) {
                updateData.refund_amount = refundAmount;
            }
            if (returnTrackingNumber) {
                updateData.return_tracking_number = returnTrackingNumber;
            }
            const { error } = await index_1.supabase
                .from('order_returns')
                .update(updateData)
                .eq('id', returnId);
            if (error) {
                console.error('Error updating return status:', error);
                return false;
            }
            if (status === 'approved' && refundAmount) {
                await this.processRefund(returnId, refundAmount);
            }
            return true;
        }
        catch (error) {
            console.error('Error updating return status:', error);
            return false;
        }
    }
    static async processRefund(returnId, amount) {
        try {
            const { data: returnRequest, error: returnError } = await index_1.supabase
                .from('order_returns')
                .select('order_id, refund_method')
                .eq('id', returnId)
                .single();
            if (returnError || !returnRequest) {
                throw new Error('Return request not found');
            }
            const { data: order, error: orderError } = await index_1.supabase
                .from('orders')
                .select('razorpay_payment_id, payment_method')
                .eq('id', returnRequest.order_id)
                .single();
            if (orderError || !order) {
                throw new Error('Order not found');
            }
            const refundResult = await paymentService_1.PaymentService.processRefund({
                order_id: returnRequest.order_id,
                amount,
                reason: 'Order return'
            });
            if (refundResult.success) {
                await this.updateReturnStatus(returnId, 'processed', amount);
                return true;
            }
            else {
                throw new Error(refundResult.message || 'Refund processing failed');
            }
        }
        catch (error) {
            console.error('Error processing refund:', error);
            return false;
        }
    }
    static async getUserReturns(userId) {
        try {
            const { data: returns, error } = await index_1.supabase
                .from('order_returns')
                .select(`
          *,
          orders!inner(user_id)
        `)
                .eq('orders.user_id', userId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Error getting user returns:', error);
                return [];
            }
            return (returns || []).map(returnRequest => ({
                id: returnRequest.id,
                orderId: returnRequest.order_id,
                returnReason: returnRequest.return_reason,
                returnDescription: returnRequest.return_description,
                returnStatus: returnRequest.return_status,
                refundAmount: returnRequest.refund_amount,
                refundMethod: returnRequest.refund_method,
                returnTrackingNumber: returnRequest.return_tracking_number,
                createdAt: new Date(returnRequest.created_at),
                updatedAt: new Date(returnRequest.updated_at)
            }));
        }
        catch (error) {
            console.error('Error getting user returns:', error);
            return [];
        }
    }
    static async getReturnReasons() {
        return [
            'Wrong item received',
            'Item damaged',
            'Item not as described',
            'Size doesn\'t fit',
            'Changed my mind',
            'Duplicate order',
            'Quality issues',
            'Other'
        ];
    }
    static async getRefundMethods() {
        return [
            'original_payment_method',
            'store_credit',
            'bank_transfer',
            'check'
        ];
    }
}
exports.OrderReturnService = OrderReturnService;
//# sourceMappingURL=orderReturnService.js.map