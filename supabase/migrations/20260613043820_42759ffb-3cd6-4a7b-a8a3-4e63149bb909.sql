
-- Add submission tracking to medicines
ALTER TABLE public.medicines
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';

-- Allow authenticated users to submit medicines (pending approval)
DROP POLICY IF EXISTS "Users can submit medicines" ON public.medicines;
CREATE POLICY "Users can submit medicines"
  ON public.medicines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = submitted_by AND approval_status = 'pending');

DROP POLICY IF EXISTS "Users view own submissions" ON public.medicines;
CREATE POLICY "Users view own submissions"
  ON public.medicines FOR SELECT
  TO authenticated
  USING (auth.uid() = submitted_by);

-- Update active-view policy: only approved medicines shown publicly
DROP POLICY IF EXISTS "Anyone can view active medicines" ON public.medicines;
CREATE POLICY "Anyone can view active medicines"
  ON public.medicines FOR SELECT
  USING (
    (is_active = true AND approval_status = 'approved')
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Allow admin (hardcoded anon session) to read all profiles already exists.
-- Add user_roles read for anon (so admin page can list users with their roles)
DROP POLICY IF EXISTS "Anon can read user_roles (hardcoded admin)" ON public.user_roles;
CREATE POLICY "Anon can read user_roles (hardcoded admin)"
  ON public.user_roles FOR SELECT
  TO anon
  USING (true);

GRANT SELECT ON public.user_roles TO anon;
