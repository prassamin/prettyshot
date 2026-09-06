"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { EffectSlider } from "../../components/effect-slider";
import { OverlayGrid } from "./overlay-grid";
import { TOKEN_OVERLAY_OPACITY } from "./constants";
import type { OverlayConfig } from "./types";

interface OverlayControlProps {
  overlay: OverlayConfig;
  setOverlayPatch: (patch: Partial<OverlayConfig>) => void;
  setPreviewVar: (name: string, value: string | null) => void;
  clearPreviewVarAfterPaint: (name: string) => void;
}

export function OverlayControl({
  overlay,
  setOverlayPatch,
  setPreviewVar,
  clearPreviewVarAfterPaint,
}: OverlayControlProps) {
  const isOverlaySelected = overlay.id !== null;

  return (
    <div className="space-y-4">
      {/* Texture Preset Gallery Grid */}
      <OverlayGrid
        selectedId={overlay.id}
        onSelect={(selectedItem) =>
          setOverlayPatch({
            id: selectedItem ? selectedItem.id : null,
            url: selectedItem ? selectedItem.url : null,
          })
        }
      />

      {/* Layer Placement & Density Controls (Visible only when shadow texture is active) */}
      {isOverlaySelected && (
        <div className="space-y-3.5 pt-3 border-t border-border/75">
          {/* Shadow Stacking Layer Selection */}
          <div className="space-y-1.5">
            <span className="block text-[10.5px] font-medium text-muted-foreground">
              Shadow Placement
            </span>
            <div className="grid grid-cols-2 gap-2">
              {/* Foreground (Screenshot Top Overlay) */}
              <button
                type="button"
                onClick={() => setOverlayPatch({ position: "overlay" })}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-xl border p-2 text-center transition-all select-none cursor-pointer",
                  overlay.position === "overlay"
                    ? "border-primary bg-primary/6 ring-2 ring-primary/40 shadow-sm"
                    : "border-border/60 bg-foreground/2 hover:border-border/80 hover:bg-foreground/4 hover:scale-[1.01]",
                )}
              >
                <div className="relative h-12 w-full overflow-hidden rounded-lg border border-border/50 bg-surface-secondary flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--foreground)_4%,transparent)_1px,transparent_1px)] bg-size-[6px_6px]" />

                  {/* Screenshot Card */}
                  <div className="relative flex h-7.5 w-13 items-center justify-center rounded-md border border-foreground/20 bg-surface-secondary/90 shadow-xs">
                    <div className="size-3 rounded-xs border border-foreground/20 bg-foreground/10" />
                  </div>

                  {/* Projected Shadow Lines ON TOP */}
                  <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--overlay)_65%,transparent)_0px,color-mix(in_oklab,var(--overlay)_65%,transparent)_5px,transparent_5px,transparent_12px)] opacity-85" />
                </div>

                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[11px] font-semibold text-foreground tracking-tight">
                    Screenshot
                  </span>
                  <span className="text-[8.5px] text-muted-foreground">
                    Overlay Top
                  </span>
                </div>

                {overlay.position === "overlay" && (
                  <span className="pointer-events-none absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                    <Check className="size-2.5 stroke-3" />
                  </span>
                )}
              </button>

              {/* Background (Backdrop Underlay) */}
              <button
                type="button"
                onClick={() => setOverlayPatch({ position: "underlay" })}
                className={cn(
                  "group relative flex flex-col items-center gap-2 rounded-xl border p-2 text-center transition-all select-none cursor-pointer",
                  overlay.position === "underlay"
                    ? "border-primary bg-primary/6 ring-2 ring-primary/40 shadow-sm"
                    : "border-border/60 bg-foreground/2 hover:border-border/80 hover:bg-foreground/4 hover:scale-[1.01]",
                )}
              >
                <div className="relative h-12 w-full overflow-hidden rounded-lg border border-border/50 bg-surface-secondary flex items-center justify-center">
                  {/* Shadow Lines Behind */}
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--overlay)_65%,transparent)_0px,color-mix(in_oklab,var(--overlay)_65%,transparent)_5px,transparent_5px,transparent_12px)] opacity-85" />

                  {/* Screenshot Card ON TOP */}
                  <div className="relative z-10 flex h-7.5 w-13 items-center justify-center rounded-md border border-foreground/25 bg-surface-secondary/90 shadow-md">
                    <div className="size-3 rounded-xs border border-foreground/25 bg-foreground/15" />
                  </div>
                </div>

                <div className="flex flex-col items-center leading-tight">
                  <span className="text-[11px] font-semibold text-foreground tracking-tight">
                    Backdrop
                  </span>
                  <span className="text-[8.5px] text-muted-foreground">
                    Behind Screenshot
                  </span>
                </div>

                {overlay.position === "underlay" && (
                  <span className="pointer-events-none absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                    <Check className="size-2.5 stroke-3" />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Opacity Slider */}
          <EffectSlider
            label="Opacity"
            value={overlay.opacity}
            onChange={(opacity) => {
              setOverlayPatch({ opacity });
              clearPreviewVarAfterPaint(TOKEN_OVERLAY_OPACITY);
            }}
            onPreview={(opacity) =>
              setPreviewVar(TOKEN_OVERLAY_OPACITY, `${opacity / 100}`)
            }
            suffix="%"
          />
        </div>
      )}
    </div>
  );
}
