-- Schema Part 3: Google Sign-In Pre-Registration Staff Invites
CREATE TABLE IF NOT EXISTS public.staff_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Only staff members with 'owner' role can manage (insert/select/delete) invites
CREATE POLICY "Owner can manage staff invites"
  ON public.staff_invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.id = auth.uid() AND staff.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE staff.id = auth.uid() AND staff.role = 'owner'
    )
  );
