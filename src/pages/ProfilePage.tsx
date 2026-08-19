import { useState, useEffect, useRef } from "react";
import { SafeImg, SafeVideo } from "@/components/SafeMedia";
import { motion } from "framer-motion";
import { User, Save, Loader2, Camera, LogOut, Apple, Settings, Lock, Globe, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import SmartwatchPanel from "@/components/SmartwatchPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const levels = [
  { value: "iniciante", label: "Iniciante", emoji: "🌱", desc: "Começando agora" },
  { value: "intermediario", label: "Intermediário", emoji: "💪", desc: "Já treina há um tempo" },
  { value: "avancado", label: "Avançado", emoji: "🔥", desc: "Treina há anos" },
] as const;

const goals = [
  { value: "emagrecimento", label: "Emagrecer", emoji: "⚖️" },
  { value: "hipertrofia", label: "Hipertrofia", emoji: "🏋️" },
  { value: "condicionamento", label: "Condicionamento", emoji: "🏃" },
  { value: "saude_mental", label: "Saúde Mental", emoji: "🧘" },
  { value: "alta_performance", label: "Performance", emoji: "🏆" },
] as const;

const bodyTypes = [
  { value: "ectomorfo", label: "Ectomorfo", desc: "Magro, dificuldade em ganhar peso" },
  { value: "mesomorfo", label: "Mesomorfo", desc: "Atlético, ganha músculo facilmente" },
  { value: "endomorfo", label: "Endomorfo", desc: "Mais robusto, ganha peso rápido" },
] as const;

const sleepQualities = [
  { value: "ruim", label: "Ruim", emoji: "😫" },
  { value: "regular", label: "Regular", emoji: "😐" },
  { value: "boa", label: "Boa", emoji: "😊" },
  { value: "excelente", label: "Excelente", emoji: "😴" },
] as const;

const trainingTimes = [
  { value: "manha", label: "Manhã", emoji: "🌅" },
  { value: "tarde", label: "Tarde", emoji: "☀️" },
  { value: "noite", label: "Noite", emoji: "🌙" },
] as const;

function CardChips<T extends string>({
  options,
  value,
  onChange,
  cols = 3,
}: {
  options: readonly { value: T; label: string; emoji?: string; desc?: string }[];
  value: T;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className={`grid gap-2 grid-cols-${cols}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(opt.value)}
            className={`relative p-3 rounded-xl text-left transition-all border ${
              active
                ? "bg-[hsl(var(--bg-success))] border-primary text-foreground"
                : "bg-secondary border-border/50 text-muted-foreground hover:text-foreground"
            }`}

          >
            {opt.emoji && <div className="text-xl mb-1">{opt.emoji}</div>}
            <div className={`text-[12px] font-medium ${active ? "text-primary" : ""}`}>{opt.label}</div>
            {opt.desc && <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</div>}

          </motion.button>
        );
      })}
    </div>
  );
}

function NumberStepper({ value, onChange, min, max, step = 1, suffix }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; suffix?: string }) {
  return (
    <div className="flex items-center bg-secondary border border-border/50 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="px-4 py-3 text-lg text-muted-foreground hover:text-foreground hover:bg-background/40 transition"
      >−</button>
      <div className="flex-1 text-center font-medium text-sm">
        {value}{suffix && <span className="text-[10px] text-muted-foreground ml-0.5">{suffix}</span>}
      </div>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        className="px-4 py-3 text-lg text-muted-foreground hover:text-foreground hover:bg-background/40 transition"
      >+</button>

    </div>
  );
}

export default function ProfilePage() {
  const { profile, updateProfile, loading } = useProfile();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [local, setLocal] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) setLocal(profile);
  }, [profile]);

  if (loading || !local) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  const set = (updates: Partial<typeof local>) => setLocal({ ...local!, ...updates });

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máximo 5MB", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        contentType: file.type,
        upsert: true,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl;
      set({ avatar_url: url });
      await updateProfile({ avatar_url: url });
      toast({ title: "Foto atualizada! ✨" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar foto", description: err?.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const username = (local.username || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (username.length < 3) {
      toast({ title: "Username muito curto", description: "Mínimo 3 caracteres (a-z, 0-9, _)", variant: "destructive" });
      setSaving(false); return;
    }
    await updateProfile({
      username,
      is_private: local.is_private,
      name: local.name,
      bio: local.bio,
      age: local.age,
      weight: local.weight,
      height: local.height,
      level: local.level,
      goal: local.goal,
      body_type: local.body_type,
      sleep_hours: local.sleep_hours,
      sleep_quality: local.sleep_quality,
      weekly_frequency: local.weekly_frequency,
      training_time: local.training_time,
    });
    setSaving(false);
    toast({ title: "Perfil salvo! ✅" });
  };

  return (
    <div className="min-h-screen pb-28 px-5 pt-8 max-w-lg mx-auto bg-background">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-medium text-foreground">Meu perfil</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={async () => { await signOut(); navigate("/auth"); }}
            className="p-2.5 rounded-xl bg-secondary border border-border/50 text-muted-foreground hover:text-destructive transition-all"
            aria-label="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>


      {/* Avatar */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-secondary border border-border/50 p-1">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden border border-border/30">
              {local.avatar_url ? (
                <SafeImg src={local.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={42} className="text-muted-foreground/30" />
              )}
            </div>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg disabled:opacity-60"
            aria-label="Trocar foto"
          >
            {uploadingAvatar ? <Loader2 size={14} className="animate-spin text-primary-foreground" /> : <Camera size={14} className="text-primary-foreground" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarPick} className="hidden" />
        </div>
        <p className="text-base font-medium text-foreground mt-4">{local.name || "Sem nome"}</p>
        <p className="text-[12px] text-muted-foreground mt-0.5 tracking-tight capitalize font-medium">{local.level} • {local.goal.replace("_", " ")}</p>

      </motion.div>

      <div className="space-y-6">
        {/* Basic info */}
        <section className="space-y-3">
          <SectionTitle icon={Settings}>Informações</SectionTitle>
          <button
            onClick={() => local.username && navigate(`/u/${local.username}`)}
            className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 flex items-center justify-between text-left hover:bg-secondary/80 transition-all"
          >
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium mb-0.5">Ver perfil público</p>
              <p className="text-[13px] font-medium text-foreground">@{local.username}</p>
            </div>
            <ExternalLink size={14} className="text-primary" />
          </button>
          <div>
            <Label>Nome de usuário (@)</Label>
            <input
              type="text"
              value={local.username || ""}
              onChange={(e) => set({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30) })}
              placeholder="seu_username"
              className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <Label>Nome</Label>
            <input
              type="text"
              value={local.name}
              onChange={(e) => set({ name: e.target.value.slice(0, 60) })}
              placeholder="Seu nome"
              className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>

          <div>
            <Label>Bio</Label>
            <textarea
              value={local.bio || ""}
              onChange={(e) => set({ bio: e.target.value.slice(0, 200) })}
              placeholder="Conte um pouco sobre você..."
              rows={2}
              className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>

          <button
            onClick={() => set({ is_private: !local.is_private })}
            className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              {local.is_private ? <Lock size={16} className="text-primary" /> : <Globe size={16} className="text-primary" />}
              <div>
                <p className="text-[13px] font-medium text-foreground">{local.is_private ? "Conta privada" : "Conta pública"}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{local.is_private ? "Aprovação manual de seguidores" : "Qualquer um pode te seguir"}</p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${local.is_private ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${local.is_private ? "translate-x-4" : ""}`} />
            </div>
          </button>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Idade</Label>
              <NumberStepper value={local.age} onChange={(v) => set({ age: v })} min={12} max={99} suffix="a" />
            </div>
            <div>
              <Label>Peso</Label>
              <NumberStepper value={local.weight} onChange={(v) => set({ weight: v })} min={30} max={250} suffix="kg" />
            </div>
            <div>
              <Label>Altura</Label>
              <NumberStepper value={local.height} onChange={(v) => set({ height: v })} min={130} max={230} suffix="cm" />
            </div>
          </div>
        </section>

        {/* Level */}
        <section>
          <SectionTitle>Nível de experiência</SectionTitle>
          <CardChips options={levels} value={local.level} onChange={(v) => set({ level: v })} cols={3} />
        </section>

        {/* Goal */}
        <section>
          <SectionTitle>Objetivo principal</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {goals.map((g) => {
              const active = local.goal === g.value;
              return (
                <motion.button
                  key={g.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => set({ goal: g.value })}
                  className={`p-3.5 rounded-xl flex items-center gap-2.5 border transition-all ${
                    active
                      ? "bg-[hsl(var(--bg-success))] border-primary"
                      : "bg-secondary border-border/50"
                  }`}
                >
                  <span className="text-lg">{g.emoji}</span>
                  <span className={`text-[12px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>{g.label}</span>
                </motion.button>
              );
            })}
          </div>

        </section>

        {/* Body type */}
        <section>
          <SectionTitle>Biotipo</SectionTitle>
          <CardChips options={bodyTypes} value={local.body_type} onChange={(v) => set({ body_type: v })} cols={1} />
        </section>

        {/* Sleep */}
        <section className="space-y-3">
          <SectionTitle>Sono</SectionTitle>
          <div>
            <Label>Horas de sono: <span className="text-primary font-medium">{local.sleep_hours}h</span></Label>

            <input
              type="range"
              min={4}
              max={10}
              step={0.5}
              value={local.sleep_hours}
              onChange={(e) => set({ sleep_hours: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <Label>Qualidade</Label>
            <CardChips options={sleepQualities} value={local.sleep_quality} onChange={(v) => set({ sleep_quality: v })} cols={4} />
          </div>
        </section>

        {/* Training */}
        <section className="space-y-3">
          <SectionTitle>Treino</SectionTitle>
          <div>
            <Label>Frequência semanal: <span className="text-primary font-medium">{local.weekly_frequency}x</span></Label>

            <input
              type="range"
              min={2}
              max={7}
              value={local.weekly_frequency}
              onChange={(e) => set({ weekly_frequency: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <Label>Horário preferido</Label>
            <CardChips options={trainingTimes} value={local.training_time} onChange={(v) => set({ training_time: v })} cols={3} />
          </div>
        </section>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl flex items-center justify-center gap-2.5 disabled:opacity-60 transition-all"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? "Salvando..." : "Salvar Perfil"}
        </motion.button>


        <SmartwatchPanel />

        <button
          onClick={() => navigate("/nutrition")}
          className="w-full bg-secondary border border-border/50 text-foreground font-medium py-3.5 rounded-xl flex items-center justify-center gap-2.5 hover:bg-secondary/80 transition-all"
        >
          <Apple size={16} className="text-primary" />
          Ver minha nutrição
        </button>

      </div>

      <BottomNav />
    </div>
  );
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground mb-3 px-1 flex items-center gap-1.5">
      {Icon && <Icon size={12} />}
      {children}
    </h2>
  );
}


function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[12px] font-medium text-muted-foreground mb-1.5 px-1 block">{children}</label>;
}
