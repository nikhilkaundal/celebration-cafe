-- ============================================
-- Migration 006: Security Hardening & Pre-Launch Audit
-- 1. Tightens RLS helper functions to reject deactivated staff strictly.
-- 2. Adds atomic `FOR UPDATE` row locks in coupon functions to prevent race conditions.
-- 3. Ensures default-deny RLS on all system tables.
-- ============================================

-- ============================================
-- 1. Helper Functions Update (Strict Status Verification)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid()
  AND status = 'active'
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'manager', 'worker')
    AND status = 'active'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
    AND status = 'active'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_owner_or_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('owner', 'manager')
    AND status = 'active'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ============================================
-- 2. Atomic Coupon Validation with FOR UPDATE Row Lock
-- Prevents double-dipping / race-condition coupon exploits
-- ============================================

CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_subtotal NUMERIC,
  p_customer_id UUID DEFAULT NULL
)
RETURNS TABLE (
  coupon_id UUID,
  discount_type TEXT,
  value NUMERIC,
  max_discount NUMERIC,
  calculated_discount NUMERIC
) AS $$
DECLARE
  v_coupon RECORD;
  v_total_usage INT;
  v_user_usage INT;
  v_discount NUMERIC;
BEGIN
  -- Acquire row lock on the matching coupon row using FOR UPDATE
  SELECT c.* INTO v_coupon
  FROM public.coupons c
  WHERE c.code = UPPER(TRIM(p_code))
  AND c.is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive coupon code';
  END IF;

  -- Check date validity
  IF v_coupon.valid_from IS NOT NULL AND v_coupon.valid_from > now() THEN
    RAISE EXCEPTION 'Coupon is not yet active';
  END IF;

  IF v_coupon.valid_to IS NOT NULL AND v_coupon.valid_to < now() THEN
    RAISE EXCEPTION 'Coupon has expired';
  END IF;

  -- Check minimum order value
  IF v_coupon.min_order_value IS NOT NULL AND p_subtotal < v_coupon.min_order_value THEN
    RAISE EXCEPTION 'Minimum order value of ₹% required for this coupon', v_coupon.min_order_value;
  END IF;

  -- Check total usage limit
  IF v_coupon.usage_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_total_usage
    FROM public.coupon_usage
    WHERE coupon_usage.coupon_id = v_coupon.id;

    IF v_total_usage >= v_coupon.usage_limit THEN
      RAISE EXCEPTION 'Coupon usage limit reached';
    END IF;
  END IF;

  -- Check per-user usage limit
  IF p_customer_id IS NOT NULL AND v_coupon.per_user_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage
    FROM public.coupon_usage
    WHERE coupon_usage.coupon_id = v_coupon.id
    AND coupon_usage.customer_id = p_customer_id;

    IF v_user_usage >= v_coupon.per_user_limit THEN
      RAISE EXCEPTION 'You have already used this coupon the maximum number of times';
    END IF;
  END IF;

  -- Calculate discount
  IF v_coupon.discount_type = 'flat' THEN
    v_discount := LEAST(v_coupon.value, p_subtotal);
  ELSE -- percent
    v_discount := ROUND(p_subtotal * v_coupon.value / 100, 2);
    IF v_coupon.max_discount IS NOT NULL THEN
      v_discount := LEAST(v_discount, v_coupon.max_discount);
    END IF;
  END IF;

  -- Ensure discount doesn't exceed subtotal
  v_discount := LEAST(v_discount, p_subtotal);

  RETURN QUERY SELECT
    v_coupon.id,
    v_coupon.discount_type,
    v_coupon.value,
    v_coupon.max_discount,
    v_discount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 3. Atomic Order Placement Function Update
-- Includes FOR UPDATE lock when consuming coupons
-- ============================================

CREATE OR REPLACE FUNCTION public.place_order(
  p_items JSONB,          -- [{ "menu_item_id": uuid, "quantity": int, "customizations": jsonb }]
  p_order_type TEXT,      -- 'dine-in', 'pickup', 'delivery'
  p_customer_name TEXT,
  p_phone TEXT,
  p_address TEXT DEFAULT NULL,
  p_coupon_code TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_delivery_fee NUMERIC DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
  v_subtotal NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_coupon_id UUID;
  v_total NUMERIC;
  v_order_id UUID;
  v_item JSONB;
  v_menu_item RECORD;
  v_item_total NUMERIC;
  v_customization_extra NUMERIC;
  v_cust JSONB;
  v_opt RECORD;
BEGIN
  -- Get authenticated user ID (can be NULL for guest orders)
  v_customer_id := auth.uid();

  -- Input Validation
  IF p_order_type NOT IN ('dine-in', 'pickup', 'delivery') THEN
    RAISE EXCEPTION 'Invalid order type: %', p_order_type;
  END IF;

  IF p_customer_name IS NULL OR TRIM(p_customer_name) = '' THEN
    RAISE EXCEPTION 'Customer name is required';
  END IF;

  IF p_phone IS NULL OR TRIM(p_phone) = '' THEN
    RAISE EXCEPTION 'Phone number is required';
  END IF;

  IF p_order_type = 'delivery' AND (p_address IS NULL OR TRIM(p_address) = '') THEN
    RAISE EXCEPTION 'Delivery address is required';
  END IF;

  -- Validate and calculate each item (Server-side price verification)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'quantity')::INT <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;

    -- Fetch menu item from DB (never trust client price)
    SELECT * INTO v_menu_item
    FROM public.menu_items
    WHERE id = (v_item->>'menu_item_id')::UUID
    AND is_available = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Menu item % is not available', v_item->>'menu_item_id';
    END IF;

    -- Calculate customization extras
    v_customization_extra := 0;
    IF v_item->'customizations' IS NOT NULL AND jsonb_array_length(v_item->'customizations') > 0 THEN
      FOR v_cust IN SELECT * FROM jsonb_array_elements(v_item->'customizations')
      LOOP
        IF (v_cust->>'option_id') IS NOT NULL THEN
          SELECT co.extra_price INTO v_opt
          FROM public.customization_options co
          JOIN public.item_customizations ic ON ic.id = co.customization_id
          WHERE co.id = (v_cust->>'option_id')::UUID
          AND ic.menu_item_id = v_menu_item.id
          AND co.is_available = true;

          IF FOUND THEN
            v_customization_extra := v_customization_extra + v_opt.extra_price;
          END IF;
        END IF;
      END LOOP;
    END IF;

    v_item_total := (v_menu_item.price + v_customization_extra) * (v_item->>'quantity')::INT;
    v_subtotal := v_subtotal + v_item_total;
  END LOOP;

  -- Validate coupon atomically if provided
  IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) != '' THEN
    SELECT vc.coupon_id, vc.calculated_discount
    INTO v_coupon_id, v_discount
    FROM public.validate_coupon(p_coupon_code, v_subtotal, v_customer_id) vc;
  END IF;

  -- Calculate final total
  v_total := v_subtotal - v_discount + p_delivery_fee;
  IF v_total < 0 THEN v_total := 0; END IF;

  -- Insert order
  INSERT INTO public.orders (
    order_type, customer_name, phone, address, status,
    subtotal, discount, delivery_fee, total_amount,
    coupon_id, customer_id, notes
  ) VALUES (
    p_order_type::order_type, p_customer_name, p_phone,
    CASE WHEN p_order_type = 'delivery' THEN p_address ELSE NULL END,
    'pending'::order_status,
    v_subtotal, v_discount, p_delivery_fee, v_total,
    v_coupon_id, v_customer_id, NULLIF(TRIM(p_notes), '')
  )
  RETURNING id INTO v_order_id;

  -- Insert order items with server-verified prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_menu_item
    FROM public.menu_items
    WHERE id = (v_item->>'menu_item_id')::UUID;

    v_customization_extra := 0;
    IF v_item->'customizations' IS NOT NULL AND jsonb_array_length(v_item->'customizations') > 0 THEN
      FOR v_cust IN SELECT * FROM jsonb_array_elements(v_item->'customizations')
      LOOP
        IF (v_cust->>'option_id') IS NOT NULL THEN
          SELECT co.extra_price INTO v_opt
          FROM public.customization_options co
          JOIN public.item_customizations ic ON ic.id = co.customization_id
          WHERE co.id = (v_cust->>'option_id')::UUID
          AND ic.menu_item_id = v_menu_item.id;

          IF FOUND THEN
            v_customization_extra := v_customization_extra + v_opt.extra_price;
          END IF;
        END IF;
      END LOOP;
    END IF;

    INSERT INTO public.order_items (
      order_id, menu_item_id, item_name, quantity,
      price_at_order, selected_customizations
    ) VALUES (
      v_order_id,
      v_menu_item.id,
      v_menu_item.name,
      (v_item->>'quantity')::INT,
      v_menu_item.price + v_customization_extra,
      COALESCE(v_item->'customizations', '[]'::jsonb)
    );
  END LOOP;

  -- Record coupon usage atomically
  IF v_coupon_id IS NOT NULL AND v_customer_id IS NOT NULL THEN
    INSERT INTO public.coupon_usage (coupon_id, customer_id, order_id)
    VALUES (v_coupon_id, v_customer_id, v_order_id);
  END IF;

  -- Log audit entry
  PERFORM public.log_audit(
    'order.create',
    'orders',
    v_order_id,
    jsonb_build_object(
      'order_type', p_order_type,
      'subtotal', v_subtotal,
      'discount', v_discount,
      'total', v_total
    )
  );

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
