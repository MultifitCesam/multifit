import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subtitle?: string;
  variant?: "default" | "primary" | "accent";
}

export default function StatCard({ icon: Icon, label, value, subtitle, variant = "default" }: StatCardProps) {
  const iconBg = variant === "primary" ? "bg-[hsl(var(--bg-success))]" : variant === "accent" ? "bg-[hsl(var(--bg-accent))]" : "bg-secondary";
  const iconColor = variant === "primary" ? "text-primary" : variant === "accent" ? "text-[hsl(var(--text-accent))]" : "text-muted-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary border border-border/50 rounded-[14px] p-4"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-colors bg-background border border-border/50">
        <Icon size={16} className={iconColor} />
      </div>
      <div>
        <p className="text-[12px] text-muted-foreground font-medium mb-0.5">{label}</p>
        <p className="text-xl font-medium font-body truncate leading-none">
          {value}
        </p>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
