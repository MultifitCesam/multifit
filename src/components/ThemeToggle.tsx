import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { getTheme, toggleTheme, type Theme } from "@/lib/theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => { setTheme(getTheme()); }, []);
  return (
    <button
      onClick={() => setTheme(toggleTheme())}
      aria-label="Alternar tema"
      className={`p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors ${className}`}
    >
      {theme === "dark" ? <Sun size={16} className="text-primary" /> : <Moon size={16} className="text-primary" />}
    </button>
  );
}
