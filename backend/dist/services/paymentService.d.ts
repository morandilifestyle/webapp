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
export declare class PaymentService {
    static createRazorpayOrder(amount: number, receipt: string, notes?: Record<string, string>): Promise<import("razorpay/dist/types/orders").Orders.RazorpayOrder>;
    static verifyPaymentSignature(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): boolean;
    static verifyPaymentWithRazorpay(razorpayPaymentId: string): Promise<boolean>;
    static processPaymentVerification(data: PaymentVerificationRequest): Promise<{
        success: boolean;
        message: string;
        order?: any;
    }>;
    static processRefund(data: PaymentRefundRequest): Promise<{
        success: boolean;
        message: string;
        refund_id?: string;
    }>;
    static getPaymentTransaction(orderId: string): Promise<any>;
    static getPaymentMethods(): Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
    }>;
}
//# sourceMappingURL=paymentService.d.ts.map