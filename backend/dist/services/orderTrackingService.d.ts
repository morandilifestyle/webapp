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
export interface CourierAPI {
    baseUrl: string;
    trackOrder: (trackingNumber: string) => Promise<any>;
}
export declare class OrderTrackingService {
    private static courierAPIs;
    static getOrderTracking(orderId: string): Promise<OrderTracking | null>;
    static updateOrderStatus(orderId: string, status: string, description?: string, location?: string, createdBy?: string): Promise<boolean>;
    static trackOrderWithCourier(trackingNumber: string, courierName: string): Promise<any>;
    static createOrderTracking(orderId: string, trackingNumber: string, courierName: string, courierUrl?: string, estimatedDelivery?: Date): Promise<boolean>;
    static getOrderTimeline(orderId: string): Promise<OrderStatusHistory[]>;
    static sendOrderNotification(orderId: string, userId: string, notificationType: 'email' | 'sms' | 'push', notificationData: any): Promise<boolean>;
    static getAvailableCouriers(): Promise<string[]>;
}
//# sourceMappingURL=orderTrackingService.d.ts.map