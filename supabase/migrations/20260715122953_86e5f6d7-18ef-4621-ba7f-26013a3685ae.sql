
-- Workout sessions: one row per executed workout
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_label TEXT,
  focus TEXT,
  workout_type TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  total_volume_kg NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_workout_sessions_user_started ON public.workout_sessions(user_id, started_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
GRANT ALL ON public.workout_sessions TO service_role;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workout_sessions select" ON public.workout_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own workout_sessions insert" ON public.workout_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own workout_sessions update" ON public.workout_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own workout_sessions delete" ON public.workout_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Exercise logs: one row per set
CREATE TABLE public.exercise_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT,
  set_index INTEGER NOT NULL,
  target_reps TEXT,
  reps INTEGER,
  weight_kg NUMERIC,
  rpe NUMERIC,
  rest_seconds INTEGER,
  done BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exercise_logs_user_ex ON public.exercise_logs(user_id, exercise_name, created_at DESC);
CREATE INDEX idx_exercise_logs_session ON public.exercise_logs(session_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_logs TO authenticated;
GRANT ALL ON public.exercise_logs TO service_role;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own exercise_logs select" ON public.exercise_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own exercise_logs insert" ON public.exercise_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own exercise_logs update" ON public.exercise_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own exercise_logs delete" ON public.exercise_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Personal records per exercise
CREATE TABLE public.exercise_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  best_weight_kg NUMERIC,
  best_reps INTEGER,
  best_volume_kg NUMERIC,
  best_est_1rm NUMERIC,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, exercise_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_records TO authenticated;
GRANT ALL ON public.exercise_records TO service_role;
ALTER TABLE public.exercise_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own exercise_records select" ON public.exercise_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own exercise_records insert" ON public.exercise_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own exercise_records update" ON public.exercise_records FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own exercise_records delete" ON public.exercise_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger: update exercise_records automatically when a set is logged as done
CREATE OR REPLACE FUNCTION public.update_exercise_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  est_1rm NUMERIC;
  volume NUMERIC;
BEGIN
  IF NEW.done IS NOT TRUE OR NEW.reps IS NULL OR NEW.weight_kg IS NULL OR NEW.weight_kg <= 0 THEN
    RETURN NEW;
  END IF;
  est_1rm := NEW.weight_kg * (1 + NEW.reps::NUMERIC / 30.0);
  volume := NEW.weight_kg * NEW.reps;

  INSERT INTO public.exercise_records (user_id, exercise_name, best_weight_kg, best_reps, best_volume_kg, best_est_1rm, updated_at)
  VALUES (NEW.user_id, NEW.exercise_name, NEW.weight_kg, NEW.reps, volume, est_1rm, now())
  ON CONFLICT (user_id, exercise_name) DO UPDATE SET
    best_weight_kg = GREATEST(public.exercise_records.best_weight_kg, EXCLUDED.best_weight_kg),
    best_reps = GREATEST(public.exercise_records.best_reps, EXCLUDED.best_reps),
    best_volume_kg = GREATEST(public.exercise_records.best_volume_kg, EXCLUDED.best_volume_kg),
    best_est_1rm = GREATEST(public.exercise_records.best_est_1rm, EXCLUDED.best_est_1rm),
    updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.update_exercise_record() FROM PUBLIC, anon;

CREATE TRIGGER trg_exercise_logs_record
AFTER INSERT OR UPDATE OF done, reps, weight_kg ON public.exercise_logs
FOR EACH ROW EXECUTE FUNCTION public.update_exercise_record();
