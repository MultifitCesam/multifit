
-- 1) Profiles: restrict write policies to authenticated role only
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2) are_mutual_followers: require caller to be one of the parties
CREATE OR REPLACE FUNCTION public.are_mutual_followers(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (auth.uid() = _a OR auth.uid() = _b)
    AND EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = _a AND following_id = _b AND status = 'accepted'
    )
    AND EXISTS (
      SELECT 1 FROM public.follows
      WHERE follower_id = _b AND following_id = _a AND status = 'accepted'
    );
$$;

-- 3) Conversations: restrict policies to authenticated, prevent duplicates via unique index
DROP POLICY IF EXISTS "Conv participants select" ON public.conversations;
DROP POLICY IF EXISTS "Conv participants update" ON public.conversations;
DROP POLICY IF EXISTS "Mutual followers create conv" ON public.conversations;

CREATE POLICY "Conv participants select" ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Conv participants update" ON public.conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Mutual followers create conv" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user1_id OR auth.uid() = user2_id)
    AND public.are_mutual_followers(user1_id, user2_id)
  );

CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_pair
  ON public.conversations (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id));

-- 4) Revoke broad EXECUTE on SECURITY DEFINER RPCs; grant to authenticated only
REVOKE ALL ON FUNCTION public.get_own_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_own_profile() TO authenticated;

REVOKE ALL ON FUNCTION public.get_or_create_conversation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;

-- Helper functions used inside RLS policies still need to be callable by authenticated
REVOKE ALL ON FUNCTION public.are_mutual_followers(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.are_mutual_followers(uuid, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;

-- 5) Realtime channel policies: only authenticated users receive postgres_changes events
DROP POLICY IF EXISTS "authenticated_postgres_changes_read" ON realtime.messages;
CREATE POLICY "authenticated_postgres_changes_read" ON realtime.messages
  FOR SELECT TO authenticated
  USING (extension = 'postgres_changes');
