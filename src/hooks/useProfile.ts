import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DBProfile {
  id: string;
  user_id: string;
  username: string;
  is_private: boolean;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  age: number;
  weight: number;
  height: number;
  level: "iniciante" | "intermediario" | "avancado";
  goal: "emagrecimento" | "hipertrofia" | "condicionamento" | "saude_mental" | "alta_performance";
  body_type: "ectomorfo" | "mesomorfo" | "endomorfo";
  sleep_hours: number;
  sleep_quality: "ruim" | "regular" | "boa" | "excelente";
  weekly_frequency: number;
  training_time: "manha" | "tarde" | "noite";
  allergies: string | null;
  dietary_restrictions: string | null;
  onboarded: boolean;
  gender: "masculino" | "feminino" | "outro" | null;
  target_weight: number | null;
  activity_level: "sedentario" | "leve" | "moderado" | "ativo" | "muito_ativo" | null;
  health_conditions: string | null;
  focus_areas: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DBProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase.rpc as any)("get_own_profile");
    if (!error && data && data.length > 0) setProfile(data[0] as DBProfile);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const updateProfile = async (updates: Partial<DBProfile>) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);
    if (error) console.error(error);
    else setProfile(prev => (prev ? { ...prev, ...updates } : prev));
    return { error };
  };

  return { profile, loading, updateProfile, reload: load };
}
