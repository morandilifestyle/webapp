-- Insert additional Maternity & Baby Care products (Feeding Apron, Baby Sleeping Bag, Hooded Towel, Baby Frock, Baby Swaddle)

-- Feeding Aprons (associating with Nursing Products category)
INSERT INTO products (category_id, name, slug, description, short_description, price, sale_price, sku, attributes, images, is_featured, stock_quantity)
VALUES (
  (SELECT id FROM product_categories WHERE slug = 'nursing-products'),
  'Organic Cotton Feeding Apron',
  'organic-cotton-feeding-apron',
  'Lightweight, breathable feeding apron made from 100% organic cotton. Provides privacy and comfort for nursing mothers on the go.',
  'Breathable organic cotton feeding apron',
  29.99,
  24.99,
  'NURS-003',
  '{"material":"organic_cotton","color":"pastel_pink","size":"one_size","organic_certified":true}',
  '["https://images.pexels.com/photos/4498366/pexels-photo-4498366.jpeg?auto=compress&cs=tinysrgb&w=1080"]',
  false,
  50);

-- Baby Sleeping Bag (Baby Bedding)
INSERT INTO products (category_id, name, slug, description, short_description, price, sale_price, sku, attributes, images, is_featured, stock_quantity)
VALUES (
  (SELECT id FROM product_categories WHERE slug = 'baby-bedding'),
  'Eco-Friendly Baby Sleeping Bag',
  'eco-friendly-baby-sleeping-bag',
  'Temperature-regulating bamboo fiber sleeping bag keeps babies cosy and safe all night. No loose blankets needed.',
  'Bamboo fiber baby sleeping bag',
  49.99,
  NULL,
  'BABY-004',
  '{"material":"bamboo","color":"sage_green","size":"0_6m","organic_certified":true}',
  '["https://images.pexels.com/photos/5711955/pexels-photo-5711955.jpeg?auto=compress&cs=tinysrgb&w=1080"]',
  true,
  30);

-- Hooded Towel (Nursing Products)
INSERT INTO products (category_id, name, slug, description, short_description, price, sale_price, sku, attributes, images, is_featured, stock_quantity)
VALUES (
  (SELECT id FROM product_categories WHERE slug = 'nursing-products'),
  'Ultra-Soft Bamboo Hooded Towel',
  'ultra-soft-bamboo-hooded-towel',
  'Luxuriously soft hooded towel crafted from absorbent bamboo terry. Gentle on delicate baby skin and quick-drying.',
  'Soft bamboo hooded towel',
  34.99,
  27.99,
  'NURS-004',
  '{"material":"bamboo","color":"ivory","size":"90x90cm","organic_certified":true}',
  '["https://images.pexels.com/photos/4599477/pexels-photo-4599477.jpeg?auto=compress&cs=tinysrgb&w=1080"]',
  false,
  60);

-- Baby Frock / Dungaree (Baby Clothing)
INSERT INTO products (category_id, name, slug, description, short_description, price, sale_price, sku, attributes, images, is_featured, stock_quantity)
VALUES (
  (SELECT id FROM product_categories WHERE slug = 'baby-clothing'),
  'Handmade Organic Baby Frock',
  'handmade-organic-baby-frock',
  'Charming A-line frock sewn from GOTS-certified cotton with wooden buttons. Perfect for summer outings.',
  'Organic cotton baby frock',
  39.99,
  NULL,
  'BABY-005',
  '{"material":"organic_cotton","color":"sky_blue","size":"6_12m","organic_certified":true}',
  '["https://images.pexels.com/photos/3622666/pexels-photo-3622666.jpeg?auto=compress&cs=tinysrgb&w=1080"]',
  false,
  40);

-- Baby Swaddle (Baby Bedding)
INSERT INTO products (category_id, name, slug, description, short_description, price, sale_price, sku, attributes, images, is_featured, stock_quantity)
VALUES (
  (SELECT id FROM product_categories WHERE slug = 'baby-bedding'),
  'Muslin Cotton Baby Swaddle',
  'muslin-cotton-baby-swaddle',
  'Breathable double-layer muslin swaddle keeps babies snug without overheating. Naturally soft and washable.',
  'Breathable muslin baby swaddle',
  24.99,
  19.99,
  'BABY-006',
  '{"material":"muslin_cotton","color":"natural","size":"120x120cm","organic_certified":true}',
  '["https://images.pexels.com/photos/5705201/pexels-photo-5705201.jpeg?auto=compress&cs=tinysrgb&w=1080"]',
  true,
  80); 