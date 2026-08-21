-- ============================================
-- Migration 013: Multi-Address Management with Coordinates & Delivery Zone Validation
-- Enhances addresses table, adds auto-promotion on delete, max 10 limit & RLS
-- ============================================

-- 1. Enhance addresses table with new columns
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS receiver_name TEXT,
  ADD COLUMN IF NOT EXISTS receiver_phone TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Himachal Pradesh',
  ADD COLUMN IF NOT EXISTS landmark TEXT,
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_addresses_customer_default ON public.addresses(customer_id, is_default);

-- 2. Trigger for updated_at
DROP TRIGGER IF EXISTS set_addresses_updated_at ON public.addresses;
CREATE TRIGGER set_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 3. Max 10 addresses limit trigger function
CREATE OR REPLACE FUNCTION public.check_max_addresses_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.addresses
  WHERE customer_id = NEW.customer_id;

  IF v_count >= 10 THEN
    RAISE EXCEPTION 'Maximum limit of 10 saved addresses reached per customer account.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_max_addresses_limit ON public.addresses;
CREATE TRIGGER enforce_max_addresses_limit
  BEFORE INSERT ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_addresses_limit();

-- 4. Auto-promote next address to default if deleted address was default
CREATE OR REPLACE FUNCTION public.handle_delete_address_default()
RETURNS TRIGGER AS $$
DECLARE
  v_next_id UUID;
BEGIN
  IF OLD.is_default = true THEN
    SELECT id INTO v_next_id
    FROM public.addresses
    WHERE customer_id = OLD.customer_id
    AND id != OLD.id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_next_id IS NOT NULL THEN
      UPDATE public.addresses
      SET is_default = true
      WHERE id = v_next_id;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_promote_default_address ON public.addresses;
CREATE TRIGGER auto_promote_default_address
  AFTER DELETE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_delete_address_default();

-- 5. RLS Policies for public.addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can CRUD own addresses" ON public.addresses;
CREATE POLICY "Customers can CRUD own addresses"
  ON public.addresses FOR ALL
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Staff view addresses" ON public.addresses;
CREATE POLICY "Staff view addresses"
  ON public.addresses FOR SELECT
  USING (public.is_staff(auth.uid()));
