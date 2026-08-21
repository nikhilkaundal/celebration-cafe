-- ============================================
-- Migration 008: Supabase Storage Bucket for Menu Images
-- Creates public bucket 'menu-images' with staff-only RLS write policies.
-- ============================================

-- 1. Create 'menu-images' bucket if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Public Read Access for Menu Images" ON storage.objects;
DROP POLICY IF EXISTS "Staff Upload Access for Menu Images" ON storage.objects;
DROP POLICY IF EXISTS "Staff Update Access for Menu Images" ON storage.objects;
DROP POLICY IF EXISTS "Staff Delete Access for Menu Images" ON storage.objects;

-- 3. Public READ policy (anyone can view menu dish images)
CREATE POLICY "Public Read Access for Menu Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- 4. Staff INSERT policy (only authenticated active staff can upload dish images)
CREATE POLICY "Staff Upload Access for Menu Images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'manager', 'worker')
      AND status = 'active'
    )
  )
);

-- 5. Staff UPDATE policy
CREATE POLICY "Staff Update Access for Menu Images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-images'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'manager', 'worker')
      AND status = 'active'
    )
  )
);

-- 6. Staff DELETE policy
CREATE POLICY "Staff Delete Access for Menu Images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-images'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'manager', 'worker')
      AND status = 'active'
    )
  )
);
