'use client';

import { useState } from 'react';
import { ProductFilters as ProductFiltersType } from '@/types/product';

interface ProductFiltersProps {
  filters: ProductFiltersType;
  onFilterChange: (filters: Partial<ProductFiltersType>) => void;
}

export default function ProductFilters({ filters, onFilterChange }: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || 0,
    max: filters.maxPrice || 500,
  });

  const materials = [
    { value: 'organic_cotton', label: 'Organic Cotton' },
    { value: 'bamboo', label: 'Bamboo' },
    { value: 'bamboo_blend', label: 'Bamboo Blend' },
    { value: 'recycled_polyester', label: 'Recycled Polyester' },
  ];

  const handlePriceChange = (type: 'min' | 'max', value: number) => {
    const newRange = { ...priceRange, [type]: value };
    setPriceRange(newRange);
    
    // Apply price filter with a small delay to avoid too many API calls
    setTimeout(() => {
      onFilterChange({
        minPrice: newRange.min > 0 ? newRange.min : undefined,
        maxPrice: newRange.max < 500 ? newRange.max : undefined,
      });
    }, 500);
  };

  const handleMaterialChange = (material: string) => {
    onFilterChange({ material });
  };

  const handleOrganicChange = (organicCertified: boolean) => {
    onFilterChange({ organicCertified });
  };

  const handleFeaturedChange = (featured: boolean) => {
    onFilterChange({ featured });
  };

  const clearFilters = () => {
    onFilterChange({
      minPrice: undefined,
      maxPrice: undefined,
      material: undefined,
      organicCertified: undefined,
      featured: undefined,
    });
    setPriceRange({ min: 0, max: 500 });
  };

  const hasActiveFilters = filters.minPrice || filters.maxPrice || filters.material || filters.organicCertified || filters.featured;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Min Price</label>
              <input
                type="number"
                min="0"
                max={priceRange.max}
                value={priceRange.min}
                onChange={(e) => handlePriceChange('min', Number(e.target.value))}
                className="input input-bordered input-sm w-full"
                placeholder="0"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Max Price</label>
              <input
                type="number"
                min={priceRange.min}
                max="1000"
                value={priceRange.max}
                onChange={(e) => handlePriceChange('max', Number(e.target.value))}
                className="input input-bordered input-sm w-full"
                placeholder="500"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            ${priceRange.min} - ${priceRange.max}
          </div>
        </div>
      </div>

      {/* Material Filter */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Material</h4>
        <div className="space-y-2">
          {materials.map((material) => (
            <label key={material.value} className="flex items-center">
              <input
                type="radio"
                name="material"
                value={material.value}
                checked={filters.material === material.value}
                onChange={() => handleMaterialChange(material.value)}
                className="radio radio-primary radio-sm"
              />
              <span className="ml-2 text-sm text-gray-700">{material.label}</span>
            </label>
          ))}
          <label className="flex items-center">
            <input
              type="radio"
              name="material"
              value=""
              checked={!filters.material}
              onChange={() => handleMaterialChange('')}
              className="radio radio-primary radio-sm"
            />
            <span className="ml-2 text-sm text-gray-700">All Materials</span>
          </label>
        </div>
      </div>

      {/* Organic Certification */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Certification</h4>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.organicCertified || false}
            onChange={(e) => handleOrganicChange(e.target.checked)}
            className="checkbox checkbox-primary checkbox-sm"
          />
          <span className="ml-2 text-sm text-gray-700">Organic Certified Only</span>
        </label>
      </div>

      {/* Featured Products */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Product Type</h4>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.featured || false}
            onChange={(e) => handleFeaturedChange(e.target.checked)}
            className="checkbox checkbox-primary checkbox-sm"
          />
          <span className="ml-2 text-sm text-gray-700">Featured Products Only</span>
        </label>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Active Filters</h4>
          <div className="space-y-1">
            {filters.minPrice && (
              <div className="text-xs text-gray-600">
                Min Price: ${filters.minPrice}
              </div>
            )}
            {filters.maxPrice && (
              <div className="text-xs text-gray-600">
                Max Price: ${filters.maxPrice}
              </div>
            )}
            {filters.material && (
              <div className="text-xs text-gray-600">
                Material: {materials.find(m => m.value === filters.material)?.label}
              </div>
            )}
            {filters.organicCertified && (
              <div className="text-xs text-gray-600">
                Organic Certified Only
              </div>
            )}
            {filters.featured && (
              <div className="text-xs text-gray-600">
                Featured Products Only
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 