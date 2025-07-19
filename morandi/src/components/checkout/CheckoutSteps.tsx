import { CheckoutStep } from '@/app/checkout/page';

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
}

const steps = [
  { id: 'cart', name: 'Cart Review', description: 'Review your items' },
  { id: 'shipping', name: 'Shipping', description: 'Delivery information' },
  { id: 'payment', name: 'Payment', description: 'Payment method' },
  { id: 'confirmation', name: 'Confirmation', description: 'Order complete' },
];

export default function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="mb-8">
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((step, stepIdx) => (
            <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} flex-1`}>
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className={`h-0.5 w-full ${stepIdx < currentIndex ? 'bg-blue-600' : 'bg-gray-200'}`} />
              </div>
              <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                stepIdx < currentIndex 
                  ? 'bg-blue-600 hover:bg-blue-900' 
                  : stepIdx === currentIndex 
                  ? 'bg-blue-600 ring-2 ring-blue-600 ring-offset-2' 
                  : 'bg-white border-2 border-gray-300 group-hover:border-gray-400'
              }`}>
                {stepIdx < currentIndex ? (
                  <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className={`text-sm font-medium ${
                    stepIdx === currentIndex ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {stepIdx + 1}
                  </span>
                )}
              </div>
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
                <span className={`text-xs font-medium ${
                  stepIdx <= currentIndex ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
} 