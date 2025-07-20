-- Insert sample products for testing

-- Maternity & Baby Care Products
INSERT INTO products (category_id, name, slug, description, short_description, price, sale_price, sku, attributes, images, is_featured, stock_quantity) VALUES
-- Maternity Wear
((SELECT id FROM product_categories WHERE slug = 'maternity-wear'), 'Organic Cotton Maternity Dress', 'organic-cotton-maternity-dress', 'Comfortable and breathable maternity dress made from 100% organic cotton. Perfect for everyday wear during pregnancy.', 'Comfortable organic cotton maternity dress', 89.99, 79.99, 'MAT-001', '{"material": "organic_cotton", "color": "navy", "size": "M", "organic_certified": true}', '["/images/products/maternity-dress-1.jpg", "/images/products/maternity-dress-2.jpg"]', true, 25),
((SELECT id FROM product_categories WHERE slug = 'maternity-wear'), 'Sustainable Maternity Leggings', 'sustainable-maternity-leggings', 'Eco-friendly maternity leggings with stretch fabric for maximum comfort during pregnancy.', 'Eco-friendly stretch maternity leggings', 45.99, NULL, 'MAT-002', '{"material": "bamboo_blend", "color": "black", "size": "L", "organic_certified": true}', '["/images/products/maternity-leggings-1.jpg"]', false, 30),

-- Baby Clothing
((SELECT id FROM product_categories WHERE slug = 'baby-clothing'), 'Organic Baby Onesie Set', 'organic-baby-onesie-set', 'Soft and gentle organic cotton onesies perfect for sensitive baby skin. Set includes 3 onesies.', 'Soft organic cotton baby onesie set', 34.99, 29.99, 'BABY-001', '{"material": "organic_cotton", "color": "white", "size": "0-3m", "organic_certified": true}', '["/images/products/baby-onesie-1.jpg", "/images/products/baby-onesie-2.jpg"]', true, 40),
((SELECT id FROM product_categories WHERE slug = 'baby-clothing'), 'Bamboo Baby Sleepsuit', 'bamboo-baby-sleepsuit', 'Breathable bamboo fabric sleepsuit for comfortable sleep. Temperature regulating and hypoallergenic.', 'Breathable bamboo baby sleepsuit', 39.99, NULL, 'BABY-002', '{"material": "bamboo", "color": "sage", "size": "6-12m", "organic_certified": true}', '["/images/products/baby-sleepsuit-1.jpg"]', false, 35),

-- Baby Bedding
((SELECT id FROM product_categories WHERE slug = 'baby-bedding'), 'Organic Crib Sheet Set', 'organic-crib-sheet-set', 'Safe and soft organic cotton crib sheets. Set includes 2 fitted sheets and 1 flat sheet.', 'Safe organic cotton crib sheets', 49.99, 44.99, 'BABY-003', '{"material": "organic_cotton", "color": "cream", "size": "standard_crib", "organic_certified": true}', '["/images/products/crib-sheets-1.jpg"]', true, 20),

-- Hospital & Healthcare Products
-- Medical Scrubs
((SELECT id FROM product_categories WHERE slug = 'medical-scrubs'), 'Eco-Friendly Medical Scrubs', 'eco-friendly-medical-scrubs', 'Sustainable medical scrubs made from recycled materials. Comfortable and professional for healthcare workers.', 'Sustainable medical scrubs', 65.99, NULL, 'MED-001', '{"material": "recycled_polyester", "color": "navy", "size": "M", "organic_certified": false}', '["/images/products/medical-scrubs-1.jpg"]', false, 50),
((SELECT id FROM product_categories WHERE slug = 'medical-scrubs'), 'Bamboo Medical Uniform', 'bamboo-medical-uniform', 'Breathable bamboo medical uniform with antimicrobial properties. Perfect for long shifts.', 'Breathable bamboo medical uniform', 89.99, 79.99, 'MED-002', '{"material": "bamboo", "color": "teal", "size": "L", "organic_certified": true}', '["/images/products/medical-uniform-1.jpg"]', true, 30),

-- Hospital Bedding
((SELECT id FROM product_categories WHERE slug = 'hospital-bedding'), 'Organic Hospital Bed Sheets', 'organic-hospital-bed-sheets', 'Medical-grade organic cotton bed sheets for patient comfort. Hypoallergenic and easy to clean.', 'Medical-grade organic bed sheets', 75.99, NULL, 'MED-003', '{"material": "organic_cotton", "color": "white", "size": "hospital_standard", "organic_certified": true}', '["/images/products/hospital-sheets-1.jpg"]', false, 100),

-- Home & Bedding Products
-- Bedding Sets
((SELECT id FROM product_categories WHERE slug = 'bedding-sets'), 'Organic Cotton Bedding Set', 'organic-cotton-bedding-set', 'Complete bedding set including duvet cover, fitted sheet, and pillowcases. Made from 100% organic cotton.', 'Complete organic cotton bedding set', 129.99, 119.99, 'HOME-001', '{"material": "organic_cotton", "color": "sage", "size": "queen", "organic_certified": true}', '["/images/products/bedding-set-1.jpg", "/images/products/bedding-set-2.jpg"]', true, 25),
((SELECT id FROM product_categories WHERE slug = 'bedding-sets'), 'Bamboo Bedding Collection', 'bamboo-bedding-collection', 'Luxury bamboo bedding collection with temperature regulating properties. Includes all bedding essentials.', 'Luxury bamboo bedding collection', 149.99, NULL, 'HOME-002', '{"material": "bamboo", "color": "cream", "size": "king", "organic_certified": true}', '["/images/products/bamboo-bedding-1.jpg"]', false, 20),

-- Pillows & Cushions
((SELECT id FROM product_categories WHERE slug = 'pillows-cushions'), 'Organic Cotton Pillow', 'organic-cotton-pillow', 'Hypoallergenic organic cotton pillow for better sleep. Supports proper neck alignment.', 'Hypoallergenic organic cotton pillow', 45.99, 39.99, 'HOME-003', '{"material": "organic_cotton", "color": "white", "size": "standard", "organic_certified": true}', '["/images/products/organic-pillow-1.jpg"]', false, 40),

-- Towels & Bath
((SELECT id FROM product_categories WHERE slug = 'towels-bath'), 'Bamboo Bath Towel Set', 'bamboo-bath-towel-set', 'Luxurious bamboo bath towels with superior absorbency. Set includes 2 bath towels and 2 hand towels.', 'Luxurious bamboo bath towel set', 89.99, NULL, 'HOME-004', '{"material": "bamboo", "color": "white", "size": "standard", "organic_certified": true}', '["/images/products/bamboo-towels-1.jpg"]', true, 30),

-- Hospitality Solutions Products
-- Hotel Bedding
((SELECT id FROM product_categories WHERE slug = 'hotel-bedding'), 'Luxury Hotel Bedding Set', 'luxury-hotel-bedding-set', 'Professional hotel bedding set with high thread count. Includes all bedding components for hotel rooms.', 'Professional hotel bedding set', 199.99, 179.99, 'HOSP-001', '{"material": "organic_cotton", "color": "white", "size": "queen", "organic_certified": true}', '["/images/products/hotel-bedding-1.jpg"]', true, 15),
((SELECT id FROM product_categories WHERE slug = 'hotel-bedding'), 'Spa Quality Robes', 'spa-quality-robes', 'Luxury spa-quality robes made from sustainable materials. Perfect for hotels and spas.', 'Luxury spa-quality robes', 89.99, NULL, 'HOSP-002', '{"material": "bamboo", "color": "white", "size": "L", "organic_certified": true}', '["/images/products/spa-robes-1.jpg"]', false, 25),

-- Restaurant Textiles
((SELECT id FROM product_categories WHERE slug = 'restaurant-textiles'), 'Organic Cotton Napkins', 'organic-cotton-napkins', 'Premium organic cotton napkins for restaurants. Set of 12 napkins with elegant design.', 'Premium organic cotton napkins', 69.99, 59.99, 'HOSP-003', '{"material": "organic_cotton", "color": "cream", "size": "dinner", "organic_certified": true}', '["/images/products/restaurant-napkins-1.jpg"]', false, 50); 