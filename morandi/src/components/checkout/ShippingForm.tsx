import { useState, useEffect } from 'react';
import { ShippingAddress } from '@/app/checkout/page';

interface ShippingFormProps {
  onNext: (shippingAddress: ShippingAddress, billingAddress: ShippingAddress, shippingMethodId: string) => void;
  onBack: () => void;
  initialData: {
    shipping_address: ShippingAddress | null;
    billing_address: ShippingAddress | null;
    shipping_method_id: string;
  };
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  base_rate: number;
  weight_rate: number;
  estimated_days: number;
}

export default function ShippingForm({ onNext, onBack, initialData }: ShippingFormProps) {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(initialData.shipping_method_id);
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(
    initialData.shipping_address || {
      first_name: '',
      last_name: '',
      company: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      phone: '',
    }
  );
  
  const [billingAddress, setBillingAddress] = useState<ShippingAddress>(
    initialData.billing_address || {
      first_name: '',
      last_name: '',
      company: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      phone: '',
    }
  );

  useEffect(() => {
    fetchShippingMethods();
  }, []);

  const fetchShippingMethods = async () => {
    try {
      const response = await fetch('/api/orders/shipping/methods');
      const result = await response.json();
      
      if (result.success) {
        setShippingMethods(result.data);
        if (!selectedShippingMethod && result.data.length > 0) {
          setSelectedShippingMethod(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch shipping methods:', error);
    }
  };

  const handleShippingAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value,
    }));
    
    if (useSameAddress) {
      setBillingAddress(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleBillingAddressChange = (field: keyof ShippingAddress, value: string) => {
    setBillingAddress(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedShippingMethod) {
      alert('Please select a shipping method');
      return;
    }
    
    // Validate required fields
    const requiredFields: (keyof ShippingAddress)[] = [
      'first_name', 'last_name', 'address_line_1', 'city', 'state', 'postal_code', 'phone'
    ];
    
    for (const field of requiredFields) {
      if (!shippingAddress[field]) {
        alert(`Please fill in the ${field.replace('_', ' ')} field`);
        return;
      }
    }
    
    if (!useSameAddress) {
      for (const field of requiredFields) {
        if (!billingAddress[field]) {
          alert(`Please fill in the billing ${field.replace('_', ' ')} field`);
          return;
        }
      }
    }
    
    onNext(shippingAddress, useSameAddress ? shippingAddress : billingAddress, selectedShippingMethod);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Shipping Information</h2>
        <p className="text-sm text-gray-600 mt-1">Enter your delivery and billing information</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {/* Shipping Methods */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Shipping Method</h3>
          <div className="space-y-3">
            {shippingMethods.map((method) => (
              <label key={method.id} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="shipping_method"
                  value={method.id}
                  checked={selectedShippingMethod === method.id}
                  onChange={(e) => setSelectedShippingMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">{method.name}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(method.base_rate)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{method.description}</p>
                  <p className="text-xs text-gray-400">Estimated delivery: {method.estimated_days} days</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Shipping Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                value={shippingAddress.first_name}
                onChange={(e) => handleShippingAddressChange('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={shippingAddress.last_name}
                onChange={(e) => handleShippingAddressChange('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={shippingAddress.company}
                onChange={(e) => handleShippingAddressChange('company', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                value={shippingAddress.phone}
                onChange={(e) => handleShippingAddressChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
              <input
                type="text"
                value={shippingAddress.address_line_1}
                onChange={(e) => handleShippingAddressChange('address_line_1', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                type="text"
                value={shippingAddress.address_line_2}
                onChange={(e) => handleShippingAddressChange('address_line_2', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(e) => handleShippingAddressChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <input
                type="text"
                value={shippingAddress.state}
                onChange={(e) => handleShippingAddressChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
              <input
                type="text"
                value={shippingAddress.postal_code}
                onChange={(e) => handleShippingAddressChange('postal_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={shippingAddress.country}
                onChange={(e) => handleShippingAddressChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Billing Address */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="same_address"
              checked={useSameAddress}
              onChange={(e) => setUseSameAddress(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="same_address" className="ml-2 text-sm font-medium text-gray-700">
              Use same address for billing
            </label>
          </div>

          {!useSameAddress && (
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-4">Billing Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={billingAddress.first_name}
                    onChange={(e) => handleBillingAddressChange('first_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!useSameAddress}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={billingAddress.last_name}
                    onChange={(e) => handleBillingAddressChange('last_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!useSameAddress}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={billingAddress.company}
                    onChange={(e) => handleBillingAddressChange('company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={billingAddress.phone}
                    onChange={(e) => handleBillingAddressChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!useSameAddress}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    value={billingAddress.address_line_1}
                    onChange={(e) => handleBillingAddressChange('address_line_1', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!useSameAddress}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={billingAddress.address_line_2}
                    onChange={(e) => handleBillingAddressChange('address_line_2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={billingAddress.city}
                    onChange={(e) => handleBillingAddressChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!useSameAddress}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={billingAddress.state}
                    onChange={(e) => handleBillingAddressChange('state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!useSameAddress}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                  <input
                    type="text"
                    value={billingAddress.postal_code}
                    onChange={(e) => handleBillingAddressChange('postal_code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!useSameAddress}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={billingAddress.country}
                    onChange={(e) => handleBillingAddressChange('country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>
          
          <button
            type="submit"
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  );
} 