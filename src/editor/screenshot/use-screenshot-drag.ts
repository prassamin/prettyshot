/**
 * useScreenshotDrag — pointer-drag logic for moving the screenshot (or its frame).
 *
 * Two drag flavors share the same lifecycle:
 *
 * - `startScreenshotDrag/moveScreenshot/stopShot` — drags a **frame-less shot** on the
 *   bare canvas. Tracks against stage dims, snaps to the nearest grid
 *   position (screenshot positions) on release, and centers against the
 *   stage center while dragging (center guides).
 * - `startFrameDrag/moveFrame/stopFrameDrag` — drags a **framed shot**
 *   (device deviceFrame / browser frame). Only moves the offset, snapping against
 *   the frame's own center.
 *
 * ── Live preview & commit ─────────────────────────────────────────────────
 * While dragging, the offset is only *previewed* (`liveOffset` /
 * `onOffsetPreview`) so animations can keep up. On release the offset is
 * committed to the store — snapped to a grid position when the gesture
 * qualifies, otherwise written as a free offset. Preview tokens are reset
 * after the paint so exported frames never show the live state.
 *
 * ── Drag session guard ────────────────────────────────────────────────────
 * `useDragSession` guards against overlapping async commits: stale drag
 * sessions cannot clear the dragging flag of a newer one.
 */

"use client";

import * as React from "react";

import {
  afterTokensCleared,
  resetPositionTokensAfterPaint,
} from "@/editor/lib/preview-tokens";

import type { CenterGuidesState } from "./types";
import { useDragSession } from "../hooks/use-drag-session";
import {
  snapCenterToTarget,
} from "@/editor/lib/canvas-helpers";
import type { EditorToolBarTool, PlacementDims } from "./types";

type Offset = { x: number; y: number };

/** Snapshot of a frame-less shot drag in flight. */
type ScreenshotDragSession = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
  baseLeft: number;
  baseTop: number;
  stageW: number;
  stageH: number;
  imgW: number;
  imgH: number;
  moved: boolean;
};

/** Snapshot of a framed-shot drag in flight. */
type FrameDragSession = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
  moved: boolean;
};

/** Pointer travel (px) before the gesture counts as a drag. */
const DRAG_ACTIVATION_PX = 3;

export function useScreenshotDrag({
  activeTool,
  annotation,
  draggable,
  scaleFactor,
  stageDims,
  positionedCss,
  offset,
  frameCenterOffset,
  setOffset,
  setSelected,
  clearSelection,
  setCenterGuides,
  setPositionDragging,
  onOffsetPreview,
  getPreviewCanvas,
}: {
  activeTool: EditorToolBarTool;
  annotation: { mode: string };
  draggable: boolean;
  /** Canvas zoom — pointer deltas are divided by this to stay in stage px. */
  scaleFactor: number;
  stageDims: PlacementDims | null;
  positionedCss: React.CSSProperties | null;
  offset: Offset;
  /** Frame center (offset space) used as the snap target for framed drags. */
  frameCenterOffset?: Offset;
  setOffset: (offset: Offset) => void;
  setSelected: (selected: boolean) => void;
  clearSelection: () => void;
  setCenterGuides: (next: CenterGuidesState) => void;
  setPositionDragging?: (dragging: boolean) => void;
  onOffsetPreview?: (offset: Offset) => void;
  getPreviewCanvas?: () => HTMLElement[];
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [liveOffset, setLiveOffset] = React.useState<Offset | null>(null);
  const liveOffsetRef = React.useRef<Offset | null>(null);
  const screenshotDragRef = React.useRef<ScreenshotDragSession | null>(null);
  const frameDragRef = React.useRef<FrameDragSession | null>(null);

  const dragSession = useDragSession();

  const updateLiveOffset = (offset: Offset | null) => {
    liveOffsetRef.current = offset;
    setLiveOffset(offset);
    if (offset) onOffsetPreview?.(offset);
  };

  /** Persist the previewed offset. */
  const commitOffset = () => {
    if (liveOffsetRef.current) {
      setOffset(liveOffsetRef.current);
    }
    liveOffsetRef.current = null;
    setLiveOffset(null);
  };

  const beginDrag = () => {
    dragSession.next();
    setIsDragging(true);
    setPositionDragging?.(true);
  };

  const endDrag = () => {
    setIsDragging(false);
    setCenterGuides({ x: false, y: false });
    const canvasEl = getPreviewCanvas?.() ?? [];
    const token = dragSession.value();
    const isCurrent = () => dragSession.matches(token);
    try {
      commitOffset();
    } finally {
      resetPositionTokensAfterPaint(canvasEl, isCurrent);
      afterTokensCleared(() => setPositionDragging?.(false), isCurrent);
    }
  };

  /* ── Frame-less shot drag ─────────────────────────────────────────────── */

  const startScreenshotDrag = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!draggable || !stageDims || !positionedCss) return;

    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelected(true);
    beginDrag();
    clearSelection();
    screenshotDragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
      baseLeft: positionedCss.left as number,
      baseTop: positionedCss.top as number,
      stageW: stageDims.stageW,
      stageH: stageDims.stageH,
      imgW: stageDims.imgW,
      imgH: stageDims.imgH,
      moved: false,
    };
  };

  const moveScreenshot = (e: React.PointerEvent<HTMLImageElement>) => {
    const drag = screenshotDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    e.preventDefault();
    if (
      !drag.moved &&
      Math.hypot(e.clientX - drag.startClientX, e.clientY - drag.startClientY) <
        DRAG_ACTIVATION_PX
    ) {
      return;
    }
    drag.moved = true;
    let nextX =
      drag.startOffsetX + (e.clientX - drag.startClientX) / scaleFactor;
    let nextY =
      drag.startOffsetY + (e.clientY - drag.startClientY) / scaleFactor;
    const centerX = drag.baseLeft + nextX + drag.imgW / 2;
    const centerY = drag.baseTop + nextY + drag.imgH / 2;
    const snap = snapCenterToTarget({
      centerX,
      centerY,
      targetX: drag.stageW / 2,
      targetY: drag.stageH / 2,
      threshold: 16 / scaleFactor,
    });

    nextX += snap.deltaX;
    nextY += snap.deltaY;

    setCenterGuides(snap.guides);
    updateLiveOffset({ x: nextX, y: nextY });
  };

  const stopScreenshotDrag = (e: React.PointerEvent<HTMLImageElement>) => {
    const drag = screenshotDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    screenshotDragRef.current = null;
    endDrag();
  };

  /* ── Framed-shot drag (deviceFrame / browser frame) ─────────────────────────── */

  const startFrameDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool !== "pointer" && annotation.mode !== "move") return;

    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelected(true);
    beginDrag();
    clearSelection();
    frameDragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
      moved: false,
    };
  };

  const moveFrame = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = frameDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    e.preventDefault();
    if (
      !drag.moved &&
      Math.hypot(e.clientX - drag.startClientX, e.clientY - drag.startClientY) <
        DRAG_ACTIVATION_PX
    ) {
      return;
    }
    drag.moved = true;
    let nextX =
      drag.startOffsetX + (e.clientX - drag.startClientX) / scaleFactor;
    let nextY =
      drag.startOffsetY + (e.clientY - drag.startClientY) / scaleFactor;

    const snap = snapCenterToTarget({
      centerX: nextX,
      centerY: nextY,
      targetX: frameCenterOffset?.x ?? 0,
      targetY: frameCenterOffset?.y ?? 0,
      threshold: 16 / scaleFactor,
    });

    nextX += snap.deltaX;
    nextY += snap.deltaY;

    setCenterGuides(snap.guides);
    updateLiveOffset({ x: nextX, y: nextY });
  };

  const stopFrameDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = frameDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    frameDragRef.current = null;
    endDrag();
  };

  return {
    isDragging,
    liveOffset,
    startScreenshotDrag,
    moveScreenshot,
    stopScreenshotDrag,
    startFrameDrag,
    moveFrame,
    stopFrameDrag,
  };
}