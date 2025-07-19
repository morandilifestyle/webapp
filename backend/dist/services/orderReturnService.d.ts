export interface OrderReturn {
    id: string;
    orderId: string;
    returnReason: string;
    returnDescription?: string;
    returnStatus: 'pending' | 'approved' | 'processed' | 'completed';
    refundAmount?: number;
    refundMethod?: string;
    returnTrackingNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ReturnRequest {
    orderId: string;
    returnReason: string;
    returnDescription?: string;
    refundAmount?: number;
    refundMethod?: string;
}
export declare class OrderReturnService {
    static createReturnRequest(request: ReturnRequest): Promise<OrderReturn | null>;
    static getOrderReturn(orderId: string): Promise<OrderReturn | null>;
    static updateReturnStatus(returnId: string, status: 'pending' | 'approved' | 'processed' | 'completed', refundAmount?: number, returnTrackingNumber?: string): Promise<boolean>;
    static processRefund(returnId: string, amount: number): Promise<boolean>;
    static getUserReturns(userId: string): Promise<OrderReturn[]>;
    static getReturnReasons(): Promise<string[]>;
    static getRefundMethods(): Promise<string[]>;
}
//# sourceMappingURL=orderReturnService.d.ts.map