/**
 * UploadArea — drag & drop / click-to-browse media import surface.
 *
 * The interactive heart of every empty state: a styled card that opens the
 * native file picker on click and reports the chosen file via `onPickFile`.
 * Supports three densities:
 *
 * - Full: card with animated conic "magic" border, dotted backdrop, upload
 *   icon, copy, and a "Browse Files" pill.
 * - Compact: a floating circular "+" button that pops a small panel with the
 *   full area inside (used on small frames / rotated mockups).
 * - `isIcon` toggles the animated upload glyph on the full variant.
 *
 * ── Drag & drop ───────────────────────────────────────────────────────────
 * The card itself does not listen to native drop events — the drag-over
 * state is driven by the parent (the canvas drop handler) via `isDropHover`,
 * which only styles the card. Keep it that way: the drop zone spans the whole
 * canvas, not just this card.
 *
 * ── Import configuration types ────────────────────────────────────────────
 * `ImportConfig` (+ friends) describe the automated screenshot-capture
 * presets (device class, crop ratio, pixel width, delay) used elsewhere by
 * the capture tooling — unrelated to this UI, exported from here for
 * convenience.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Image as UploadCloud } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { isDrawingArmed } from "@/editor/lib/canvas-helpers";
import { useEditor } from "@/editor/lib/engine";
import { Popover, PopoverContent, PopoverTrigger } from "@heroui/react";

/** MIME types the platform accepts as media. */
export const ACCEPTED_MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp"];

type UploadAreaProps = {
  /** Whether a file drag is currently hovering the parent drop zone. */
  isDropHover?: boolean;
  /** Consumes the chosen file (picker or drop). */
  onPickFile: (file: File) => void;
  /** Shows the "Ctrl + V to paste" hint strip at the bottom. */
  showHint?: boolean;
  className?: string;
  /** Extra classes for the inner surface mask layer. */
  maskClassName?: string;
  /** Compact circular trigger variant. */
  compact?: boolean;
  /** Whether the full variant shows the animated upload icon. */
  isIcon?: boolean;
};

export function UploadArea({
  isDropHover = false,
  onPickFile,
  showHint = false,
  className,
  maskClassName,
  compact = false,
  isIcon = true,
}: UploadAreaProps) {
  const { activeTool, annotation } = useEditor();
  const [isHovered, setIsHovered] = useState(false);
  const selectRef = useRef<HTMLInputElement>(null);

  const [microOpen, setMicroOpen] = useState(false);
  const microTrigRef = useRef<HTMLButtonElement>(null);
  const microZoneRef = useRef<HTMLDivElement>(null);

  // Close the micro popover on any outside tap. The `data-closing` marker
  // tells the canvas empty-state's click-to-open handler to ignore the same
  // tap that just closed it (otherwise it would immediately reopen).
  useEffect(() => {
    if (!compact || !microOpen) return;
    function globalTap(e: PointerEvent) {
      if (microZoneRef.current?.contains(e.target as Node)) return;
      if (microTrigRef.current?.contains(e.target as Node)) return;
      if (
        e.target instanceof Element &&
        e.target.closest("[data-radix-popper-content-wrapper]")
      )
        return;
      microTrigRef.current?.setAttribute("data-closing", "true");
      setMicroOpen(false);
    }
    document.addEventListener("pointerdown", globalTap, true);
    return () => document.removeEventListener("pointerdown", globalTap, true);
  }, [compact, microOpen]);

  if (compact) {
    return (
      <Popover isOpen={microOpen} onOpenChange={setMicroOpen}>
        <PopoverTrigger>
          <button
            ref={microTrigRef}
            type="button"
            data-upload-compact-trigger
            data-state={microOpen ? "open" : "closed"}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setMicroOpen(!microOpen);
            }}
            style={{
              transform:
                "scale(clamp(1, calc(1 / var(--canvas-fit-scale, 1)), 1.8))",
              transformOrigin: "center",
            }}
            className={cn(
              "pointer-events-auto grid place-items-center rounded-full border border-foreground/15 bg-surface-secondary/80 text-foreground shadow-xl backdrop-blur-xl transition-all hover:scale-110 hover:bg-surface-tertiary *:select-none",
              "size-12 sm:size-16",
              className,
            )}
          >
            <Plus className="size-6 sm:size-8" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          placement="bottom"
          onPointerDown={(e) => e.stopPropagation()}
          className="w-64 overflow-hidden rounded-2xl border border-foreground/15 bg-background/80 p-0 text-foreground shadow-2xl backdrop-blur-3xl *:select-none"
        >
          <div ref={microZoneRef} className="h-full w-full">
            <UploadArea
              isDropHover={isDropHover}
              onPickFile={onPickFile}
              showHint={false}
              isIcon={false}
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{ scale: isDropHover ? 1.02 : 1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl bg-background p-2 shadow-2xl sm:p-4 *:select-none",
        className,
      )}
    >
      {/* Hidden file input — clicked programmatically by the browse button. */}
      <input
        ref={selectRef}
        type="file"
        accept={ACCEPTED_MEDIA_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onPickFile(file);
          }
          e.target.value = "";
        }}
      />

      {/* Rotating conic "magic" border, visible on hover/drag-over. */}
      <div
        className="pointer-events-none absolute -inset-full z-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 mix-blend-screen"
        style={{ opacity: isDropHover ? 1 : undefined }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="h-full w-full"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg 340deg, var(--color-primary) 360deg)",
          }}
        />
      </div>

      {/* Surface mask over the animated border. */}
      <div
        className={cn(
          "absolute inset-px z-0 rounded-2xl bg-surface",
          maskClassName,
        )}
      />

      {/* Soft primary glow blobs behind the content. */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-700"
        style={{ opacity: isDropHover || isHovered ? 1 : 0 }}
      >
        <div className="absolute -top-1/2 -left-1/2 h-full w-full rounded-full bg-primary opacity-[0.15] blur-[120px] mix-blend-screen" />
        <div className="absolute -right-1/2 -bottom-1/2 h-full w-full rounded-full bg-primary opacity-[0.10] blur-[120px] mix-blend-screen" />
      </div>

      {/* Film-grain noise overlay. */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')",
        }}
      />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Main click target: opens the file picker. */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (isDrawingArmed(activeTool, annotation?.mode)) return;
            selectRef.current?.click();
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border px-4 py-8 transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-white/20 active:scale-[0.98] **:relative",
            isDropHover
              ? "border-primary/50 bg-primary/10 shadow-[inset_0_0_30px_0_var(--color-primary)]"
              : "border-foreground/15 bg-overlay/40 hover:border-primary/30 hover:bg-overlay/60",
          )}
        >
          {/* Dotted radial backdrop. */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, color-mix(in oklab, var(--foreground) 100%, transparent) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
              maskImage:
                "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%)",
            }}
          />

          {isIcon && (
            <motion.div
              animate={{
                y: isDropHover ? -8 : [0, -4, 0],
                scale: isDropHover ? 1.1 : 1,
              }}
              transition={{
                y: isDropHover
                  ? { type: "spring", stiffness: 400, damping: 25 }
                  : { duration: 4, repeat: Infinity, ease: "easeInOut" },
                scale: { type: "spring", stiffness: 400, damping: 25 },
              }}
              className={cn(
                "relative z-10 grid place-items-center rounded-2xl p-3 transition-colors duration-500",
                isDropHover || isHovered
                  ? "border border-primary/30 bg-primary/20 shadow-lg shadow-primary/40"
                  : "border border-border/40 bg-foreground/5",
              )}
            >
              <UploadCloud
                className={cn(
                  "size-6 transition-colors duration-500",
                  isDropHover || isHovered
                    ? "text-primary"
                    : "text-foreground/80 opacity-70",
                )}
              />
            </motion.div>
          )}

          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "text-[14px] font-bold tracking-wide transition-colors duration-500",
                  isDropHover || isHovered
                    ? "text-foreground drop-shadow-[0_0_10px_color-mix(in_oklab,var(--foreground)_30%,transparent)]"
                    : "text-foreground/80",
                )}
              >
                {isDropHover ? "Drop to Import" : "Drag & drop your media here"}
              </span>
              <span
                className={cn(
                  "text-[12px] font-medium transition-colors duration-500",
                  isDropHover || isHovered
                    ? "text-primary/80"
                    : "text-muted-foreground",
                )}
              >
                High resolution recommended. JPG, PNG
              </span>
            </div>
            <div className="mt-2 rounded-full border border-foreground/15 bg-foreground/5 px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors group-hover:border-foreground/20 group-hover:bg-foreground/10">
              Browse Files
            </div>
          </div>
        </button>

        {/* Paste hint strip. */}
        {showHint && (
          <div
            className={cn(
              "mt-2 flex -mx-3 items-center justify-center rounded-b-[16px] border-t bg-surface-muted px-4 py-3 text-sm transition-colors duration-500 sm:-mx-4 sm:-mb-4 -mb-3",
              isDropHover || isHovered
                ? "border-accent-soft-hover"
                : "border-border/40",
            )}
          >
            <span className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="font-semibold">Ctrl + V</span>
              <span className="font-medium opacity-60">to paste directly</span>
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
