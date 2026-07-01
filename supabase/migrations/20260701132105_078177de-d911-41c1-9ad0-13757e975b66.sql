-- Restrict SELECT on profiles to owner only, expose safe fields via a view
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;

CREATE POLICY "Owner can select own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Public-safe view exposing only non-sensitive fields
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  user_id,
  username,
  name,
  avatar_url,
  bio,
  is_private,
  level,
  goal,
  created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
REVOKE ALL ON public.public_profiles FROM anon;