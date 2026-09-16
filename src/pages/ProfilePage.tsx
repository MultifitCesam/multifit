import { useEffect, useRef, useState } from "react";
import "@fontsource-variable/bricolage-grotesque";
import { Apple, Camera, Check, ExternalLink, Globe, Loader2, Lock, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SafeImg } from "@/components/SafeMedia";
import BottomNav from "@/components/BottomNav";
import SmartwatchPanel from "@/components/SmartwatchPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const levels = [
  { value: "iniciante", label: "Iniciante", desc: "começando" },
  { value: "intermediario", label: "Intermediário", desc: "há um tempo" },
  { value: "avancado", label: "Avançado", desc: "há anos" },
] as const;

const goals = [
  { value: "emagrecimento", label: "Emagrecer" },
  { value: "hipertrofia", label: "Hipertrofia" },
  { value: "condicionamento", label: "Condicionamento" },
  { value: "saude_mental", label: "Saúde mental" },
  { value: "alta_performance", label: "Performance" },
] as const;

const bodyTypes = [
  { value: "ectomorfo", label: "Ectomorfo", desc: "Magro, dificuldade em ganhar peso" },
  { value: "mesomorfo", label: "Mesomorfo", desc: "Atlético, ganha músculo com facilidade" },
  { value: "endomorfo", label: "Endomorfo", desc: "Mais robusto, ganha peso rápido" },
] as const;

const sleepQualities = [
  { value: "ruim", label: "Ruim", emoji: "😫" },
  { value: "regular", label: "Regular", emoji: "😐" },
  { value: "boa", label: "Boa", emoji: "🙂" },
  { value: "excelente", label: "Excelente", emoji: "😴" },
] as const;

const trainingTimes = [
  { value: "manha", label: "Manhã", emoji: "🌅" },
  { value: "tarde", label: "Tarde", emoji: "☀️" },
  { value: "noite", label: "Noite", emoji: "🌙" },
] as const;

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
    return <div className="profile-theme min-h-screen grid place-items-center"><Loader2 className="animate-spin text-primary" aria-label="Carregando perfil" /></div>;
  }

  const set = (updates: Partial<typeof local>) => setLocal((current) => current ? { ...current, ...updates } : current);

  const handleAvatarPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande", description: "Máximo 5 MB", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      set({ avatar_url: data.publicUrl });
      await updateProfile({ avatar_url: data.publicUrl });
      toast({ title: "Foto atualizada" });
    } catch (error) {
      toast({ title: "Erro ao enviar foto", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const username = (local.username || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (username.length < 3) {
      toast({ title: "Nome de usuário muito curto", description: "Use ao menos 3 caracteres.", variant: "destructive" });
      return;
    }
    setSaving(true);
    await updateProfile({
      username, is_private: local.is_private, name: local.name, bio: local.bio,
      age: local.age, weight: local.weight, height: local.height, level: local.level,
      goal: local.goal, body_type: local.body_type, sleep_hours: local.sleep_hours,
      sleep_quality: local.sleep_quality, weekly_frequency: local.weekly_frequency,
      training_time: local.training_time,
    });
    setSaving(false);
    toast({ title: "Perfil salvo" });
  };

  const initials = (local.name || local.username || "M").trim().charAt(0).toUpperCase();
  const selectedLevel = levels.find((item) => item.value === local.level)?.label || local.level;
  const selectedGoal = goals.find((item) => item.value === local.goal)?.label || local.goal;

  return (
    <div className="profile-theme min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-lg px-5 pb-32 pt-6 sm:pt-8">
        <header className="mb-5 flex items-center justify-between">
          <h1 className="profile-display text-[22px] font-semibold">Meu perfil</h1>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border bg-secondary text-muted-foreground" onClick={async () => { await signOut(); navigate("/auth"); }} aria-label="Sair">
              <LogOut size={17} />
            </Button>
          </div>
        </header>

        <section className="profile-identity">
          <div className="profile-avatar">
            {local.avatar_url ? <SafeImg src={local.avatar_url} alt={`Foto de ${local.name}`} className="h-full w-full object-cover" /> : initials}
            <Button size="icon" className="profile-camera" onClick={() => fileRef.current?.click()} disabled={uploadingAvatar} aria-label="Trocar foto">
              {uploadingAvatar ? <Loader2 className="animate-spin" /> : <Camera />}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarPick} className="hidden" />
          </div>
          <div className="min-w-0 flex-1 pb-0.5">
            <p className="profile-display truncate text-[19px] font-semibold">{local.name || "Sem nome"}</p>
            <button type="button" onClick={() => local.username && navigate(`/u/${local.username}`)} className="mt-0.5 flex min-h-6 items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              @{local.username || "usuario"}<ExternalLink size={12} />
            </button>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="profile-badge profile-badge-level">{selectedLevel}</span>
              <span className="profile-badge profile-badge-goal">{selectedGoal}</span>
            </div>
          </div>
        </section>

        <section className="profile-ticker" aria-label="Medidas corporais">
          <MetricCell label="Idade" value={local.age} unit="anos" onDecrease={() => set({ age: Math.max(12, local.age - 1) })} onIncrease={() => set({ age: Math.min(99, local.age + 1) })} />
          <MetricCell label="Peso" value={local.weight} unit="kg" onDecrease={() => set({ weight: Math.max(30, local.weight - 1) })} onIncrease={() => set({ weight: Math.min(250, local.weight + 1) })} />
          <MetricCell label="Altura" value={local.height} unit="cm" onDecrease={() => set({ height: Math.max(130, local.height - 1) })} onIncrease={() => set({ height: Math.min(230, local.height + 1) })} />
        </section>

        <div className="space-y-8">
          <ProfileSection title="Informações pessoais">
            <div className="space-y-3">
              <Field label="Nome de usuário">
                <input value={local.username || ""} onChange={(e) => set({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30) })} placeholder="seu_usuario" className="profile-input" />
              </Field>
              <Field label="Nome">
                <input value={local.name} onChange={(e) => set({ name: e.target.value.slice(0, 60) })} placeholder="Seu nome" className="profile-input" />
              </Field>
              <Field label="Bio">
                <textarea value={local.bio || ""} onChange={(e) => set({ bio: e.target.value.slice(0, 200) })} placeholder="Conte um pouco sobre você" rows={2} className="profile-input resize-none" />
              </Field>
              <Button variant="outline" onClick={() => set({ is_private: !local.is_private })} className="h-auto w-full justify-between whitespace-normal rounded-[14px] border-border bg-secondary px-4 py-3 text-left">
                <span className="flex items-center gap-3">
                  {local.is_private ? <Lock className="text-primary" /> : <Globe className="text-primary" />}
                  <span><span className="block text-[13px] text-foreground">{local.is_private ? "Conta privada" : "Conta pública"}</span><span className="block text-[11px] font-normal text-muted-foreground">{local.is_private ? "Você aprova novos seguidores" : "Qualquer pessoa pode seguir você"}</span></span>
                </span>
                <span className={`profile-switch ${local.is_private ? "is-on" : ""}`}><span /></span>
              </Button>
            </div>
          </ProfileSection>

          <ProfileSection title="Nível de experiência">
            <div className="profile-segmented">
              {levels.map((item) => <button key={item.value} type="button" className={`profile-segment ${local.level === item.value ? "is-active" : ""}`} onClick={() => set({ level: item.value })}><span>{item.label}</span><small>{item.desc}</small></button>)}
            </div>
          </ProfileSection>

          <ProfileSection title="Objetivo principal">
            <div className="flex flex-wrap gap-2">
              {goals.map((item) => <button key={item.value} type="button" className={`profile-chip ${local.goal === item.value ? "is-active" : ""}`} onClick={() => set({ goal: item.value })}><span />{item.label}</button>)}
            </div>
          </ProfileSection>

          <ProfileSection title="Biotipo" hint={`${bodyTypes.findIndex((item) => item.value === local.body_type) + 1} de 3`}>
            <div className="profile-biotypes">
              {bodyTypes.map((item) => {
                const active = local.body_type === item.value;
                return <button key={item.value} type="button" className={`profile-biotype ${active ? "is-active" : ""}`} onClick={() => set({ body_type: item.value })}><span className="profile-biotype-bar" /><span className="min-w-0 text-left"><strong>{item.label}</strong><small>{item.desc}</small></span><span className="profile-check">{active && <Check size={12} />}</span></button>;
              })}
            </div>
          </ProfileSection>

          <ProfileSection title="Sono">
            <SliderPanel label="Horas por noite" value={`${local.sleep_hours}h`} minLabel="4h" maxLabel="10h">
              <input className="profile-range" type="range" min={4} max={10} step={0.5} value={local.sleep_hours} onChange={(e) => set({ sleep_hours: Number(e.target.value) })} aria-label="Horas de sono por noite" />
              <div className="profile-choice-row mt-5">
                {sleepQualities.map((item) => <button key={item.value} type="button" className={local.sleep_quality === item.value ? "is-active" : ""} onClick={() => set({ sleep_quality: item.value })}><span>{item.emoji}</span>{item.label}</button>)}
              </div>
            </SliderPanel>
          </ProfileSection>

          <ProfileSection title="Treino">
            <SliderPanel label="Frequência semanal" value={`${local.weekly_frequency}x`} minLabel="2x" maxLabel="7x">
              <input className="profile-range" type="range" min={2} max={7} value={local.weekly_frequency} onChange={(e) => set({ weekly_frequency: Number(e.target.value) })} aria-label="Frequência semanal de treino" />
              <div className="profile-choice-row mt-5">
                {trainingTimes.map((item) => <button key={item.value} type="button" className={local.training_time === item.value ? "is-active" : ""} onClick={() => set({ training_time: item.value })}><span>{item.emoji}</span>{item.label}</button>)}
              </div>
            </SliderPanel>
          </ProfileSection>

          <Button onClick={handleSave} disabled={saving} className="profile-save h-14 w-full rounded-[14px] text-[14px] font-semibold">
            {saving && <Loader2 className="animate-spin" />}{saving ? "Salvando..." : "Salvar perfil"}
          </Button>

          <SmartwatchPanel />
          <Button variant="outline" onClick={() => navigate("/nutrition")} className="h-12 w-full rounded-[14px] border-border bg-secondary text-foreground"><Apple className="text-primary" />Ver minha nutrição</Button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function ProfileSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <section><div className="mb-3 flex items-baseline justify-between"><h2 className="profile-display text-[16px] font-semibold">{title}</h2>{hint && <span className="text-[12px] text-muted-foreground/60">{hint}</span>}</div>{children}</section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-[12px] text-muted-foreground">{label}</span>{children}</label>;
}

function MetricCell({ label, value, unit, onDecrease, onIncrease }: { label: string; value: number; unit: string; onDecrease: () => void; onIncrease: () => void }) {
  return <div className="profile-metric"><span className="text-[11px] text-muted-foreground/60">{label}</span><div className="mt-4 flex items-baseline gap-1"><strong className="profile-display text-[20px] font-semibold">{value}</strong><span className="text-[11px] text-muted-foreground">{unit}</span></div><div className="mt-2 flex gap-1"><Button variant="ghost" size="icon" className="h-6 w-6 rounded-md bg-muted text-muted-foreground" onClick={onDecrease} aria-label={`Diminuir ${label.toLowerCase()}`}>−</Button><Button variant="ghost" size="icon" className="h-6 w-6 rounded-md bg-muted text-muted-foreground" onClick={onIncrease} aria-label={`Aumentar ${label.toLowerCase()}`}>+</Button></div></div>;
}

function SliderPanel({ label, value, minLabel, maxLabel, children }: { label: string; value: string; minLabel: string; maxLabel: string; children: React.ReactNode }) {
  return <div className="rounded-[16px] border border-border bg-secondary p-4"><div className="mb-3 flex items-center justify-between"><span className="text-[13px] text-muted-foreground">{label}</span><strong className="profile-display text-[19px] font-semibold text-primary">{value}</strong></div>{children}<div className="mt-1 flex justify-between text-[10px] text-muted-foreground/60"><span>{minLabel}</span><span>{maxLabel}</span></div></div>;
}