'use client';

import { useState } from 'react';
import { ProductCategory } from '@/types/product';

interface CategoryNavigationProps {
  categories: ProductCategory[];
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategorySelect: (category?: string, subcategory?: string) => void;
}

export default function CategoryNavigation({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
}: CategoryNavigationProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categorySlug: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categorySlug)) {
      newExpanded.delete(categorySlug);
    } else {
      newExpanded.add(categorySlug);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryClick = (category: ProductCategory, isSubcategory = false) => {
    if (isSubcategory) {
      onCategorySelect(category.parent_id ? categories.find(c => c.id === category.parent_id)?.slug : undefined, category.slug);
    } else {
      onCategorySelect(category.slug, undefined);
    }
  };

  const isCategorySelected = (category: ProductCategory) => {
    return selectedCategory === category.slug;
  };

  const isSubcategorySelected = (subcategory: ProductCategory) => {
    return selectedSubcategory === subcategory.slug;
  };

  const getSubcategories = (categoryId: string) => {
    return categories.filter(cat => cat.parent_id === categoryId);
  };

  const mainCategories = categories.filter(cat => !cat.parent_id);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
      
      <div className="space-y-1">
        {/* All Products */}
        <button
          onClick={() => onCategorySelect(undefined, undefined)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            !selectedCategory && !selectedSubcategory
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          All Products
        </button>

        {/* Main Categories */}
        {mainCategories.map((category) => {
          const subcategories = getSubcategories(category.id);
          const isExpanded = expandedCategories.has(category.slug);
          const isSelected = isCategorySelected(category);
          const hasSelectedSubcategory = subcategories.some(sub => isSubcategorySelected(sub));

          return (
            <div key={category.id}>
              <button
                onClick={() => {
                  if (subcategories.length > 0) {
                    toggleCategory(category.slug);
                  } else {
                    handleCategoryClick(category);
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
                  isSelected || hasSelectedSubcategory
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{category.name}</span>
                {subcategories.length > 0 && (
                  <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>

              {/* Subcategories */}
              {subcategories.length > 0 && isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {subcategories.map((subcategory) => (
                    <button
                      key={subcategory.id}
                      onClick={() => handleCategoryClick(subcategory, true)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        isSubcategorySelected(subcategory)
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {subcategory.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Category Info */}
      {selectedCategory && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 mb-2">Currently viewing:</div>
          <div className="text-sm font-medium text-gray-900">
            {categories.find(c => c.slug === selectedCategory)?.name}
            {selectedSubcategory && (
              <>
                {' > '}
                {categories.find(c => c.slug === selectedSubcategory)?.name}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 