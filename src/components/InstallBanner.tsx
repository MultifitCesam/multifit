import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.()
  );
}

/** Inline install card shown on the login screen, before the user signs in. */
export default function InstallBanner() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const onBip = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setEvt(null);
  };

  return (
    <div className="mb-6 rounded-2xl border border-primary/40 bg-primary/10 p-4">
      <p className="text-sm font-medium text-foreground">Instale o MultiFit antes de entrar</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {ios ? (
          <>Toque em <Share size={12} className="inline" /> Compartilhar e depois em "Adicionar à Tela de Início".</>
        ) : evt ? (
          "Acesse mais rápido, em tela cheia, direto do seu celular."
        ) : (
          "No menu do navegador, toque em \"Instalar app\" ou \"Adicionar à tela inicial\"."
        )}
      </p>
      {!ios && evt && (
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
