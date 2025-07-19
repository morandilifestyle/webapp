-- Cart items for guest users (session-based)
CREATE TABLE guest_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, product_id)
);

-- Cart items for registered users
CREATE TABLE user_cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 99),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Cart sessions for tracking
CREATE TABLE cart_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_guest_cart_items_session_id ON guest_cart_items(session_id);
CREATE INDEX idx_guest_cart_items_product_id ON guest_cart_items(product_id);
CREATE INDEX idx_user_cart_items_user_id ON user_cart_items(user_id);
CREATE INDEX idx_user_cart_items_product_id ON user_cart_items(product_id);
CREATE INDEX idx_cart_sessions_session_id ON cart_sessions(session_id);
CREATE INDEX idx_cart_sessions_user_id ON cart_sessions(user_id);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_guest_cart_items_updated_at 
    BEFORE UPDATE ON guest_cart_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_cart_items_updated_at 
    BEFORE UPDATE ON user_cart_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_sessions_updated_at 
    BEFORE UPDATE ON cart_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for security
ALTER TABLE guest_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;

-- Guest cart items policies (session-based access)
CREATE POLICY "Guest cart items are accessible by session" ON guest_cart_items
    FOR ALL USING (session_id = current_setting('app.session_id', true));

-- User cart items policies (user-based access)
CREATE POLICY "Users can manage their own cart items" ON user_cart_items
    FOR ALL USING (auth.uid() = user_id);

-- Cart sessions policies
CREATE POLICY "Cart sessions are accessible by session or user" ON cart_sessions
    FOR ALL USING (
        session_id = current_setting('app.session_id', true) OR 
        auth.uid() = user_id
    );

-- Function to merge guest cart with user cart
CREATE OR REPLACE FUNCTION merge_guest_cart_to_user(
    p_session_id VARCHAR(255),
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- Insert guest cart items into user cart, handling duplicates
    INSERT INTO user_cart_items (user_id, product_id, quantity)
    SELECT p_user_id, product_id, quantity
    FROM guest_cart_items
    WHERE session_id = p_session_id
    ON CONFLICT (user_id, product_id) 
    DO UPDATE SET 
        quantity = user_cart_items.quantity + EXCLUDED.quantity,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Delete guest cart items after successful merge
    DELETE FROM guest_cart_items WHERE session_id = p_session_id;
    
    -- Update cart session
    UPDATE cart_sessions 
    SET user_id = p_user_id, updated_at = CURRENT_TIMESTAMP
    WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql; 