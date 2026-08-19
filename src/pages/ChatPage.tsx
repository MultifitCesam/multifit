import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Loader2, Sparkles, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const suggestions = [
  "Como melhorar minha postura no agachamento?",
  "O que comer antes do treino?",
  "Sugira um aquecimento de 10 min",
  "Como aumentar massa muscular rápido?",
];

export default function ChatPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load history
  useEffect(() => {
    if (!user) return;
    supabase
      .from("chat_messages")
      .select("role,content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (data) setMessages(data as Msg[]);
      });
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading || !user) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    // Persist user message
    supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: userMsg.content });

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m));
        }
        return [...prev, { role: "assistant", content: acc }];
      });
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({ title: "Sessão expirada", description: "Faça login novamente.", variant: "destructive" });
        setLoading(false);
        return;
      }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-fitness`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: next, profile }),
      });


      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast({ title: "Muitas requisições", description: "Tente novamente em instantes.", variant: "destructive" });
        else if (resp.status === 402) toast({ title: "Créditos esgotados", description: "Adicione créditos no workspace.", variant: "destructive" });
        else toast({ title: "Erro no chat", variant: "destructive" });
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const r = await reader.read();
        if (r.done) break;
        buf += decoder.decode(r.value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }

      if (acc) {
        await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: acc });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Erro de conexão", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (!user) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
    toast({ title: "Histórico limpo" });
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 max-w-lg mx-auto bg-background">
      <header className="px-5 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--bg-success))] flex items-center justify-center">
            <Bot size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-base font-medium text-foreground">MultiFit Coach</h1>
            <p className="text-[12px] text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> online • ia
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button onClick={clearChat} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 size={16} />
          </button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-secondary border border-border/50 rounded-[20px] p-8 mt-4"
          >
            <Sparkles size={24} className="text-primary mb-4" />
            <h2 className="text-base font-medium text-foreground mb-2">Seu coach pessoal</h2>
            <p className="text-[13px] text-muted-foreground mb-8 leading-relaxed">
              Tire dúvidas sobre treino, nutrição e recuperação. Suas respostas usam seu perfil para serem totalmente personalizadas.
            </p>
            <div className="space-y-3">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left text-[12px] bg-background border border-border/50 px-4 py-3.5 rounded-[14px] text-muted-foreground hover:text-foreground transition-all active:scale-[0.98]"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}


        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-[18px] px-4 py-3 text-[13px] leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-[4px]"
                  : "bg-secondary border border-border/50 text-foreground rounded-tl-[4px]"
              }`}
            >

              {m.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-strong:text-primary">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{m.content}</p>
              )}
            </div>
          </motion.div>
        ))}

        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Pensando...</span>
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={e => { e.preventDefault(); send(input); }}
        className="fixed bottom-[68px] left-0 right-0 z-40 px-5 py-3 bg-background border-t border-border/50"
      >
        <div className="max-w-lg mx-auto flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pergunte ao seu coach..."
            disabled={loading}
            className="flex-1 bg-secondary border border-border/50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </form>


      <BottomNav />
    </div>
  );
}
