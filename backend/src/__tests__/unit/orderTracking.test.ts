import { OrderTrackingService } from '../../services/orderTrackingService';
import { supabase } from '../../index';

// Add Jest types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOrderTracking(): R;
    }
  }
}

// Mock supabase
jest.mock('../../index', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('OrderTrackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrderTracking', () => {
    it('should return order tracking data when tracking exists', async () => {
      const mockTracking = {
        order_id: 'test-order-id',
        tracking_number: 'TRACK123456',
        courier_name: 'Delhivery',
        courier_url: 'https://delhivery.com/track',
        estimated_delivery: '2024-12-15',
        actual_delivery_date: null,
        status: 'in_transit',
        location: 'Mumbai',
      };

      const mockHistory = [
        {
          status: 'pending',
          description: 'Order placed',
          location: 'Delhi',
          timestamp: '2024-12-10T10:00:00Z',
          created_by: 'system',
        },
        {
          status: 'shipped',
          description: 'Package shipped',
          location: 'Mumbai',
          timestamp: '2024-12-12T14:00:00Z',
          created_by: 'courier',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockTracking, error: null }),
          }),
        }),
      } as any);

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockHistory, error: null }),
            }),
          }),
        }),
      } as any);

      const result = await OrderTrackingService.getOrderTracking('test-order-id');

      expect(result).toEqual({
        orderId: 'test-order-id',
        trackingNumber: 'TRACK123456',
        courierName: 'Delhivery',
        courierUrl: 'https://delhivery.com/track',
        status: 'in_transit',
        estimatedDelivery: new Date('2024-12-15'),
        actualDelivery: undefined,
        timeline: [
          {
            status: 'pending',
            description: 'Order placed',
            location: 'Delhi',
            timestamp: new Date('2024-12-10T10:00:00Z'),
            createdBy: 'system',
          },
          {
            status: 'shipped',
            description: 'Package shipped',
            location: 'Mumbai',
            timestamp: new Date('2024-12-12T14:00:00Z'),
            createdBy: 'courier',
          },
        ],
        location: 'Mumbai',
      });
    });

    it('should return null when tracking does not exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      } as any);

      const result = await OrderTrackingService.getOrderTracking('non-existent-order');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Database error')),
          }),
        }),
      } as any);

      const result = await OrderTrackingService.getOrderTracking('test-order-id');

      expect(result).toBeNull();
    });
  });

  describe('updateOrderStatus', () => {
    it('should successfully update order status with history', async () => {
      mockSupabase.rpc.mockResolvedValue({ error: null });

      const result = await OrderTrackingService.updateOrderStatus(
        'test-order-id',
        'shipped',
        'Package shipped from warehouse',
        'Mumbai',
        'admin'
      );

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('update_order_status_with_history', {
        p_order_id: 'test-order-id',
        p_status: 'shipped',
        p_description: 'Package shipped from warehouse',
        p_location: 'Mumbai',
        p_created_by: 'admin',
      });
    });

    it('should handle database errors during status update', async () => {
      mockSupabase.rpc.mockResolvedValue({ error: { message: 'Database error' } });

      const result = await OrderTrackingService.updateOrderStatus(
        'test-order-id',
        'shipped'
      );

      expect(result).toBe(false);
    });
  });

  describe('trackOrderWithCourier', () => {
    it('should track order with Delhivery courier', async () => {
      const result = await OrderTrackingService.trackOrderWithCourier('TRACK123456', 'delhivery');

      expect(result).toEqual({
        status: 'in_transit',
        location: 'Mumbai',
        estimatedDelivery: expect.any(Date),
        timeline: expect.arrayContaining([
          expect.objectContaining({
            status: 'picked_up',
            description: 'Package picked up from seller',
            location: 'Delhi',
            timestamp: expect.any(Date),
            createdBy: 'courier',
          }),
        ]),
      });
    });

    it('should track order with Blue Dart courier', async () => {
      const result = await OrderTrackingService.trackOrderWithCourier('TRACK789012', 'bluedart');

      expect(result).toEqual({
        status: 'out_for_delivery',
        location: 'Bangalore',
        estimatedDelivery: expect.any(Date),
        timeline: expect.arrayContaining([
          expect.objectContaining({
            status: 'out_for_delivery',
            description: 'Package out for delivery',
            location: 'Bangalore',
            timestamp: expect.any(Date),
            createdBy: 'courier',
          }),
        ]),
      });
    });

    it('should throw error for unsupported courier', async () => {
      await expect(
        OrderTrackingService.trackOrderWithCourier('TRACK123456', 'unsupported')
      ).rejects.toThrow('Courier unsupported not supported');
    });
  });

  describe('createOrderTracking', () => {
    it('should create order tracking successfully', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'tracking-id' }, error: null }),
          }),
        }),
      } as any);

      const result = await OrderTrackingService.createOrderTracking(
        'test-order-id',
        'TRACK123456',
        'Delhivery',
        'https://delhivery.com/track',
        new Date('2024-12-15')
      );

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('order_tracking');
    });

    it('should handle database errors during tracking creation', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
          }),
        }),
      } as any);

      const result = await OrderTrackingService.createOrderTracking(
        'test-order-id',
        'TRACK123456',
        'Delhivery'
      );

      expect(result).toBe(false);
    });
  });

  describe('getOrderTimeline', () => {
    it('should return order timeline successfully', async () => {
      const mockTimeline = [
        {
          status: 'pending',
          description: 'Order placed',
          location: 'Delhi',
          timestamp: '2024-12-10T10:00:00Z',
          created_by: 'system',
        },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockTimeline, error: null });

      const result = await OrderTrackingService.getOrderTimeline('test-order-id');

      expect(result).toEqual([
        {
          status: 'pending',
          description: 'Order placed',
          location: 'Delhi',
          timestamp: new Date('2024-12-10T10:00:00Z'),
          createdBy: 'system',
        },
      ]);
    });

    it('should return empty array when no timeline exists', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      const result = await OrderTrackingService.getOrderTimeline('test-order-id');

      expect(result).toEqual([]);
    });
  });

  describe('sendOrderNotification', () => {
    it('should create notification record successfully', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      const result = await OrderTrackingService.sendOrderNotification(
        'test-order-id',
        'test-user-id',
        'email',
        { subject: 'Order Update', body: 'Your order has been shipped' }
      );

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('order_notifications');
    });

    it('should handle database errors during notification creation', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: { message: 'Database error' } }),
      } as any);

      const result = await OrderTrackingService.sendOrderNotification(
        'test-order-id',
        'test-user-id',
        'email',
        {}
      );

      expect(result).toBe(false);
    });
  });

  describe('getAvailableCouriers', () => {
    it('should return list of available couriers', async () => {
      const result = await OrderTrackingService.getAvailableCouriers();

      expect(result).toEqual(['delhivery', 'bluedart']);
    });
  });
}); 