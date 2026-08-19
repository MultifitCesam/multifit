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
      <div className="sticky top-0 z-40 bg-background border-b border-border/50 px-5 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/workouts')} className="p-2 -ml-2 rounded-xl text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight leading-tight">{workoutDay.focus}</p>
          <h1 className="text-sm font-medium text-foreground">Exercício {currentExerciseIndex + 1} de {totalExercises}</h1>
        </div>
        <div className="w-10" />
      </div>

      <div className="max-w-lg mx-auto p-5">
        <div className="w-full h-1 bg-secondary rounded-full mb-8 overflow-hidden">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentExerciseIndex + 1) / totalExercises) * 100}%` }}
          />
        </div>

        <motion.div 
          key={currentExercise.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary border border-border/50 rounded-[20px] p-6 mb-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-[11px] text-primary font-medium uppercase mb-2 inline-block">
                {currentExercise.muscleGroup}
              </span>
              <h2 className="text-xl font-medium text-foreground">{currentExercise.name}</h2>
            </div>
            <ExerciseVideo exerciseName={currentExercise.name} />
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-6 font-normal">
            {currentExercise.description}
          </p>
          
          <div className="flex gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-background border border-border/50 flex items-center justify-center text-primary">
                <Dumbbell size={16} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase leading-tight">Séries</p>
                <p className="text-sm font-medium">{currentExercise.sets} x {currentExercise.reps}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-background border border-border/50 flex items-center justify-center text-[hsl(var(--text-accent))]">
                <Timer size={16} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase leading-tight">Descanso</p>
                <p className="text-sm font-medium">{currentExercise.rest}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-3 mb-8">
          <h3 className="text-[12px] font-medium text-muted-foreground uppercase px-1 mb-2">Registro de séries</h3>
          {exerciseLogs.map((log, i) => (
            <motion.div 
              key={i}
              className={`flex items-center gap-4 p-4 rounded-[14px] border transition-all ${
                log.done ? 'bg-[hsl(var(--bg-success))] border-primary/20' : 'bg-secondary border-border/50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[11px] ${
                log.done ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground border border-border/50'
              }`}>
                {i + 1}
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase mb-1">Carga (kg)</span>
                  <input 
                    type="number"
                    value={log.weight || ""}
                    onChange={(e) => updateLog(currentExerciseIndex, i, 'weight', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-background/50 border border-border/30 rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase mb-1">Reps</span>
                  <input 
                    type="number"
                    value={log.reps || ""}
                    onChange={(e) => updateLog(currentExerciseIndex, i, 'reps', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-background/50 border border-border/30 rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>

              <button 
                onClick={() => toggleDone(currentExerciseIndex, i)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  log.done ? 'bg-primary text-primary-foreground' : 'bg-background border border-border/50 text-muted-foreground hover:text-primary'
                }`}
              >
                {log.done ? <CheckCircle2 size={18} /> : <Play size={16} className="ml-0.5" />}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-4">
          <button 
            disabled={currentExerciseIndex === 0}
            onClick={() => setCurrentExerciseIndex(prev => prev - 1)}
            className="flex-1 bg-secondary border border-border/50 py-4 rounded-[14px] font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
          
          {currentExerciseIndex < totalExercises - 1 ? (
            <button 
              onClick={() => setCurrentExerciseIndex(prev => prev + 1)}
              className="flex-[2] bg-primary text-primary-foreground py-4 rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2"
            >
              Próximo <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              onClick={finishWorkout}
              disabled={isFinishing}
              className="flex-[2] bg-primary text-primary-foreground py-4 rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2"
            >
              {isFinishing ? "Salvando..." : "Finalizar"} <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isResting && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-5 right-5 z-50 bg-secondary border border-primary/20 p-4 rounded-[14px] flex items-center justify-between shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--bg-success))] flex items-center justify-center text-primary">
                <TimerIcon size={18} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">Tempo de descanso</p>
                <p className="text-xl font-medium text-primary">{Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsResting(false)}
              className="px-4 py-2 bg-background border border-border/50 rounded-lg text-[11px] font-semibold"
            >
              Pular
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
}
