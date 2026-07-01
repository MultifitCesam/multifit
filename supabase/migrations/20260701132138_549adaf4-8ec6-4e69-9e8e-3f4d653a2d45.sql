-- Remove the SECURITY DEFINER view flagged by the linter
DROP VIEW IF EXISTS public.public_profiles;

-- Restore permissive row visibility, restrict sensitive columns via GRANTs
DROP POLICY IF EXISTS "Owner can select own profile" ON public.profiles;

CREATE POLICY "Authenticated can view profile basics"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Revoke blanket column access, grant only safe columns
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  user_id, username, name, avatar_url, bio, is_private, level, goal,
  onboarded, created_at, updated_at
) ON public.profiles TO authenticated;

-- Keep INSERT/UPDATE/DELETE at row level (RLS still enforces ownership)
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Owner RPC to read the full profile including sensitive fields
CREATE OR REPLACE FUNCTION public.get_own_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_own_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated;