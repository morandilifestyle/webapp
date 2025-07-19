'use client';

import React, { useState, useEffect } from 'react';
import { Heart, HeartOff } from 'lucide-react';
import { WishlistAPI } from '@/lib/api/wishlist';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'lg' | 'default' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  showText?: boolean;
  onToggle?: (isInWishlist: boolean) => void;
}

export function WishlistButton({
  productId,
  className,
  size = 'default',
  variant = 'ghost',
  showText = false,
  onToggle,
}: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkWishlistStatus();
  }, [productId]);

  const checkWishlistStatus = async () => {
    try {
      setIsChecking(true);
      const response = await WishlistAPI.isInWishlist(productId);
      setIsInWishlist(response.isInWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const toggleWishlist = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      
      if (isInWishlist) {
        await WishlistAPI.removeFromWishlist({ productId });
        setIsInWishlist(false);
        onToggle?.(false);
      } else {
        await WishlistAPI.addToWishlist({ productId });
        setIsInWishlist(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      // Revert the state change on error
      setIsInWishlist(!isInWishlist);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-12 w-12',
    icon: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 16,
    default: 20,
    lg: 24,
    icon: 20,
  };

  if (isChecking) {
    return (
      <Button
        variant={variant}
        size={size}
        className={cn('animate-pulse', className)}
        disabled
      >
        <Heart className={cn('animate-pulse', sizeClasses[size])} />
        {showText && <span className="ml-2">Loading...</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'transition-all duration-200',
        isInWishlist && 'text-red-500 hover:text-red-600',
        className
      )}
      onClick={toggleWishlist}
      disabled={isLoading}
    >
      {isInWishlist ? (
        <HeartOff size={iconSizes[size]} className="fill-current" />
      ) : (
        <Heart size={iconSizes[size]} />
      )}
      {showText && (
        <span className="ml-2">
          {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        </span>
      )}
    </Button>
  );
} 