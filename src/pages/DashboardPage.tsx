import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Flame, Target, Calendar, Award, Zap, Footprints, Droplet } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import StatCard from "@/components/StatCard";
import { useProfile } from "@/hooks/useProfile";
import { useDailyStats } from "@/hooks/useDailyStats";
import { calculateCalories } from "@/lib/workout-generator";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function DashboardPage() {
  const { profile } = useProfile();
  const { getHistory, stats } = useDailyStats();
  const [history, setHistory] = useState<any[]>([]);
  
  const weight = Number(profile?.weight ?? 70);
  const height = Number(profile?.height ?? 170);
  const age = profile?.age ?? 25;
  const goal = profile?.goal ?? "hipertrofia";
  const caloriesGoal = calculateCalories(weight, height, age, goal);

  useEffect(() => {
    const load = async () => {
      const data = await getHistory(7);
      // Fill missing days if needed or just reverse for chart
      const chartData = [...data].reverse().map(d => ({
        day: new Date(d.day + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).charAt(0).toUpperCase(),
        calories: d.calories,
        steps: d.steps,
        water: d.water_ml
      }));
      setHistory(chartData);
    };
    load();
  }, [getHistory]);

  const caloriePct = stats ? Math.min(100, Math.round((stats.calories / caloriesGoal) * 100)) : 0;

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold font-display mb-6">
        <span className="text-gradient">Evolução</span>
      </h1>

      {/* Calorie Target Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass glow-border rounded-2xl p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Meta calórica diária</p>
            <p className="text-3xl font-bold font-display text-gradient">{caloriesGoal}</p>
            <p className="text-xs text-muted-foreground">kcal sugeridas</p>
          </div>
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" className="text-secondary" strokeWidth="4" />
              <circle 
                cx="40" cy="40" r="36" fill="none" stroke="currentColor" 
                className="text-primary" strokeWidth="4" 
                strokeDasharray={`${226 * (caloriePct/100)} 226`} 
                strokeLinecap="round" 
              />
            </svg>
            <span className="text-sm font-bold">{caloriePct}%</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-[10px] text-muted-foreground border-t border-border/50 pt-3">
          <span>Consumido: {stats?.calories ?? 0} kcal</span>
          <span>Restante: {Math.max(0, caloriesGoal - (stats?.calories ?? 0))} kcal</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={Flame} label="Calorias" value={String(stats?.calories ?? 0)} subtitle="hoje" variant="primary" />
        <StatCard icon={Footprints} label="Passos" value={String(stats?.steps ?? 0)} subtitle="hoje" variant="accent" />
        <StatCard icon={Droplet} label="Água" value={`${stats?.water_ml ?? 0}ml`} subtitle="hoje" />
        <StatCard icon={TrendingUp} label="Objetivo" value={goal.charAt(0).toUpperCase() + goal.slice(1).replace('_', ' ')} />
      </div>

      {/* Weekly History Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-5 mb-6 overflow-hidden"
      >
        <h2 className="text-sm font-bold font-display mb-4">Calorias (Últimos 7 dias)</h2>
        <div className="h-48 w-full">
          <ChartContainer config={{ calories: { label: "Kcal", color: "hsl(var(--primary))" } }}>
            <BarChart data={history}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }} />
              <Tooltip content={<ChartTooltipContent hideLabel />} cursor={{ fill: "hsl(var(--secondary))", opacity: 0.2 }} />
              <Bar dataKey="calories" fill="var(--color-calories)" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ChartContainer>
        </div>
      </motion.div>

      {/* Body Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5 mb-4">
        <h2 className="text-sm font-bold font-display mb-3">Composição Corporal</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold font-display text-gradient">{weight}</p>
            <p className="text-[10px] text-muted-foreground">Peso (kg)</p>
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-gradient">{height}</p>
            <p className="text-[10px] text-muted-foreground">Altura (cm)</p>
          </div>
          <div>
            <p className="text-2xl font-bold font-display text-gradient">{(weight / (height / 100) ** 2).toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">IMC</p>
          </div>
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
