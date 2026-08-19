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
    <div className="min-h-screen pb-24 px-5 pt-8 max-w-lg mx-auto bg-background">
      <h1 className="text-xl font-medium text-foreground mb-8">Evolução</h1>

      {/* Calorie Target Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-secondary border border-border/50 rounded-[20px] p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[12px] text-muted-foreground font-medium mb-1">Meta calórica diária</p>
            <p className="text-3xl font-medium text-foreground leading-none">{caloriesGoal} <span className="text-sm font-normal text-muted-foreground ml-1">kcal</span></p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-background flex items-center justify-center relative">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" className="text-background" strokeWidth="4" />
              <circle 
                cx="32" cy="32" r="28" fill="none" stroke="currentColor" 
                className="text-primary" strokeWidth="4" 
                strokeDasharray={`${176 * (caloriePct/100)} 176`} 
                strokeLinecap="round" 
              />
            </svg>
            <span className="text-[12px] font-semibold">{caloriePct}%</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-[12px] text-muted-foreground border-t border-border/30 pt-4">
          <span>Consumido: {stats?.calories ?? 0}</span>
          <span>Restante: {Math.max(0, caloriesGoal - (stats?.calories ?? 0))}</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={Flame} label="Calorias" value={String(stats?.calories ?? 0)} subtitle="kcal hoje" variant="primary" />
        <StatCard icon={Footprints} label="Passos" value={String(stats?.steps ?? 0)} subtitle="total hoje" variant="accent" />
        <StatCard icon={Droplet} label="Água" value={`${stats?.water_ml ?? 0}`} subtitle="ml hoje" />
        <StatCard icon={TrendingUp} label="Objetivo" value={goal.replace('_', ' ')} />
      </div>

      {/* Weekly History Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-secondary border border-border/50 rounded-[20px] p-5 mb-6 overflow-hidden"
      >
        <h2 className="text-sm font-medium text-foreground mb-6">Calorias (Últimos 7 dias)</h2>
        <div className="h-48 w-full">
          <ChartContainer config={{ calories: { label: "Kcal", color: "hsl(var(--primary))" } }}>
            <BarChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<ChartTooltipContent hideLabel />} cursor={{ fill: "hsl(var(--background))", opacity: 0.5 }} />
              <Bar dataKey="calories" fill="var(--color-calories)" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ChartContainer>
        </div>
      </motion.div>

      {/* Body Stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-secondary border border-border/50 rounded-[20px] p-5 mb-4">
        <h2 className="text-sm font-medium text-foreground mb-4">Composição Corporal</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-medium text-foreground mb-0.5">{weight}</p>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">Peso (kg)</p>
          </div>
          <div>
            <p className="text-2xl font-medium text-foreground mb-0.5">{height}</p>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">Altura (cm)</p>
          </div>
          <div>
            <p className="text-2xl font-medium text-foreground mb-0.5">{(weight / (height / 100) ** 2).toFixed(1)}</p>
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight">IMC</p>
          </div>
        </div>
      </motion.div>

      <BottomNav />
    </div>

  );
}
