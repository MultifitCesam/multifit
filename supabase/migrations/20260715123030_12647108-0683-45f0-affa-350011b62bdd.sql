
CREATE OR REPLACE FUNCTION public.update_exercise_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
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
