-- ============================================================================
-- BREW & BEAN — SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Complete schema for Guest Checkout Coffee Shop E-Commerce
-- Features:
--   1. 31 Approved Client Products with Size/Flavor Variants
--   2. Delivery Settings: ₹30 fee, Free > ₹499 or Takeaway or Premium Subscriber
--   3. Subscription Plans: Simple (₹49/mo - 5% off) & Premium (₹99/mo - 10% off + Free Delivery)
--   4. RLS enabled on all tables
--   5. Server-side price recalculation & order number generation via RPC
--   6. Secure guest order tracking requiring (order_number + customer_phone)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 2. PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL,
  category_id INT REFERENCES categories(id),
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  badge TEXT DEFAULT '',
  rating NUMERIC(2, 1) DEFAULT 4.8,
  reviews INT DEFAULT 120,
  ingredients TEXT,
  calories TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);

-- ============================================================================
-- 3. PRODUCT_VARIANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL, -- 'Small', 'Medium', 'Large', 'Regular', 'Choco', 'Blueberry'
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (product_id, size)
);

CREATE INDEX IF NOT EXISTS idx_product_variants_prod ON product_variants(product_id);

-- ============================================================================
-- 4. ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  city TEXT NOT NULL,
  pincode TEXT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 30 CHECK (delivery_fee >= 0),
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery',
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
  order_status TEXT NOT NULL DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')),
  order_type TEXT NOT NULL DEFAULT 'Home Delivery' CHECK (order_type IN ('Home Delivery', 'Takeaway')),
  order_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================================================
-- 5. ORDER_ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INT NOT NULL REFERENCES products(id),
  variant_id INT REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  product_price NUMERIC(10, 2) NOT NULL CHECK (product_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  selected_size TEXT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================================================
-- 6. SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_ref TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  plan_name TEXT NOT NULL CHECK (plan_name IN ('Simple', 'Premium')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount IN (49.00, 99.00)),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed')),
  subscription_status TEXT NOT NULL DEFAULT 'Pending' CHECK (subscription_status IN ('Pending', 'Active', 'Cancelled', 'Expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_phone ON subscriptions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(subscription_status);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view categories" ON categories;
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view available products" ON products;
CREATE POLICY "Public can view available products" ON products FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Public can view product variants" ON product_variants;
CREATE POLICY "Public can view product variants" ON product_variants FOR SELECT USING (true);

-- ============================================================================
-- 8. STORED PROCEDURES (RPC)
-- ============================================================================

-- Function 1: create_guest_order
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

-- Function 2: track_guest_order
CREATE OR REPLACE FUNCTION track_guest_order(
  p_order_number TEXT,
  p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_items JSONB;
  v_clean_phone TEXT;
BEGIN
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');

  SELECT * INTO v_order
  FROM orders
  WHERE upper(trim(order_number)) = upper(trim(p_order_number))
    AND regexp_replace(customer_phone, '\D', '', 'g') = v_clean_phone;

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No matching order found. Please check your Order Number and Mobile Number.'
    );
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'product_id', oi.product_id,
      'product_name', oi.product_name,
      'product_price', oi.product_price,
      'quantity', oi.quantity,
      'selected_size', oi.selected_size,
      'subtotal', oi.subtotal,
      'image_url', p.image_url
    )
  ) INTO v_items
  FROM order_items oi
  LEFT JOIN products p ON oi.product_id = p.id
  WHERE oi.order_id = v_order.id;

  RETURN jsonb_build_object(
    'success', true,
    'order', jsonb_build_object(
      'order_number', v_order.order_number,
      'customer_name', v_order.customer_name,
      'customer_phone', v_order.customer_phone,
      'customer_email', v_order.customer_email,
      'delivery_address', v_order.delivery_address,
      'city', v_order.city,
      'pincode', v_order.pincode,
      'subtotal', v_order.subtotal,
      'discount', v_order.discount_amount,
      'delivery_fee', v_order.delivery_fee,
      'total_amount', v_order.total_amount,
      'order_type', v_order.order_type,
      'payment_method', v_order.payment_method,
      'payment_status', v_order.payment_status,
      'order_status', v_order.order_status,
      'created_at', v_order.created_at,
      'items', coalesce(v_items, '[]'::jsonb)
    )
  );
END;
$$;

-- Function 3: create_guest_subscription
CREATE OR REPLACE FUNCTION create_guest_subscription(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_plan_name TEXT,
  p_is_demo_payment BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clean_phone TEXT;
  v_active_sub RECORD;
  v_amount NUMERIC(10,2);
  v_sub_ref TEXT;
  v_sub_id UUID;
  v_status TEXT;
  v_pay_status TEXT;
BEGIN
  v_clean_phone := regexp_replace(p_customer_phone, '\D', '', 'g');

  IF p_plan_name = 'Simple' THEN
    v_amount := 49.00;
  ELSIF p_plan_name = 'Premium' THEN
    v_amount := 99.00;
  ELSE
    RAISE EXCEPTION 'Invalid plan selected. Must be Simple or Premium.';
  END IF;

  SELECT * INTO v_active_sub
  FROM subscriptions
  WHERE regexp_replace(customer_phone, '\D', '', 'g') = v_clean_phone
    AND subscription_status = 'Active'
    AND end_date >= CURRENT_DATE;

  IF v_active_sub.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'An active subscription already exists for this phone number (' || v_active_sub.plan_name || ' Plan, Ref: ' || v_active_sub.subscription_ref || ').'
    );
  END IF;

  v_sub_ref := 'SUB-' || to_char(now(), 'YYYYMMDD') || '-' || floor(1000 + random() * 9000)::INT;

  IF p_is_demo_payment = true THEN
    v_status := 'Active';
    v_pay_status := 'Paid (Demo Verified)';
  ELSE
    v_status := 'Pending';
    v_pay_status := 'Pending';
  END IF;

  INSERT INTO subscriptions (
    subscription_ref,
    customer_name,
    customer_email,
    customer_phone,
    plan_name,
    amount,
    start_date,
    end_date,
    payment_status,
    subscription_status
  ) VALUES (
    v_sub_ref,
    trim(p_customer_name),
    lower(trim(p_customer_email)),
    v_clean_phone,
    p_plan_name,
    v_amount,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 month',
    v_pay_status,
    v_status
  ) RETURNING id INTO v_sub_id;

  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', v_sub_id,
    'subscription_ref', v_sub_ref,
    'plan_name', p_plan_name,
    'amount', v_amount,
    'status', v_status,
    'payment_status', v_pay_status,
    'end_date', (CURRENT_DATE + INTERVAL '1 month')
  );
END;
$$;

-- Function 4: cancel_guest_subscription
CREATE OR REPLACE FUNCTION cancel_guest_subscription(
  p_sub_ref TEXT,
  p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clean_phone TEXT;
  v_sub RECORD;
BEGIN
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');

  SELECT * INTO v_sub
  FROM subscriptions
  WHERE upper(trim(subscription_ref)) = upper(trim(p_sub_ref))
    AND regexp_replace(customer_phone, '\D', '', 'g') = v_clean_phone;

  IF v_sub.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No subscription found with matching Reference and Phone Number.'
    );
  END IF;

  IF v_sub.subscription_status = 'Cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Subscription is already cancelled.'
    );
  END IF;

  UPDATE subscriptions
  SET subscription_status = 'Cancelled'
  WHERE id = v_sub.id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Subscription ' || v_sub.subscription_ref || ' has been successfully cancelled.'
  );
END;
$$;
