'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { blogApi, blogUtils } from '@/lib/api/blog';
import { BlogPost, BlogCategory, BlogFilters } from '@/types/blog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BlogFilters>({
    status: 'published',
    page: 1,
    limit: 12,
    sortBy: 'published_at',
    sortOrder: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadBlogData();
  }, [filters]);

  const loadBlogData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories
      const categoriesData = await blogApi.getCategories();
      setCategories(categoriesData);

      // Load posts with filters
      const postsData = await blogApi.getPosts(filters);
      setPosts(postsData);
    } catch (err) {
      setError('Failed to load blog posts');
      console.error('Error loading blog data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      page: 1
    }));
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setFilters(prev => ({
      ...prev,
      categoryId: categoryId || undefined,
      page: 1
    }));
  };

  const handleLoadMore = () => {
    setFilters(prev => ({
      ...prev,
      page: (prev.page || 1) + 1
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setFilters({
      status: 'published',
      page: 1,
      limit: 12,
      sortBy: 'published_at',
      sortOrder: 'desc'
    });
  };

  if (loading && posts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Blog</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadBlogData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Morandi Blog
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Discover sustainable living tips, wellness insights, and stories from our community
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 text-gray-900"
                />
                <Button onClick={handleSearch} className="bg-white text-green-600 hover:bg-gray-100">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedCategory === '' ? 'default' : 'outline'}
              onClick={() => handleCategoryFilter('')}
              size="sm"
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                onClick={() => handleCategoryFilter(category.id)}
                size="sm"
              >
                {category.name}
              </Button>
            ))}
          </div>
          
          {(searchTerm || selectedCategory) && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary">
                  Search: {searchTerm}
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary">
                  Category: {categories.find(c => c.id === selectedCategory)?.name}
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Featured Posts */}
        {posts.filter(post => post.isFeatured).length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Featured Posts</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {posts.filter(post => post.isFeatured).slice(0, 2).map((post) => (
                <FeaturedPostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {/* All Posts */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {searchTerm ? `Search Results for "${searchTerm}"` : 'Latest Articles'}
          </h2>
          
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Check back soon for new content'}
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          {/* Load More Button */}
          {posts.length >= (filters.limit || 12) && (
            <div className="text-center mt-12">
              <Button 
                onClick={handleLoadMore}
                disabled={loading}
                variant="outline"
                size="lg"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Load More Posts'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Featured Post Card Component
function FeaturedPostCard({ post }: { post: BlogPost }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {post.featuredImage && (
        <div className="relative h-64">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          {post.categories?.map((category) => (
            <Badge key={category.id} variant="secondary" className="text-xs">
              {category.name}
            </Badge>
          ))}
        </div>
        <CardTitle className="text-xl">
          <Link href={`/blog/${post.slug}`} className="hover:text-green-600 transition-colors">
            {post.title}
          </Link>
        </CardTitle>
        <p className="text-gray-600 text-sm">
          {blogUtils.formatDate(post.publishedAt || post.createdAt)} • {blogUtils.formatReadingTime(post.readingTime)}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4">
          {post.excerpt || blogUtils.truncateText(post.content, 150)}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{post.viewCount} views</span>
            <span>{post.commentCount} comments</span>
          </div>
          <Link href={`/blog/${post.slug}`}>
            <Button variant="outline" size="sm">
              Read More
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Regular Blog Post Card Component
function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {post.featuredImage && (
        <div className="relative h-48">
          <Image
            src={post.featuredImage}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          {post.categories?.slice(0, 2).map((category) => (
            <Badge key={category.id} variant="secondary" className="text-xs">
              {category.name}
            </Badge>
          ))}
        </div>
        <CardTitle className="text-lg">
          <Link href={`/blog/${post.slug}`} className="hover:text-green-600 transition-colors">
            {post.title}
          </Link>
        </CardTitle>
        <p className="text-gray-600 text-sm">
          {blogUtils.formatDate(post.publishedAt || post.createdAt)} • {blogUtils.formatReadingTime(post.readingTime)}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-4">
          {post.excerpt || blogUtils.truncateText(post.content, 120)}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{post.viewCount} views</span>
            <span>{post.commentCount} comments</span>
          </div>
          <Link href={`/blog/${post.slug}`}>
            <Button variant="outline" size="sm">
              Read More
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
} 