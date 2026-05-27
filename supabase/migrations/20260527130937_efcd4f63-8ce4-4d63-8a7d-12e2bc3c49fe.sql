
-- 1) Require authenticated for social content reads
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Follows viewable by everyone" ON public.follows;
CREATE POLICY "Follows viewable by authenticated"
  ON public.follows FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Posts viewable by everyone" ON public.posts;
CREATE POLICY "Posts viewable by authenticated"
  ON public.posts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.post_comments;
CREATE POLICY "Comments viewable by authenticated"
  ON public.post_comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.post_likes;
CREATE POLICY "Likes viewable by authenticated"
  ON public.post_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Active stories viewable by everyone" ON public.stories;
CREATE POLICY "Active stories viewable by authenticated"
  ON public.stories FOR SELECT TO authenticated USING (expires_at > now());

-- Revoke anon table grants so reads truly require auth
REVOKE SELECT ON public.profiles, public.follows, public.posts,
                  public.post_comments, public.post_likes, public.stories
  FROM anon;

GRANT SELECT ON public.profiles, public.follows, public.posts,
                  public.post_comments, public.post_likes, public.stories
  TO authenticated;

-- 2) Storage: stop allowing listing of public buckets via storage.objects
DROP POLICY IF EXISTS "Avatars publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Community media public read" ON storage.objects;

-- Owners can still list/manage their own files; public CDN URLs continue to serve files
CREATE POLICY "Avatar owners read own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Community media owners read own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'community-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 3) Lock down SECURITY DEFINER functions from anon
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_comment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_follow() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_follow_accept() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_like() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_comments_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_likes_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_reposts_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_conversation_last_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.are_mutual_followers(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) FROM anon;
