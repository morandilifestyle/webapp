-- Blog and Content Management Schema
-- Migration: 20241201000006_blog_content_schema.sql

-- Blog posts
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(500),
    author_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, scheduled, archived
    published_at TIMESTAMP,
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags TEXT[], -- Array of tags
    reading_time INTEGER, -- Estimated reading time in minutes
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog categories
CREATE TABLE blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES blog_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog post categories (many-to-many)
CREATE TABLE blog_post_categories (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);

-- Blog comments
CREATE TABLE blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    parent_id UUID REFERENCES blog_comments(id),
    author_name VARCHAR(100),
    author_email VARCHAR(255),
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    is_spam BOOLEAN DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Promotional content
CREATE TABLE promotional_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- banner, campaign, testimonial, video
    content_data JSONB,
    display_location VARCHAR(100), -- homepage, product_page, blog
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content analytics
CREATE TABLE content_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- blog_post, promotional_content
    event_type VARCHAR(50) NOT NULL, -- view, like, share, comment
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Newsletter subscriptions
CREATE TABLE newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    subscription_source VARCHAR(100), -- blog, checkout, popup
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_is_featured ON blog_posts(is_featured);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);

CREATE INDEX idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX idx_blog_comments_is_approved ON blog_comments(is_approved);

CREATE INDEX idx_promotional_content_is_active ON promotional_content(is_active);
CREATE INDEX idx_promotional_content_display_location ON promotional_content(display_location);
CREATE INDEX idx_promotional_content_dates ON promotional_content(start_date, end_date);

CREATE INDEX idx_content_analytics_content_id ON content_analytics(content_id);
CREATE INDEX idx_content_analytics_event_type ON content_analytics(event_type);
CREATE INDEX idx_content_analytics_created_at ON content_analytics(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
CREATE POLICY "Public can view published blog posts" ON blog_posts
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can manage their own posts" ON blog_posts
    FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Admins can manage all posts" ON blog_posts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.role() = 'service_role'
        )
    );

-- RLS Policies for blog_categories
CREATE POLICY "Public can view active categories" ON blog_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON blog_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.role() = 'service_role'
        )
    );

-- RLS Policies for blog_comments
CREATE POLICY "Public can view approved comments" ON blog_comments
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can create comments" ON blog_comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON blog_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments" ON blog_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.role() = 'service_role'
        )
    );

-- RLS Policies for promotional_content
CREATE POLICY "Public can view active promotional content" ON promotional_content
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage promotional content" ON promotional_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.role() = 'service_role'
        )
    );

-- RLS Policies for newsletter_subscriptions
CREATE POLICY "Public can subscribe to newsletter" ON newsletter_subscriptions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their own subscriptions" ON newsletter_subscriptions
    FOR UPDATE USING (email = (
        SELECT email FROM auth.users WHERE auth.users.id = auth.uid()
    ));

-- Insert sample blog categories
INSERT INTO blog_categories (name, slug, description, sort_order) VALUES
('Sustainability', 'sustainability', 'Articles about sustainable living and eco-friendly practices', 1),
('Wellness', 'wellness', 'Health and wellness content for mindful living', 2),
('Product Guides', 'product-guides', 'How-to guides and product care instructions', 3),
('Lifestyle', 'lifestyle', 'Lifestyle tips and inspiration', 4),
('Behind the Scenes', 'behind-the-scenes', 'Stories from our team and manufacturing process', 5);

-- Insert sample promotional content
INSERT INTO promotional_content (title, content_type, content_data, display_location, is_active, sort_order) VALUES
('Sustainable Living Starts Here', 'banner', '{"image": "/images/promos/sustainable-living.jpg", "link": "/blog/sustainability"}', 'homepage', true, 1),
('Wellness Wednesday Tips', 'campaign', '{"title": "Weekly Wellness Tips", "description": "Get your weekly dose of wellness inspiration"}', 'blog', true, 2),
('Customer Spotlight: Sarah M.', 'testimonial', '{"customer_name": "Sarah M.", "location": "California", "story": "How Morandi products transformed my daily routine"}', 'homepage', true, 3); 