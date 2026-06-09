
-- Allow anon role (used by hardcoded admin login) to manage medicines and read transactions
-- NOTE: Hardcoded admin runs as anon since there's no real Supabase session

CREATE POLICY "Anon can manage medicines (hardcoded admin)"
ON public.medicines
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can read orders (hardcoded admin)"
ON public.orders
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can update orders (hardcoded admin)"
ON public.orders
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Anon can read order items (hardcoded admin)"
ON public.order_items
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon can read profiles (hardcoded admin)"
ON public.profiles
FOR SELECT
TO anon
USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicines TO anon;
GRANT SELECT, UPDATE ON public.orders TO anon;
GRANT SELECT ON public.order_items TO anon;
GRANT SELECT ON public.profiles TO anon;
