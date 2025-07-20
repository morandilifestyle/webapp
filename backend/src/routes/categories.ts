import express from 'express';
import { supabase } from '../config/database';

const router = express.Router();

// Get all categories with hierarchy
router.get('/', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    // Organize categories into hierarchy
    const mainCategories = categories?.filter(cat => !cat.parent_id) || [];
    const subCategories = categories?.filter(cat => cat.parent_id) || [];

    const categoriesWithSubs = mainCategories.map(mainCat => ({
      ...mainCat,
      subcategories: subCategories.filter(subCat => subCat.parent_id === mainCat.id)
    }));

    res.json({ categories: categoriesWithSubs });
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single category by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: category, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get subcategories if this is a main category
    let subcategories = [];
    if (!category.parent_id) {
      const { data: subs } = await supabase
        .from('product_categories')
        .select('*')
        .eq('parent_id', category.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      subcategories = subs || [];
    }

    res.json({ 
      category: {
        ...category,
        subcategories
      }
    });
  } catch (error) {
    console.error('Category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get category with products
router.get('/:slug/products', async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12, sort = 'created_at' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Get the category
    const { data: category } = await supabase
      .from('product_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        product_categories(name, slug)
      `)
      .eq('is_active', true);

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
      return res.status(500).json({ error: 'Failed to fetch category products' });
    }

    res.json({
      category,
      products,
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

export default router; 