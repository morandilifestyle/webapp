"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supabase_js_1 = require("@supabase/supabase-js");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const { data: wishlistItems, error: wishlistError } = await supabase
            .from('wishlists')
            .select(`
        id,
        added_at,
        products (
          id,
          name,
          slug,
          description,
          short_description,
          price,
          sale_price,
          images,
          is_active,
          stock_quantity,
          category_id,
          product_categories (
            id,
            name,
            slug
          )
        )
      `)
            .eq('user_id', userId)
            .order('added_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (wishlistError) {
            console.error('Error fetching wishlist:', wishlistError);
            return res.status(500).json({ error: 'Failed to fetch wishlist' });
        }
        const { count, error: countError } = await supabase
            .from('wishlists')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        if (countError) {
            console.error('Error counting wishlist items:', countError);
            return res.status(500).json({ error: 'Failed to count wishlist items' });
        }
        const transformedItems = wishlistItems?.map((item) => ({
            id: item.id,
            userId,
            productId: item.products.id,
            product: {
                id: item.products.id,
                name: item.products.name,
                slug: item.products.slug,
                description: item.products.description,
                shortDescription: item.products.short_description,
                price: item.products.price,
                salePrice: item.products.sale_price,
                images: item.products.images || [],
                isActive: item.products.is_active,
                stockQuantity: item.products.stock_quantity,
                categoryId: item.products.category_id,
                category: {
                    id: item.products.product_categories.id,
                    name: item.products.product_categories.name,
                    slug: item.products.product_categories.slug,
                },
            },
            addedAt: item.added_at,
        })) || [];
        res.json({
            items: transformedItems,
            totalCount: count || 0,
        });
    }
    catch (error) {
        console.error('Error in wishlist GET:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/items', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, is_active')
            .eq('id', productId)
            .eq('is_active', true)
            .single();
        if (productError || !product) {
            return res.status(404).json({ error: 'Product not found or inactive' });
        }
        const { data: existingItem, error: checkError } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();
        if (existingItem) {
            return res.status(409).json({ error: 'Product already in wishlist' });
        }
        const { error: insertError } = await supabase
            .from('wishlists')
            .insert({
            user_id: userId,
            product_id: productId,
        });
        if (insertError) {
            console.error('Error adding to wishlist:', insertError);
            return res.status(500).json({ error: 'Failed to add to wishlist' });
        }
        res.json({ success: true, message: 'Added to wishlist successfully' });
    }
    catch (error) {
        console.error('Error in wishlist POST:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/items', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        const { error } = await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);
        if (error) {
            console.error('Error removing from wishlist:', error);
            return res.status(500).json({ error: 'Failed to remove from wishlist' });
        }
        res.json({ success: true, message: 'Removed from wishlist successfully' });
    }
    catch (error) {
        console.error('Error in wishlist DELETE:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/items/move', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { productId, quantity = 1 } = req.body;
        if (!productId) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        const { data: wishlistItem, error: wishlistError } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();
        if (wishlistError || !wishlistItem) {
            return res.status(404).json({ error: 'Product not found in wishlist' });
        }
        const { data: cartItem, error: cartCheckError } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();
        if (cartItem) {
            const { error: updateError } = await supabase
                .from('cart_items')
                .update({ quantity: cartItem.quantity + quantity })
                .eq('id', cartItem.id);
            if (updateError) {
                console.error('Error updating cart quantity:', updateError);
                return res.status(500).json({ error: 'Failed to update cart' });
            }
        }
        else {
            const { error: insertError } = await supabase
                .from('cart_items')
                .insert({
                user_id: userId,
                product_id: productId,
                quantity,
            });
            if (insertError) {
                console.error('Error adding to cart:', insertError);
                return res.status(500).json({ error: 'Failed to add to cart' });
            }
        }
        const { error: deleteError } = await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId);
        if (deleteError) {
            console.error('Error removing from wishlist:', deleteError);
            return res.status(500).json({ error: 'Failed to remove from wishlist' });
        }
        res.json({ success: true, message: 'Moved to cart successfully' });
    }
    catch (error) {
        console.error('Error in wishlist move:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/check/:productId', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { productId } = req.params;
        const { data, error } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userId)
            .eq('product_id', productId)
            .single();
        res.json({ isInWishlist: !!data });
    }
    catch (error) {
        console.error('Error checking wishlist status:', error);
        res.json({ isInWishlist: false });
    }
});
router.get('/count', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { count, error } = await supabase
            .from('wishlists')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
        if (error) {
            console.error('Error counting wishlist items:', error);
            return res.status(500).json({ error: 'Failed to count wishlist items' });
        }
        res.json({ count: count || 0 });
    }
    catch (error) {
        console.error('Error in wishlist count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/clear', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const { error } = await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', userId);
        if (error) {
            console.error('Error clearing wishlist:', error);
            return res.status(500).json({ error: 'Failed to clear wishlist' });
        }
        res.json({ success: true, message: 'Wishlist cleared successfully' });
    }
    catch (error) {
        console.error('Error in wishlist clear:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=wishlist.js.map