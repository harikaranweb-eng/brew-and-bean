-- ============================================================================
-- BREW & BEAN — CUSTOMER AUTHENTICATION & PROFILES SYSTEM
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================================
-- Features:
--   1. customer_profiles table for normal website visitors
--   2. Safe RLS: Customers can ONLY read & update their own profile
--   3. Associates customer user_id with their orders
--   4. Customers can view their own orders and order items in "My Orders"
--   5. Preserves 100% guest checkout (user_id is optional / nullable)
--   6. Admin accounts in admin_profiles remain completely isolated
-- ============================================================================

-- 1. CUSTOMER PROFILES TABLE
CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);

-- Enable RLS on customer_profiles
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Customers can view their own profile only
DROP POLICY IF EXISTS "Customers can view own profile" ON customer_profiles;
CREATE POLICY "Customers can view own profile" ON customer_profiles
  FOR SELECT USING (auth.uid() = id);

-- Customers can insert their own profile
DROP POLICY IF EXISTS "Customers can insert own profile" ON customer_profiles;
CREATE POLICY "Customers can insert own profile" ON customer_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Customers can update their own profile only
DROP POLICY IF EXISTS "Customers can update own profile" ON customer_profiles;
CREATE POLICY "Customers can update own profile" ON customer_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. LINK ORDERS TO CUSTOMER ACCOUNTS (OPTIONAL USER_ID)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Enable customer RLS on orders (Customers can read their own orders)
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Customers can view their own order items
DROP POLICY IF EXISTS "Customers can view own order items" ON order_items;
CREATE POLICY "Customers can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- 3. UPDATE create_guest_order FUNCTION TO ACCEPT OPTIONAL p_user_id
CREATE OR REPLACE FUNCTION create_guest_order(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_delivery_address TEXT,
  p_city TEXT,
  p_pincode TEXT,
  p_payment_method TEXT,
  p_order_notes TEXT,
  p_items JSONB,
  p_order_type TEXT DEFAULT 'Home Delivery',
  p_user_id UUID DEFAULT NULL
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
  v_final_user_id UUID;
BEGIN
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
  
  -- Use auth.uid() if user is authenticated and p_user_id is not passed
  v_final_user_id := coalesce(p_user_id, auth.uid());

  -- 1. Calculate trusted subtotal from product_variants
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := (v_item->>'product_id')::INT;
    v_qty     := (v_item->>'quantity')::INT;
    v_size    := coalesce(v_item->>'size', 'Regular');

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;

    SELECT pv.price, p.name INTO v_variant_price, v_prod_name
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    WHERE pv.product_id = v_prod_id
      AND lower(trim(pv.size)) = lower(trim(v_size))
      AND p.is_available = true;

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
  IF p_order_type = 'Takeaway' THEN
    v_delivery_fee := 0;
  ELSIF v_active_sub.id IS NOT NULL AND v_active_sub.plan_name = 'Premium' THEN
    v_delivery_fee := 0; -- Free delivery for Premium subscribers
  ELSIF (v_subtotal - v_discount) > 499 THEN
    v_delivery_fee := 0; -- Free delivery for orders > ₹499
  ELSE
    v_delivery_fee := 30.00; -- Standard delivery fee
  END IF;

  v_total_amount := (v_subtotal - v_discount) + v_delivery_fee;

  -- 4. Insert Master Order with user_id
  INSERT INTO orders (
    order_number,
    user_id,
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
    v_final_user_id,
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

