import { supabase } from '../config/database';

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

export class OrderTrackingService {
  private static courierAPIs: Record<string, CourierAPI> = {
    'delhivery': {
      baseUrl: 'https://api.delhivery.com',
      trackOrder: async (trackingNumber: string) => {
        // Mock implementation - replace with actual API
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
      trackOrder: async (trackingNumber: string) => {
        // Mock implementation - replace with actual API
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

  static async getOrderTracking(orderId: string): Promise<OrderTracking | null> {
    try {
      const { data: tracking, error } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (error || !tracking) {
        return null;
      }

      // Get status history
      const { data: history, error: historyError } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('timestamp', { ascending: true });

      if (historyError) {
        console.error('Error fetching status history:', historyError);
      }

      const timeline: OrderStatusHistory[] = (history || []).map(item => ({
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
    } catch (error) {
      console.error('Error getting order tracking:', error);
      return null;
    }
  }

  static async updateOrderStatus(
    orderId: string, 
    status: string, 
    description?: string, 
    location?: string, 
    createdBy: string = 'system'
  ): Promise<boolean> {
    try {
      // Update order status using the database function
      const { error } = await supabase.rpc('update_order_status_with_history', {
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
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  }

  static async trackOrderWithCourier(trackingNumber: string, courierName: string): Promise<any> {
    try {
      const courierAPI = this.courierAPIs[courierName.toLowerCase()];
      
      if (!courierAPI) {
        throw new Error(`Courier ${courierName} not supported`);
      }

      const trackingData = await courierAPI.trackOrder(trackingNumber);
      return trackingData;
    } catch (error) {
      console.error('Error tracking order with courier:', error);
      throw error;
    }
  }

  static async createOrderTracking(
    orderId: string,
    trackingNumber: string,
    courierName: string,
    courierUrl?: string,
    estimatedDelivery?: Date
  ): Promise<boolean> {
    try {
      const { error } = await supabase
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
    } catch (error) {
      console.error('Error creating order tracking:', error);
      return false;
    }
  }

  static async getOrderTimeline(orderId: string): Promise<OrderStatusHistory[]> {
    try {
      const { data, error } = await supabase.rpc('get_order_timeline', {
        p_order_id: orderId
      });

      if (error) {
        console.error('Error getting order timeline:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        status: item.status,
        description: item.description,
        location: item.location,
        timestamp: new Date(item.timestamp),
        createdBy: item.created_by
      }));
    } catch (error) {
      console.error('Error getting order timeline:', error);
      return [];
    }
  }

  static async sendOrderNotification(
    orderId: string,
    userId: string,
    notificationType: 'email' | 'sms' | 'push',
    notificationData: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
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

      // TODO: Implement actual notification sending logic
      console.log(`Sending ${notificationType} notification for order ${orderId}`);

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  static async getAvailableCouriers(): Promise<string[]> {
    return Object.keys(this.courierAPIs);
  }
} 