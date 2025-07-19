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
export interface BillingAddress extends ShippingAddress {
}
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
export declare class CheckoutService {
    static initializeCheckout(data: CheckoutRequest): Promise<CheckoutResponse>;
    static validateCartItems(items: CheckoutItem[]): Promise<void>;
    static calculateShippingCost(items: CheckoutItem[], shippingMethodId: string): Promise<number>;
    static generateOrderNumber(): Promise<string>;
    static verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<boolean>;
    static processSuccessfulPayment(orderId: string, razorpayOrderId: string, razorpayPaymentId: string): Promise<void>;
    static updateInventory(orderId: string): Promise<void>;
    static getShippingMethods(): Promise<any[]>;
}
//# sourceMappingURL=checkoutService.d.ts.map