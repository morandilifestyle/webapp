import { useState, useEffect } from 'react';
import { ShippingAddress } from '@/app/checkout/page';
import { secureFetch, handleApiError, formatPrice } from '@/lib/utils';

interface PaymentFormProps {
  onNext: (paymentMethod: string) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
  orderData: {
    order_id: string | null;
    razorpay_order_id: string | null;
    shipping_address: ShippingAddress;
    billing_address: ShippingAddress;
    shipping_method_id: string;
  };
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export default function PaymentForm({ onNext, onBack, loading, error, orderData }: PaymentFormProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [orderSummary, setOrderSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
    fetchOrderSummary();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await secureFetch('/api/orders/payment/methods');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setPaymentMethods(result.data);
        if (result.data.length > 0) {
          setSelectedPaymentMethod(result.data[0].id);
        }
      } else {
        setErrorMessage(result.error || 'Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      setErrorMessage(handleApiError(error));
    }
  };

  const fetchOrderSummary = async () => {
    try {
      // This would typically come from the cart context or API
      // For now, we'll use a mock summary
      setOrderSummary({
        subtotal: 2500,
        tax: 450,
        shipping: 100,
        total: 3050,
      });
    } catch (error) {
      console.error('Failed to fetch order summary:', error);
      setErrorMessage(handleApiError(error));
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPaymentMethod) {
      setErrorMessage('Please select a payment method');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (selectedPaymentMethod === 'razorpay') {
        await handleRazorpayPayment();
      } else {
        onNext(selectedPaymentMethod);
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      setErrorMessage(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    try {
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: (orderSummary?.total || 0) * 100, // Convert to paise
          currency: 'INR',
          name: 'Morandi Lifestyle',
          description: 'Sustainable Textile Products',
          order_id: orderData.razorpay_order_id,
          handler: function (response: any) {
            // Handle successful payment
            verifyPayment(response);
          },
          prefill: {
            name: `${orderData.shipping_address.first_name} ${orderData.shipping_address.last_name}`,
            email: 'customer@example.com', // Would come from user context
            contact: orderData.shipping_address.phone,
          },
          theme: {
            color: '#10B981', // Morandi brand green
          },
          modal: {
            ondismiss: function () {
              console.log('Payment modal closed');
              setErrorMessage('Payment was cancelled');
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        setErrorMessage('Failed to load payment gateway');
      };
    } catch (error) {
      console.error('Razorpay payment error:', error);
      setErrorMessage(handleApiError(error));
    }
  };

  const verifyPayment = async (response: any) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const verifyResponse = await secureFetch('/api/orders/payment/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          order_id: orderData.order_id,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.error || 'Payment verification failed');
      }

      const result = await verifyResponse.json();

      if (result.success) {
        onNext('razorpay');
      } else {
        setErrorMessage(result.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setErrorMessage(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
        <p className="text-sm text-gray-600 mt-1">Choose your preferred payment method</p>
      </div>

      <form onSubmit={handlePaymentSubmit} className="p-6">
        {/* Error Display */}
        {(error || errorMessage) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error || errorMessage}
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="mb-6">
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <label key={method.id} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment_method"
                  value={method.id}
                  checked={selectedPaymentMethod === method.id}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{method.icon}</span>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{method.name}</span>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        {orderSummary && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-md font-medium text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(orderSummary.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (18% GST)</span>
                <span>{formatPrice(orderSummary.tax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatPrice(orderSummary.shipping)}</span>
              </div>
              <div className="flex justify-between font-medium text-lg border-t pt-2">
                <span>Total</span>
                <span>{formatPrice(orderSummary.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading || isLoading || !selectedPaymentMethod}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </div>
      </form>
    </div>
  );
} 