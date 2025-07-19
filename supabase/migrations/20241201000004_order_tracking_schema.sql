-- Order status tracking
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) -- 'system', 'admin', 'courier'
);

-- Order tracking details
CREATE TABLE order_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    tracking_number VARCHAR(100) UNIQUE,
    courier_name VARCHAR(100),
    courier_url VARCHAR(500),
    estimated_delivery DATE,
    actual_delivery_date DATE,
    delivery_attempts INTEGER DEFAULT 0,
    delivery_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order returns and refunds
CREATE TABLE order_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    return_reason VARCHAR(100),
    return_description TEXT,
    return_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, processed, completed
    refund_amount DECIMAL(10,2),
    refund_method VARCHAR(50),
    return_tracking_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order notifications
CREATE TABLE order_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    notification_type VARCHAR(50), -- 'email', 'sms', 'push'
    notification_status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    notification_data JSONB,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courier integration settings
CREATE TABLE courier_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_name VARCHAR(100) UNIQUE NOT NULL,
    api_key VARCHAR(255),
    api_secret VARCHAR(255),
    base_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_timestamp ON order_status_history(timestamp);
CREATE INDEX idx_order_tracking_order_id ON order_tracking(order_id);
CREATE INDEX idx_order_tracking_tracking_number ON order_tracking(tracking_number);
CREATE INDEX idx_order_returns_order_id ON order_returns(order_id);
CREATE INDEX idx_order_returns_status ON order_returns(return_status);
CREATE INDEX idx_order_notifications_order_id ON order_notifications(order_id);
CREATE INDEX idx_order_notifications_user_id ON order_notifications(user_id);

-- Update triggers for updated_at timestamps
CREATE TRIGGER update_order_tracking_updated_at 
    BEFORE UPDATE ON order_tracking 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_returns_updated_at 
    BEFORE UPDATE ON order_returns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courier_integrations_updated_at 
    BEFORE UPDATE ON courier_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for security
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_integrations ENABLE ROW LEVEL SECURITY;

-- Order status history policies
CREATE POLICY "Users can view their order status history" ON order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_status_history.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage order status history" ON order_status_history
    FOR ALL USING (auth.role() = 'service_role');

-- Order tracking policies
CREATE POLICY "Users can view their order tracking" ON order_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_tracking.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage order tracking" ON order_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- Order returns policies
CREATE POLICY "Users can view their order returns" ON order_returns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_returns.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their order returns" ON order_returns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_returns.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage order returns" ON order_returns
    FOR ALL USING (auth.role() = 'service_role');

-- Order notifications policies
CREATE POLICY "Users can view their order notifications" ON order_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage order notifications" ON order_notifications
    FOR ALL USING (auth.role() = 'service_role');

-- Courier integrations policies (admin only)
CREATE POLICY "Admins can manage courier integrations" ON courier_integrations
    FOR ALL USING (auth.role() = 'service_role');

-- Insert default courier integrations
INSERT INTO courier_integrations (courier_name, base_url, is_active) VALUES
('Delhivery', 'https://api.delhivery.com', true),
('Blue Dart', 'https://api.bluedart.com', true),
('DTDC', 'https://api.dtdc.com', true),
('FedEx', 'https://api.fedex.com', true);

-- Function to update order status with history
CREATE OR REPLACE FUNCTION update_order_status_with_history(
    p_order_id UUID,
    p_status VARCHAR(50),
    p_description TEXT DEFAULT NULL,
    p_location VARCHAR(255) DEFAULT NULL,
    p_created_by VARCHAR(100) DEFAULT 'system'
)
RETURNS VOID AS $$
BEGIN
    -- Update order status
    UPDATE orders 
    SET status = p_status, updated_at = CURRENT_TIMESTAMP
    WHERE id = p_order_id;
    
    -- Add to status history
    INSERT INTO order_status_history (order_id, status, description, location, created_by)
    VALUES (p_order_id, p_status, p_description, p_location, p_created_by);
END;
$$ LANGUAGE plpgsql;

-- Function to get order timeline
CREATE OR REPLACE FUNCTION get_order_timeline(p_order_id UUID)
RETURNS TABLE (
    status VARCHAR(50),
    description TEXT,
    location VARCHAR(255),
    timestamp TIMESTAMP,
    created_by VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        osh.status,
        osh.description,
        osh.location,
        osh.timestamp,
        osh.created_by
    FROM order_status_history osh
    WHERE osh.order_id = p_order_id
    ORDER BY osh.timestamp ASC;
END;
$$ LANGUAGE plpgsql; 