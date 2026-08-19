import { useEffect, useState } from "react";
import { Home, Bot, Users, Footprints, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Footprints, label: "Corrida", path: "/runs" },
  { icon: Users, label: "Social", path: "/community" },
  { icon: MessageCircle, label: "DMs", path: "/messages", badge: true },
  { icon: Bot, label: "Coach", path: "/chat" },
  { icon: User, label: "Perfil", path: "/profile" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("read", false);
      setUnread(count ?? 0);
    };
    load();
    const ch = supabase.channel("nav-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between py-3 px-6 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === "/messages" && location.pathname.startsWith("/messages"));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-1 transition-colors"
            >
              <div className="relative">
                <item.icon size={20} className={isActive ? "text-primary" : "text-muted-foreground"} />
                {item.badge && unread > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>

  );
}
