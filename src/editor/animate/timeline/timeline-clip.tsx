"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Crop,
  Grid2X2,
  type LucideIcon,
  Moon,
  Move,
  Paintbrush,
  Palette,
  RotateCw,
  Sun,
  ZoomIn,
} from "lucide-react";

import type { AnimationEffect } from "@/editor/lib/animation/types";
import { cn } from "@/lib/utils";

import type { ClipDragMode, ClipThumb } from "../types";

type TimelineClipProps = {
  left: number;
  width: number;
  selected: boolean;
  dragging: boolean;
  interacting: boolean;
  /** Clip sits past the set timeline duration — rendered faded and blurred. */
  beyond: boolean;
  /**
   * Razor (cut) tool is active: the clip shows the scissor cursor, the trim
   * grips are disabled, and a pointer-down cuts instead of dragging (the cut
   * itself is handled upstream in onPointerDownClip).
   */
  razorMode: boolean;
  /**
   * Thumbnail(s) of the screenshot(s) this clip animates. A single image
   * renders as one preview; multiple (an "all" clip) render as a small grid.
   */
  images: ClipThumb[];
  iconKeys: AnimationEffect[];
  onPointerDownClip: (e: React.PointerEvent, mode: ClipDragMode) => void;
  onPointerMoveClip: (e: React.PointerEvent) => void;
  onPointerUpClip: (e: React.PointerEvent) => void;
};

const gripHandle =
  "absolute inset-y-0 flex w-3 cursor-ew-resize touch-none items-center justify-center";
const gripPill =
  "h-4 w-1 rounded-full bg-muted-foreground opacity-0 shadow-sm transition-opacity duration-150 group-hover/clip:opacity-100";

// property panel matching icons for the properties a clip animates.
const ICON_FOR: Record<AnimationEffect, LucideIcon> = {
  position: Move,
  zoom: ZoomIn,
  tilt: RotateCw,
  padding: Grid2X2,
  shadow: Moon,
  backdrop: Sun,
  background: Palette,
  lighting: Sun,
  filter: Sun,
  overlay: Sun,
  border: Paintbrush,
  borderRadius: Paintbrush,
  crop: Crop,
};

export function TimelineClip({
  left,
  width,
  selected,
  dragging,
  interacting,
  beyond,
  razorMode,
  images,
  iconKeys,
  onPointerDownClip,
  onPointerMoveClip,
  onPointerUpClip,
}: TimelineClipProps) {
  // Several effects deliberately share an icon (border + border radius → brush;
  // backdrop / lighting / filter / portrait / pattern / overlay / canvas radius →
  // sun). Collapse to unique glyphs so a clip animating two of them doesn't show
  // the same icon twice.
  const uniqueIcons: LucideIcon[] = [];
  for (const key of iconKeys) {
    const Icon = ICON_FOR[key];
    if (!uniqueIcons.includes(Icon)) uniqueIcons.push(Icon);
  }
  return (
    <motion.div
      onPointerDown={(e) => onPointerDownClip(e, "move")}
      onPointerMove={onPointerMoveClip}
      onPointerUp={onPointerUpClip}
      // Selection (and click-to-deselect) is handled in the pointer
      // down/up cycle; this just stops the click from reaching the track.
      onClick={(e) => e.stopPropagation()}
      // Razor tool overrides the grab cursor with the scissor cursor.
      className={cn(
        "group/clip absolute top-1 bottom-1 z-20 touch-none overflow-hidden rounded-md border bg-[color-mix(in_oklab,var(--surface-tertiary)_92%,var(--foreground)_8%)] text-foreground transition-all duration-150 ease-out",
        razorMode ? "cursor-scissor" : "cursor-grab active:cursor-grabbing",
        selected
          ? "border-primary ring-1 ring-primary/50 shadow-md"
          : "border-border/70 hover:border-border",
        dragging && "z-30 border-primary ring-2 ring-primary/60 shadow-xl",
        // Past the set duration → desaturated to read as "beyond". The blur
        // is applied by the inactive-region overlay (which sits above the
        // clips) so a clip straddling the duration only blurs its overflow
        // portion, not the whole clip.
        beyond && "saturate-50 opacity-60",
      )}
      // Slide to new left/width when clips shift (e.g. duplicate ripples the
      // neighbours over). The clip you're actively dragging/trimming updates
      // instantly so it never lags behind the pointer. `left`/`width` start
      // at their real value in `initial` so a fresh clip pops in place (no
      // slide from 0) while only opacity/scale animate — that gives the
      // duplicated clip a visible fade+scale-in even when it lands in a gap
      // and no neighbours move.
      initial={{ opacity: 0, scale: 0.8, left, width }}
      animate={{
        left,
        width,
        y: dragging ? -3 : 0,
        opacity: beyond ? 0.5 : 1,
        scale: 1,
      }}
      // On delete, fade + shrink out while the neighbours slide in to fill.
      exit={{
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
      }}
      transition={
        interacting
          ? { duration: 0 }
          : { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
      }
    >
      {/* Centered mockup preview — the screenshot(s) this clip animates.
              A single target shows one thumbnail; an "all" clip shows every
              image as a compact grid so it reads as spanning all of them. */}
      <div className="pointer-events-none flex h-full items-center justify-center px-3">
        {images.length === 0 ? (
          <span className="h-7 w-12 rounded-[5px] bg-surface-muted ring-1 ring-border" />
        ) : images.length === 1 ? (
          // Fixed box + object-cover so tall full-page captures crop like the
          // canvas (not shrink to a 2px-wide intrinsic strip).
          <span className="relative h-7 w-12 overflow-hidden rounded-[5px] ring-1 ring-border">
            <img
              src={images[0].src}
              alt=""
              className="size-full object-cover"
              style={
                images[0].objectPosition
                  ? { objectPosition: images[0].objectPosition }
                  : undefined
              }
            />
          </span>
        ) : (
          // Up to 4 thumbnails in a 2-col grid; a "+N" chip if there are more.
          <div className="grid max-w-17 grid-cols-2 gap-0.5">
            {images.slice(0, 4).map((thumb, i) => (
              <div
                key={i}
                className="relative h-3.5 w-5.5 overflow-hidden rounded-[3px] ring-1 ring-border"
              >
                <img
                  src={thumb.src}
                  alt=""
                  className="size-full object-cover"
                  style={
                    thumb.objectPosition
                      ? { objectPosition: thumb.objectPosition }
                      : undefined
                  }
                />
                {i === 3 && images.length > 4 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-overlay/80 text-[9px] font-semibold text-overlay-foreground">
                    +{images.length - 3}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {uniqueIcons.length > 0 && width >= 78 && (
        <div className="pointer-events-none absolute inset-y-0 right-2 flex max-w-[70%] items-center justify-end gap-1 overflow-hidden">
          {uniqueIcons.map((Icon, i) => (
            <Icon
              key={i}
              className="size-3 shrink-0 text-muted-foreground transition-colors group-hover/clip:text-foreground"
            />
          ))}
        </div>
      )}

      {/* Trim handles — a grip pill on each edge, revealed on hover. */}
      <div
        onPointerDown={(e) => onPointerDownClip(e, "trim-start")}
        onPointerMove={onPointerMoveClip}
        onPointerUp={onPointerUpClip}
        className={cn(
          gripHandle,
          "left-0",
          // Razor tool disables trim so the whole clip is one cut surface.
          razorMode && "pointer-events-none",
        )}
      >
        <span className={cn(gripPill, razorMode && "hidden")} />
      </div>
      <div
        onPointerDown={(e) => onPointerDownClip(e, "trim")}
        onPointerMove={onPointerMoveClip}
        onPointerUp={onPointerUpClip}
        className={cn(
          gripHandle,
          "right-0",
          razorMode && "pointer-events-none",
        )}
      >
        <span className={cn(gripPill, razorMode && "hidden")} />
      </div>
    </motion.div>
  );
}
