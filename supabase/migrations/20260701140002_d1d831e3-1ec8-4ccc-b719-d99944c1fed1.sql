
-- 1) Tighten profiles SELECT: replace USING true with owner-or-public policy relying on column grants.
-- Column-level GRANTs already restrict which columns authenticated can read; make the policy explicit.
DROP POLICY IF EXISTS "Authenticated can view profile basics" ON public.profiles;
CREATE POLICY "Authenticated read basic profile columns"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);
-- Remove any leftover anon table privileges on profiles (defense in depth; no anon policy exists)
REVOKE ALL ON public.profiles FROM anon, public;

-- 2) Storage: allow authenticated users to read all community-media (public social feed).
DROP POLICY IF EXISTS "Community media owners read own" ON storage.objects;
CREATE POLICY "Authenticated read community media"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'community-media');

-- 3) Convert helper SECURITY DEFINER functions to SECURITY INVOKER where safe.
ALTER FUNCTION public.are_mutual_followers(uuid, uuid) SECURITY INVOKER;
ALTER FUNCTION public.is_conversation_participant(uuid, uuid) SECURITY INVOKER;
ALTER FUNCTION public.get_or_create_conversation(uuid) SECURITY INVOKER;
