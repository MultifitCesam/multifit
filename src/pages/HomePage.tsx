import { useEffect, useState } from "react";
import { SafeImg, SafeVideo } from "@/components/SafeMedia";
import { motion } from "framer-motion";
import { Dumbbell, Flame, Footprints, Timer, TrendingUp, Zap, Moon, Bot, Apple, User, Bell, Droplet } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import EditableStatCard from "@/components/EditableStatCard";
import StreakBadge from "@/components/StreakBadge";
import { useProfile } from "@/hooks/useProfile";
import { useDailyStats } from "@/hooks/useDailyStats";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/multifit-logo.png";

const quotes = [
  "O corpo alcança o que a mente acredita. 💪",
  "Disciplina é o que te move quando a motivação falha.",
  "Cada treino te aproxima do seu melhor. 🔥",
  "Não pare quando estiver cansado. Pare quando terminar.",
  "Seu único limite é você mesmo.",
];

import { HomePageSkeleton } from "@/components/PremiumSkeletons";

export default function HomePage() {
  const { profile, loading: profileLoading } = useProfile();
  const { stats, update, loading: statsLoading } = useDailyStats();
  const { user } = useAuth();
  const navigate = useNavigate();
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const [unread, setUnread] = useState(0);
  const loading = profileLoading || statsLoading;

  // First-time users: send to onboarding wizard
  useEffect(() => {
    if (!loading && profile && !(profile as any).onboarded) {
      navigate("/onboarding", { replace: true });
    }
  }, [loading, profile, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false);
      setUnread(count ?? 0);
    };
    load();
    const ch = supabase.channel("home-notifs").on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const isProfileComplete = !!profile?.name && (profile as any)?.onboarded;

  if (loading) return <HomePageSkeleton />;

  return (
    <div className="min-h-screen pb-24 px-5 pt-8 max-w-lg mx-auto bg-background">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--bg-success))] flex items-center justify-center">
            <Flame size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground font-medium">Olá,</p>
            <h1 className="text-base font-medium text-foreground leading-tight">
              {isProfileComplete ? profile!.name.split(" ")[0] : "Atleta"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate("/notifications")}
            className="w-9 h-9 rounded-full bg-secondary border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Notificações"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="w-9 h-9 rounded-full bg-[hsl(var(--bg-success))] flex items-center justify-center overflow-hidden"
            title="Meu perfil"
          >
            {profile?.avatar_url ? (
              <SafeImg src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-primary" />
            )}
          </button>
        </div>
      </motion.div>


      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[hsl(var(--bg-success))] rounded-[14px] p-4 mb-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Flame size={18} className="text-primary" />
          <span className="text-sm font-medium text-primary">7 dias seguidos</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-secondary border border-border/50 rounded-[14px] p-4 mb-6 italic text-sm text-muted-foreground"
      >
        "{quote}"
      </motion.div>


      {!isProfileComplete && !loading && (
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate("/onboarding")}
          className="w-full bg-gradient-primary text-primary-foreground rounded-2xl p-5 mb-6 text-left"
        >
          <div className="flex items-center gap-3">
            <Zap size={24} />
            <div>
              <p className="font-bold font-display">Configure seu perfil</p>
              <p className="text-xs opacity-80">Para gerar treinos personalizados com IA</p>
            </div>
          </div>
        </motion.button>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-foreground">Atividade de hoje</h2>
        <span className="text-[11px] text-muted-foreground font-medium">salvo automaticamente</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <EditableStatCard
          icon={Flame} label="Calorias" variant="primary"
          value={stats?.calories ?? 0} goal={stats?.calories_goal ?? 500} unit="kcal"
          quickSteps={[50, 200]}
          onChange={(v) => update({ calories: v })}
        />
        <EditableStatCard
          icon={Footprints} label="Passos" variant="accent"
          value={stats?.steps ?? 0} goal={stats?.steps_goal ?? 10000}
          quickSteps={[500, 2000]}
          onChange={(v) => update({ steps: v })}
        />
        <EditableStatCard
          icon={Timer} label="Tempo ativo"
          value={stats?.active_minutes ?? 0} goal={stats?.active_minutes_goal ?? 60} unit="min"
          quickSteps={[10, 30]}
          onChange={(v) => update({ active_minutes: v })}
        />
        <EditableStatCard
          icon={Droplet} label="Água"
          value={stats?.water_ml ?? 0} goal={stats?.water_ml_goal ?? 2000} unit="ml"
          quickSteps={[250, 500]}
          onChange={(v) => update({ water_ml: v })}
        />
      </div>


      <h2 className="text-base font-medium text-foreground mb-4">Acesso rápido</h2>
      <div className="grid grid-cols-2 gap-4 mb-8 stagger-load">
        {[
          { icon: Dumbbell, label: "Meu treino", path: "/workouts", sub: "plano atual" },
          { icon: Bot, label: "Coach IA", path: "/chat", sub: "tirar dúvidas" },
          { icon: Apple, label: "Nutrição", path: "/nutrition", sub: "plano alimentar" },
          { icon: TrendingUp, label: "Evolução", path: "/dashboard", sub: "ver estatísticas" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="bg-secondary border border-border/50 rounded-[14px] p-4 text-left group active:scale-[0.98] transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-background border border-border/50 flex items-center justify-center mb-3 text-muted-foreground group-hover:text-primary transition-colors">
              <item.icon size={18} />
            </div>
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="text-[11px] text-muted-foreground">{item.sub}</p>
          </button>
        ))}

      </div>

      <h2 className="text-base font-medium text-foreground mb-4">Esta semana</h2>
      <div className="bg-secondary border border-border/50 rounded-[20px] p-5 mb-10">
        <div className="flex justify-between items-end mb-6">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium">{d}</span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-medium transition-all ${
                  i < 5
                    ? "bg-primary text-primary-foreground"
                    : i === 5
                    ? "border border-primary/30 text-primary"
                    : "bg-background text-muted-foreground border border-border/50"
                }`}
              >
                {i < 5 ? "✓" : ""}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[12px] mb-2">
          <span className="text-muted-foreground font-medium">Progresso semanal</span>
          <span className="text-foreground font-semibold">5 de 7 treinos</span>
        </div>
        <div className="h-1 w-full bg-background rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "71%" }}
            className="h-full bg-primary"
          />
        </div>
      </div>


      <BottomNav />
    </div>
  );
}
