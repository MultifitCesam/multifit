import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Timer, 
  Dumbbell, 
  ArrowLeft,
  Timer as TimerIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { generateWorkoutPlan, type WorkoutDay, type UserProfile } from "@/lib/workout-generator";
import ExerciseVideo from "@/components/ExerciseVideo";
import { toast } from "@/hooks/use-toast";

export default function WorkoutSessionPage() {
  const [searchParams] = useSearchParams();
  const dayIndex = parseInt(searchParams.get("day") || "0");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [sessionStartedAt] = useState(new Date());
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutDay, setWorkoutDay] = useState<WorkoutDay | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  
  // Timer state
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!profile) return;
    
    const mapped: UserProfile = {
      name: profile.name,
      gender: profile.gender as any,
      age: profile.age,
      weight: Number(profile.weight),
      height: Number(profile.height),
      level: profile.level as any,
      goal: profile.goal as any,
      bodyType: profile.body_type as any,
      sleepHours: Number(profile.sleep_hours),
      sleepQuality: profile.sleep_quality as any,
      weeklyFrequency: profile.weekly_frequency,
      trainingTime: profile.training_time as any,
      focusAreas: profile.focus_areas as any,
      healthConditions: profile.health_conditions as any,
    };
    
    const plan = generateWorkoutPlan(mapped);
    const day = plan.weeklyPlan[dayIndex];
    
    if (day && day.type !== 'descanso') {
      setWorkoutDay(day);
      const initialLogs = day.exercises.flatMap((ex, exIdx) => 
        Array.from({ length: ex.sets }).map((_, setIdx) => ({
          exerciseIndex: exIdx,
          setIndex: setIdx,
          reps: parseInt(ex.reps.split('-')[0]) || 10,
          weight: 0,
          done: false,
          rpe: 7
        }))
      );
      setLogs(initialLogs);
    } else {
      navigate('/workouts');
    }
  }, [profile, dayIndex, navigate]);

  useEffect(() => {
    if (isResting && restTime > 0) {
      timerRef.current = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isResting, restTime]);

  const startRest = (seconds: number) => {
    setRestTime(seconds);
    setIsResting(true);
  };

  const updateLog = (exIdx: number, setIdx: number, field: string, value: any) => {
    setLogs(prev => prev.map(log => 
      (log.exerciseIndex === exIdx && log.setIndex === setIdx) 
        ? { ...log, [field]: value } 
        : log
    ));
  };

  const toggleDone = (exIdx: number, setIdx: number) => {
    const currentLog = logs.find(l => l.exerciseIndex === exIdx && l.setIndex === setIdx);
    const newDone = !currentLog?.done;
    updateLog(exIdx, setIdx, 'done', newDone);
    
    if (newDone && workoutDay) {
      const restSeconds = parseInt(workoutDay.exercises[exIdx].rest) * 60 || 60;
      startRest(restSeconds);
    }
  };

  const finishWorkout = async () => {
    if (!user || !workoutDay) return;
    setIsFinishing(true);
    
    try {
      const durationSeconds = Math.round((new Date().getTime() - sessionStartedAt.getTime()) / 1000);
      
      const { data: session, error: sError } = await supabase
        .from('workout_sessions')
        .insert({
          user_id: user.id,
          focus: workoutDay.focus,
          day_label: workoutDay.day,
          started_at: sessionStartedAt.toISOString(),
          finished_at: new Date().toISOString(),
          duration_seconds: durationSeconds
        })
        .select()
        .single();

      if (sError) throw sError;

      const exerciseLogs = logs.map(log => ({
        user_id: user.id,
        session_id: session.id,
        exercise_name: workoutDay.exercises[log.exerciseIndex].name,
        muscle_group: workoutDay.exercises[log.exerciseIndex].muscleGroup,
        set_index: log.setIndex,
        reps: log.reps,
        weight_kg: log.weight,
        rpe: log.rpe,
        done: log.done
      }));

      const { error: lError } = await supabase
        .from('exercise_logs')
        .insert(exerciseLogs);

      if (lError) throw lError;

      const todayStr = new Date().toISOString().split('T')[0];
      const { data: currentStats } = await supabase
        .from('daily_stats')
        .select('active_minutes')
        .eq('user_id', user.id)
        .eq('day', todayStr)
        .maybeSingle();
      
      await supabase
        .from('daily_stats')
        .upsert({
          user_id: user.id,
          day: todayStr,
          active_minutes: (currentStats?.active_minutes || 0) + Math.round(durationSeconds / 60)
        });

      toast({ title: "Treino Concluído! 🏆", description: "Sua evolução foi registrada." });
      navigate('/workouts');
    } catch (error) {
      console.error(error);
      toast({ title: "Erro ao salvar", description: "Não conseguimos registrar seu treino.", variant: "destructive" });
    } finally {
      setIsFinishing(false);
    }
  };

  if (!workoutDay) return null;

  const currentExercise = workoutDay.exercises[currentExerciseIndex];
  const exerciseLogs = logs.filter(l => l.exerciseIndex === currentExerciseIndex);
  const totalExercises = workoutDay.exercises.length;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 glass-premium border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/workouts')} className="p-2 -ml-2 rounded-xl hover:bg-secondary">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{workoutDay.focus}</p>
          <h1 className="text-sm font-bold font-display">Exercício {currentExerciseIndex + 1} de {totalExercises}</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="max-w-lg mx-auto p-4">
        <div className="w-full h-1 bg-secondary rounded-full mb-6 overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentExerciseIndex + 1) / totalExercises) * 100}%` }}
          />
        </div>

        <motion.div 
          key={currentExercise.name}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-premium rounded-3xl p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase mb-2 inline-block">
                {currentExercise.muscleGroup}
              </span>
              <h2 className="text-xl font-black font-display tracking-tight">{currentExercise.name}</h2>
            </div>
            <ExerciseVideo exerciseName={currentExercise.name} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {currentExercise.description}
          </p>
          
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-primary">
              <div className="p-2 rounded-xl bg-primary/10">
                <Dumbbell size={18} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Séries</p>
                <p className="text-sm font-bold">{currentExercise.sets} x {currentExercise.reps}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-accent">
              <div className="p-2 rounded-xl bg-accent/10">
                <Timer size={18} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Descanso</p>
                <p className="text-sm font-bold">{currentExercise.rest}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-3 mb-8">
          <h3 className="text-sm font-bold px-1 mb-2">Registro de Séries</h3>
          {exerciseLogs.map((log, i) => (
            <motion.div 
              key={i}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                log.done ? 'bg-primary/5 border-primary/20' : 'glass border-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                log.done ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Carga (kg)</span>
                  <input 
                    type="number"
                    value={log.weight || ""}
                    onChange={(e) => updateLog(currentExerciseIndex, i, 'weight', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-secondary/50 border-none rounded-lg px-2 py-1 text-sm font-bold focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Reps</span>
                  <input 
                    type="number"
                    value={log.reps || ""}
                    onChange={(e) => updateLog(currentExerciseIndex, i, 'reps', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-secondary/50 border-none rounded-lg px-2 py-1 text-sm font-bold focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <button 
                onClick={() => toggleDone(currentExerciseIndex, i)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  log.done ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-primary/20'
                }`}
              >
                {log.done ? <CheckCircle2 size={20} /> : <Play size={18} className="ml-0.5" />}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-4">
          <button 
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex(prev => prev - 1)}
            className="flex-1 glass py-4 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <ChevronLeft size={18} /> Voltar
          </button>
          
          {currentExerciseIndex < totalExercises - 1 ? (
            <button 
              onClick={() => setCurrentExerciseIndex(prev => prev + 1)}
              className="flex-[2] bg-primary text-primary-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-neon"
            >
              Próximo <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={finishWorkout}
              disabled={isFinishing}
              className="flex-[2] bg-gradient-primary text-primary-foreground py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-neon"
            >
              {isFinishing ? "Salvando..." : "Finalizar Treino"} <CheckCircle2 size={18} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isResting && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-6 right-6 z-50 glass-premium border-primary/30 p-4 rounded-2xl flex items-center justify-between shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                <TimerIcon size={20} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Tempo de Descanso</p>
                <p className="text-xl font-black font-display text-primary">{Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsResting(false)}
              className="px-4 py-2 bg-secondary rounded-xl text-xs font-bold"
            >
              Pular
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
