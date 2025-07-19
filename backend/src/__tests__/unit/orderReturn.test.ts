import { OrderReturnService } from '../../services/orderReturnService';
import { supabase } from '../../index';

// Mock supabase
jest.mock('../../index', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

const mockSupabase = supabase as any;

describe('OrderReturnService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReturnRequest', () => {
    it('should create return request successfully for eligible order', async () => {
      const mockOrder = {
        id: 'test-order-id',
        status: 'delivered',
        total_amount: 117.99,
      };

      const mockReturnRequest = {
        id: 'return-id',
        order_id: 'test-order-id',
        return_reason: 'Wrong item received',
        return_description: 'Received wrong size',
        return_status: 'pending',
        refund_amount: 117.99,
        refund_method: 'original_payment_method',
        created_at: '2024-12-10T10:00:00Z',
        updated_at: '2024-12-10T10:00:00Z',
      };

      // Mock order lookup
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockOrder, error: null }),
          }),
        }),
      });

      // Mock existing return check
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      // Mock return creation
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockReturnRequest, error: null }),
          }),
        }),
      });

      const result = await OrderReturnService.createReturnRequest({
        orderId: 'test-order-id',
        returnReason: 'Wrong item received',
        returnDescription: 'Received wrong size',
        refundAmount: 117.99,
        refundMethod: 'original_payment_method',
      });

      expect(result).toEqual({
        id: 'return-id',
        orderId: 'test-order-id',
        returnReason: 'Wrong item received',
        returnDescription: 'Received wrong size',
        returnStatus: 'pending',
        refundAmount: 117.99,
        refundMethod: 'original_payment_method',
        returnTrackingNumber: undefined,
        createdAt: new Date('2024-12-10T10:00:00Z'),
        updatedAt: new Date('2024-12-10T10:00:00Z'),
      });
    });

    it('should throw error for non-existent order', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      await expect(
        OrderReturnService.createReturnRequest({
          orderId: 'non-existent-order',
          returnReason: 'Wrong item received',
        })
      ).rejects.toThrow('Order not found');
    });

    it('should throw error for ineligible order status', async () => {
      const mockOrder = {
        id: 'test-order-id',
        status: 'pending',
        total_amount: 117.99,
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockOrder, error: null }),
          }),
        }),
      });

      await expect(
        OrderReturnService.createReturnRequest({
          orderId: 'test-order-id',
          returnReason: 'Wrong item received',
        })
      ).rejects.toThrow('Order is not eligible for return');
    });

    it('should throw error if return already exists', async () => {
      const mockOrder = {
        id: 'test-order-id',
        status: 'delivered',
        total_amount: 117.99,
      };

      const mockExistingReturn = {
        id: 'existing-return-id',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockExistingReturn, error: null }),
          }),
        }),
      });

      await expect(
        OrderReturnService.createReturnRequest({
          orderId: 'test-order-id',
          returnReason: 'Wrong item received',
        })
      ).rejects.toThrow('Return request already exists for this order');
    });
  });

  describe('getOrderReturn', () => {
    it('should return return request when exists', async () => {
      const mockReturnRequest = {
        id: 'return-id',
        order_id: 'test-order-id',
        return_reason: 'Wrong item received',
        return_description: 'Received wrong size',
        return_status: 'pending',
        refund_amount: 117.99,
        refund_method: 'original_payment_method',
        return_tracking_number: null,
        created_at: '2024-12-10T10:00:00Z',
        updated_at: '2024-12-10T10:00:00Z',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockReturnRequest, error: null }),
          }),
        }),
      });

      const result = await OrderReturnService.getOrderReturn('test-order-id');

      expect(result).toEqual({
        id: 'return-id',
        orderId: 'test-order-id',
        returnReason: 'Wrong item received',
        returnDescription: 'Received wrong size',
        returnStatus: 'pending',
        refundAmount: 117.99,
        refundMethod: 'original_payment_method',
        returnTrackingNumber: undefined,
        createdAt: new Date('2024-12-10T10:00:00Z'),
        updatedAt: new Date('2024-12-10T10:00:00Z'),
      });
    });

    it('should return null when return request does not exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
          }),
        }),
      });

      const result = await OrderReturnService.getOrderReturn('test-order-id');

      expect(result).toBeNull();
    });
  });

  describe('updateReturnStatus', () => {
    it('should update return status successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const result = await OrderReturnService.updateReturnStatus(
        'return-id',
        'approved',
        117.99,
        'RETURN123456'
      );

      expect(result).toBe(true);
    });

    it('should handle database errors during status update', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: { message: 'Database error' } }),
        }),
      });

      const result = await OrderReturnService.updateReturnStatus('return-id', 'approved');

      expect(result).toBe(false);
    });
  });

  describe('getUserReturns', () => {
    it('should return user returns successfully', async () => {
      const mockReturns = [
        {
          id: 'return-id-1',
          order_id: 'order-id-1',
          return_reason: 'Wrong item received',
          return_description: 'Received wrong size',
          return_status: 'pending',
          refund_amount: 117.99,
          refund_method: 'original_payment_method',
          return_tracking_number: null,
          created_at: '2024-12-10T10:00:00Z',
          updated_at: '2024-12-10T10:00:00Z',
        },
        {
          id: 'return-id-2',
          order_id: 'order-id-2',
          return_reason: 'Item damaged',
          return_description: 'Package arrived damaged',
          return_status: 'approved',
          refund_amount: 89.99,
          refund_method: 'store_credit',
          return_tracking_number: 'RETURN789',
          created_at: '2024-12-08T10:00:00Z',
          updated_at: '2024-12-09T10:00:00Z',
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockReturns, error: null }),
            }),
          }),
        }),
      });

      const result = await OrderReturnService.getUserReturns('test-user-id');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'return-id-1',
        orderId: 'order-id-1',
        returnReason: 'Wrong item received',
        returnDescription: 'Received wrong size',
        returnStatus: 'pending',
        refundAmount: 117.99,
        refundMethod: 'original_payment_method',
        returnTrackingNumber: undefined,
        createdAt: new Date('2024-12-10T10:00:00Z'),
        updatedAt: new Date('2024-12-10T10:00:00Z'),
      });
    });

    it('should return empty array when no returns exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      });

      const result = await OrderReturnService.getUserReturns('test-user-id');

      expect(result).toEqual([]);
    });
  });

  describe('getReturnReasons', () => {
    it('should return list of return reasons', async () => {
      const result = await OrderReturnService.getReturnReasons();

      expect(result).toEqual([
        'Wrong item received',
        'Item damaged',
        'Item not as described',
        'Size doesn\'t fit',
        'Changed my mind',
        'Duplicate order',
        'Quality issues',
        'Other',
      ]);
    });
  });

  describe('getRefundMethods', () => {
    it('should return list of refund methods', async () => {
      const result = await OrderReturnService.getRefundMethods();

      expect(result).toEqual([
        'original_payment_method',
        'store_credit',
        'bank_transfer',
        'check',
      ]);
    });
  });
}); 