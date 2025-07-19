'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types/product';
import AddToCartButton from '@/components/ui/AddToCartButton';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const mainImage = product.images?.[0] || '/images/placeholder-product.jpg';
  const secondaryImage = product.images?.[1] || mainImage;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getDiscountPercentage = () => {
    if (!product.sale_price || product.sale_price >= product.price) return null;
    return Math.round(((product.price - product.sale_price) / product.price) * 100);
  };

  const isOrganic = product.attributes?.organic_certified;
  const discountPercentage = getDiscountPercentage();

  return (
    <div
      className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`}>
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {!imageError ? (
            <>
              <Image
                src={isHovered && secondaryImage !== mainImage ? secondaryImage : mainImage}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isOrganic && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Organic
              </span>
            )}
            {discountPercentage && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                -{discountPercentage}%
              </span>
            )}
            {product.is_featured && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Featured
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Add to wishlist functionality
              }}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Category */}
          {product.product_categories && (
            <p className="text-xs text-gray-500 mb-1">
              {product.product_categories.name}
            </p>
          )}

          {/* Title */}
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* Short Description */}
          {product.short_description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.short_description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            {product.sale_price && product.sale_price < product.price ? (
              <>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(product.sale_price)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Attributes */}
          <div className="flex flex-wrap gap-1 mb-3">
            {product.attributes?.material && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {product.attributes.material.replace('_', ' ')}
              </span>
            )}
            {product.attributes?.color && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {product.attributes.color}
              </span>
            )}
            {product.attributes?.size && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {product.attributes.size}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {product.stock_quantity > 0 ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">
                    {product.stock_quantity > product.low_stock_threshold 
                      ? 'In Stock' 
                      : `Only ${product.stock_quantity} left`
                    }
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Out of Stock</span>
                </>
              )}
            </div>

            {/* Add to Cart Button */}
            <AddToCartButton product={product} variant="compact" />
          </div>
        </div>
      </Link>
    </div>
  );
} 