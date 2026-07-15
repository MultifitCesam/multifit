// Rule-based workout progression (no AI). Reads recent exercise_logs and adjusts
// suggested load / reps / sets for the next session.

import { supabase } from "@/integrations/supabase/client";
import type { Exercise } from "./workout-generator";

export interface ProgressionSuggestion {
  suggestedWeightKg: number | null;
  suggestedReps: string;
  note: string; // human-readable why
}

interface RecentSet {
  reps: number | null;
  weight_kg: number | null;
  rpe: number | null;
  done: boolean;
  created_at: string;
}

const UPPER_KEYWORDS = ["Peito", "Costas", "Ombros", "Bíceps", "Tríceps"];

function repsBounds(target: string): { min: number; max: number } {
  // "10-12" -> {10,12}. "12" -> {12,12}. "12 cada" -> {12,12}. "20-30 min" -> nonsense, ignore.
  const m = target.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return { min: +m[1], max: +m[2] };
  const single = target.match(/^(\d+)/);
  if (single) return { min: +single[1], max: +single[1] };
  return { min: 0, max: 0 };
}

export async function fetchRecentSets(userId: string, exerciseName: string, limit = 8): Promise<RecentSet[]> {
  const { data } = await (supabase as any)
    .from("exercise_logs")
    .select("reps, weight_kg, rpe, done, created_at")
    .eq("user_id", userId)
    .eq("exercise_name", exerciseName)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as RecentSet[];
}

export function suggestNext(exercise: Exercise, recent: RecentSet[]): ProgressionSuggestion {
  const { min, max } = repsBounds(exercise.reps);
  if (recent.length === 0 || max === 0) {
    return { suggestedWeightKg: null, suggestedReps: exercise.reps, note: "Sem histórico — comece com carga confortável." };
  }

  const isUpper = UPPER_KEYWORDS.includes(exercise.muscleGroup);
  const increment = isUpper ? 2.5 : 5;
  const doneRecent = recent.filter((r) => r.done && r.weight_kg && r.reps);
  if (doneRecent.length === 0) {
    return { suggestedWeightKg: null, suggestedReps: exercise.reps, note: "Última tentativa não foi concluída — mantenha carga anterior." };
  }

  const lastWeight = Math.max(...doneRecent.map((r) => r.weight_kg!));
  const setsAtLastWeight = doneRecent.filter((r) => r.weight_kg === lastWeight);
  const allTopped = setsAtLastWeight.every((r) => (r.reps ?? 0) >= max);
  const avgRpe = setsAtLastWeight.reduce((a, r) => a + (r.rpe ?? 0), 0) / setsAtLastWeight.length;

  // Two consecutive failed sessions at same weight -> deload
  const failed = doneRecent.filter((r) => r.weight_kg === lastWeight && (r.reps ?? 0) < min).length;
  if (failed >= 2) {
    return {
      suggestedWeightKg: +(lastWeight * 0.9).toFixed(1),
      suggestedReps: exercise.reps,
      note: `Deload -10% (não completou ${min} reps recentemente).`,
    };
  }

  if (allTopped && avgRpe < 9) {
    return {
      suggestedWeightKg: lastWeight + increment,
      suggestedReps: exercise.reps,
      note: `+${increment}kg (concluiu topo da faixa com RPE ${avgRpe.toFixed(1) || "?"}).`,
    };
  }

  if (avgRpe >= 9) {
    return {
      suggestedWeightKg: lastWeight,
      suggestedReps: exercise.reps,
      note: `Mantenha ${lastWeight}kg — RPE alto, foque em consolidar.`,
    };
  }

  return {
    suggestedWeightKg: lastWeight,
    suggestedReps: exercise.reps,
    note: `Mantenha ${lastWeight}kg e busque o topo da faixa (${max} reps).`,
  };
}
