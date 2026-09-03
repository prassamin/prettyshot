"use client";

import { AnimatePresence } from "framer-motion";
import { CirclePlus } from "lucide-react";

import {
  MAX_DURATION_MS,
  MIN_DURATION_MS,
} from "@/editor/lib/animation/timeline";
import { cn } from "@/lib/utils";

import type { AnimationEffect } from "@/editor/lib/animation/types";
import type { ClipThumb, TimelineLayer } from "../types";
import { TimelineClip } from "./timeline-clip";
import { TimelineRuler } from "./timeline-ruler";

type TimelineStripProps = {
  timelineW: number;
  pxFor: (ms: number) => number;
  durationMs: number;
  playheadMs: number;
  ticks: number[];
  layers: TimelineLayer[];
  razorMode: boolean;
  clipsAnimated: boolean;
  isDurationDragging: boolean;
  showDropPreview: boolean;
  dropPreviewLayerId: string | null;
  dropPreviewWidthPx: number;
  dropPreviewRef: React.RefObject<HTMLDivElement | null>;
  rangeSelectRect: { left: number; width: number } | null;
  highlightedClipIds: string[];
  draggingClipId: string | null;
  interactingClipId: string | null;
  trackRef: React.RefObject<HTMLDivElement | null>;
  trackListRef: React.RefObject<HTMLDivElement | null>;
  clipsForLayer: (layerId: string) => any[];
  resolveClipImages: (clip: any) => ClipThumb[];
  resolveClipIcons: (clip: any) => AnimationEffect[];
  onLayerSelect: (layerId: string) => void;
  onScrubDown: (e: React.PointerEvent) => void;
  onScrubMove: (e: React.PointerEvent) => void;
  onScrubUp: (e: React.PointerEvent) => void;
  onDurationHandleDown: (e: React.PointerEvent) => void;
  onDurationHandleMove: (e: React.PointerEvent) => void;
  onDurationHandleUp: (e: React.PointerEvent) => void;
  onTrackClick: (e: React.MouseEvent) => void;
  onTrackPointerDown: (e: React.PointerEvent) => void;
  onTrackMove: (e: React.PointerEvent) => void;
  onTrackPointerUp: (e: React.PointerEvent) => void;
  onTrackLeave: () => void;
  onClipPointerDown: (e: React.PointerEvent, clip: any, mode: any) => void;
  onClipPointerMove: (e: React.PointerEvent) => void;
  onClipPointerUp: (e: React.PointerEvent) => void;
};

/**
 * The time axis: ruler on top, track below (void, playhead, duration handle,
 * and the clip rows). Wired to the interaction hooks via props.
 */
export function TimelineStrip({
  timelineW,
  pxFor,
  durationMs,
  playheadMs,
  ticks,
  layers,
  razorMode,
  clipsAnimated,
  isDurationDragging,
  showDropPreview,
  dropPreviewLayerId,
  dropPreviewWidthPx,
  rangeSelectRect,
  highlightedClipIds,
  draggingClipId,
  interactingClipId,
  trackRef,
  trackListRef,
  dropPreviewRef,
  clipsForLayer,
  resolveClipImages,
  resolveClipIcons,
  onLayerSelect,
  onScrubDown,
  onScrubMove,
  onScrubUp,
  onDurationHandleDown,
  onDurationHandleMove,
  onDurationHandleUp,
  onTrackClick,
  onTrackPointerDown,
  onTrackMove,
  onTrackPointerUp,
  onTrackLeave,
  onClipPointerDown,
  onClipPointerMove,
  onClipPointerUp,
}: TimelineStripProps) {
  return (
    <div className="relative" style={{ width: timelineW }}>
      <div
        className="cursor-copy touch-none select-none"
        onPointerDown={onScrubDown}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubUp}
        onPointerCancel={onScrubUp}
      >
        <TimelineRuler ticks={ticks} durationMs={durationMs} pxFor={pxFor} />
      </div>

      <div
        ref={trackRef}
        className="relative mt-1 cursor-copy touch-none select-none"
        onPointerDown={onScrubDown}
        onPointerMove={onScrubMove}
        onPointerUp={onScrubUp}
        onPointerCancel={onScrubUp}
      >
        {/* End-of-timeline void — denser pattern + separator line so the
            strip clearly reads as "ends here". Spans the full remaining
            width to the right edge of the strip. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-1 bottom-0 z-25 rounded-r-lg [--tl-cap:color-mix(in_oklab,var(--surface-tertiary)_40%,transparent)] [--tl-cap-hatch:color-mix(in_oklab,var(--muted-foreground)_10%,transparent)]"
          style={{
            left: pxFor(durationMs),
            right: 0,
            backgroundColor: "var(--tl-cap)",
            backgroundImage:
              "repeating-linear-gradient(-45deg, var(--tl-cap-hatch) 0 1px, transparent 1px 7px)",
            borderLeft: "1px solid var(--border)",
            backdropFilter: "blur(2px) saturate(0.6)",
            WebkitBackdropFilter: "blur(2px) saturate(0.6)",
          }}
        />

        <div
          className="pointer-events-none absolute -top-2 bottom-0 z-40 w-0.5 -translate-x-1/2 bg-primary"
          style={{ left: pxFor(Math.min(playheadMs, durationMs)) }}
        >
          <div className="pointer-events-auto absolute -top-2 left-1/2 flex h-4 w-3 -translate-x-1/2 cursor-ew-resize items-center justify-center rounded-[3px] bg-primary shadow-sm">
            <div className="h-2 w-px bg-primary-foreground/80" />
          </div>
        </div>

        <div
          onPointerDown={onDurationHandleDown}
          onPointerMove={onDurationHandleMove}
          onPointerUp={onDurationHandleUp}
          onPointerCancel={onDurationHandleUp}
          role="slider"
          aria-label="Timeline duration"
          aria-valuemin={Math.round(MIN_DURATION_MS / 1000)}
          aria-valuemax={MAX_DURATION_MS / 1000}
          aria-valuenow={Math.round(durationMs / 1000)}
          className="group absolute -top-2 bottom-0 z-30 flex w-6 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center"
          style={{ left: pxFor(durationMs) }}
        >
          <div
            className={cn(
              "rounded-full transition-all duration-150",
              isDurationDragging
                ? "h-full w-1 bg-primary"
                : "h-[calc(100%-1rem)] w-0.75 bg-muted-foreground/35 group-hover:h-full group-hover:w-1 group-hover:bg-primary",
            )}
          />
        </div>

        <div
          ref={trackListRef}
          className="relative min-h-38 space-y-1.5"
          style={{ width: timelineW }}
          onClick={onTrackClick}
          onPointerDown={onTrackPointerDown}
          onPointerMove={onTrackMove}
          onPointerUp={onTrackPointerUp}
          onPointerLeave={onTrackLeave}
          onPointerCancel={onTrackPointerUp}
        >
          {layers.map((layer: any, layerIndex: number) => {
            const isDropRow =
              showDropPreview && dropPreviewLayerId === layer.id;
            return (
              <div
                key={layer.id}
                data-layer-id={layer.id}
                data-layer-kind={layer.kind}
                onClick={() => onLayerSelect(layer.id)}
                className={cn(
                  "group/row relative h-11 cursor-pointer touch-none overflow-visible rounded-lg border border-border/40 bg-surface-tertiary/40 transition-colors hover:border-border/80 hover:bg-surface-tertiary/60",
                  isDropRow && "cursor-copy",
                  razorMode && "cursor-scissor",
                )}
              >
                {layerIndex === 0 && rangeSelectRect && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 z-0 rounded-md border border-primary/70 bg-primary/15"
                    style={{
                      left: rangeSelectRect.left,
                      width: rangeSelectRect.width,
                    }}
                  />
                )}
                {dropPreviewLayerId === layer.id && (
                  <div
                    ref={dropPreviewRef}
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute top-1 bottom-1 left-0 z-10 box-border flex items-center justify-center gap-1.5 overflow-hidden rounded-md border border-dashed border-primary/60 bg-primary/10 px-1 text-[11px] font-medium text-primary backdrop-blur-sm transition-opacity duration-150 ease-out will-change-transform",
                      showDropPreview ? "opacity-100" : "opacity-0",
                    )}
                    style={{ width: dropPreviewWidthPx }}
                  >
                    <CirclePlus className="size-4 shrink-0" />
                  </div>
                )}
                <AnimatePresence>
                  {clipsForLayer(layer.id).map((clip: any) => (
                    <TimelineClip
                      key={clip.id}
                      left={pxFor(clip.startMs)}
                      width={pxFor(clip.durationMs)}
                      selected={highlightedClipIds.includes(clip.id)}
                      dragging={clip.id === draggingClipId}
                      beyond={clip.startMs >= durationMs}
                      razorMode={razorMode}
                      interacting={
                        clip.id === interactingClipId || !clipsAnimated
                      }
                      images={resolveClipImages(clip)}
                      iconKeys={resolveClipIcons(clip)}
                      onPointerDownClip={(e, mode) =>
                        onClipPointerDown(e, clip, mode)
                      }
                      onPointerMoveClip={onClipPointerMove}
                      onPointerUpClip={onClipPointerUp}
                    />
                  ))}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
