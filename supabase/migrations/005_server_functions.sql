-- ============================================
-- Migration 005: Server-Side Functions (Security Definer)
-- These functions run with elevated privileges and enforce business logic.
-- Client code calls these via supabase.rpc() instead of direct table operations.
-- Run AFTER all previous migrations.
-- ============================================

-- ============================================
-- 1. LOG AUDIT — Insert an audit log entry
-- Called internally by other functions and by API routes.
-- ============================================
CREATE OR REPLACE FUNCTION public.log_audit(
  p_action TEXT,
  p_entity TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.audit_logs (actor_id, action, entity, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity, p_entity_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 2. VALIDATE COUPON — Check if a coupon code is valid for the given order
-- Returns coupon details or raises an exception.
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
  -- Find the coupon
  SELECT c.* INTO v_coupon
  FROM public.coupons c
  WHERE c.code = UPPER(TRIM(p_code))
  AND c.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid coupon code';
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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ============================================
-- 3. PLACE ORDER — Server-side order creation
-- Validates items, recalculates prices, validates coupon, creates order + items.
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

  -- Validate order type
  IF p_order_type NOT IN ('dine-in', 'pickup', 'delivery') THEN
    RAISE EXCEPTION 'Invalid order type: %', p_order_type;
  END IF;

  -- Delivery requires address
  IF p_order_type = 'delivery' AND (p_address IS NULL OR TRIM(p_address) = '') THEN
    RAISE EXCEPTION 'Delivery address is required';
  END IF;

  -- Validate and calculate each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
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
        -- Verify the option exists and get its real price
        SELECT co.extra_price INTO v_opt
        FROM public.customization_options co
        JOIN public.item_customizations ic ON ic.id = co.customization_id
        WHERE co.id = (v_cust->>'option_id')::UUID
        AND ic.menu_item_id = v_menu_item.id
        AND co.is_available = true;

        IF FOUND THEN
          v_customization_extra := v_customization_extra + v_opt.extra_price;
        END IF;
      END LOOP;
    END IF;

    v_item_total := (v_menu_item.price + v_customization_extra) * (v_item->>'quantity')::INT;
    v_subtotal := v_subtotal + v_item_total;
  END LOOP;

  -- Validate coupon if provided
  IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) != '' THEN
    SELECT vc.coupon_id, vc.calculated_discount
    INTO v_coupon_id, v_discount
    FROM public.validate_coupon(p_coupon_code, v_subtotal, v_customer_id) vc;
  END IF;

  -- Calculate final total
  v_total := v_subtotal - v_discount + p_delivery_fee;
  IF v_total < 0 THEN v_total := 0; END IF;

  -- Insert the order
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

    -- Calculate customization extras again for per-item price
    v_customization_extra := 0;
    IF v_item->'customizations' IS NOT NULL AND jsonb_array_length(v_item->'customizations') > 0 THEN
      FOR v_cust IN SELECT * FROM jsonb_array_elements(v_item->'customizations')
      LOOP
        SELECT co.extra_price INTO v_opt
        FROM public.customization_options co
        JOIN public.item_customizations ic ON ic.id = co.customization_id
        WHERE co.id = (v_cust->>'option_id')::UUID
        AND ic.menu_item_id = v_menu_item.id;

        IF FOUND THEN
          v_customization_extra := v_customization_extra + v_opt.extra_price;
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

  -- Record coupon usage if coupon was applied
  IF v_coupon_id IS NOT NULL AND v_customer_id IS NOT NULL THEN
    INSERT INTO public.coupon_usage (coupon_id, customer_id, order_id)
    VALUES (v_coupon_id, v_customer_id, v_order_id);
  END IF;

  -- Log the order creation
  PERFORM public.log_audit(
    'order.create',
    'orders',
    v_order_id,
    jsonb_build_object(
      'order_type', p_order_type,
      'subtotal', v_subtotal,
      'discount', v_discount,
      'total', v_total,
      'items_count', jsonb_array_length(p_items)
    )
  );

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 4. UPDATE ORDER STATUS — Enforces state machine transitions
-- Only allows valid status changes and logs the action.
-- ============================================
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id UUID,
  p_new_status TEXT
)
RETURNS VOID AS $$
DECLARE
  v_current_status TEXT;
  v_allowed BOOLEAN := false;
BEGIN
  -- Verify caller is staff
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Only staff members can update order status';
  END IF;

  -- Get current status
  SELECT status::text INTO v_current_status
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- Define valid state transitions
  v_allowed := CASE
    WHEN v_current_status = 'pending'          AND p_new_status IN ('confirmed', 'preparing', 'cancelled') THEN true
    WHEN v_current_status = 'confirmed'        AND p_new_status IN ('preparing', 'cancelled')              THEN true
    WHEN v_current_status = 'preparing'        AND p_new_status IN ('ready', 'cancelled')                  THEN true
    WHEN v_current_status = 'ready'            AND p_new_status IN ('out-for-delivery', 'completed')       THEN true
    WHEN v_current_status = 'out-for-delivery' AND p_new_status = 'completed'                              THEN true
    ELSE false
  END;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Invalid status transition: % → %', v_current_status, p_new_status;
  END IF;

  -- Perform the update
  UPDATE public.orders
  SET
    status = p_new_status::order_status,
    updated_by = auth.uid(),
    updated_at = now()
  WHERE id = p_order_id;

  -- Log the status change
  PERFORM public.log_audit(
    'order.status_update',
    'orders',
    p_order_id,
    jsonb_build_object(
      'old_status', v_current_status,
      'new_status', p_new_status
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 5. Utility: Ensure only one default address per customer
-- ============================================
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.addresses
    SET is_default = false
    WHERE customer_id = NEW.customer_id
    AND id != NEW.id
    AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_default_address
  BEFORE INSERT OR UPDATE ON public.addresses
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION public.ensure_single_default_address();
