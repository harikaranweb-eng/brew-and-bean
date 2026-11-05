-- ============================================================================
-- BREW & BEAN — ADMIN PRODUCT PERMISSIONS & STORAGE FIX
-- Execute this script in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================
-- Ensures:
--   1. admin_profiles and is_admin() function are properly configured
--   2. Explicit INSERT, UPDATE, DELETE RLS policies on products and product_variants
--   3. Storage bucket 'product-images' exists, is public, and has RLS policies
-- ============================================================================

-- 1. Ensure is_admin() function has clean search_path and proper security definer
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'superadmin')
  );
$$;

-- 2. Grant schema and table permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON TABLE products TO authenticated;
GRANT ALL ON TABLE product_variants TO authenticated;
GRANT ALL ON TABLE categories TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. PRODUCTS RLS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view available products" ON products;
CREATE POLICY "Public can view available products" ON products
  FOR SELECT USING (is_available = true);

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

-- 4. PRODUCT_VARIANTS RLS Policies
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view product variants" ON product_variants;
CREATE POLICY "Public can view product variants" ON product_variants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can insert product variants" ON product_variants;
CREATE POLICY "Admin can insert product variants" ON product_variants
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can update product variants" ON product_variants;
CREATE POLICY "Admin can update product variants" ON product_variants
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can delete product variants" ON product_variants;
CREATE POLICY "Admin can delete product variants" ON product_variants
  FOR DELETE USING (is_admin());

-- 5. STORAGE BUCKET & POLICIES FOR PRODUCT IMAGES
-- Create public bucket 'product-images' if not already created
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admin can upload product images" ON storage.objects;
CREATE POLICY "Admin can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "Admin can update product images" ON storage.objects;
CREATE POLICY "Admin can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "Admin can delete product images" ON storage.objects;
CREATE POLICY "Admin can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND is_admin());

