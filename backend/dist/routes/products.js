"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 12, category, subcategory, search, sort = 'created_at', minPrice, maxPrice, material, organicCertified, featured } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let query = database_1.supabase
            .from('products')
            .select(`
        *,
        product_categories!inner(name, slug, parent_id)
      `)
            .eq('is_active', true);
        if (category) {
            query = query.eq('product_categories.slug', category);
        }
        if (subcategory) {
            query = query.eq('product_categories.slug', subcategory);
        }
        if (minPrice) {
            query = query.gte('price', Number(minPrice));
        }
        if (maxPrice) {
            query = query.lte('price', Number(maxPrice));
        }
        if (material) {
            query = query.contains('attributes', { material: material });
        }
        if (organicCertified === 'true') {
            query = query.contains('attributes', { organic_certified: true });
        }
        if (featured === 'true') {
            query = query.eq('is_featured', true);
        }
        if (search) {
            query = query.textSearch('search_vector', search, {
                type: 'websearch',
                config: 'english'
            });
        }
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
                query = query.order('created_at', { ascending: false });
                break;
            default:
                query = query.order('created_at', { ascending: false });
        }
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
    }
    catch (error) {
        console.error('Products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { data: product, error } = await database_1.supabase
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
    }
    catch (error) {
        console.error('Product error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/category/:categorySlug', async (req, res) => {
    try {
        const { categorySlug } = req.params;
        const { page = 1, limit = 12, sort = 'created_at', subcategory } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let query = database_1.supabase
            .from('products')
            .select(`
        *,
        product_categories!inner(name, slug, parent_id)
      `)
            .eq('is_active', true);
        const { data: category } = await database_1.supabase
            .from('product_categories')
            .select('id, parent_id')
            .eq('slug', categorySlug)
            .single();
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        if (category.parent_id) {
            query = query.eq('category_id', category.id);
        }
        else {
            const { data: subcategories } = await database_1.supabase
                .from('product_categories')
                .select('id')
                .eq('parent_id', category.id);
            const categoryIds = [category.id, ...(subcategories?.map(c => c.id) || [])];
            query = query.in('category_id', categoryIds);
        }
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
    }
    catch (error) {
        console.error('Category products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/featured/list', async (req, res) => {
    try {
        const { data: products, error } = await database_1.supabase
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
    }
    catch (error) {
        console.error('Featured products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/related/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { data: currentProduct } = await database_1.supabase
            .from('products')
            .select('category_id')
            .eq('id', productId)
            .single();
        if (!currentProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const { data: relatedProducts, error } = await database_1.supabase
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
    }
    catch (error) {
        console.error('Related products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/search/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ suggestions: [] });
        }
        const { data: suggestions, error } = await database_1.supabase
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
    }
    catch (error) {
        console.error('Search suggestions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map