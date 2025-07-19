import Link from 'next/link';

interface OrderConfirmationProps {
  orderId: string;
  orderNumber: string;
}

export default function OrderConfirmation({ orderId, orderNumber }: OrderConfirmationProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Order Confirmation</h2>
        <p className="text-sm text-gray-600 mt-1">Thank you for your order!</p>
      </div>

      <div className="p-6">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Order Placed Successfully!
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            Your order has been confirmed and we'll send you an email with tracking information.
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Order ID:</span>
                <p className="text-gray-900">{orderId}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Order Number:</span>
                <p className="text-gray-900">{orderNumber}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <p className="text-green-600 font-medium">Confirmed</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Payment:</span>
                <p className="text-green-600 font-medium">Paid</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">What's Next?</h4>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <p>You'll receive an order confirmation email within a few minutes</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <p>We'll process your order and ship it within 1-2 business days</p>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <p>You'll receive tracking information once your order ships</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              View Orders
            </Link>
            
            <Link
              href="/products"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
          </div>

          {/* Support Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@morandi.com" className="text-blue-600 hover:text-blue-700">
                support@morandi.com
              </a>
              {' '}or call us at{' '}
              <a href="tel:+91-1800-123-4567" className="text-blue-600 hover:text-blue-700">
                +91-1800-123-4567
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 