import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Clock, Minus, Plus, StopCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import type { Exercise, UserProfile } from "@/lib/workout-generator";
import { generateWorkoutPlan } from "@/lib/workout-generator";
import { fetchRecentSets, suggestNext } from "@/lib/progression";
import ExerciseVideo from "@/components/ExerciseVideo";
import { toast } from "@/hooks/use-toast";

interface SetRow {
  set_index: number;
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  done: boolean;
}

interface ExState {
  exercise: Exercise;
  sets: SetRow[];
  suggestion: string;
}

function useRestTimer() {
  const [seconds, setSeconds] = useState(0);
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : (setActive(false), 0))), 1000);
    return () => clearInterval(id);
  }, [active]);
  return {
    seconds, active,
    start: (s: number) => { setSeconds(s); setActive(true); },
    stop: () => { setActive(false); setSeconds(0); },
  };
}

export default function WorkoutSessionPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { profile } = useProfile();
  const dayIndex = Number(params.get("day") ?? "0");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [exState, setExState] = useState<ExState[]>([]);
  const [saving, setSaving] = useState(false);
  const rest = useRestTimer();

  const day = useMemo(() => {
    if (!profile) return null;
    const mapped: UserProfile = {
      name: profile.name, gender: (profile as any).gender ?? null,
      age: profile.age, weight: Number(profile.weight), height: Number(profile.height),
      level: profile.level, goal: profile.goal, bodyType: profile.body_type,
      sleepHours: Number(profile.sleep_hours), sleepQuality: profile.sleep_quality,
      weeklyFrequency: profile.weekly_frequency, trainingTime: profile.training_time,
      focusAreas: (profile as any).focus_areas ?? null, healthConditions: (profile as any).health_conditions ?? null,
    };
    return generateWorkoutPlan(mapped).weeklyPlan[dayIndex];
  }, [profile, dayIndex]);

  useEffect(() => {
    if (!day || !user || day.type === "descanso") return;
    (async () => {
      // Initialize per-exercise state with progression suggestion
      const states: ExState[] = [];
      for (const ex of day.exercises) {
        const recent = await fetchRecentSets(user.id, ex.name);
        const s = suggestNext(ex, recent);
        const sets: SetRow[] = Array.from({ length: ex.sets }, (_, i) => ({
          set_index: i + 1,
          reps: null,
          weight_kg: s.suggestedWeightKg,
          rpe: null,
          done: false,
        }));
        states.push({ exercise: ex, sets, suggestion: s.note });
      }
      setExState(states);

      // Create session
      const { data, error } = await (supabase as any)
        .from("workout_sessions")
        .insert({ user_id: user.id, day_label: day.day, focus: day.focus, workout_type: day.type })
        .select("id, started_at")
        .single();
      if (error) { toast({ title: "Erro ao iniciar sessão", description: error.message, variant: "destructive" }); return; }
      setSessionId(data.id);
      setStartedAt(new Date(data.started_at));
    })();
  }, [day, user]);

  if (!profile || !day) return <div className="p-6">Carregando...</div>;
  if (day.type === "descanso") {
    return (
      <div className="p-6 text-center">
        <p className="text-lg font-bold mb-2">Dia de descanso 😴</p>
        <button onClick={() => nav(-1)} className="text-primary underline">Voltar</button>
      </div>
    );
  }

  const updateSet = (eIdx: number, sIdx: number, patch: Partial<SetRow>) => {
    setExState((prev) => prev.map((e, i) => i !== eIdx ? e : {
      ...e, sets: e.sets.map((s, j) => j !== sIdx ? s : { ...s, ...patch })
    }));
  };

  const markDone = async (eIdx: number, sIdx: number) => {
    const ex = exState[eIdx];
    const set = ex.sets[sIdx];
    updateSet(eIdx, sIdx, { done: true });
    if (!sessionId || !user) return;
    const restSec = parseInt(ex.exercise.rest) || 60;
    await (supabase as any).from("exercise_logs").insert({
      session_id: sessionId, user_id: user.id,
      exercise_name: ex.exercise.name, muscle_group: ex.exercise.muscleGroup,
      set_index: set.set_index, target_reps: ex.exercise.reps,
      reps: set.reps, weight_kg: set.weight_kg, rpe: set.rpe,
      rest_seconds: restSec, done: true,
    });
    rest.start(restSec);
  };

  const finish = async () => {
    if (!sessionId || !startedAt) return;
    setSaving(true);
    const duration = Math.round((Date.now() - startedAt.getTime()) / 1000);
    const volume = exState.reduce((total, e) => total + e.sets.reduce((acc, s) => acc + (s.done && s.reps && s.weight_kg ? s.reps * s.weight_kg : 0), 0), 0);
    await (supabase as any).from("workout_sessions").update({
      finished_at: new Date().toISOString(),
      duration_seconds: duration,
      total_volume_kg: volume,
    }).eq("id", sessionId);
    toast({ title: "Treino concluído! 💪", description: `${Math.round(duration/60)} min • ${volume.toFixed(0)} kg de volume` });
    nav("/workouts");
  };

  return (
    <div className="min-h-screen pb-32 px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => nav(-1)} className="p-2 rounded-xl bg-secondary"><ArrowLeft size={18} /></button>
        <div>
          <h1 className="text-xl font-bold font-display">{day.day}</h1>
          <p className="text-xs text-muted-foreground">{day.focus}</p>
        </div>
      </div>

      {rest.active && (
        <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="glass glow-border rounded-2xl p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary"><Clock size={18} /><span className="font-bold">Descanso</span></div>
          <span className="text-2xl font-display font-bold">{rest.seconds}s</span>
          <button onClick={rest.stop} className="text-xs text-muted-foreground underline">pular</button>
        </motion.div>
      )}

      <div className="space-y-4">
        {exState.map((e, eIdx) => (
          <div key={eIdx} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-sm">{e.exercise.name}</p>
                <p className="text-[10px] text-muted-foreground">{e.exercise.muscleGroup} • alvo {e.exercise.reps}</p>
              </div>
              <ExerciseVideo exerciseName={e.exercise.name} />
            </div>
            <p className="text-[11px] text-primary/80 mb-3">💡 {e.suggestion}</p>

            <div className="space-y-2">
              {e.sets.map((s, sIdx) => (
                <div key={sIdx} className={`flex items-center gap-2 rounded-xl p-2 ${s.done ? "bg-primary/10" : "bg-secondary/50"}`}>
                  <span className="w-6 text-center text-xs font-bold">{s.set_index}</span>
                  <div className="flex-1 grid grid-cols-3 gap-1.5">
                    <input
                      type="number" inputMode="decimal" placeholder="kg"
                      value={s.weight_kg ?? ""}
                      onChange={(ev) => updateSet(eIdx, sIdx, { weight_kg: ev.target.value ? Number(ev.target.value) : null })}
                      className="bg-background/50 rounded px-2 py-1 text-sm w-full"
                      disabled={s.done}
                    />
                    <input
                      type="number" inputMode="numeric" placeholder="reps"
                      value={s.reps ?? ""}
                      onChange={(ev) => updateSet(eIdx, sIdx, { reps: ev.target.value ? Number(ev.target.value) : null })}
                      className="bg-background/50 rounded px-2 py-1 text-sm w-full"
                      disabled={s.done}
                    />
                    <input
                      type="number" inputMode="decimal" placeholder="RPE" step="0.5" min="1" max="10"
                      value={s.rpe ?? ""}
                      onChange={(ev) => updateSet(eIdx, sIdx, { rpe: ev.target.value ? Number(ev.target.value) : null })}
                      className="bg-background/50 rounded px-2 py-1 text-sm w-full"
                      disabled={s.done}
                    />
                  </div>
                  <button
                    onClick={() => markDone(eIdx, sIdx)}
                    disabled={s.done || !s.reps}
                    className={`p-2 rounded-lg ${s.done ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary disabled:opacity-40"}`}
                    aria-label="Concluir série"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-lg mx-auto">
          <button
            onClick={finish}
            disabled={saving}
            className="w-full bg-gradient-primary text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <StopCircle size={20} />
            {saving ? "Salvando..." : "Finalizar treino"}
          </button>
        </div>
      </div>
    </div>
  );
}
