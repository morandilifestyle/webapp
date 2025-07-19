import express from 'express';
import { supabase } from '../index';

const router = express.Router();

// Get all products with advanced filtering and search
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      subcategory,
      search, 
      sort = 'created_at',
      minPrice,
      maxPrice,
      material,
      organicCertified,
      featured
    } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('products')
      .select(`
        *,
        product_categories!inner(name, slug, parent_id)
      `)
      .eq('is_active', true);

    // Apply category filter
    if (category) {
      query = query.eq('product_categories.slug', category);
    }

    // Apply subcategory filter
    if (subcategory) {
      query = query.eq('product_categories.slug', subcategory);
    }

    // Apply price range filter
    if (minPrice) {
      query = query.gte('price', Number(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', Number(maxPrice));
    }

    // Apply material filter
    if (material) {
      query = query.contains('attributes', { material: material });
    }

    // Apply organic certification filter
    if (organicCertified === 'true') {
      query = query.contains('attributes', { organic_certified: true });
    }

    // Apply featured filter
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // Apply full-text search
    if (search) {
      query = query.textSearch('search_vector', search as string, {
        type: 'websearch',
        config: 'english'
      });
    }

    // Apply sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      case 'popularity':
        // For now, sort by created_at. In a real app, you'd track views/sales
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(name, slug, description)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get products by category
router.get('/category/:categorySlug', async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 12, sort = 'created_at', subcategory } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('products')
      .select(`
        *,
        product_categories!inner(name, slug, parent_id)
      `)
      .eq('is_active', true);

    // If it's a main category, get all products in that category and subcategories
    const { data: category } = await supabase
      .from('product_categories')
      .select('id, parent_id')
      .eq('slug', categorySlug)
      .single();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.parent_id) {
      // Subcategory - get products directly
      query = query.eq('category_id', category.id);
    } else {
      // Main category - get products from this category and all its subcategories
      const { data: subcategories } = await supabase
        .from('product_categories')
        .select('id')
        .eq('parent_id', category.id);

      const categoryIds = [category.id, ...(subcategories?.map(c => c.id) || [])];
      query = query.in('category_id', categoryIds);
    }

    // Apply sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('name', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    res.json({
      products,
      category: categorySlug,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Category products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(name, slug)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch featured products' });
    }

    res.json({ products });
  } catch (error) {
    console.error('Featured products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get related products
router.get('/related/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // First get the current product to find its category
    const { data: currentProduct } = await supabase
      .from('products')
      .select('category_id')
      .eq('id', productId)
      .single();

    if (!currentProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get related products from the same category
    const { data: relatedProducts, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories(name, slug)
      `)
      .eq('category_id', currentProduct.category_id)
      .eq('is_active', true)
      .neq('id', productId)
      .order('created_at', { ascending: false })
      .limit(4);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch related products' });
    }

    res.json({ products: relatedProducts });
  } catch (error) {
    console.error('Related products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search products with suggestions
router.get('/search/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || (q as string).length < 2) {
      return res.json({ suggestions: [] });
    }

    const { data: suggestions, error } = await supabase
      .from('products')
      .select('name, slug, short_description')
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,short_description.ilike.%${q}%`)
      .limit(5);

    if (error) {
      console.error('Search suggestions error:', error);
      return res.status(500).json({ error: 'Failed to fetch suggestions' });
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 