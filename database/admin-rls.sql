-- ============================================================================
-- BREW & BEAN — ADMIN AUTHORIZATION LAYER
-- Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================
-- This creates:
--   1. admin_profiles table (maps Supabase auth user → admin role)
--   2. RLS policies so only admins can write products/categories/orders/subs
--   3. Helper function is_admin() checked on every privileged operation
-- ============================================================================

-- ============================================================================
-- 1. ADMIN PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Admins can read their own profile only
DROP POLICY IF EXISTS "Admin can read own profile" ON admin_profiles;
CREATE POLICY "Admin can read own profile" ON admin_profiles
  FOR SELECT USING (auth.uid() = id);

-- ============================================================================
-- 2. HELPER FUNCTION: is_admin()
-- Returns TRUE if the calling Supabase Auth user exists in admin_profiles
-- ============================================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
$$;

-- ============================================================================
-- 3. RLS POLICIES — PRODUCTS
-- ============================================================================
-- Public: already exists (read available products)
-- Admin: can read ALL products (including unavailable), insert, update, delete

DROP POLICY IF EXISTS "Admin can read all products" ON products;
CREATE POLICY "Admin can read all products" ON products
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admin can insert products" ON products;
CREATE POLICY "Admin can insert products" ON products
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can update products" ON products;
CREATE POLICY "Admin can update products" ON products
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can delete products" ON products;
CREATE POLICY "Admin can delete products" ON products
  FOR DELETE USING (is_admin());

-- ============================================================================
-- 4. RLS POLICIES — PRODUCT_VARIANTS
-- ============================================================================
DROP POLICY IF EXISTS "Admin can manage all variants" ON product_variants;
CREATE POLICY "Admin can manage all variants" ON product_variants
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- 5. RLS POLICIES — CATEGORIES
-- ============================================================================
DROP POLICY IF EXISTS "Admin can manage categories" ON categories;
CREATE POLICY "Admin can manage categories" ON categories
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- 6. RLS POLICIES — ORDERS (admin-only read + update)
-- ============================================================================
DROP POLICY IF EXISTS "Admin can read all orders" ON orders;
CREATE POLICY "Admin can read all orders" ON orders
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admin can update order status" ON orders;
CREATE POLICY "Admin can update order status" ON orders
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- 7. RLS POLICIES — ORDER_ITEMS (admin-only read)
-- ============================================================================
DROP POLICY IF EXISTS "Admin can read all order items" ON order_items;
CREATE POLICY "Admin can read all order items" ON order_items
  FOR SELECT USING (is_admin());

-- ============================================================================
-- 8. RLS POLICIES — SUBSCRIPTIONS (admin-only read + update)
-- ============================================================================
DROP POLICY IF EXISTS "Admin can read all subscriptions" ON subscriptions;
CREATE POLICY "Admin can read all subscriptions" ON subscriptions
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admin can update subscriptions" ON subscriptions;
CREATE POLICY "Admin can update subscriptions" ON subscriptions
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- ============================================================================
-- 9. STORAGE BUCKET FOR PRODUCT IMAGES
-- Run this separately in Supabase Dashboard → Storage → New Bucket
-- OR uncomment & run via SQL:
-- ============================================================================
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'product-images',
--   'product-images',
--   true,                            -- public bucket so image URLs work in frontend
--   5242880,                         -- 5MB max file size
--   ARRAY['image/jpeg','image/png','image/webp','image/gif']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Storage RLS for admins to upload/delete images
-- (Enable after creating the bucket)
-- DROP POLICY IF EXISTS "Admin upload product images" ON storage.objects;
-- CREATE POLICY "Admin upload product images" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'product-images' AND is_admin());
--
-- DROP POLICY IF EXISTS "Admin delete product images" ON storage.objects;
-- CREATE POLICY "Admin delete product images" ON storage.objects
--   FOR DELETE USING (bucket_id = 'product-images' AND is_admin());
--
-- DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
-- CREATE POLICY "Public read product images" ON storage.objects
--   FOR SELECT USING (bucket_id = 'product-images');

-- ============================================================================
-- HOW TO CREATE YOUR ADMIN ACCOUNT:
-- ============================================================================
-- Step 1: Go to Supabase Dashboard → Authentication → Users → Add User
--         Enter your admin email + a strong password → Create User
--         Copy the UUID of the created user.
--
-- Step 2: Run this SQL (replace the values):
--
--   INSERT INTO admin_profiles (id, email, role)
--   VALUES (
--     '<paste-uuid-from-step-1>',
--     'your-admin@email.com',
--     'admin'
--   );
--
-- Step 3: Log in at /admin/login.html using those credentials.
-- ============================================================================

