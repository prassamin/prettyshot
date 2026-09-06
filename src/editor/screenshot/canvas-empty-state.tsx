/**
 * CanvasEmptyState — the drop placeholder for a canvas with no deviceFrame.
 *
 * Shown when the canvas has no screenshot, no device deviceFrame, and no browser
 * deviceFrame. Three presentation modes:
 *
 * Free placement (`freePlacement`) — a draggable empty box positioned by
 *    `bareFreePlacementStyle`, so the placeholder previews the actual spot
 *    the shot will occupy (used by the canvas view with live offset).
 * Anchored (`anchor` provided) — an aspect-fit box positioned via
 *    `framePositionTransform`, honoring shadow filters.
 * Centered — a simple responsive box in the middle of the canvas.
 *
 * The whole surface is clickable in compact mode (tap-to-open the upload
 * trigger); the `data-closing` marker set by the micro upload popover
 * prevents the same tap that closes it from reopening it.
 */

"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { shadowDropFilterPreviewCss } from "@/editor/lib/css-utils";
import { useEditor } from "@/editor/lib/engine";
import { DropPrompt } from "./drop-prompt";
import {
  frameFitStyle,
  framePositionTransform,
  isDrawingArmed,
} from "@/editor/lib/canvas-helpers";
import { InnerLightingOverlay } from "./inner-lighting-overlay";

type CanvasEmptyStateProps = {
  /** Whether a file drag is currently hovering this target. */
  isDropHover: boolean;
  /** Opens the file picker / consumes a dropped file. */
  onPickFile: (file: File) => void;
  /** Whether the canvas element is active (editor state). */
  isActive?: boolean;
  /** Overrides the preview box styles (row-layout previews). */
  previewCss?: React.CSSProperties;
  /** Compact variant (small/tilted canvases). */
  compact?: boolean;
  /** Canvas aspect (falls back to the editor aspect). */
  aspectW?: number;
  /** Canvas aspect (falls back to the editor aspect). */
  aspectH?: number;
  /** Skip the outer padding in centered mode. */
  noOuterPadding?: boolean;
  /** Optional inner lighting overlay styles. */
  lightingStyle?: React.CSSProperties | null;
  /** Anchor (0–1) for the anchored placeholder box. */
  anchor?: { x: number; y: number };
  /** Pixel offset from the anchor. */
  offset?: { x: number; y: number };
  /** Base CSS transform for the placeholder. */
  transform?: string;
  /** Optional CSS filter for the placeholder's drop shadow. */
  shadowCss?: string;
  /** Extra styles for the placeholder box. */
  boxCss?: React.CSSProperties;
  /** Whether a drag gesture is in flight. */
  isBeingDragged?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export function CanvasEmptyState({
  isDropHover,
  onPickFile,
  isActive = false,
  previewCss,
  compact = false,
  aspectW,
  aspectH,
  noOuterPadding = false,
  lightingStyle,
  anchor,
  offset,
  transform,
  shadowCss,
  boxCss,
  isBeingDragged,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: CanvasEmptyStateProps) {
  const { aspect, activeTool, annotation } = useEditor();
  const aw = aspectW ?? aspect.w ?? 16;
  const ah = aspectH ?? aspect.h ?? 10;
  const effectiveAw = aw || 16;
  const effectiveAh = ah || 10;

  const isPortrait = effectiveAh >= effectiveAw;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const downPointRef = React.useRef<{ x: number; y: number } | null>(null);

  const useCompact = compact || isPortrait;

  // Compact mode: tapping anywhere on the placeholder opens the upload
  // trigger — except taps that already landed on/just closed it, drags
  // (including the tail end of an annotation stroke), or while a drawing
  // tool is armed.
  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!useCompact) return;
    if (isDrawingArmed(activeTool, annotation.mode)) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-upload-compact-trigger]")) return;
    const down = downPointRef.current;
    downPointRef.current = null;
    if (
      down &&
      (Math.abs(e.clientX - down.x) > 5 || Math.abs(e.clientY - down.y) > 5)
    ) {
      // This was a drag/gesture, not a tap — never open the picker.
      return;
    }
    const trigger = rootRef.current?.querySelector<HTMLButtonElement>(
      "[data-upload-compact-trigger]",
    );
    const isClosing = trigger?.getAttribute("data-closing") === "true";
    if (isClosing) {
      trigger?.removeAttribute("data-closing");
      return;
    }
    trigger?.click();
  };

  const interactionClass = cn(
    "pointer-events-auto absolute top-0 left-0 select-none",
    onPointerDown && (activeTool === "pointer" || annotation.mode === "move")
      ? isBeingDragged
        ? "cursor-grabbing transition-none"
        : "cursor-grab"
      : "cursor-pointer",
  );

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      downPointRef.current = { x: e.clientX, y: e.clientY };
      onPointerDown?.(e);
    },
    [onPointerDown],
  );

  // 1) Anchored: aspect-fit box at anchor + offset.
  const hasPosition = anchor !== undefined;
  if (hasPosition) {
    const boxAspect = `${effectiveAw} / ${effectiveAh}`;
    const fitStyle = frameFitStyle(boxAspect, 0);
    return (
      <div
        className="pointer-events-none relative h-full w-full"
        style={{ containerType: "size" }}
      >
        <div
          ref={rootRef}
          onClick={handleAreaClick}
          data-drag-over={isDropHover}
          data-active={isActive}
          data-editor-shadow-filter-target
          data-editor-shadow-filter-base={shadowCss || ""}
          className={cn(interactionClass, "max-h-full max-w-full")}
          style={{
            ...fitStyle,
            ...boxCss,
            left: "50%",
            top: "50%",
            transform: framePositionTransform({
              anchor,
              offset: offset ?? { x: 0, y: 0 },
              transform: transform ?? "",
            }),
            transformOrigin: "center",
            transformStyle: "preserve-3d",

            filter: shadowDropFilterPreviewCss(shadowCss) || undefined,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <DropPrompt
            isDropHover={isDropHover}
            onPickFile={onPickFile}
            compact={useCompact}
          />
        </div>
      </div>
    );
  }

  // Centered: responsive box in the middle of the canvas.
  return (
    <div
      data-drag-over={isDropHover}
      data-active={isActive}
      className={cn(
        "pointer-events-auto relative flex h-full w-full items-center justify-center text-foreground transition-all duration-300",
        !previewCss && !noOuterPadding && "px-4 py-3 sm:px-6 md:px-8",
        "data-[drag-over=true]:scale-[1.005]",
      )}
    >
      <div
        ref={rootRef}
        onClick={handleAreaClick}
        onPointerDown={handlePointerDown}
        style={{
          ...boxCss,
          ...(previewCss ? { transition: "none", ...previewCss } : null),
          ...(isPortrait
            ? { aspectRatio: `${effectiveAw} / ${effectiveAh}` }
            : null),
        }}
        data-drag-over={isDropHover}
        data-active={isActive}
        className={cn(
          "cursor-pointer overflow-hidden rounded-3xl border border-border/30",
          "data-[drag-over=true]:border-accent/60 data-[drag-over=true]:ring-2 data-[drag-over=true]:ring-accent/35",
          isPortrait ? "h-auto max-h-[85%] w-[85%]" : "h-full w-full",
        )}
      >
        <InnerLightingOverlay style={lightingStyle} />
        <DropPrompt
          isDropHover={isDropHover}
          onPickFile={onPickFile}
          compact={useCompact}
        />
      </div>
    </div>
  );
}
