-- ============================================
-- Migration 014: Restaurant Settings & Payment QR Bucket
-- Creates table 'restaurant_settings' and public bucket 'payment-qr' with Owner write access.
-- ============================================

-- 1. Create restaurant_settings table
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  payment_qr_url TEXT DEFAULT NULL,
  upi_id TEXT DEFAULT 'celebrationcafe@upi',
  restaurant_name TEXT DEFAULT 'Celebration Food Cafe',
  phone TEXT DEFAULT '9876543210',
  address TEXT DEFAULT 'Hamirpur, HP',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Insert default row
INSERT INTO public.restaurant_settings (id, payment_qr_url, upi_id)
VALUES ('default', NULL, 'celebrationcafe@upi')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Read Access for Restaurant Settings" ON public.restaurant_settings;
DROP POLICY IF EXISTS "Owner Write Access for Restaurant Settings" ON public.restaurant_settings;

-- Public READ policy
CREATE POLICY "Public Read Access for Restaurant Settings"
ON public.restaurant_settings FOR SELECT
USING (true);

-- Owner WRITE policy (INSERT/UPDATE/DELETE)
CREATE POLICY "Owner Write Access for Restaurant Settings"
ON public.restaurant_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'owner'
    AND status = 'active'
  )
);

-- 2. Create 'payment-qr' Storage Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-qr',
  'payment-qr',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing storage policies if any
DROP POLICY IF EXISTS "Public Read Access for Payment QR" ON storage.objects;
DROP POLICY IF EXISTS "Owner Upload Access for Payment QR" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Access for Payment QR" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Access for Payment QR" ON storage.objects;

-- Public READ policy for storage
CREATE POLICY "Public Read Access for Payment QR"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-qr');

-- Owner Upload Access
CREATE POLICY "Owner Upload Access for Payment QR"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-qr'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'owner'
      AND status = 'active'
    )
  )
);

-- Owner Update Access
CREATE POLICY "Owner Update Access for Payment QR"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'payment-qr'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'owner'
      AND status = 'active'
    )
  )
);

-- Owner Delete Access
CREATE POLICY "Owner Delete Access for Payment QR"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-qr'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'owner'
      AND status = 'active'
    )
  )
);
