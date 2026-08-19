-- 1. Create tables
CREATE TABLE public.workout_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    plan_name text,
    started_at timestamptz default now(),
    ended_at timestamptz,
    duration_minutes int,
    notes text
);

CREATE TABLE public.exercise_logs (
    id uuid primary key default gen_random_uuid(),
    session_id uuid references public.workout_sessions(id) on delete cascade not null,
    exercise_name text not null,
    muscle_group text,
    set_index int not null,
    reps int,
    weight_kg numeric,
    rpe int,
    rest_seconds int,
    done boolean default false
);

CREATE TABLE public.exercise_records (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    exercise_name text not null,
    best_1rm_estimado numeric,
    best_volume numeric,
    best_reps int,
    unique (user_id, exercise_name)
);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_sessions TO authenticated;
GRANT ALL ON public.workout_sessions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_logs TO authenticated;
GRANT ALL ON public.exercise_logs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_records TO authenticated;
GRANT ALL ON public.exercise_records TO service_role;

-- 3. RLS
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their sessions" ON public.workout_sessions FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their logs" ON public.exercise_logs FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid()));
CREATE POLICY "Users can manage their records" ON public.exercise_records FOR ALL TO authenticated USING (auth.uid() = user_id);
