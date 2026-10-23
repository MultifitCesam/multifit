import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import logo from "@/assets/multifit-logo.png";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const KEY = "mf_install_dismissed_at";

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  );
}

export default function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (isStandalone() || window.self !== window.top) return;
    const last = Number(localStorage.getItem(KEY) || 0);
    if (Date.now() - last < 3 * 24 * 3600 * 1000) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) { setIos(true); setShow(true); }

    const onBip = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); setShow(true); };
    const onInstalled = () => setShow(false);
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => { localStorage.setItem(KEY, String(Date.now())); setShow(false); };
  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    setEvt(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-[60] mx-auto max-w-md rounded-2xl border border-border bg-card p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <img src={logo} alt="MultiFit" className="h-11 w-11 rounded-full" />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Instale o MultiFit</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ios ? (
              <>Toque em <Share size={12} className="inline" /> Compartilhar e depois em "Adicionar à Tela de Início".</>
            ) : (
              "Acesse mais rápido, em tela cheia, direto do seu celular."
            )}
          </p>
        </div>
        <button onClick={dismiss} aria-label="Fechar" className="p-1 text-muted-foreground hover:text-foreground">
          <X size={18} />
        </button>
      </div>
      {!ios && (
        <button
          onClick={install}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Download size={16} /> Instalar app
        </button>
      )}
    </div>
  );
}
