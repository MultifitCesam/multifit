import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/multifit-logo.png";
import { getKeepLoggedIn, setKeepLoggedIn } from "@/lib/auth-persistence";

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(60),
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});
const signInSchema = signUpSchema.omit({ name: true });

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLogged, setKeepLogged] = useState(getKeepLoggedIn());
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeepLoggedIn(keepLogged);
    setBusy(true);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse({ name, email, password });
        if (!parsed.success) {
          toast({ title: "Dados inválidos", description: parsed.error.issues[0].message, variant: "destructive" });
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: parsed.data.name },
          },
        });
        if (error) throw error;
        toast({ title: "Conta criada! 🎉", description: "Bem-vindo ao MultiFit." });
      } else {
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast({ title: "Dados inválidos", description: parsed.error.issues[0].message, variant: "destructive" });
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast({ title: "Bem-vindo de volta! 💪" });
      }
    } catch (err: any) {
      const msg = String(err?.message || "");
      let friendly = msg;
      if (msg.includes("Invalid login")) friendly = "Email ou senha incorretos.";
      else if (msg.includes("already registered")) friendly = "Email já cadastrado. Faça login.";
      toast({ title: "Erro", description: friendly, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-44 h-44 mx-auto relative group"
          >
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-colors animate-pulse" />
            <img
              src={logo}
              alt="MultiFit"
              className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_15px_rgba(132,204,22,0.5)] rounded-full"
            />
          </motion.div>
          <h2 className="text-3xl font-medium text-foreground mt-8">
            MultiFit
          </h2>
          <p className="text-[12px] text-muted-foreground mt-2 font-medium">
            {mode === "login" ? "Bem-vindo de volta" : "Comece sua evolução"}
          </p>
        </div>

        <div className="bg-secondary border border-border/50 rounded-[24px] p-8 relative overflow-hidden">

          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 px-1 block tracking-tight">Nome</label>
                <div className="relative group">
                  <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-background border border-border/50 rounded-[14px] pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                    required
                  />
                </div>
              </motion.div>
            )}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 px-1 block tracking-tight">Email</label>
              <div className="relative group">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="w-full bg-background border border-border/50 rounded-[14px] pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase mb-1.5 px-1 block tracking-tight">Senha</label>
              <div className="relative group">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-background border border-border/50 rounded-[14px] pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/40"
                  required
                  minLength={6}
                />
              </div>
            </div>


            <label className="flex items-center gap-3 text-[13px] text-muted-foreground cursor-pointer select-none pt-2 group">
              <input
                type="checkbox"
                checked={keepLogged}
                onChange={(e) => setKeepLogged(e.target.checked)}
                className="w-4 h-4 rounded border-border/50 bg-background accent-primary cursor-pointer transition-all"
              />
              <span className="group-hover:text-foreground transition-colors">Manter conectado</span>
            </label>


            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={busy}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-[14px] disabled:opacity-60 flex items-center justify-center gap-2 mt-4"
            >
              {busy ? <Loader2 size={18} className="animate-spin" /> : null}
              {mode === "login" ? "Entrar agora" : "Criar minha conta"}
            </motion.button>

          </form>



          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-sm text-muted-foreground hover:text-primary mt-5 text-center transition-colors"
          >
            {mode === "login"
              ? "Não tem conta? Cadastre-se"
              : "Já tem conta? Entre"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
