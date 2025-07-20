import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// CSRF token management
let csrfToken: string | null = null;

export const getCSRFToken = (): string | null => {
  return csrfToken;
};

export const setCSRFToken = (token: string): void => {
  csrfToken = token;
};

export const clearCSRFToken = (): void => {
  csrfToken = null;
};

// Enhanced fetch with CSRF token
export const secureFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const headers = new Headers(options.headers);
  
  // Add CSRF token if available
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  
  // Add content type if not present
  if (!headers.get('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for session management
  });
  
  // Extract CSRF token from response headers
  const newCSRFToken = response.headers.get('X-CSRF-Token');
  if (newCSRFToken) {
    setCSRFToken(newCSRFToken);
  }
  
  return response;
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

export const validatePostalCode = (postalCode: string): boolean => {
  const postalCodeRegex = /^[0-9]{6}$/;
  return postalCodeRegex.test(postalCode);
};

// Address validation
export const validateShippingAddress = (address: {
  first_name: string;
  last_name: string;
  address_line_1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!address.first_name?.trim()) {
    errors.push('First name is required');
  }
  
  if (!address.last_name?.trim()) {
    errors.push('Last name is required');
  }
  
  if (!address.address_line_1?.trim()) {
    errors.push('Address line 1 is required');
  }
  
  if (!address.city?.trim()) {
    errors.push('City is required');
  }
  
  if (!address.state?.trim()) {
    errors.push('State is required');
  }
  
  if (!address.postal_code?.trim()) {
    errors.push('Postal code is required');
  } else if (!validatePostalCode(address.postal_code)) {
    errors.push('Invalid postal code format');
  }
  
  if (!address.country?.trim()) {
    errors.push('Country is required');
  }
  
  if (!address.phone?.trim()) {
    errors.push('Phone number is required');
  } else if (!validatePhone(address.phone)) {
    errors.push('Invalid phone number format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Price formatting
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
};

// Error handling
export const handleApiError = (error: any): string => {
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Security utilities
export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '');
};

export const generateNonce = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}; 