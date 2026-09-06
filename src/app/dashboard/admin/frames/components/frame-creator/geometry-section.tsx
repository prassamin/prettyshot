"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Sliders, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FrameCreatorState } from "./use-frame-creator";
import { GeometryEditorModal } from "./geometry-editor-modal";

export function GeometrySection({ ctx }: { ctx: FrameCreatorState }) {
  const {
    geometry,
    setGeometry,
    geometryOpen,
    setGeometryOpen,
    geometryDetecting,
  } = ctx;
  const [modalOpen, setModalOpen] = React.useState(false);

  const patchScreen = (patch: Partial<typeof geometry.screen>) =>
    setGeometry({ ...geometry, screen: { ...geometry.screen, ...patch } });

  // Get active frame image URL for visual preview
  const firstVariantWithFrame = ctx.variants.find(
    (v) => v.frame || v.existingFrameUrl,
  );
  const [frameImageUrl, setFrameImageUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (firstVariantWithFrame?.frame) {
      const url = URL.createObjectURL(firstVariantWithFrame.frame);
      setFrameImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setFrameImageUrl(firstVariantWithFrame?.existingFrameUrl ?? null);
  }, [firstVariantWithFrame?.frame, firstVariantWithFrame?.existingFrameUrl]);

  return (
    <div className="rounded-2xl border border-border/40 bg-background p-4 shadow-inner flex flex-col">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setGeometryOpen((v) => !v)}
          className="flex flex-1 items-center justify-between cursor-pointer pr-2"
        >
          <span className="flex items-center gap-2 text-[11px] font-semibold text-foreground">
            <Wand2
              className={cn(
                "size-3.5",
                geometryDetecting
                  ? "animate-pulse text-primary"
                  : "text-muted-foreground",
              )}
            />
            Geometry & Screen Projection
            {geometryDetecting && (
              <span className="text-[10px] font-normal text-primary">
                detecting…
              </span>
            )}
          </span>
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform",
              geometryOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
        Align the screen cutout directly over the hardware bezel.
      </p>

      {/* Visual Live Editor Trigger Button */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border/60 bg-background px-3 py-2.5 text-xs font-semibold text-foreground transition-all hover:bg-muted/10 active:scale-[0.98] shadow-sm"
      >
        <Sliders className="size-3.5 text-primary" />
        <span>Open Visual Geometry Editor & Preview</span>
      </button>

      <AnimatePresence>
        {geometryOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">
                  Frame aspect
                </label>
                <input
                  value={geometry.aspectRatio}
                  onChange={(e) =>
                    setGeometry({ ...geometry, aspectRatio: e.target.value })
                  }
                  className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 font-mono text-[11px] text-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">
                  Screen aspect
                </label>
                <input
                  value={geometry.screen.aspectRatio}
                  onChange={(e) => patchScreen({ aspectRatio: e.target.value })}
                  className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 font-mono text-[11px] text-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">
                  Screen scale
                </label>
                <input
                  type="number"
                  step={0.001}
                  value={geometry.screen.scale}
                  onChange={(e) =>
                    patchScreen({ scale: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 font-mono text-[11px] text-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">
                  Corner radius
                </label>
                <input
                  type="number"
                  value={geometry.screen.borderRadius}
                  onChange={(e) =>
                    patchScreen({ borderRadius: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 font-mono text-[11px] text-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">
                  Position Y (Shift)
                </label>
                <input
                  type="number"
                  step={0.5}
                  value={geometry.screen.offsetY ?? 0}
                  onChange={(e) =>
                    patchScreen({ offsetY: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 font-mono text-[11px] text-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-muted-foreground">
                  Position X (Shift)
                </label>
                <input
                  type="number"
                  step={0.5}
                  value={geometry.screen.offsetX ?? 0}
                  onChange={(e) =>
                    patchScreen({ offsetX: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-border/60 bg-background px-2 py-1.5 font-mono text-[11px] text-foreground focus:border-primary/50 focus:outline-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GeometryEditorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        geometry={geometry}
        onChange={setGeometry}
        frameImageUrl={frameImageUrl}
      />
    </div>
  );
}
