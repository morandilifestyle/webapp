'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Product, ProductCategory, ProductFilters } from '@/types/product';
import { productsAPI } from '@/lib/api/products';
import ProductCard from '@/components/products/ProductCard';
import ProductFiltersComponent from '@/components/products/ProductFilters';
import ProductSearch from '@/components/products/ProductSearch';
import CategoryNavigation from '@/components/products/CategoryNavigation';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  // Get filters from URL
  const getFiltersFromURL = (): ProductFilters => {
    return {
      category: searchParams.get('category') || undefined,
      subcategory: searchParams.get('subcategory') || undefined,
      search: searchParams.get('search') || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      material: searchParams.get('material') || undefined,
      organicCertified: searchParams.get('organicCertified') === 'true',
      featured: searchParams.get('featured') === 'true',
      sort: (searchParams.get('sort') as any) || 'created_at',
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: 12,
    };
  };

  // Update URL with filters
  const updateURL = (filters: ProductFilters) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });

    router.push(`/products?${params.toString()}`);
  };

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = getFiltersFromURL();
      const response = await productsAPI.getProducts(filters);
      
      setProducts(response.products);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to load products. Please try again.');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.categories);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    const currentFilters = getFiltersFromURL();
    const updatedFilters = { ...currentFilters, ...newFilters, page: 1 };
    updateURL(updatedFilters);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    const currentFilters = getFiltersFromURL();
    const updatedFilters = { ...currentFilters, page };
    updateURL(updatedFilters);
  };

  // Load data on mount and when URL changes
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadProducts}
              className="btn btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sustainable Textiles
          </h1>
          <p className="text-gray-600">
            Discover our premium collection of eco-friendly and organic textiles
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-8">
              {/* Search */}
              <div className="mb-6">
                <ProductSearch
                  initialValue={getFiltersFromURL().search || ''}
                  onSearch={(search) => handleFilterChange({ search })}
                />
              </div>

              {/* Category Navigation */}
              <div className="mb-6">
                <CategoryNavigation
                  categories={categories}
                  selectedCategory={getFiltersFromURL().category}
                  selectedSubcategory={getFiltersFromURL().subcategory}
                  onCategorySelect={(category, subcategory) => 
                    handleFilterChange({ category, subcategory })
                  }
                />
              </div>

              {/* Filters */}
              <ProductFiltersComponent
                filters={getFiltersFromURL()}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {(pagination?.total ?? 0) > 0 
                    ? `${pagination?.total ?? 0} products found`
                    : 'No products found'
                  }
                </h2>
                {getFiltersFromURL().search && (
                  <p className="text-gray-600 mt-1">
                    Search results for "{getFiltersFromURL().search}"
                  </p>
                )}
              </div>

              {/* Sort */}
              <div className="mt-4 sm:mt-0">
                <select
                  value={getFiltersFromURL().sort}
                  onChange={(e) => handleFilterChange({ sort: e.target.value as any })}
                  className="select select-bordered w-full sm:w-auto"
                >
                  <option value="created_at">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                  <option value="name_desc">Name: Z to A</option>
                  <option value="popularity">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {(pagination?.totalPages ?? 0) > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={pagination?.page ?? 1}
                      totalPages={pagination?.totalPages ?? 1}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <button
                  onClick={() => {
                    router.push('/products');
                  }}
                  className="btn btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProductsPageContent />
    </Suspense>
  );
} 