
-- 1) Catch-all: grant Data API access to ALL existing public tables
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.relname AS t FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE c.relkind='r' AND n.nspname='public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', r.t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', r.t);
  END LOOP;
END $$;

-- Public-readable surfaces (profiles + posts feed + stories) need anon SELECT for non-logged previews / SEO
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.posts TO anon;
GRANT SELECT ON public.stories TO anon;
GRANT SELECT ON public.post_comments TO anon;
GRANT SELECT ON public.post_likes TO anon;

-- Grants on sequences (for inserts)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 2) Add new profile columns for richer onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('masculino','feminino','outro')),
  ADD COLUMN IF NOT EXISTS target_weight NUMERIC,
  ADD COLUMN IF NOT EXISTS activity_level TEXT CHECK (activity_level IN ('sedentario','leve','moderado','ativo','muito_ativo')),
  ADD COLUMN IF NOT EXISTS health_conditions TEXT,
  ADD COLUMN IF NOT EXISTS focus_areas TEXT;
