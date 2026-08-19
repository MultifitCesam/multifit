import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DailyStats {
  id?: string;
  user_id: string;
  day: string; // YYYY-MM-DD
  steps: number;
  calories: number;
  active_minutes: number;
  water_ml: number;
  steps_goal: number;
  calories_goal: number;
  active_minutes_goal: number;
  water_ml_goal: number;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const empty = (user_id: string): DailyStats => ({
  user_id,
  day: todayStr(),
  steps: 0,
  calories: 0,
  active_minutes: 0,
  water_ml: 0,
  steps_goal: 10000,
  calories_goal: 500,
  active_minutes_goal: 60,
  water_ml_goal: 2000,
});

export function useDailyStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setStats(null); setLoading(false); return; }
    setLoading(true);
    const day = todayStr();
    const { data } = await supabase
      .from("daily_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("day", day)
      .maybeSingle();
    setStats(data ? (data as DailyStats) : empty(user.id));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const update = useCallback(async (patch: Partial<DailyStats>) => {
    if (!user) return;
    const base = stats ?? empty(user.id);
    const next: DailyStats = { ...base, ...patch, user_id: user.id, day: todayStr() };
    setStats(next);
    const { id, ...row } = next;
    await supabase.from("daily_stats").upsert(row, { onConflict: "user_id,day" });
  }, [stats, user?.id]);

  const add = useCallback((field: "steps" | "calories" | "active_minutes" | "water_ml", delta: number) => {
    if (!stats) return;
    const v = Math.max(0, (stats[field] ?? 0) + delta);
    return update({ [field]: v } as Partial<DailyStats>);
  }, [stats, update]);

  const getHistory = useCallback(async (days = 7) => {
    if (!user) return [];
    const { data } = await supabase
      .from("daily_stats")
      .select("*")
      .eq("user_id", user.id)
      .order("day", { ascending: false })
      .limit(days);
    return (data || []) as DailyStats[];
  }, [user?.id]);

  return { stats, loading, update, add, reload: load, getHistory };
}
