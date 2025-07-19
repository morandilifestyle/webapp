import { useCart } from '@/store/CartContext';
import Image from 'next/image';
import Link from 'next/link';

interface CartReviewProps {
  cart: any;
  onNext: () => void;
}

export default function CartReview({ cart, onNext }: CartReviewProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Review Your Cart</h2>
        <p className="text-sm text-gray-600 mt-1">Please review your items before proceeding</p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {cart.items.map((item: any) => (
            <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-100 last:border-b-0">
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover rounded-lg"
                  sizes="64px"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                </h3>
                
                {item.attributes && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.attributes.material && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {item.attributes.material}
                      </span>
                    )}
                    {item.attributes.color && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {item.attributes.color}
                      </span>
                    )}
                    {item.attributes.size && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {item.attributes.size}
                      </span>
                    )}
                  </div>
                )}
                
                <p className="text-sm text-gray-500 mt-1">
                  Qty: {item.quantity}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatPrice((item.salePrice || item.price) * item.quantity)}
                </p>
                {item.salePrice && (
                  <p className="text-xs text-gray-500 line-through">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal ({cart.itemCount} items)</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (18% GST)</span>
              <span>{formatPrice(cart.tax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{cart.shipping === 0 ? 'Free' : formatPrice(cart.shipping)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-between">
          <Link
            href="/cart"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Cart
          </Link>
          
          <button
            onClick={onNext}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Continue to Shipping
          </button>
        </div>
      </div>
    </div>
  );
} 