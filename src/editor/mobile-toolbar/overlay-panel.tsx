"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BringToFront, SendToBack } from "lucide-react";

import { useEditorEngine, useEditorStateField } from "@/editor/lib/engine";
import { previewHosts, writeToken } from "@/editor/lib/preview-tokens";
import { EffectSlider } from "../property-panel/components/effect-slider";
import { OverlayGrid } from "../property-panel/sections/backdrop/overlay-grid";
import { TOKEN_OVERLAY_OPACITY } from "../property-panel/sections/backdrop/constants";
import { cn } from "@/lib/utils";

export function MobileOverlayPanel() {
  const overlayState = useEditorStateField((canvas) => canvas.overlay);
  const setOverlay = useEditorEngine((engine) => engine.setOverlay);

  const activeOverlayRef = React.useRef(overlayState);
  React.useEffect(() => {
    activeOverlayRef.current = overlayState;
  });

  const updateLiveToken = React.useCallback(
    (tokenKey: string, tokenVal: string | null) => {
      writeToken(previewHosts(), tokenKey, tokenVal);
    },
    [],
  );

  const flushTokenAfterPaint = React.useCallback(
    (tokenKey: string) => {
      if (typeof requestAnimationFrame === "undefined") return;
      requestAnimationFrame(() => updateLiveToken(tokenKey, null));
    },
    [updateLiveToken],
  );

  const handlePatchOverlay = React.useCallback(
    (patch: Partial<typeof overlayState>) => {
      setOverlay({ ...activeOverlayRef.current, ...patch });
    },
    [setOverlay],
  );

  const isOverlayActive = overlayState.id !== null;

  return (
    <div className="flex w-full flex-col gap-3 px-1 pt-1 pb-5 select-none text-foreground">
      {/* Texture Selector Rail */}
      <OverlayGrid
        selectedId={overlayState.id}
        layout="carousel"
        onSelect={(selectedItem) =>
          handlePatchOverlay({
            id: selectedItem ? selectedItem.id : null,
            url: selectedItem ? selectedItem.url : null,
          })
        }
      />

      {/* Adjustments (Layer Placement & Opacity) */}
      <AnimatePresence initial={false}>
        {isOverlayActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden space-y-3 pt-2 border-t border-border/50"
          >
            {/* Layer Placement Pill Switcher */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                Shadow Placement
              </span>

              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-foreground/4 p-1 ring-1 ring-border/50">
                <button
                  type="button"
                  onClick={() => handlePatchOverlay({ position: "overlay" })}
                  className={cn(
                    "relative flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-[11px] font-medium transition-colors",
                    overlayState.position === "overlay"
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {overlayState.position === "overlay" && (
                    <motion.span
                      layoutId="overlay-pos-pill"
                      className="absolute inset-0 rounded-lg bg-background shadow-xs ring-1 ring-border/60"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <BringToFront className="size-3.5" />
                    <span>On Screenshot</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePatchOverlay({ position: "underlay" })}
                  className={cn(
                    "relative flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-[11px] font-medium transition-colors",
                    overlayState.position === "underlay"
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {overlayState.position === "underlay" && (
                    <motion.span
                      layoutId="overlay-pos-pill"
                      className="absolute inset-0 rounded-lg bg-background shadow-xs ring-1 ring-border/60"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <SendToBack className="size-3.5" />
                    <span>Behind (Backdrop)</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Density / Opacity Slider */}
            <div className="pt-1">
              <EffectSlider
                label="Shadow Intensity"
                value={overlayState.opacity}
                onChange={(opacity) => {
                  handlePatchOverlay({ opacity });
                  flushTokenAfterPaint(TOKEN_OVERLAY_OPACITY);
                }}
                onPreview={(opacity) =>
                  updateLiveToken(TOKEN_OVERLAY_OPACITY, `${opacity / 100}`)
                }
                suffix="%"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
