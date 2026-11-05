-- ============================================================================
-- BREW & BEAN — FINAL CLIENT MENU & PRODUCT VARIANTS SEED SCRIPT
-- ============================================================================
-- Client Approved Menu: 31 Products across 5 Categories
-- Currency: Indian Rupees (INR - ₹)
-- Safe, idempotent execution: Can be executed multiple times without duplicates
-- ============================================================================

-- 1. Ensure Categories exist with exact client names
INSERT INTO categories (name, slug, description)
VALUES 
  ('Hot Coffee', 'hot-coffee', 'Freshly brewed artisanal hot espressos and coffees'),
  ('Cold Coffee', 'cold-coffee', 'Chilled slow brews, iced lattes and blended frappes'),
  ('Tea & Refreshments', 'tea-refreshments', 'Traditional spiced teas, green teas and hot chocolates'),
  ('Snacks', 'snacks', 'Freshly toasted artisanal sandwiches, sides and fries'),
  ('Desserts', 'desserts', 'Handcrafted brownies, cheesecakes, muffins and bakery treats')
ON CONFLICT (name) DO UPDATE SET
  slug = EXCLUDED.slug,
  description = EXCLUDED.description;

-- 2. Ensure product_variants table exists
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL, -- e.g. 'Small', 'Medium', 'Large', 'Regular', 'Choco', 'Blueberry'
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (product_id, size)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_prod ON product_variants(product_id);

-- Enable RLS on product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view product variants" ON product_variants;
CREATE POLICY "Public can view product variants" 
ON product_variants FOR SELECT 
USING (true);

-- Ensure category_id and order_type columns exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INT REFERENCES categories(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'Home Delivery';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- ============================================================================
-- 3. INSERT / UPDATE APPROVED CLIENT PRODUCTS (31 PRODUCTS)
-- ============================================================================

-- Helper temporary table to seed products and variants cleanly
DO $$
DECLARE
  v_cat_hot INT;
  v_cat_cold INT;
  v_cat_tea INT;
  v_cat_snack INT;
  v_cat_dessert INT;
  v_pid INT;
BEGIN
  SELECT id INTO v_cat_hot FROM categories WHERE slug = 'hot-coffee';
  SELECT id INTO v_cat_cold FROM categories WHERE slug = 'cold-coffee';
  SELECT id INTO v_cat_tea FROM categories WHERE slug = 'tea-refreshments';
  SELECT id INTO v_cat_snack FROM categories WHERE slug = 'snacks';
  SELECT id INTO v_cat_dessert FROM categories WHERE slug = 'desserts';

  -- ----------------------------------------------------
  -- CATEGORY A: HOT COFFEE (7 Products)
  -- ----------------------------------------------------
  -- 1. Espresso (Small: ₹180)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (1, 'Espresso', 'Intense, full-bodied single-origin espresso shot with a rich golden crema.', 180.00, 'hot-coffee', v_cat_hot, 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&q=80', true, 'classic', 4.8, 312)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (1, 'Small', 180.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 2. Americano (Small: ₹150, Medium: ₹190)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (2, 'Americano', 'Rich espresso poured over hot purified water for a bold and smooth flavor profile.', 150.00, 'hot-coffee', v_cat_hot, 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600&q=80', true, '', 4.7, 240)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (2, 'Small', 150.00), (2, 'Medium', 190.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 3. Cappuccino (Small: ₹170, Medium: ₹200, Large: ₹240)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (3, 'Cappuccino', 'Equal parts dark espresso, velvety steamed milk, and dense foam dusting.', 170.00, 'hot-coffee', v_cat_hot, 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&q=80', true, 'bestseller', 4.9, 520)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (3, 'Small', 170.00), (3, 'Medium', 200.00), (3, 'Large', 240.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 4. Latte (Small: ₹170, Medium: ₹200, Large: ₹240)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (4, 'Latte', 'Smooth espresso layered beneath silky textured steamed milk with delicate latte art.', 170.00, 'hot-coffee', v_cat_hot, 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&q=80', true, 'popular', 4.8, 415)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (4, 'Small', 170.00), (4, 'Medium', 200.00), (4, 'Large', 240.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 5. Café Mocha (Small: ₹190, Medium: ₹220, Large: ₹260)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (5, 'Café Mocha', 'Espresso married with decadent chocolate ganache and creamy frothed milk.', 190.00, 'hot-coffee', v_cat_hot, 'https://images.unsplash.com/photo-1579888944880-d98341245702?w=600&q=80', true, 'rich', 4.8, 380)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (5, 'Small', 190.00), (5, 'Medium', 220.00), (5, 'Large', 260.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 6. Flat White (Small: ₹180, Medium: ₹210)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (6, 'Flat White', 'Double ristretto espresso shots topped with micro-foamed whole milk for supreme silkiness.', 180.00, 'hot-coffee', v_cat_hot, 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600&q=80', true, '', 4.7, 290)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (6, 'Small', 180.00), (6, 'Medium', 210.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 7. Macchiato (Small: ₹170, Medium: ₹200)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (7, 'Macchiato', 'Bold espresso stained with a dollop of warm, silky milk foam.', 170.00, 'hot-coffee', v_cat_hot, 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&q=80', true, '', 4.6, 195)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (7, 'Small', 170.00), (7, 'Medium', 200.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- ----------------------------------------------------
  -- CATEGORY B: COLD COFFEE (5 Products)
  -- ----------------------------------------------------
  -- 8. Iced Latte (Medium: ₹200, Large: ₹240)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (8, 'Iced Latte', 'Freshly pulled espresso poured over chilled whole milk and crystal ice.', 200.00, 'cold-coffee', v_cat_cold, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&q=80', true, 'refreshing', 4.8, 340)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (8, 'Medium', 200.00), (8, 'Large', 240.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 9. Iced Caramel Latte (Medium: ₹220, Large: ₹260)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (9, 'Iced Caramel Latte', 'Espresso blended with artisanal caramel syrup, chilled milk, and caramel drizzle.', 220.00, 'cold-coffee', v_cat_cold, 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=600&q=80', true, 'bestseller', 4.9, 580)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (9, 'Medium', 220.00), (9, 'Large', 260.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 10. Iced Mocha (Medium: ₹220, Large: ₹260)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (10, 'Iced Mocha', 'Dark cocoa sauce blended with espresso, chilled milk, and served over ice.', 220.00, 'cold-coffee', v_cat_cold, 'https://images.unsplash.com/photo-1559496417-e7f25cb247cd?w=600&q=80', true, '', 4.7, 310)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (10, 'Medium', 220.00), (10, 'Large', 260.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 11. Classic Iced Coffee (Medium: ₹180, Large: ₹220)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (11, 'Classic Iced Coffee', 'Bold brewed coffee chilled over ice with a hint of sweetness and cream.', 180.00, 'cold-coffee', v_cat_cold, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80', true, 'classic', 4.7, 400)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (11, 'Medium', 180.00), (11, 'Large', 220.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 12. Chocolate Frappe (Medium: ₹250, Large: ₹290)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (12, 'Chocolate Frappe', 'Decadent blended ice frappe with chocolate sauce, espresso, and whipped topping.', 250.00, 'cold-coffee', v_cat_cold, 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&q=80', true, 'bestseller', 4.9, 620)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (12, 'Medium', 250.00), (12, 'Large', 290.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- ----------------------------------------------------
  -- CATEGORY C: TEA & REFRESHMENTS (5 Products)
  -- ----------------------------------------------------
  -- 13. Masala Tea (₹20)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (13, 'Masala Tea', 'Authentic Indian chai infused with fresh cardamom, cinnamon, cloves, and ginger.', 20.00, 'tea-refreshments', v_cat_tea, 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=600&q=80', true, 'popular', 4.9, 750)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (13, 'Regular', 20.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 14. Ginger Tea (₹20)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (14, 'Ginger Tea', 'Invigorating freshly crushed ginger steeped with premium Assam tea leaves.', 20.00, 'tea-refreshments', v_cat_tea, 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=600&q=80', true, '', 4.8, 480)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (14, 'Regular', 20.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 15. Lemon Tea (₹20)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (15, 'Lemon Tea', 'Zesty black tea infused with freshly squeezed lemon juice and raw honey.', 20.00, 'tea-refreshments', v_cat_tea, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80', true, '', 4.6, 320)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (15, 'Regular', 20.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 16. Green Tea (₹20)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (16, 'Green Tea', 'Pure antioxidant-rich whole green tea leaves steeped to a delicate golden infusion.', 20.00, 'tea-refreshments', v_cat_tea, 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=600&q=80', true, 'healthy', 4.7, 260)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (16, 'Regular', 20.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 17. Hot Chocolate (₹50)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (17, 'Hot Chocolate', 'Rich Dutch dark cocoa whisked into creamy hot milk and topped with chocolate curls.', 50.00, 'tea-refreshments', v_cat_tea, 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&q=80', true, 'bestseller', 4.9, 610)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (17, 'Regular', 50.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- ----------------------------------------------------
  -- CATEGORY D: SNACKS (7 Products)
  -- ----------------------------------------------------
  -- 18. Veg Sandwich (₹100)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (18, 'Veg Sandwich', 'Fresh cucumbers, tomatoes, bell peppers, and mint chutney in toasted bread.', 100.00, 'snacks', v_cat_snack, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&q=80', true, 'fresh', 4.6, 350)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (18, 'Regular', 100.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 19. Chicken Sandwich (₹150)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (19, 'Chicken Sandwich', 'Tender spiced roasted chicken breast with house herbs and garlic mayonnaise.', 150.00, 'snacks', v_cat_snack, 'https://images.unsplash.com/photo-1603903631889-b5f3ba4d5b9b?w=600&q=80', true, 'popular', 4.8, 480)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (19, 'Regular', 150.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 20. Grilled Cheese Sandwich (₹170)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (20, 'Grilled Cheese Sandwich', 'Golden toasted sourdough stuffed with melted cheddar and mozzarella.', 170.00, 'snacks', v_cat_snack, 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80', true, 'bestseller', 4.9, 530)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (20, 'Regular', 170.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 21. Paneer Sandwich (₹180)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (21, 'Paneer Sandwich', 'Marinated tandoori cottage cheese paneer cubes grilled with crisp onions and capsicum.', 180.00, 'snacks', v_cat_snack, 'https://images.unsplash.com/photo-1554433601-44787a22ef78?w=600&q=80', true, '', 4.7, 390)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (21, 'Regular', 180.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 22. French Fries (₹120)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (22, 'French Fries', 'Crispy golden salted potato fries served piping hot with ketchup.', 120.00, 'snacks', v_cat_snack, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&q=80', true, 'crispy', 4.8, 620)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (22, 'Regular', 120.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 23. Garlic Bread (₹120)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (23, 'Garlic Bread', 'Toasted baguette slices smothered in herb-infused garlic butter.', 120.00, 'snacks', v_cat_snack, 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=600&q=80', true, '', 4.7, 440)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (23, 'Regular', 120.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 24. Nachos with Cheese (₹140)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (24, 'Nachos with Cheese', 'Crisp Mexican corn tortilla chips served with warm gooey cheese dip and jalapeños.', 140.00, 'snacks', v_cat_snack, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&q=80', true, '', 4.8, 380)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (24, 'Regular', 140.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- ----------------------------------------------------
  -- CATEGORY E: DESSERTS (7 Products / 6 Menu items)
  -- ----------------------------------------------------
  -- 25. Chocolate Brownie (₹120)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (25, 'Chocolate Brownie', 'Fudgy, dense Belgian chocolate brownie baked to gooey perfection.', 120.00, 'desserts', v_cat_dessert, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80', true, 'bestseller', 4.9, 690)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (25, 'Regular', 120.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 26. Cheesecake (₹160)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (26, 'Cheesecake', 'Classic New York style baked cheesecake over a buttery graham cracker crust.', 160.00, 'desserts', v_cat_dessert, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=80', true, 'popular', 4.9, 510)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (26, 'Regular', 160.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 27. Chocolate Cookies (₹80)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (27, 'Chocolate Cookies', 'Freshly baked soft-centered cookies loaded with melting dark chocolate chunks.', 80.00, 'desserts', v_cat_dessert, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80', true, '', 4.7, 430)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (27, 'Regular', 80.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 28. Muffin (Choco / Blueberry) (₹100 - flavor variants: Choco & Blueberry)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (28, 'Muffin (Choco / Blueberry)', 'Soft, fluffy bakery muffin available in rich Chocolate chip or wild Blueberry flavor.', 100.00, 'desserts', v_cat_dessert, 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&q=80', true, 'fresh', 4.8, 360)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (28, 'Choco', 100.00), (28, 'Blueberry', 100.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 29. Choco Muffin (Distinct Item 29 for direct catalog indexing: ₹100)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (29, 'Choco Muffin', 'Moist chocolate muffin packed with rich cocoa and dark chocolate chips.', 100.00, 'desserts', v_cat_dessert, 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&q=80', true, '', 4.8, 220)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (29, 'Regular', 100.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 30. Croissant (₹110)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (30, 'Croissant', 'Flaky, buttery French golden pastry baked fresh daily.', 110.00, 'desserts', v_cat_dessert, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80', true, 'classic', 4.8, 390)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (30, 'Regular', 110.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- 31. Donut (₹90)
  INSERT INTO products (id, name, description, price, category, category_id, image_url, is_available, badge, rating, reviews)
  VALUES (31, 'Donut', 'Soft glazed ring donut with chocolate frosting and sweet colorful sprinkles.', 90.00, 'desserts', v_cat_dessert, 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?w=600&q=80', true, '', 4.7, 310)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, category = EXCLUDED.category, category_id = EXCLUDED.category_id, image_url = EXCLUDED.image_url;
  INSERT INTO product_variants (product_id, size, price) VALUES (31, 'Regular', 90.00)
  ON CONFLICT (product_id, size) DO UPDATE SET price = EXCLUDED.price;

  -- Sync sequence
  PERFORM setval('products_id_seq', (SELECT MAX(id) FROM products));
  PERFORM setval('product_variants_id_seq', (SELECT MAX(id) FROM product_variants));
END $$;

-- ============================================================================
-- 4. UPDATE STORED PROCEDURE FOR ACCURATE SERVER-SIDE PRICE RECALCULATION
-- ============================================================================
-- Uses product_variants table to strictly fetch authorized prices.
-- Calculates delivery fee:
--   - Takeaway: ₹0
--   - Premium Subscriber: ₹0
--   - Subtotal > ₹499: ₹0
--   - Otherwise: ₹30
-- Calculates subscriber discount:
--   - Simple: 5% discount
--   - Premium: 10% discount
CREATE OR REPLACE FUNCTION create_guest_order(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_delivery_address TEXT,
  p_city TEXT,
  p_pincode TEXT,
  p_payment_method TEXT,
  p_order_notes TEXT,
  p_items JSONB, -- Array of {product_id: int, quantity: int, size: string}
  p_order_type TEXT DEFAULT 'Home Delivery'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_prod_id INT;
  v_prod_name TEXT;
  v_variant_price NUMERIC(10,2);
  v_size TEXT;
  v_qty INT;
  v_subtotal NUMERIC(10,2) := 0;
  v_delivery_fee NUMERIC(10,2) := 0;
  v_discount NUMERIC(10,2) := 0;
  v_total_amount NUMERIC(10,2) := 0;
  v_clean_phone TEXT;
  v_active_sub RECORD;
BEGIN
  -- Basic customer validations
  IF coalesce(trim(p_customer_name), '') = '' THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;
  IF coalesce(trim(p_customer_phone), '') = '' THEN
    RAISE EXCEPTION 'Customer phone number is required';
  END IF;
  IF p_order_type = 'Home Delivery' AND coalesce(trim(p_delivery_address), '') = '' THEN
    RAISE EXCEPTION 'Delivery address is required for Home Delivery';
  END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  v_clean_phone := regexp_replace(p_customer_phone, '\D', '', 'g');
  v_order_number := 'BB-' || to_char(now(), 'YYYYMMDD') || '-' || floor(1000 + random() * 9000)::INT;

  -- 1. Calculate trusted subtotal from product_variants
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := (v_item->>'product_id')::INT;
    v_qty     := (v_item->>'quantity')::INT;
    v_size    := coalesce(v_item->>'size', 'Regular');

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;

    -- Lookup variant price first
    SELECT pv.price, p.name INTO v_variant_price, v_prod_name
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    WHERE pv.product_id = v_prod_id
      AND lower(trim(pv.size)) = lower(trim(v_size))
      AND p.is_available = true;

    -- Fallback to product base price if variant record not found
    IF v_variant_price IS NULL THEN
      SELECT price, name INTO v_variant_price, v_prod_name
      FROM products
      WHERE id = v_prod_id AND is_available = true;
    END IF;

    IF v_variant_price IS NULL THEN
      RAISE EXCEPTION 'Product % (size: %) not found or unavailable', v_prod_id, v_size;
    END IF;

    v_subtotal := v_subtotal + (v_variant_price * v_qty);
  END LOOP;

  -- 2. Check for active subscription discounts for this customer phone
  SELECT * INTO v_active_sub
  FROM subscriptions
  WHERE regexp_replace(customer_phone, '\D', '', 'g') = v_clean_phone
    AND subscription_status = 'Active'
    AND end_date >= CURRENT_DATE
  ORDER BY created_at DESC LIMIT 1;

  IF v_active_sub.id IS NOT NULL THEN
    IF v_active_sub.plan_name = 'Premium' THEN
      v_discount := round(v_subtotal * 0.10, 2); -- 10% discount
    ELSIF v_active_sub.plan_name = 'Simple' THEN
      v_discount := round(v_subtotal * 0.05, 2); -- 5% discount
    END IF;
  END IF;

  -- 3. Calculate delivery fee
  -- Takeaway = 0, Premium Member = 0, Subtotal > 499 = 0, Otherwise = 30
  IF p_order_type = 'Takeaway' THEN
    v_delivery_fee := 0;
  ELSIF v_active_sub.id IS NOT NULL AND v_active_sub.plan_name = 'Premium' THEN
    v_delivery_fee := 0; -- Free delivery for Premium subscribers
  ELSIF (v_subtotal - v_discount) > 499 THEN
    v_delivery_fee := 0; -- Free delivery for orders > ₹499
  ELSE
    v_delivery_fee := 30.00; -- Client approved delivery fee: ₹30
  END IF;

  v_total_amount := (v_subtotal - v_discount) + v_delivery_fee;

  -- 4. Insert Master Order
  INSERT INTO orders (
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    delivery_address,
    city,
    pincode,
    subtotal,
    delivery_fee,
    discount_amount,
    total_amount,
    payment_method,
    payment_status,
    order_status,
    order_notes,
    order_type
  ) VALUES (
    v_order_number,
    trim(p_customer_name),
    lower(trim(coalesce(p_customer_email, ''))),
    v_clean_phone,
    trim(coalesce(p_delivery_address, 'Takeaway Pickup')),
    trim(coalesce(p_city, 'Bangalore')),
    trim(coalesce(p_pincode, '')),
    v_subtotal,
    v_delivery_fee,
    v_discount,
    v_total_amount,
    coalesce(p_payment_method, 'Cash on Delivery'),
    'Pending',
    'Confirmed',
    coalesce(p_order_notes, ''),
    coalesce(p_order_type, 'Home Delivery')
  ) RETURNING id INTO v_order_id;

  -- 5. Insert Order Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := (v_item->>'product_id')::INT;
    v_qty     := (v_item->>'quantity')::INT;
    v_size    := coalesce(v_item->>'size', 'Regular');

    SELECT pv.price, p.name INTO v_variant_price, v_prod_name
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    WHERE pv.product_id = v_prod_id
      AND lower(trim(pv.size)) = lower(trim(v_size));

    IF v_variant_price IS NULL THEN
      SELECT price, name INTO v_variant_price, v_prod_name
      FROM products WHERE id = v_prod_id;
    END IF;

    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_price,
      quantity,
      selected_size,
      subtotal
    ) VALUES (
      v_order_id,
      v_prod_id,
      v_prod_name,
      v_variant_price,
      v_qty,
      v_size,
      v_variant_price * v_qty
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'customer_name', p_customer_name,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'delivery_fee', v_delivery_fee,
    'total_amount', v_total_amount,
    'order_type', p_order_type,
    'order_status', 'Confirmed',
    'payment_status', 'Pending'
  );
END;
$$;

