import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Loader2, Target } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";

const genders = [
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
  { value: "outro", label: "Outro" },
] as const;

const goals = [
  { value: "emagrecimento", label: "Emagrecer", hint: "gasto calórico e definição" },
  { value: "hipertrofia", label: "Ganhar massa", hint: "força e volume muscular" },
  { value: "condicionamento", label: "Condicionamento", hint: "resistência e fôlego" },
  { value: "saude_mental", label: "Bem-estar", hint: "constância sem sobrecarga" },
  { value: "alta_performance", label: "Performance", hint: "cargas e progressão" },
] as const;

const levels = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
] as const;

export default function GoalsPage() {
  const nav = useNavigate();
  const { profile, loading, updateProfile } = useProfile();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    gender: "feminino" as string,
    age: 25,
    weight: 65,
    height: 165,
    level: "iniciante" as string,
    goal: "hipertrofia" as string,
    weekly_frequency: 4,
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      gender: profile.gender || "feminino",
      age: profile.age || 25,
      weight: Number(profile.weight) || 65,
      height: Number(profile.height) || 165,
      level: profile.level || "iniciante",
      goal: profile.goal || "hipertrofia",
      weekly_frequency: profile.weekly_frequency || 4,
    });
  }, [profile]);

  const set = (p: Partial<typeof form>) => setForm(prev => ({ ...prev, ...p }));

  const save = async () => {
    if (form.age < 12 || form.weight < 30 || form.height < 130) {
      toast({ title: "Revise idade, peso e altura", variant: "destructive" });
      return;
    }
    setSaving(true);
    await updateProfile({ ...form, onboarded: true } as any);
    setSaving(false);
    toast({ title: "Objetivos salvos", description: "Seu treino já está adaptado." });
    nav("/workouts");
  };

  const isFemale = form.gender === "feminino";

  return (
    <div className="min-h-screen bg-background px-5 pt-8 pb-28 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => nav(-1)} className="p-2.5 rounded-xl bg-secondary border border-border/50 text-muted-foreground active:scale-95 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-lg font-medium text-foreground leading-tight">Meus objetivos</h1>
          <p className="text-[12px] text-muted-foreground">Usamos isso para montar seu treino</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          <Section title="Gênero" icon>
            <Row cols={3}>
              {genders.map(g => (
                <Chip key={g.value} active={form.gender === g.value} onClick={() => set({ gender: g.value })}>{g.label}</Chip>
              ))}
            </Row>
            {isFemale && (
              <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">
                Treino feminino: prioridade em glúteos, posterior e core, com instruções e vídeos adaptados.
              </p>
            )}
          </Section>

          <Section title="Corpo">
            <div className="grid grid-cols-3 gap-3">
              <Stepper label="Idade" value={form.age} onChange={v => set({ age: v })} min={12} max={99} suffix="anos" />
              <Stepper label="Peso" value={form.weight} onChange={v => set({ weight: v })} min={30} max={250} suffix="kg" />
              <Stepper label="Altura" value={form.height} onChange={v => set({ height: v })} min={130} max={230} suffix="cm" />
            </div>
          </Section>

          <Section title="Nível">
            <Row cols={3}>
              {levels.map(l => (
                <Chip key={l.value} active={form.level === l.value} onClick={() => set({ level: l.value })}>{l.label}</Chip>
              ))}
            </Row>
          </Section>

          <Section title="Objetivo">
            <div className="space-y-2">
              {goals.map(g => (
                <button
                  key={g.value}
                  onClick={() => set({ goal: g.value })}
                  className={`w-full text-left px-4 py-3.5 rounded-[14px] border transition-colors ${
                    form.goal === g.value
                      ? "border-primary bg-[hsl(var(--bg-success))]"
                      : "border-border/50 bg-secondary"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground leading-tight">{g.label}</p>
                      <p className="text-[12px] text-muted-foreground">{g.hint}</p>
                    </div>
                    {form.goal === g.value && <Check size={16} className="text-primary shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Frequência semanal">
            <p className="text-[13px] text-muted-foreground mb-2">{form.weekly_frequency} treinos por semana</p>
            <input
              type="range" min={2} max={7}
              value={form.weekly_frequency}
              onChange={e => set({ weekly_frequency: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </Section>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={save}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground font-medium py-4 rounded-[14px] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
            Salvar e gerar treino
          </motion.button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; icon?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] text-muted-foreground mb-2.5">{title}</p>
      {children}
    </div>
  );
}

function Row({ cols, children }: { cols: number; children: React.ReactNode }) {
  return <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>{children}</div>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 rounded-[14px] text-[13px] border transition-colors ${
        active ? "border-primary bg-[hsl(var(--bg-success))] text-foreground font-medium" : "border-border/50 bg-secondary text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Stepper({ label, value, onChange, min, max, suffix }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; suffix?: string }) {
  return (
    <div className="bg-secondary border border-border/50 rounded-[14px] p-3">
      <p className="text-[11px] text-muted-foreground mb-1.5">{label}</p>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-7 h-7 rounded-lg bg-background border border-border/50 text-muted-foreground">−</button>
        <span className="text-[15px] font-medium text-foreground">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="w-7 h-7 rounded-lg bg-background border border-border/50 text-muted-foreground">+</button>
      </div>
      {suffix && <p className="text-[11px] text-muted-foreground text-center mt-1">{suffix}</p>}
    </div>
  );
}
