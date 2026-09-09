import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Dumbbell, Play, Clock, Zap, RefreshCw } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import ExerciseVideo from "@/components/ExerciseVideo";
import { useProfile } from "@/hooks/useProfile";
import { WorkoutSkeleton } from "@/components/PremiumSkeletons";
import { generateWorkoutPlan, type WorkoutPlan, type WorkoutDay, type UserProfile } from "@/lib/workout-generator";

function WorkoutDayCard({ day, index, onStart }: { day: WorkoutDay; index: number; onStart: () => void }) {
  const [open, setOpen] = useState(false);

  if (day.type === "descanso") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-secondary/40 border border-border/30 rounded-[14px] p-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-background border border-border/50 flex items-center justify-center text-sm">😴</div>
          <div>
            <p className="font-medium text-sm text-foreground leading-tight mb-1">{day.day}</p>
            <p className="text-[12px] text-muted-foreground font-medium">descanso ativo — alongamento e recuperação</p>
          </div>
        </div>
      </motion.div>
    );
  }


  const typeIcon = day.type === "cardio" ? "🏃" : day.type === "funcional" ? "⚡" : "🏋️";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-secondary border border-border/50 rounded-[20px] overflow-hidden"
    >
      <button onClick={() => setOpen(!open)} className="w-full p-4 flex items-center justify-between group active:bg-background/20 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-background border border-border/50 flex items-center justify-center text-sm">{typeIcon}</div>
          <div className="text-left">
            <p className="font-medium text-sm text-foreground leading-tight mb-1">{day.day}</p>
            <p className="text-[12px] text-muted-foreground font-medium">{day.focus} • {day.exercises.length} exercícios</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>


      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {day.warmup && (
                <div className="bg-background border border-border/30 rounded-[14px] p-4">
                  <p className="text-[11px] font-medium text-primary uppercase mb-1.5 tracking-tight">🔥 aquecimento</p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{day.warmup}</p>
                </div>
              )}
              {day.exercises.map((ex, i) => (
                <div key={i} className="bg-background border border-border/30 rounded-[14px] p-4">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <p className="text-sm font-medium flex-1 text-foreground leading-tight">{ex.name}</p>
                    <span className="text-[10px] text-primary font-medium uppercase px-2 py-0.5">{ex.muscleGroup}</span>
                    <ExerciseVideo exerciseName={ex.name} />
                  </div>
                  <p className="text-[12px] text-muted-foreground font-normal leading-relaxed mb-2">{ex.description}</p>
                  {ex.tip && (
                    <p className="text-[12px] text-primary leading-relaxed mb-3">💡 {ex.tip}</p>
                  )}
                  <div className="flex gap-4 text-[11px] text-muted-foreground font-medium uppercase">
                    <span className="flex items-center gap-1.5"><Dumbbell size={14} /> {ex.sets}x{ex.reps}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} /> {ex.rest}</span>
                  </div>
                </div>
              ))}
              <button
                onClick={(e) => { e.stopPropagation(); onStart(); }}
                className="w-full mt-2 bg-primary text-primary-foreground font-semibold py-4 rounded-[14px] flex items-center justify-center gap-2"
              >
                <Play size={16} /> Executar treino
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function WorkoutsPage() {
  const nav = useNavigate();
  const { profile, loading } = useProfile();
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const isProfileComplete = !!profile?.name;

  const handleGenerate = () => {
    if (!profile) return;
    const mapped: UserProfile = {
      name: profile.name,
      gender: (profile as any).gender ?? null,
      age: profile.age,
      weight: Number(profile.weight),
      height: Number(profile.height),
      level: profile.level,
      goal: profile.goal,
      bodyType: profile.body_type,
      sleepHours: Number(profile.sleep_hours),
      sleepQuality: profile.sleep_quality,
      weeklyFrequency: profile.weekly_frequency,
      trainingTime: profile.training_time,
      focusAreas: (profile as any).focus_areas ?? null,
      healthConditions: (profile as any).health_conditions ?? null,
    };

    setPlan(generateWorkoutPlan(mapped));
  };

  return (
    <div className="min-h-screen pb-24 px-5 pt-8 max-w-lg mx-auto bg-background">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-medium text-foreground">Meus treinos</h1>
        {plan && (
          <button onClick={handleGenerate} className="p-2.5 rounded-xl bg-secondary border border-border/50 text-muted-foreground active:scale-95 transition-all">
            <RefreshCw size={18} />
          </button>
        )}
      </div>

      {!plan ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="w-16 h-16 rounded-[20px] bg-[hsl(var(--bg-success))] flex items-center justify-center mx-auto mb-6">
            <Zap size={28} className="text-primary" />
          </div>
          <h2 className="text-base font-medium text-foreground mb-2">Gere seu treino com IA</h2>
          <p className="text-[13px] text-muted-foreground mb-8 max-w-[240px] mx-auto leading-relaxed">
            {isProfileComplete
              ? "Baseado no seu perfil, vamos criar o plano perfeito para você."
              : "Complete seu perfil primeiro para treinos personalizados."}
          </p>
          <button
            onClick={handleGenerate}
            className="bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-[14px] flex items-center gap-2 mx-auto active:scale-[0.98] transition-all"
          >
            <Play size={16} />
            Gerar treino agora
          </button>
        </motion.div>
      ) : loading ? (
        <WorkoutSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Explanation */}
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="bg-secondary border border-border/50 rounded-[20px] p-5 mb-2">
            <p className="text-[11px] font-medium text-primary uppercase mb-1.5 tracking-tight">🧠 por que este treino?</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{plan.explanation}</p>
          </motion.div>

          {/* Days */}
          {plan.weeklyPlan.map((day, i) => (
            <WorkoutDayCard key={day.day} day={day} index={i} onStart={() => nav(`/workouts/session?day=${i}&planId=${plan?.id || ''}`)} />
          ))}

          {/* Tips */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-secondary border border-border/50 rounded-[20px] p-5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight mb-3 px-1">💡 dicas essenciais</p>
            <ul className="space-y-2">
              {plan.tips.map((tip, i) => (
                <li key={i} className="text-[13px] text-foreground flex gap-3 leading-relaxed">
                  <span className="text-primary font-bold">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Evolution */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-secondary border border-border/50 rounded-[20px] p-5">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight mb-1.5 px-1">📈 progressão</p>
            <p className="text-[13px] text-muted-foreground leading-relaxed px-1">{plan.evolution}</p>
          </motion.div>
        </div>
      )}


      <BottomNav />
    </div>
  );
}
