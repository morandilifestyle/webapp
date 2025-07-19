"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const uuid_1 = require("uuid");
const router = express_1.default.Router();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const getSessionId = (req, res) => {
    let sessionId = req.cookies?.sessionId;
    if (!sessionId) {
        sessionId = (0, uuid_1.v4)();
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
    }
    return sessionId;
};
const getUserId = (req) => {
    return null;
};
const calculateCartTotals = (items) => {
    const subtotal = items.reduce((sum, item) => {
        const price = item.product.sale_price || item.product.price;
        return sum + (price * item.quantity);
    }, 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + tax + shipping;
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { subtotal, tax, shipping, total, itemCount };
};
const getCartItems = async (sessionId, userId) => {
    if (userId) {
        const result = await pool.query(`
      SELECT 
        uci.id,
        uci.product_id,
        uci.quantity,
        uci.added_at,
        uci.updated_at,
        p.name,
        p.slug,
        p.price,
        p.sale_price,
        p.stock_quantity,
        p.images,
        p.attributes
      FROM user_cart_items uci
      JOIN products p ON uci.product_id = p.id
      WHERE uci.user_id = $1
      ORDER BY uci.added_at DESC
    `, [userId]);
        return result.rows;
    }
    else {
        const result = await pool.query(`
      SELECT 
        gci.id,
        gci.product_id,
        gci.quantity,
        gci.added_at,
        gci.updated_at,
        p.name,
        p.slug,
        p.price,
        p.sale_price,
        p.stock_quantity,
        p.images,
        p.attributes
      FROM guest_cart_items gci
      JOIN products p ON gci.product_id = p.id
      WHERE gci.session_id = $1
      ORDER BY gci.added_at DESC
    `, [sessionId]);
        return result.rows;
    }
};
const transformCartItems = (items) => {
    return items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        added_at: item.added_at,
        updated_at: item.updated_at,
        product: {
            id: item.product_id,
            name: item.name,
            slug: item.slug,
            price: parseFloat(item.price),
            sale_price: item.sale_price ? parseFloat(item.sale_price) : null,
            stock_quantity: item.stock_quantity,
            images: item.images || [],
            attributes: item.attributes || {},
        }
    }));
};
router.get('/', async (req, res) => {
    try {
        const sessionId = getSessionId(req, res);
        const userId = getUserId(req);
        const items = await getCartItems(sessionId, userId);
        const transformedItems = transformCartItems(items);
        const totals = calculateCartTotals(transformedItems);
        res.json({
            items: transformedItems,
            ...totals
        });
    }
    catch (error) {
        console.error('Error getting cart:', error);
        res.status(500).json({ message: 'Failed to get cart' });
    }
});
router.get('/count', async (req, res) => {
    try {
        const sessionId = getSessionId(req, res);
        const userId = getUserId(req);
        let count = 0;
        if (userId) {
            const result = await pool.query(`
        SELECT SUM(quantity) as count
        FROM user_cart_items
        WHERE user_id = $1
      `, [userId]);
            count = parseInt(result.rows[0]?.count || '0');
        }
        else {
            const result = await pool.query(`
        SELECT SUM(quantity) as count
        FROM guest_cart_items
        WHERE session_id = $1
      `, [sessionId]);
            count = parseInt(result.rows[0]?.count || '0');
        }
        res.json({ count });
    }
    catch (error) {
        console.error('Error getting cart count:', error);
        res.status(500).json({ message: 'Failed to get cart count' });
    }
});
router.post('/items', async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const sessionId = getSessionId(req, res);
        const userId = getUserId(req);
        if (!productId || !quantity || quantity < 1 || quantity > 99) {
            return res.status(400).json({ message: 'Invalid product ID or quantity' });
        }
        const productResult = await pool.query(`
      SELECT id, stock_quantity, price, sale_price
      FROM products
      WHERE id = $1 AND is_active = true
    `, [productId]);
        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const product = productResult.rows[0];
        if (product.stock_quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
        }
        if (userId) {
            await pool.query(`
        INSERT INTO user_cart_items (user_id, product_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, product_id)
        DO UPDATE SET 
          quantity = user_cart_items.quantity + $3,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, productId, quantity]);
        }
        else {
            await pool.query(`
        INSERT INTO guest_cart_items (session_id, product_id, quantity)
        VALUES ($1, $2, $3)
        ON CONFLICT (session_id, product_id)
        DO UPDATE SET 
          quantity = guest_cart_items.quantity + $3,
          updated_at = CURRENT_TIMESTAMP
      `, [sessionId, productId, quantity]);
        }
        const items = await getCartItems(sessionId, userId);
        const transformedItems = transformCartItems(items);
        const totals = calculateCartTotals(transformedItems);
        res.json({
            items: transformedItems,
            ...totals
        });
    }
    catch (error) {
        console.error('Error adding item to cart:', error);
        res.status(500).json({ message: 'Failed to add item to cart' });
    }
});
router.put('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const sessionId = getSessionId(req, res);
        const userId = getUserId(req);
        if (!quantity || quantity < 1 || quantity > 99) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }
        if (userId) {
            const result = await pool.query(`
        UPDATE user_cart_items
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING id
      `, [quantity, id, userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Cart item not found' });
            }
        }
        else {
            const result = await pool.query(`
        UPDATE guest_cart_items
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND session_id = $3
        RETURNING id
      `, [quantity, id, sessionId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Cart item not found' });
            }
        }
        const items = await getCartItems(sessionId, userId);
        const transformedItems = transformCartItems(items);
        const totals = calculateCartTotals(transformedItems);
        res.json({
            items: transformedItems,
            ...totals
        });
    }
    catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({ message: 'Failed to update cart item' });
    }
});
router.delete('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sessionId = getSessionId(req, res);
        const userId = getUserId(req);
        if (userId) {
            const result = await pool.query(`
        DELETE FROM user_cart_items
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `, [id, userId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Cart item not found' });
            }
        }
        else {
            const result = await pool.query(`
        DELETE FROM guest_cart_items
        WHERE id = $1 AND session_id = $2
        RETURNING id
      `, [id, sessionId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ message: 'Cart item not found' });
            }
        }
        const items = await getCartItems(sessionId, userId);
        const transformedItems = transformCartItems(items);
        const totals = calculateCartTotals(transformedItems);
        res.json({
            items: transformedItems,
            ...totals
        });
    }
    catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).json({ message: 'Failed to remove cart item' });
    }
});
router.post('/clear', async (req, res) => {
    try {
        const sessionId = getSessionId(req, res);
        const userId = getUserId(req);
        if (userId) {
            await pool.query(`
        DELETE FROM user_cart_items
        WHERE user_id = $1
      `, [userId]);
        }
        else {
            await pool.query(`
        DELETE FROM guest_cart_items
        WHERE session_id = $1
      `, [sessionId]);
        }
        res.json({ message: 'Cart cleared successfully' });
    }
    catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ message: 'Failed to clear cart' });
    }
});
router.post('/merge', async (req, res) => {
    try {
        const sessionId = getSessionId(req, res);
        const userId = getUserId(req);
        if (!userId) {
            return res.status(401).json({ message: 'User must be authenticated' });
        }
        await pool.query(`
      SELECT merge_guest_cart_to_user($1, $2)
    `, [sessionId, userId]);
        const items = await getCartItems(sessionId, userId);
        const transformedItems = transformCartItems(items);
        const totals = calculateCartTotals(transformedItems);
        res.json({
            items: transformedItems,
            ...totals
        });
    }
    catch (error) {
        console.error('Error merging cart:', error);
        res.status(500).json({ message: 'Failed to merge cart' });
    }
});
exports.default = router;
//# sourceMappingURL=cart.js.map