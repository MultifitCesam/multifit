import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Loader2, Sparkles, Target, Moon, Dumbbell } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/multifit-logo.png";

const goals = [
  { value: "emagrecimento", label: "Emagrecer", emoji: "⚖️" },
  { value: "hipertrofia", label: "Ganhar massa", emoji: "🏋️" },
  { value: "condicionamento", label: "Condicionamento", emoji: "🏃" },
  { value: "saude_mental", label: "Saúde mental", emoji: "🧘" },
  { value: "alta_performance", label: "Performance", emoji: "🏆" },
] as const;

const levels = [
  { value: "iniciante", label: "Iniciante", emoji: "🌱" },
  { value: "intermediario", label: "Intermediário", emoji: "💪" },
  { value: "avancado", label: "Avançado", emoji: "🔥" },
] as const;

const sleepQ = [
  { value: "ruim", label: "Ruim", emoji: "😫" },
  { value: "regular", label: "Regular", emoji: "😐" },
  { value: "boa", label: "Boa", emoji: "😊" },
  { value: "excelente", label: "Excelente", emoji: "😴" },
] as const;

const trainTimes = [
  { value: "manha", label: "Manhã", emoji: "🌅" },
  { value: "tarde", label: "Tarde", emoji: "☀️" },
  { value: "noite", label: "Noite", emoji: "🌙" },
] as const;

export default function OnboardingPage() {
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || "",
    age: profile?.age || 25,
    weight: profile?.weight || 70,
    height: profile?.height || 170,
    goal: profile?.goal || "hipertrofia",
    level: profile?.level || "iniciante",
    weekly_frequency: profile?.weekly_frequency || 4,
    training_time: profile?.training_time || "manha",
    sleep_hours: profile?.sleep_hours || 7,
    sleep_quality: profile?.sleep_quality || "boa",
  });

  const set = (p: Partial<typeof form>) => setForm({ ...form, ...p });

  const steps = [
    { title: "Vamos te conhecer", subtitle: "Comece com o básico", icon: Sparkles },
    { title: "Seu objetivo", subtitle: "Para onde vamos?", icon: Target },
    { title: "Sua rotina", subtitle: "Quando e quanto treina?", icon: Dumbbell },
    { title: "Seu descanso", subtitle: "Sono é parte do treino", icon: Moon },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const next = async () => {
    if (step === 0 && form.name.trim().length < 2) {
      toast({ title: "Conta pra gente seu nome", variant: "destructive" }); return;
    }
    if (!isLast) { setStep(step + 1); return; }
    setSaving(true);
    await updateProfile({ ...form, onboarded: true } as any);
    setSaving(false);
    toast({ title: "Tudo pronto! 🎉", description: "Bora treinar." });
    navigate("/", { replace: true });
  };

  const skip = async () => {
    await updateProfile({ onboarded: true } as any);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col px-5 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <img src={logo} alt="MultiFit" className="w-10 h-10 object-contain" />
        <button onClick={skip} className="text-xs text-muted-foreground hover:text-foreground">
          Pular
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i <= step ? "bg-gradient-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <current.icon size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-display">{current.title}</h2>
                <p className="text-xs text-muted-foreground">{current.subtitle}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {step === 0 && (
                <>
                  <Field label="Como podemos te chamar?">
                    <input
                      autoFocus
                      type="text"
                      value={form.name}
                      onChange={(e) => set({ name: e.target.value.slice(0, 60) })}
                      placeholder="Seu nome"
                      className="w-full bg-secondary rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Stepper label="Idade" value={form.age} onChange={(v) => set({ age: v })} min={12} max={99} suffix="a" />
                    <Stepper label="Peso" value={form.weight} onChange={(v) => set({ weight: v })} min={30} max={250} suffix="kg" />
                    <Stepper label="Altura" value={form.height} onChange={(v) => set({ height: v })} min={130} max={230} suffix="cm" />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <Grid cols={2}>
                    {goals.map((g) => (
                      <Chip key={g.value} active={form.goal === g.value} onClick={() => set({ goal: g.value as any })}>
                        <span className="text-2xl">{g.emoji}</span>
                        <span className="font-bold text-sm">{g.label}</span>
                      </Chip>
                    ))}
                  </Grid>
                  <p className="text-[11px] text-muted-foreground mt-4 mb-2 font-bold uppercase tracking-wide">Seu nível</p>
                  <Grid cols={3}>
                    {levels.map((l) => (
                      <Chip key={l.value} active={form.level === l.value} onClick={() => set({ level: l.value as any })}>
                        <span className="text-2xl">{l.emoji}</span>
                        <span className="font-bold text-xs">{l.label}</span>
                      </Chip>
                    ))}
                  </Grid>
                </>
              )}

              {step === 2 && (
                <>
                  <Field label={<>Treinos por semana: <span className="text-primary font-bold">{form.weekly_frequency}x</span></>}>
                    <input
                      type="range"
                      min={2} max={7}
                      value={form.weekly_frequency}
                      onChange={(e) => set({ weekly_frequency: Number(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </Field>
                  <p className="text-[11px] text-muted-foreground mt-4 mb-2 font-bold uppercase tracking-wide">Horário preferido</p>
                  <Grid cols={3}>
                    {trainTimes.map((t) => (
                      <Chip key={t.value} active={form.training_time === t.value} onClick={() => set({ training_time: t.value as any })}>
                        <span className="text-2xl">{t.emoji}</span>
                        <span className="font-bold text-xs">{t.label}</span>
                      </Chip>
                    ))}
                  </Grid>
                </>
              )}

              {step === 3 && (
                <>
                  <Field label={<>Horas de sono: <span className="text-primary font-bold">{form.sleep_hours}h</span></>}>
                    <input
                      type="range"
                      min={4} max={10} step={0.5}
                      value={form.sleep_hours}
                      onChange={(e) => set({ sleep_hours: Number(e.target.value) })}
                      className="w-full accent-primary"
                    />
                  </Field>
                  <p className="text-[11px] text-muted-foreground mt-4 mb-2 font-bold uppercase tracking-wide">Como anda seu sono?</p>
                  <Grid cols={4}>
                    {sleepQ.map((s) => (
                      <Chip key={s.value} active={form.sleep_quality === s.value} onClick={() => set({ sleep_quality: s.value as any })}>
                        <span className="text-2xl">{s.emoji}</span>
                        <span className="font-bold text-[11px]">{s.label}</span>
                      </Chip>
                    ))}
                  </Grid>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 mt-6 pt-4">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-4 py-3.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition flex items-center gap-1"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          disabled={saving}
          className="flex-1 bg-gradient-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-neon flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : isLast ? <Check size={18} /> : <ArrowRight size={18} />}
          {isLast ? "Concluir" : "Continuar"}
        </motion.button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2 block">{label}</label>
      {children}
    </div>
  );
}

function Grid({ cols, children }: { cols: number; children: React.ReactNode }) {
  return <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>{children}</div>;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-all ${
        active ? "bg-primary/15 border-primary shadow-neon text-foreground" : "bg-secondary/60 border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </motion.button>
  );
}

function Stepper({ label, value, onChange, min, max, suffix }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; suffix?: string }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <div className="flex items-center bg-secondary rounded-xl overflow-hidden">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="px-3 py-3 text-lg text-muted-foreground hover:text-primary">−</button>
        <div className="flex-1 text-center font-bold font-display text-sm">
          {value}{suffix && <span className="text-[10px] text-muted-foreground ml-0.5">{suffix}</span>}
        </div>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="px-3 py-3 text-lg text-muted-foreground hover:text-primary">+</button>
      </div>
    </div>
  );
}
