import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Check, Loader2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cropAvatar } from "@/lib/avatar-crop";

export default function AvatarCropDialog({ source, busy, onClose, onSave }: {
  source: string | null;
  busy: boolean;
  onClose: () => void;
  onSave: (image: Blob) => Promise<void>;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setCrop({ x: 0, y: 0 }); setZoom(1); setArea(null); setError(null);
  }, [source]);
  const saving = busy || preparing;
  async function save() {
    if (!source || !area || saving) return;
    setPreparing(true); setError(null);
    try { await onSave(await cropAvatar(source, area)); }
    catch { setError("Não foi possível salvar a foto. Tente novamente."); }
    finally { setPreparing(false); }
  }
  return <Dialog open={Boolean(source)} onOpenChange={open => { if (!open && !saving) onClose(); }}>
    <DialogContent className="max-w-[min(440px,calc(100%-32px))] rounded-lg" onEscapeKeyDown={e => { if (saving) e.preventDefault(); }} onInteractOutside={e => { if (saving) e.preventDefault(); }}>
      <DialogHeader><DialogTitle>Recortar foto</DialogTitle><DialogDescription className="sr-only">Selecionar enquadramento da foto de perfil</DialogDescription></DialogHeader>
      <div className="avatar-crop-stage" aria-label="Enquadramento da foto">
        {source && <Cropper image={source} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, pixels) => setArea(pixels)} onMediaLoaded={() => setError(null)} onWheelRequest={() => !saving} />}
      </div>
      <div className="flex items-center gap-3"><ZoomIn size={18} className="shrink-0 text-muted-foreground" /><Slider aria-label="Zoom da foto" min={1} max={3} step={0.01} value={[zoom]} onValueChange={([value]) => setZoom(value)} disabled={saving} /></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button variant="outline" disabled={saving} onClick={onClose}>Cancelar</Button><Button disabled={!area || saving} onClick={save}>{saving ? <Loader2 className="animate-spin" /> : <Check />}Salvar foto</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}