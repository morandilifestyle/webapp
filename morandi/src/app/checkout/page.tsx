'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/store/CartContext';
import Header from '@/components/ui/Header';
import CheckoutSteps from '@/components/checkout/CheckoutSteps';
import CartReview from '@/components/checkout/CartReview';
import ShippingForm from '@/components/checkout/ShippingForm';
import PaymentForm from '@/components/checkout/PaymentForm';
import OrderConfirmation from '@/components/checkout/OrderConfirmation';
import { useRouter } from 'next/navigation';

export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'confirmation';

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

export interface CheckoutState {
  step: CheckoutStep;
  shipping_address: ShippingAddress | null;
  billing_address: ShippingAddress | null;
  shipping_method_id: string;
  payment_method: string;
  order_id: string | null;
  razorpay_order_id: string | null;
  loading: boolean;
  error: string | null;
}

export default function CheckoutPage() {
  const { cart, refreshCart } = useCart();
  const router = useRouter();
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    step: 'cart',
    shipping_address: null,
    billing_address: null,
    shipping_method_id: '',
    payment_method: '',
    order_id: null,
    razorpay_order_id: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    // Redirect to cart if empty
    if (cart.items.length === 0 && !cart.isLoading) {
      router.push('/cart');
    }
  }, [cart.items.length, cart.isLoading, router]);

  const handleNextStep = () => {
    const steps: CheckoutStep[] = ['cart', 'shipping', 'payment', 'confirmation'];
    const currentIndex = steps.indexOf(checkoutState.step);
    if (currentIndex < steps.length - 1) {
      setCheckoutState(prev => ({
        ...prev,
        step: steps[currentIndex + 1],
        error: null,
      }));
    }
  };

  const handlePreviousStep = () => {
    const steps: CheckoutStep[] = ['cart', 'shipping', 'payment', 'confirmation'];
    const currentIndex = steps.indexOf(checkoutState.step);
    if (currentIndex > 0) {
      setCheckoutState(prev => ({
        ...prev,
        step: steps[currentIndex - 1],
        error: null,
      }));
    }
  };

  const handleShippingSubmit = (shippingAddress: ShippingAddress, billingAddress: ShippingAddress, shippingMethodId: string) => {
    setCheckoutState(prev => ({
      ...prev,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      shipping_method_id: shippingMethodId,
      step: 'payment',
      error: null,
    }));
  };

  const handlePaymentSubmit = async (paymentMethod: string) => {
    if (!checkoutState.shipping_address || !checkoutState.shipping_method_id) {
      setCheckoutState(prev => ({
        ...prev,
        error: 'Please complete shipping information first',
      }));
      return;
    }

    setCheckoutState(prev => ({
      ...prev,
      payment_method: paymentMethod,
      loading: true,
      error: null,
    }));

    try {
      // Initialize checkout
      const response = await fetch('/api/orders/checkout/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.items.map(item => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.salePrice || item.price,
            total_price: (item.salePrice || item.price) * item.quantity,
            attributes: item.attributes,
          })),
          shipping_address: checkoutState.shipping_address,
          billing_address: checkoutState.billing_address,
          shipping_method_id: checkoutState.shipping_method_id,
          payment_method: paymentMethod,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Checkout initialization failed');
      }

      setCheckoutState(prev => ({
        ...prev,
        order_id: result.data.order_id,
        razorpay_order_id: result.data.razorpay_order_id,
        step: 'confirmation',
        loading: false,
      }));
    } catch (error) {
      setCheckoutState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Checkout failed',
        loading: false,
      }));
    }
  };

  const renderStep = () => {
    switch (checkoutState.step) {
      case 'cart':
        return (
          <CartReview
            cart={cart}
            onNext={handleNextStep}
          />
        );
      case 'shipping':
        return (
          <ShippingForm
            onNext={handleShippingSubmit}
            onBack={handlePreviousStep}
            initialData={{
              shipping_address: checkoutState.shipping_address,
              billing_address: checkoutState.billing_address,
              shipping_method_id: checkoutState.shipping_method_id,
            }}
          />
        );
      case 'payment':
        return (
          <PaymentForm
            onNext={handlePaymentSubmit}
            onBack={handlePreviousStep}
            loading={checkoutState.loading}
            error={checkoutState.error}
            orderData={{
              order_id: checkoutState.order_id,
              razorpay_order_id: checkoutState.razorpay_order_id,
              shipping_address: checkoutState.shipping_address!,
              billing_address: checkoutState.billing_address!,
              shipping_method_id: checkoutState.shipping_method_id,
            }}
          />
        );
      case 'confirmation':
        return (
          <OrderConfirmation
            orderId={checkoutState.order_id!}
            orderNumber={checkoutState.razorpay_order_id!}
          />
        );
      default:
        return null;
    }
  };

  if (cart.isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </>
    );
  }

  if (cart.items.length === 0) {
    return null; // Will redirect to cart
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <CheckoutSteps currentStep={checkoutState.step} />
          
          <div className="mt-8">
            {checkoutState.error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{checkoutState.error}</p>
                  </div>
                </div>
              </div>
            )}
            
            {renderStep()}
          </div>
        </div>
      </div>
    </>
  );
} 