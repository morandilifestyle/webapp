"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const uuid_1 = require("uuid");
const isTest = process.env.NODE_ENV === 'test';
const testProducts = isTest
    ? new Map([
        ['prod-1', { id: 'prod-1', price: 29.99, sale_price: null, stock_quantity: 5 }],
    ])
    : null;
const getTestCart = (sessionId) => {
    if (!global.mockDB.carts.has(sessionId))
        global.mockDB.carts.set(sessionId, []);
    return global.mockDB.carts.get(sessionId);
};
const saveTestCart = (sessionId, cart) => {
    global.mockDB.carts.set(sessionId, cart);
};
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
    const shipping = subtotal === 0 ? 0 : subtotal > 50 ? 0 : 5.99;
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
    if (isTest) {
        const sessionId = getSessionId(req, res);
        const cartItems = getTestCart(sessionId);
        const transformedItems = cartItems.map((ci) => {
            const product = testProducts.get(ci.productId);
            return {
                id: ci.id,
                product_id: product.id,
                quantity: ci.quantity,
                product: {
                    id: product.id,
                    name: 'Test Product',
                    slug: 'test-product',
                    price: product.price,
                    sale_price: product.sale_price,
                    stock_quantity: product.stock_quantity,
                    images: [],
                    attributes: {},
                },
            };
        });
        const totals = calculateCartTotals(transformedItems);
        return res.json({ items: transformedItems, ...totals });
    }
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
    if (isTest) {
        const sessionId = getSessionId(req, res);
        const cart = getTestCart(sessionId);
        const count = cart.reduce((sum, c) => sum + c.quantity, 0);
        return res.json({ count });
    }
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
    if (isTest) {
        const { productId, quantity } = req.body;
        const sessionId = getSessionId(req, res);
        if (!productId || !quantity || quantity < 1 || quantity > 99) {
            return res.status(400).json({ message: 'Invalid product ID or quantity' });
        }
        const product = testProducts.get(productId);
        if (!product)
            return res.status(404).json({ message: 'Product not found' });
        if (quantity > product.stock_quantity)
            return res.status(400).json({ message: 'Insufficient stock' });
        const cart = getTestCart(sessionId);
        const existing = cart.find((c) => c.productId === productId);
        if (existing)
            existing.quantity += quantity;
        else
            cart.push({ id: `ci_${Date.now()}`, productId, quantity });
        saveTestCart(sessionId, cart);
        return res.json({ items: cart });
    }
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
    if (isTest) {
        const { quantity } = req.body;
        if (!quantity || quantity < 1 || quantity > 99)
            return res.status(400).json({ message: 'Invalid quantity' });
        const sessionId = getSessionId(req, res);
        const cart = getTestCart(sessionId);
        const item = cart.find((c) => c.id === req.params.id);
        if (!item)
            return res.status(404).json({ message: 'Cart item not found' });
        const product = testProducts.get(item.productId);
        if (quantity > product.stock_quantity)
            return res.status(400).json({ message: 'Insufficient stock' });
        item.quantity = quantity;
        saveTestCart(sessionId, cart);
        return res.json({ items: cart });
    }
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
    if (isTest) {
        const sessionId = getSessionId(req, res);
        let cart = getTestCart(sessionId);
        const idx = cart.findIndex((c) => c.id === req.params.id);
        if (idx === -1)
            return res.status(404).json({ message: 'Cart item not found' });
        cart.splice(idx, 1);
        saveTestCart(sessionId, cart);
        return res.json({ items: cart });
    }
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
    if (isTest) {
        const sessionId = getSessionId(req, res);
        global.mockDB.carts.set(sessionId, []);
        return res.json({ message: 'Cart cleared successfully' });
    }
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
    if (isTest) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
});
exports.default = router;
//# sourceMappingURL=cart.js.map