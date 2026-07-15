import { useState } from "react";
import { Play, X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getExerciseEmbedUrl, getExerciseVideoUrl } from "@/lib/exercise-videos";

interface Props {
  exerciseName: string;
  size?: "sm" | "md";
}

export default function ExerciseVideo({ exerciseName, size = "sm" }: Props) {
  const [open, setOpen] = useState(false);
  const embed = getExerciseEmbedUrl(exerciseName);
  const search = getExerciseVideoUrl(exerciseName);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition ${size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"}`}
        aria-label={`Ver vídeo de ${exerciseName}`}
      >
        <Play size={size === "sm" ? 10 : 12} />
        Vídeo
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-card rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-3 border-b border-border/40">
                <p className="text-sm font-bold">{exerciseName}</p>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                  <X size={18} />
                </button>
              </div>
              {embed ? (
                <div className="aspect-video bg-black">
                  <iframe
                    src={embed}
                    title={exerciseName}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Ainda não temos um vídeo curado para este exercício.
                  </p>
                  <a
                    href={search}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground font-bold px-4 py-2 rounded-full text-sm"
                  >
                    Buscar no YouTube <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
