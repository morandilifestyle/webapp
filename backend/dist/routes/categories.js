"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const index_1 = require("../index");
const router = express_1.default.Router();
router.get('/', async (req, res) => {
    try {
        const { data: categories, error } = await index_1.supabase
            .from('product_categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('name', { ascending: true });
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
        const mainCategories = categories?.filter(cat => !cat.parent_id) || [];
        const subCategories = categories?.filter(cat => cat.parent_id) || [];
        const categoriesWithSubs = mainCategories.map(mainCat => ({
            ...mainCat,
            subcategories: subCategories.filter(subCat => subCat.parent_id === mainCat.id)
        }));
        res.json({ categories: categoriesWithSubs });
    }
    catch (error) {
        console.error('Categories error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { data: category, error } = await index_1.supabase
            .from('product_categories')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .single();
        if (error || !category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        let subcategories = [];
        if (!category.parent_id) {
            const { data: subs } = await index_1.supabase
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
    }
    catch (error) {
        console.error('Category error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/:slug/products', async (req, res) => {
    try {
        const { slug } = req.params;
        const { page = 1, limit = 12, sort = 'created_at' } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const { data: category } = await index_1.supabase
            .from('product_categories')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .single();
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        let query = index_1.supabase
            .from('products')
            .select(`
        *,
        product_categories(name, slug)
      `)
            .eq('is_active', true);
        if (category.parent_id) {
            query = query.eq('category_id', category.id);
        }
        else {
            const { data: subcategories } = await index_1.supabase
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
    }
    catch (error) {
        console.error('Category products error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=categories.js.map