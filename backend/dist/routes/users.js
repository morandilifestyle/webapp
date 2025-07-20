"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const router = express_1.default.Router();
router.get('/profile', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { data: user, error } = await database_1.supabase
            .from('users')
            .select('id, email, first_name, last_name, phone, created_at')
            .eq('id', userId)
            .single();
        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/profile', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        const { firstName, lastName, phone } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { data: user, error } = await database_1.supabase
            .from('users')
            .update({
            first_name: firstName,
            last_name: lastName,
            phone,
        })
            .eq('id', userId)
            .select('id, email, first_name, last_name, phone, created_at')
            .single();
        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            message: 'Profile updated successfully',
            user,
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/addresses', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { data: addresses, error } = await database_1.supabase
            .from('user_addresses')
            .select('*')
            .eq('user_id', userId)
            .order('is_default', { ascending: false });
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Failed to fetch addresses' });
        }
        res.json({ addresses });
    }
    catch (error) {
        console.error('Addresses error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/addresses', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        const { addressType, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (isDefault) {
            await database_1.supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', userId)
                .eq('address_type', addressType);
        }
        const { data: address, error } = await database_1.supabase
            .from('user_addresses')
            .insert({
            user_id: userId,
            address_type: addressType,
            address_line1: addressLine1,
            address_line2: addressLine2,
            city,
            state,
            postal_code: postalCode,
            country: country || 'India',
            is_default: isDefault || false,
        })
            .select()
            .single();
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Failed to add address' });
        }
        res.status(201).json({
            message: 'Address added successfully',
            address,
        });
    }
    catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.put('/addresses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.headers['user-id'];
        const { addressType, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (isDefault) {
            await database_1.supabase
                .from('user_addresses')
                .update({ is_default: false })
                .eq('user_id', userId)
                .eq('address_type', addressType)
                .neq('id', id);
        }
        const { data: address, error } = await database_1.supabase
            .from('user_addresses')
            .update({
            address_type: addressType,
            address_line1: addressLine1,
            address_line2: addressLine2,
            city,
            state,
            postal_code: postalCode,
            country: country || 'India',
            is_default: isDefault || false,
        })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();
        if (error || !address) {
            return res.status(404).json({ error: 'Address not found' });
        }
        res.json({
            message: 'Address updated successfully',
            address,
        });
    }
    catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.delete('/addresses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        const { error } = await database_1.supabase
            .from('user_addresses')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ error: 'Failed to delete address' });
        }
        res.json({ message: 'Address deleted successfully' });
    }
    catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map