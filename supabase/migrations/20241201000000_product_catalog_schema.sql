-- Product categories with hierarchy
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products with search optimization
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES product_categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    weight DECIMAL(8,2),
    dimensions JSONB, -- {length, width, height}
    attributes JSONB, -- {material, color, size, organic_certified}
    images JSONB, -- Array of image URLs
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    meta_title VARCHAR(255),
    meta_description TEXT,
    search_vector tsvector, -- For full-text search
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search index
CREATE INDEX idx_products_search ON products USING gin(search_vector);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Update search vector on product changes
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_vector_update
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

-- Insert default categories
INSERT INTO product_categories (name, slug, description, sort_order) VALUES
('Maternity & Baby Care', 'maternity-baby-care', 'Sustainable textiles for mothers and babies', 1),
('Hospital & Healthcare', 'hospital-healthcare', 'Medical-grade sustainable textiles', 2),
('Home & Bedding', 'home-bedding', 'Comfortable and sustainable home textiles', 3),
('Hospitality Solutions', 'hospitality-solutions', 'Professional hospitality textiles', 4);

-- Insert subcategories
INSERT INTO product_categories (name, slug, description, parent_id, sort_order) VALUES
-- Maternity & Baby Care subcategories
('Maternity Wear', 'maternity-wear', 'Comfortable maternity clothing', (SELECT id FROM product_categories WHERE slug = 'maternity-baby-care'), 1),
('Baby Clothing', 'baby-clothing', 'Organic baby clothes', (SELECT id FROM product_categories WHERE slug = 'maternity-baby-care'), 2),
('Baby Bedding', 'baby-bedding', 'Safe and comfortable baby bedding', (SELECT id FROM product_categories WHERE slug = 'maternity-baby-care'), 3),
('Nursing Products', 'nursing-products', 'Nursing essentials', (SELECT id FROM product_categories WHERE slug = 'maternity-baby-care'), 4),

-- Hospital & Healthcare subcategories
('Medical Scrubs', 'medical-scrubs', 'Professional medical attire', (SELECT id FROM product_categories WHERE slug = 'hospital-healthcare'), 1),
('Hospital Bedding', 'hospital-bedding', 'Medical-grade bedding', (SELECT id FROM product_categories WHERE slug = 'hospital-healthcare'), 2),
('Surgical Textiles', 'surgical-textiles', 'Sterile surgical materials', (SELECT id FROM product_categories WHERE slug = 'hospital-healthcare'), 3),
('Patient Gowns', 'patient-gowns', 'Comfortable patient wear', (SELECT id FROM product_categories WHERE slug = 'hospital-healthcare'), 4),

-- Home & Bedding subcategories
('Bedding Sets', 'bedding-sets', 'Complete bedding solutions', (SELECT id FROM product_categories WHERE slug = 'home-bedding'), 1),
('Pillows & Cushions', 'pillows-cushions', 'Comfortable pillows and cushions', (SELECT id FROM product_categories WHERE slug = 'home-bedding'), 2),
('Towels & Bath', 'towels-bath', 'Luxury bath textiles', (SELECT id FROM product_categories WHERE slug = 'home-bedding'), 3),
('Kitchen Textiles', 'kitchen-textiles', 'Kitchen and dining textiles', (SELECT id FROM product_categories WHERE slug = 'home-bedding'), 4),

-- Hospitality Solutions subcategories
('Hotel Bedding', 'hotel-bedding', 'Professional hotel bedding', (SELECT id FROM product_categories WHERE slug = 'hospitality-solutions'), 1),
('Restaurant Textiles', 'restaurant-textiles', 'Restaurant and dining textiles', (SELECT id FROM product_categories WHERE slug = 'hospitality-solutions'), 2),
('Spa & Wellness', 'spa-wellness', 'Spa and wellness textiles', (SELECT id FROM product_categories WHERE slug = 'hospitality-solutions'), 3),
('Conference & Events', 'conference-events', 'Event and conference textiles', (SELECT id FROM product_categories WHERE slug = 'hospitality-solutions'), 4); 