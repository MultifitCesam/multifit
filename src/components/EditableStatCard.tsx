import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, Plus, Minus, X, Check } from "lucide-react";

interface EditableStatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  goal?: number;
  unit?: string;
  variant?: "default" | "primary" | "accent";
  quickSteps?: number[]; // e.g. [100, 500] for steps
  onChange: (newValue: number) => void;
  className?: string;
}

export default function EditableStatCard({
  icon: Icon,
  label,
  value,
  goal,
  unit,
  variant = "default",
  quickSteps = [1],
  onChange,
  className,
}: EditableStatCardProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const borderClass = "border-border/50";
  const iconBg = variant === "primary" ? "bg-[hsl(var(--bg-success))]" : variant === "accent" ? "bg-[hsl(var(--bg-accent))]" : "bg-secondary";
  const iconColor = variant === "primary" ? "text-primary" : variant === "accent" ? "text-[hsl(var(--text-accent))]" : "text-muted-foreground";
  const fillClass = variant === "primary" ? "bg-primary" : variant === "accent" ? "bg-[hsl(var(--fill-accent))]" : "bg-muted-foreground";

  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : null;
  const display = value >= 1000 ? value.toLocaleString("pt-BR") : String(value);


  return (
    <>
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => { setDraft(value); setOpen(true); }}
        className={`bg-secondary border rounded-[14px] p-4 text-left w-full transition-all active:scale-[0.98] ${borderClass} ${className || ""}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            <Icon size={20} className={iconColor} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-medium font-body truncate">
              {display}{unit && <span className="text-[12px] text-muted-foreground font-normal ml-1">{unit}</span>}
            </p>
            {pct !== null && (
              <div className="mt-2 h-1 rounded-full bg-background overflow-hidden">
                <div className={`h-full transition-all ${fillClass}`} style={{ width: `${pct}%` }} />
              </div>
            )}

          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass glow-border rounded-2xl p-5 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${iconBg}`}>
                    <Icon size={16} className={iconColor} />
                  </div>
                  <h3 className="font-bold font-display">{label}</h3>
                </div>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                  <X size={16} />
                </button>
              </div>

              <input
                type="number"
                value={draft}
                onChange={(e) => setDraft(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-secondary rounded-xl px-4 py-3 text-2xl font-bold font-display text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {unit && <p className="text-xs text-muted-foreground text-center mt-1">{unit}</p>}

              <div className="grid grid-cols-2 gap-2 mt-4">
                {quickSteps.map((s) => (
                  <div key={s} className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDraft(Math.max(0, draft - s))}
                      className="py-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-primary font-bold flex items-center justify-center gap-1 text-xs"
                    >
                      <Minus size={12} /> {s}
                    </button>
                    <button
                      onClick={() => setDraft(draft + s)}
                      className="py-2.5 rounded-xl bg-secondary text-foreground hover:text-primary font-bold flex items-center justify-center gap-1 text-xs"
                    >
                      <Plus size={12} /> {s}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { onChange(draft); setOpen(false); }}
                className="w-full mt-4 bg-gradient-primary text-primary-foreground font-bold py-3 rounded-xl shadow-neon flex items-center justify-center gap-2"
              >
                <Check size={16} /> Salvar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
