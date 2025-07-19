-- Wishlist and Reviews Schema Migration
-- Migration: 20241201000005_wishlist_reviews_schema.sql

-- Wishlist items for registered users
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Product reviews
CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    title VARCHAR(255),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    unhelpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review images
CREATE TABLE review_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review helpfulness votes
CREATE TABLE review_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(review_id, user_id)
);

-- Review reports
CREATE TABLE review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES auth.users(id),
    report_reason VARCHAR(100) NOT NULL,
    report_description TEXT,
    report_status VARCHAR(20) DEFAULT 'pending' CHECK (report_status IN ('pending', 'reviewed', 'resolved')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review analytics
CREATE TABLE review_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    rating_distribution JSONB, -- {1: 10, 2: 5, 3: 15, 4: 30, 5: 40}
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id)
);

-- Indexes for performance
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_is_approved ON product_reviews(is_approved);
CREATE INDEX idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX idx_product_reviews_created_at ON product_reviews(created_at);
CREATE INDEX idx_review_images_review_id ON review_images(review_id);
CREATE INDEX idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX idx_review_votes_user_id ON review_votes(user_id);
CREATE INDEX idx_review_reports_review_id ON review_reports(review_id);
CREATE INDEX idx_review_reports_status ON review_reports(report_status);
CREATE INDEX idx_review_analytics_product_id ON review_analytics(product_id);

-- Update triggers for updated_at timestamps
CREATE TRIGGER update_product_reviews_updated_at 
    BEFORE UPDATE ON product_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_reports_updated_at 
    BEFORE UPDATE ON review_reports 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for security
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_analytics ENABLE ROW LEVEL SECURITY;

-- Wishlist policies
CREATE POLICY "Users can manage their own wishlist" ON wishlists
    FOR ALL USING (auth.uid() = user_id);

-- Product reviews policies
CREATE POLICY "Users can view approved reviews" ON product_reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create their own reviews" ON product_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON product_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON product_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Review images policies
CREATE POLICY "Users can view review images" ON review_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM product_reviews 
            WHERE product_reviews.id = review_images.review_id 
            AND product_reviews.is_approved = true
        )
    );

CREATE POLICY "Users can create images for their reviews" ON review_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM product_reviews 
            WHERE product_reviews.id = review_images.review_id 
            AND product_reviews.user_id = auth.uid()
        )
    );

-- Review votes policies
CREATE POLICY "Users can view review votes" ON review_votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM product_reviews 
            WHERE product_reviews.id = review_votes.review_id 
            AND product_reviews.is_approved = true
        )
    );

CREATE POLICY "Users can vote on reviews" ON review_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON review_votes
    FOR UPDATE USING (auth.uid() = user_id);

-- Review reports policies
CREATE POLICY "Users can view their own reports" ON review_reports
    FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON review_reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Review analytics policies (read-only for all users)
CREATE POLICY "All users can view review analytics" ON review_analytics
    FOR SELECT USING (true);

-- Function to update review analytics
CREATE OR REPLACE FUNCTION update_review_analytics(p_product_id UUID)
RETURNS VOID AS $$
DECLARE
    total_reviews_count INTEGER;
    avg_rating DECIMAL(3,2);
    rating_dist JSONB;
BEGIN
    -- Calculate total reviews and average rating
    SELECT 
        COUNT(*),
        ROUND(AVG(rating)::DECIMAL, 2)
    INTO total_reviews_count, avg_rating
    FROM product_reviews 
    WHERE product_id = p_product_id AND is_approved = true;
    
    -- Calculate rating distribution
    SELECT jsonb_object_agg(rating, count) INTO rating_dist
    FROM (
        SELECT rating, COUNT(*) as count
        FROM product_reviews 
        WHERE product_id = p_product_id AND is_approved = true
        GROUP BY rating
        ORDER BY rating
    ) rating_counts;
    
    -- Insert or update analytics
    INSERT INTO review_analytics (product_id, total_reviews, average_rating, rating_distribution, last_updated)
    VALUES (p_product_id, total_reviews_count, COALESCE(avg_rating, 0), COALESCE(rating_dist, '{}'::jsonb), CURRENT_TIMESTAMP)
    ON CONFLICT (product_id) 
    DO UPDATE SET 
        total_reviews = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        rating_distribution = EXCLUDED.rating_distribution,
        last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to verify purchase for review
CREATE OR REPLACE FUNCTION verify_purchase_for_review(
    p_user_id UUID,
    p_product_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    has_purchase BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.user_id = p_user_id 
        AND oi.product_id = p_product_id
        AND o.status IN ('delivered', 'shipped')
    ) INTO has_purchase;
    
    RETURN has_purchase;
END;
$$ LANGUAGE plpgsql;

-- Function to update review helpfulness votes
CREATE OR REPLACE FUNCTION update_review_votes(p_review_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE product_reviews 
    SET 
        helpful_votes = (
            SELECT COUNT(*) 
            FROM review_votes 
            WHERE review_id = p_review_id AND vote_type = 'helpful'
        ),
        unhelpful_votes = (
            SELECT COUNT(*) 
            FROM review_votes 
            WHERE review_id = p_review_id AND vote_type = 'unhelpful'
        )
    WHERE id = p_review_id;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update analytics and votes
CREATE OR REPLACE FUNCTION trigger_update_review_analytics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        PERFORM update_review_analytics(NEW.product_id);
        IF TG_OP = 'DELETE' THEN
            PERFORM update_review_analytics(OLD.product_id);
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_product_reviews_analytics
    AFTER INSERT OR UPDATE OR DELETE ON product_reviews
    FOR EACH ROW EXECUTE FUNCTION trigger_update_review_analytics();

CREATE OR REPLACE FUNCTION trigger_update_review_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        PERFORM update_review_votes(NEW.review_id);
        IF TG_OP = 'DELETE' THEN
            PERFORM update_review_votes(OLD.review_id);
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_votes_update
    AFTER INSERT OR UPDATE OR DELETE ON review_votes
    FOR EACH ROW EXECUTE FUNCTION trigger_update_review_votes();

-- Function to check if user can review product
CREATE OR REPLACE FUNCTION can_user_review_product(
    p_user_id UUID,
    p_product_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    has_purchase BOOLEAN;
    has_review BOOLEAN;
BEGIN
    -- Check if user has purchased the product
    SELECT verify_purchase_for_review(p_user_id, p_product_id) INTO has_purchase;
    
    -- Check if user already has a review for this product
    SELECT EXISTS (
        SELECT 1 FROM product_reviews 
        WHERE user_id = p_user_id AND product_id = p_product_id
    ) INTO has_review;
    
    RETURN has_purchase AND NOT has_review;
END;
$$ LANGUAGE plpgsql; 