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
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <img src={logo} alt="MultiFit" className="w-12 h-12 object-contain" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Olá,</p>
            <h1 className="text-2xl font-black font-display tracking-tight leading-tight">
              {isProfileComplete ? profile!.name.split(" ")[0] : "Atleta"}{" "}
              <span className="premium-gradient-text">MultiFit</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/notifications")}
            className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            title="Notificações"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>
            )}
          </button>
          <StreakBadge days={7} />
          <button
            onClick={() => navigate("/profile")}
            className="w-10 h-10 rounded-full bg-gradient-primary p-[2px] shadow-neon"
            title="Meu perfil"
          >
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <SafeImg src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-primary" />
              )}
            </div>
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-premium rounded-2xl p-5 mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <TrendingUp size={48} className="text-primary" />
        </div>
        <p className="text-sm text-foreground/90 italic font-medium leading-relaxed relative z-10">
          "{quote}"
        </p>
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

      <div className="flex items-end justify-between mb-4 px-1">
        <h2 className="text-xl font-black font-display tracking-tight">Atividade</h2>
        <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest bg-secondary/50 px-2 py-0.5 rounded-full border border-white/5">Auto-save on</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <EditableStatCard
          icon={Flame} label="Calorias" variant="primary"
          value={stats?.calories ?? 0} goal={stats?.calories_goal ?? 500} unit="kcal"
          quickSteps={[50, 200]}
          onChange={(v) => update({ calories: v })}
          className="premium-card-hover"
        />
        <EditableStatCard
          icon={Footprints} label="Passos" variant="accent"
          value={stats?.steps ?? 0} goal={stats?.steps_goal ?? 10000}
          quickSteps={[500, 2000]}
          onChange={(v) => update({ steps: v })}
          className="premium-card-hover"
        />
        <EditableStatCard
          icon={Timer} label="Tempo ativo"
          value={stats?.active_minutes ?? 0} goal={stats?.active_minutes_goal ?? 60} unit="min"
          quickSteps={[10, 30]}
          onChange={(v) => update({ active_minutes: v })}
          className="premium-card-hover"
        />
        <EditableStatCard
          icon={Droplet} label="Água"
          value={stats?.water_ml ?? 0} goal={stats?.water_ml_goal ?? 2000} unit="ml"
          quickSteps={[250, 500]}
          onChange={(v) => update({ water_ml: v })}
          className="premium-card-hover"
        />
      </div>

      <h2 className="text-lg font-bold font-display mb-3">Acesso Rápido</h2>
      <div className="grid grid-cols-2 gap-4 mb-8 stagger-load">
        {[
          { icon: Dumbbell, label: "Meu Treino", path: "/workouts", color: "primary", delay: "stagger-1" },
          { icon: Bot, label: "Falar c/ Coach", path: "/chat", color: "accent", delay: "stagger-2" },
          { icon: Apple, label: "Nutrição", path: "/nutrition", color: "primary", delay: "stagger-3" },
          { icon: TrendingUp, label: "Evolução", path: "/dashboard", color: "accent", delay: "stagger-4" },
        ].map((item) => (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(item.path)}
            className={`glass-premium rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-300 hover:border-primary/40 group ${item.delay}`}
          >
            <div className={`p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110 ${item.color === "primary" ? "bg-primary/10 shadow-[0_0_15px_rgba(132,204,22,0.1)]" : "bg-accent/10 shadow-[0_0_15px_rgba(132,204,22,0.1)]"}`}>
              <item.icon size={26} className={item.color === "primary" ? "text-primary" : "text-accent"} />
            </div>
            <span className="text-sm font-semibold tracking-tight">{item.label}</span>
          </motion.button>
        ))}
      </div>

      <h2 className="text-lg font-bold font-display mb-3 px-1">Esta Semana</h2>
      <div className="glass-premium rounded-3xl p-6 mb-10 stagger-load stagger-5">
        <div className="flex justify-between items-end mb-6">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-bold">{d}</span>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold transition-all ${
                  i < 5
                    ? "bg-gradient-primary text-primary-foreground shadow-neon scale-110"
                    : i === 5
                    ? "border-2 border-primary/40 text-primary"
                    : "bg-secondary/50 text-muted-foreground"
                }`}
              >
                {i < 5 ? "✓" : ""}
              </motion.div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Progresso semanal</span>
          <span className="text-primary font-bold">5 de 7 treinos</span>
        </div>
        <div className="mt-2 h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "71%" }}
            className="h-full bg-gradient-primary"
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
