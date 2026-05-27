
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.daily_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  steps integer NOT NULL DEFAULT 0,
  calories integer NOT NULL DEFAULT 0,
  active_minutes integer NOT NULL DEFAULT 0,
  water_ml integer NOT NULL DEFAULT 0,
  steps_goal integer NOT NULL DEFAULT 10000,
  calories_goal integer NOT NULL DEFAULT 500,
  active_minutes_goal integer NOT NULL DEFAULT 60,
  water_ml_goal integer NOT NULL DEFAULT 2000,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_stats TO authenticated;
GRANT ALL ON public.daily_stats TO service_role;

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own daily stats"
  ON public.daily_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own daily stats"
  ON public.daily_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own daily stats"
  ON public.daily_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own daily stats"
  ON public.daily_stats FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER daily_stats_updated_at
  BEFORE UPDATE ON public.daily_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
