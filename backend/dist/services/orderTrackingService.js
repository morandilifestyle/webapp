"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderTrackingService = void 0;
const index_1 = require("../index");
class OrderTrackingService {
    static async getOrderTracking(orderId) {
        try {
            const { data: tracking, error } = await index_1.supabase
                .from('order_tracking')
                .select('*')
                .eq('order_id', orderId)
                .single();
            if (error || !tracking) {
                return null;
            }
            const { data: history, error: historyError } = await index_1.supabase
                .from('order_status_history')
                .select('*')
                .eq('order_id', orderId)
                .order('timestamp', { ascending: true });
            if (historyError) {
                console.error('Error fetching status history:', historyError);
            }
            const timeline = (history || []).map(item => ({
                status: item.status,
                description: item.description,
                location: item.location,
                timestamp: new Date(item.timestamp),
                createdBy: item.created_by
            }));
            return {
                orderId: tracking.order_id,
                trackingNumber: tracking.tracking_number,
                courierName: tracking.courier_name,
                courierUrl: tracking.courier_url,
                status: tracking.status || 'pending',
                estimatedDelivery: tracking.estimated_delivery ? new Date(tracking.estimated_delivery) : new Date(),
                actualDelivery: tracking.actual_delivery_date ? new Date(tracking.actual_delivery_date) : undefined,
                timeline,
                location: tracking.location
            };
        }
        catch (error) {
            console.error('Error getting order tracking:', error);
            return null;
        }
    }
    static async updateOrderStatus(orderId, status, description, location, createdBy = 'system') {
        try {
            const { error } = await index_1.supabase.rpc('update_order_status_with_history', {
                p_order_id: orderId,
                p_status: status,
                p_description: description,
                p_location: location,
                p_created_by: createdBy
            });
            if (error) {
                console.error('Error updating order status:', error);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error updating order status:', error);
            return false;
        }
    }
    static async trackOrderWithCourier(trackingNumber, courierName) {
        try {
            const courierAPI = this.courierAPIs[courierName.toLowerCase()];
            if (!courierAPI) {
                throw new Error(`Courier ${courierName} not supported`);
            }
            const trackingData = await courierAPI.trackOrder(trackingNumber);
            return trackingData;
        }
        catch (error) {
            console.error('Error tracking order with courier:', error);
            throw error;
        }
    }
    static async createOrderTracking(orderId, trackingNumber, courierName, courierUrl, estimatedDelivery) {
        try {
            const { error } = await index_1.supabase
                .from('order_tracking')
                .insert({
                order_id: orderId,
                tracking_number: trackingNumber,
                courier_name: courierName,
                courier_url: courierUrl,
                estimated_delivery: estimatedDelivery
            });
            if (error) {
                console.error('Error creating order tracking:', error);
                return false;
            }
            return true;
        }
        catch (error) {
            console.error('Error creating order tracking:', error);
            return false;
        }
    }
    static async getOrderTimeline(orderId) {
        try {
            const { data, error } = await index_1.supabase.rpc('get_order_timeline', {
                p_order_id: orderId
            });
            if (error) {
                console.error('Error getting order timeline:', error);
                return [];
            }
            return (data || []).map((item) => ({
                status: item.status,
                description: item.description,
                location: item.location,
                timestamp: new Date(item.timestamp),
                createdBy: item.created_by
            }));
        }
        catch (error) {
            console.error('Error getting order timeline:', error);
            return [];
        }
    }
    static async sendOrderNotification(orderId, userId, notificationType, notificationData) {
        try {
            const { error } = await index_1.supabase
                .from('order_notifications')
                .insert({
                order_id: orderId,
                user_id: userId,
                notification_type: notificationType,
                notification_data: notificationData
            });
            if (error) {
                console.error('Error creating notification:', error);
                return false;
            }
            console.log(`Sending ${notificationType} notification for order ${orderId}`);
            return true;
        }
        catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }
    static async getAvailableCouriers() {
        return Object.keys(this.courierAPIs);
    }
}
exports.OrderTrackingService = OrderTrackingService;
_a = OrderTrackingService;
OrderTrackingService.courierAPIs = {
    'delhivery': {
        baseUrl: 'https://api.delhivery.com',
        trackOrder: async (trackingNumber) => {
            return {
                status: 'in_transit',
                location: 'Mumbai',
                estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                timeline: [
                    {
                        status: 'picked_up',
                        description: 'Package picked up from seller',
                        location: 'Delhi',
                        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        createdBy: 'courier'
                    },
                    {
                        status: 'in_transit',
                        description: 'Package in transit',
                        location: 'Mumbai',
                        timestamp: new Date(),
                        createdBy: 'courier'
                    }
                ]
            };
        }
    },
    'bluedart': {
        baseUrl: 'https://api.bluedart.com',
        trackOrder: async (trackingNumber) => {
            return {
                status: 'out_for_delivery',
                location: 'Bangalore',
                estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000),
                timeline: [
                    {
                        status: 'picked_up',
                        description: 'Package picked up from seller',
                        location: 'Delhi',
                        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                        createdBy: 'courier'
                    },
                    {
                        status: 'in_transit',
                        description: 'Package in transit',
                        location: 'Bangalore',
                        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                        createdBy: 'courier'
                    },
                    {
                        status: 'out_for_delivery',
                        description: 'Package out for delivery',
                        location: 'Bangalore',
                        timestamp: new Date(),
                        createdBy: 'courier'
                    }
                ]
            };
        }
    }
};
//# sourceMappingURL=orderTrackingService.js.map