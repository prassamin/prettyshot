/**
 * ShapeElement — a rect / ellipse / arrow annotation on the canvas.
 *
 * ── Layout ──
 * Position is driven by CSS custom properties (see preview-tokens.ts) so the
 * shape can be moved live during drags without touching the store until
 * release. Size is percentage-based (canvas-relative).
 *
 * ── Interactions (all owned here) ──
 * - Move: pointer drag, position committed on release
 * - Resize: 8 edge/corner handles via the shared SelectionChrome
 * - Rotate: rotation handle (Shift = 15° steps, snaps to 90°)
 *
 * Arrow-specific endpoint editing lives in `useArrowInteractions` (shapes/arrow).
 * The per-kind SVG body renders via ArrowGlyph / RectGlyph / EllipseGlyph.
 */
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { useEditor } from "@/editor/lib/engine";
import {
  applyElementPosition,
  elementPositionTokens,
  previewHosts,
  resetElementPosition,
} from "@/editor/lib/preview-tokens";
import { cn } from "@/lib/utils";
import { computeToolbarOffset } from "@/editor/toolbar/controls";
import { useFloatingToolbar } from "@/editor/hooks/use-floating-toolbar";
import { SelectionChrome } from "@/editor/elements/shared/selection-chrome";
import { clamp, dashPattern, getArrowGeometry } from "@/editor/lib/geometry";
import { isDrawingArmed } from "@/editor/lib/canvas-helpers";
import { useDragSession } from "@/editor/hooks/use-drag-session";

import {
  arrowMinBounds,
  ArrowGlyph,
  useArrowInteractions,
} from "./shapes/arrow";
import { RectGlyph } from "./shapes/rect";
import { EllipseGlyph } from "./shapes/ellipse";
import { ShapeToolbar } from "./toolbar";
import type {
  MoveSession,
  ResizeHandleId,
  ResizeSession,
  RotateSession,
  ShapeElementProps,
} from "./types";

export function ShapeElement({
  shape,
  canvasRef,
  previewMode,
}: ShapeElementProps) {
  const {
    id: canvasScopeId,
    selectedAnnotationShapeId,
    setSelectedAnnotationShapeId,
    setSelectedTextId,
    setSelectedAssetId,
    updateAnnotationShape,
    activeTool,
    annotation,
  } = useEditor();
  const isSelected = selectedAnnotationShapeId === shape.id;
  // Freehand brushes (pen/highlight/eraser) draw over existing shapes without
  // selecting them. Shape tools (arrow/rect/ellipse) select on click — clicks
  // select, drags still draw a new shape.
  const suppressSelect = activeTool === "draw" && annotation.mode === "eraser";
  const dash = dashPattern(shape.lineStyle);
  const positionTokens = elementPositionTokens(shape.id);

  const hostRef = React.useRef<HTMLDivElement>(null);
  const chromeRef = React.useRef<HTMLDivElement>(null);
  const moveRef = React.useRef<MoveSession | null>(null);
  const dragSession = useDragSession();
  const resizeSession = React.useRef<ResizeSession | null>(null);
  const rotateSession = React.useRef<RotateSession | null>(null);
  const [snapEngaged, setSnapEngaged] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [isRotating, setIsRotating] = React.useState(false);
  const [measuredSize, setMeasuredSize] = React.useState({
    width: 120,
    height: 48,
  });
  const rotation = shape.rotation ?? 0;

  const isArrow = shape.kind === "arrow";
  const arrow = useArrowInteractions({
    shape,
    canvasRef,
    onUpdate: (patch) => updateAnnotationShape(shape.id, patch),
  });

  const { toolbarRect, toolbarHidden, animateEntry, setToolbarRect } =
    useFloatingToolbar({
      elRef: hostRef,
      isSelected,
      kind: "annotation-shape",
      elementId: shape.id,
      enableAnimation: true,
      onSizeChange: (el) => {
        setMeasuredSize((current) => {
          const width = Math.max(1, el.offsetWidth);
          const height = Math.max(1, el.offsetHeight);
          if (
            Math.abs(current.width - width) < 0.5 &&
            Math.abs(current.height - height) < 0.5
          ) {
            return current;
          }
          return { width, height };
        });
      },
    });

  // Measure synchronously before paint so the glyph never renders with a
  // stale size (avoids the one-frame "blink" at shape creation / size jumps
  // before the ResizeObserver reports).
  React.useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const width = Math.max(1, el.offsetWidth);
    const height = Math.max(1, el.offsetHeight);
    setMeasuredSize((current) =>
      Math.abs(current.width - width) < 0.5 &&
      Math.abs(current.height - height) < 0.5
        ? current
        : { width, height },
    );
  }, [shape.widthPct, shape.heightPct]);

  React.useEffect(() => {
    if (!isSelected) return;
    setToolbarRect(hostRef.current?.getBoundingClientRect() ?? null);
  }, [
    isSelected,
    setToolbarRect,
    shape.xPct,
    shape.yPct,
    shape.widthPct,
    shape.heightPct,
    rotation,
  ]);

  const selectThis = (
    e: React.PointerEvent | React.MouseEvent | React.KeyboardEvent,
  ) => {
    e.stopPropagation();
    if (suppressSelect) return;
    setSelectedAnnotationShapeId(shape.id);
    setSelectedTextId(null);
    setSelectedAssetId(null);
  };

  // ── Move ──────────────────────────────────────────────────────────────

  const beginMove = (e: React.PointerEvent<Element>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.button !== 0) return;
    if (suppressSelect) return;
    selectThis(e);
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    moveRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXPct: shape.xPct,
      startYPct: shape.yPct,
      canvasW: rect.width,
      canvasH: rect.height,
      nextXPct: shape.xPct,
      nextYPct: shape.yPct,
      moved: false,
    };
    dragSession.next();
    setIsDragging(true);
  };

  const updateMove = (e: React.PointerEvent<Element>) => {
    const move = moveRef.current;
    if (!move || move.pointerId !== e.pointerId) return;
    e.preventDefault();
    const dxPct = ((e.clientX - move.startClientX) / move.canvasW) * 100;
    const dyPct = ((e.clientY - move.startClientY) / move.canvasH) * 100;
    const nextX = clamp(move.startXPct + dxPct, -20, 120);
    const nextY = clamp(move.startYPct + dyPct, -20, 120);

    move.nextXPct = nextX;
    move.nextYPct = nextY;
    move.moved = true;

    // Live position via CSS custom properties — no store writes mid-drag.
    applyElementPosition(previewHosts(canvasScopeId), shape.id, nextX, nextY);
    const host = hostRef.current;
    if (host) setToolbarRect(host.getBoundingClientRect());
    const chrome = chromeRef.current;
    if (chrome) {
      chrome.style.left = `${nextX}%`;
      chrome.style.top = `${nextY}%`;
    }
  };

  const finishMove = (e: React.PointerEvent<Element>) => {
    const move = moveRef.current;
    if (!move || move.pointerId !== e.pointerId) return;
    moveRef.current = null;
    setIsDragging(false);
    if (move.moved) {
      updateAnnotationShape(shape.id, {
        xPct: move.nextXPct,
        yPct: move.nextYPct,
      });
      // Drop the live-position tokens so the committed store values take over.
      const hosts = previewHosts(canvasScopeId);
      const token = dragSession.value();
      requestAnimationFrame(() => {
        if (!dragSession.matches(token)) return;
        resetElementPosition(hosts, shape.id);
      });
    }
  };

  // ── Resize ────────────────────────────────────────────────────────────

  const beginResize =
    (handle: ResizeHandleId) => (e: React.PointerEvent<HTMLButtonElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = canvas.getBoundingClientRect();
      resizeSession.current = {
        pointerId: e.pointerId,
        handle,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startXPct: shape.xPct,
        startYPct: shape.yPct,
        startWidthPct: shape.widthPct,
        startHeightPct: shape.heightPct,
        canvasW: rect.width,
        canvasH: rect.height,
      };
      setIsResizing(true);
    };

  const updateResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rs = resizeSession.current;
    if (!rs || rs.pointerId !== e.pointerId) return;
    e.preventDefault();
    const dxPx = e.clientX - rs.startClientX;
    const dyPx = e.clientY - rs.startClientY;
    // Convert screen deltas into the shape's rotated local space.
    const theta = (rotation * Math.PI) / 180;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const localDxPx = cos * dxPx + sin * dyPx;
    const localDyPx = -sin * dxPx + cos * dyPx;
    const minBounds = isArrow
      ? arrowMinBounds(shape.strokeWidth)
      : { width: 8, height: 8 };
    const minWidthPx = minBounds.width;
    const minHeightPx = minBounds.height;
    const maxWidthPx = rs.canvasW * 2;
    const maxHeightPx = rs.canvasH * 2;
    const startWidthPx = (rs.startWidthPct / 100) * rs.canvasW;
    const startHeightPx = (rs.startHeightPct / 100) * rs.canvasH;
    let nextWidthPx = startWidthPx;
    let nextHeightPx = startHeightPx;
    let centerLocalXPx = 0;
    let centerLocalYPx = 0;

    if (rs.handle.includes("l")) {
      nextWidthPx = clamp(startWidthPx - localDxPx, minWidthPx, maxWidthPx);
      centerLocalXPx = -(nextWidthPx - startWidthPx) / 2;
    }
    if (rs.handle.includes("r")) {
      nextWidthPx = clamp(startWidthPx + localDxPx, minWidthPx, maxWidthPx);
      centerLocalXPx = (nextWidthPx - startWidthPx) / 2;
    }
    if (rs.handle.includes("t")) {
      nextHeightPx = clamp(startHeightPx - localDyPx, minHeightPx, maxHeightPx);
      centerLocalYPx = -(nextHeightPx - startHeightPx) / 2;
    }
    if (rs.handle.includes("b")) {
      nextHeightPx = clamp(startHeightPx + localDyPx, minHeightPx, maxHeightPx);
      centerLocalYPx = (nextHeightPx - startHeightPx) / 2;
    }

    const centerDxPx = cos * centerLocalXPx - sin * centerLocalYPx;
    const centerDyPx = sin * centerLocalXPx + cos * centerLocalYPx;
    const nextX = rs.startXPct + (centerDxPx / rs.canvasW) * 100;
    const nextY = rs.startYPct + (centerDyPx / rs.canvasH) * 100;
    const nextW = (nextWidthPx / rs.canvasW) * 100;
    const nextH = (nextHeightPx / rs.canvasH) * 100;

    updateAnnotationShape(shape.id, {
      xPct: clamp(nextX, -20, 120),
      yPct: clamp(nextY, -20, 120),
      widthPct: clamp(nextW, (minWidthPx / rs.canvasW) * 100, 200),
      heightPct: clamp(nextH, (minHeightPx / rs.canvasH) * 100, 200),
    });
  };

  const finishResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rs = resizeSession.current;
    if (!rs || rs.pointerId !== e.pointerId) return;
    resizeSession.current = null;
    setIsResizing(false);
  };

  // ── Rotate ────────────────────────────────────────────────────────────

  const beginRotate = (e: React.PointerEvent<HTMLButtonElement>) => {
    const host = hostRef.current;
    if (!host) return;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = host.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rotateSession.current = {
      pointerId: e.pointerId,
      centerX: cx,
      centerY: cy,
      startAngle: Math.atan2(e.clientY - cy, e.clientX - cx),
      startRotation: rotation,
    };
    setIsRotating(true);
  };

  const updateRotate = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rot = rotateSession.current;
    if (!rot || rot.pointerId !== e.pointerId) return;
    const angle = Math.atan2(e.clientY - rot.centerY, e.clientX - rot.centerX);
    const delta = ((angle - rot.startAngle) * 180) / Math.PI;
    let next = rot.startRotation + delta;
    next = ((next % 360) + 360) % 360;
    let snapped = false;
    if (e.shiftKey) {
      // Shift = 15° increments, highlight multiples of 90°.
      next = Math.round(next / 15) * 15;
      if (next % 90 === 0) snapped = true;
    } else {
      // Free rotation with snap-to-90° within a 4° threshold.
      const nearest90 = Math.round(next / 90) * 90;
      if (
        Math.abs(next - nearest90) < 4 ||
        Math.abs(next - nearest90 + 360) < 4
      ) {
        next = nearest90 % 360;
        snapped = true;
      }
    }
    setSnapEngaged(snapped);
    updateAnnotationShape(shape.id, { rotation: next });
  };

  const finishRotate = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rot = rotateSession.current;
    if (!rot || rot.pointerId !== e.pointerId) return;
    rotateSession.current = null;
    setIsRotating(false);
    setSnapEngaged(false);
  };

  const inverseRotate = `rotate(${-rotation}deg)`;
  const arrowGeometry = isArrow
    ? getArrowGeometry(
        measuredSize.width,
        measuredSize.height,
        shape.strokeWidth,
      )
    : null;

  return (
    <>
      <div
        ref={hostRef}
        role="button"
        tabIndex={0}
        aria-label={`${shape.kind} annotation`}
        className={cn(
          "nodrag nopan pointer-events-auto absolute touch-none select-none",
          isSelected ? "cursor-move" : "cursor-pointer",
        )}
        onClick={selectThis}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") selectThis(e);
        }}
        onPointerDown={beginMove}
        onPointerMove={updateMove}
        onPointerUp={finishMove}
        onPointerCancel={finishMove}
        data-shape-ref={shape.id}
        data-export-stack="foreground"
        style={{
          left: `var(${positionTokens.x}, var(--stage-el-x, ${shape.xPct}%))`,
          top: `var(${positionTokens.y}, var(--stage-el-y, ${shape.yPct}%))`,
          width: `${shape.widthPct}%`,
          height: `${shape.heightPct}%`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          transition:
            !isDragging &&
            !isResizing &&
            !arrow.isTuningEndpoint &&
            !isRotating &&
            animateEntry
              ? "left 300ms ease-out, top 300ms ease-out"
              : "none",
          zIndex: isSelected ? 99999 : 60 + shape.zIndex,
          opacity: (shape.opacity ?? 100) / 100,
          display: shape.hidden ? "none" : undefined,
        }}
      >
        {isArrow ? (
          arrowGeometry ? (
            <ArrowGlyph
              geometry={arrowGeometry}
              color={shape.color}
              lineStyle={shape.lineStyle}
            />
          ) : null
        ) : shape.kind === "rect" ? (
          <RectGlyph
            color={shape.color}
            strokeWidth={shape.strokeWidth}
            dashArray={dash}
          />
        ) : (
          <EllipseGlyph
            color={shape.color}
            strokeWidth={shape.strokeWidth}
            dashArray={dash}
          />
        )}
      </div>

      {/* Selection chrome — resize/rotate handles, snap guides */}
      {isSelected && !previewMode ? (
        <div
          ref={chromeRef}
          data-chrome-ref={shape.id}
          data-export-hidden="true"
          className="pointer-events-none absolute touch-none select-none"
          style={{
            left: `${shape.xPct}%`,
            top: `${shape.yPct}%`,
            width: `${shape.widthPct}%`,
            height: `${shape.heightPct}%`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            zIndex: 100000,
            display: shape.hidden ? "none" : undefined,
          }}
        >
          {!isArrow ? (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 border border-dashed border-primary/80",
              )}
            />
          ) : null}
          {snapEngaged && (
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-[-1] -translate-x-1/2 -translate-y-1/2">
              <div className="absolute w-1000 -translate-x-1/2 border-t border-dashed border-primary/95" />
              <div className="absolute h-1000 -translate-y-1/2 border-l border-dashed border-primary/95" />
            </div>
          )}
          {isArrow ? (
            <SelectionChrome
              type="arrow"
              counterRotate={inverseRotate}
              isRotateSnapped={snapEngaged}
              startRotate={beginRotate}
              moveRotate={updateRotate}
              endRotate={finishRotate}
              startArrowEndpoint={arrow.beginEndpoint}
              moveArrowEndpoint={arrow.updateEndpoint}
              endArrowEndpoint={arrow.finishEndpoint}
              onDragPointerDown={beginMove}
              onDragPointerMove={updateMove}
              onDragPointerUp={finishMove}
            />
          ) : (
            <SelectionChrome
              counterRotate={inverseRotate}
              isRotateSnapped={snapEngaged}
              startRotate={beginRotate}
              moveRotate={updateRotate}
              endRotate={finishRotate}
              startResize={beginResize}
              moveResize={updateResize}
              endResize={finishResize}
              onDragPointerDown={beginMove}
              onDragPointerMove={updateMove}
              onDragPointerUp={finishMove}
            />
          )}
        </div>
      ) : null}

      {/* Floating toolbar portal */}
      {!previewMode &&
      isSelected &&
      !toolbarHidden &&
      toolbarRect &&
      typeof document !== "undefined"
        ? createPortal(
            (() => {
              const flipBelow = toolbarRect.top < 80;
              const top = flipBelow
                ? toolbarRect.bottom + 12
                : toolbarRect.top - 12;
              const left = toolbarRect.left + toolbarRect.width / 2;
              return (
                <div
                  data-floating-anchor={`shape:${shape.id}`}
                  className="pointer-events-none fixed z-40"
                  style={{
                    top,
                    left,
                    transform: computeToolbarOffset(flipBelow, 1),
                    transformOrigin: flipBelow ? "top center" : "bottom center",
                  }}
                >
                  <div className="pointer-events-auto">
                    <ShapeToolbar shape={shape} />
                  </div>
                </div>
              );
            })(),
            document.body,
          )
        : null}
    </>
  );
}
