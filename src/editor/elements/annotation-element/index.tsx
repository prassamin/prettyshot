/**
 * AnnotationStrokeView — renders a single freehand stroke + its interactions.
 *
 * ── Rendering ──
 * The stroke is drawn as an SVG `<path>` from its point list. Two paths are
 * rendered:
 *   An invisible, slightly thicker hit-test path (grab/select target)
 *   The visible styled path (pen/highlight styling, mask for erasers)
 *
 * The whole element is wrapped in a positioned div that translates
 * (`dragOffset`) and rotates (`rotation`) via CSS transforms — the underlying
 * points are untouched during interaction and only committed on release.
 *
 * ── Interactions ──
 * - Drag: move the stroke (with center-snap to canvas center)
 * - Resize: scale the point cloud around a pivot via 8 selection-chrome handles
 * - Rotate: rotate the point cloud around the bbox center (Shift = 15° steps)
 *
 * Selection chrome (handles + rotation button) comes from the shared
 * `SelectionChrome` component.
 */
"use client";

import * as React from "react";

import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";
import { isDrawingArmed } from "@/editor/lib/canvas-helpers";
import { useEditor } from "@/editor/lib/engine";
import { useFloatingToolbar } from "@/editor/hooks/use-floating-toolbar";
import { computeToolbarOffset } from "@/editor/toolbar/controls";
import { useDragSession } from "@/editor/hooks/use-drag-session";

import { annotationPath, getStrokeBoundingBox } from "./utils";
import { AnnotationStrokeToolbar } from "./toolbar";
import { SelectionChrome } from "@/editor/elements/shared/selection-chrome";
import type {
  AnnotationStrokeViewProps,
  StrokeMoveSession,
  StrokeResizeSession,
  StrokeResizeState,
  StrokeRotateSession,
} from "./types";
import { SNAP_PX, HIT_TEST_PADDING, MIN_HIT_TEST_WIDTH } from "./constants";

export function AnnotationStrokeView({
  stroke,
  isSelected,
  onSelect,
  onDelete,
  onCenterGuideChange,
  canvasRef,
  eraserStrokes,
  allStrokes,
  annotationMaskId,
}: AnnotationStrokeViewProps) {
  const maskId = `${annotationMaskId}-${stroke.id}`;
  /** Only erasers drawn AFTER this stroke affect it — a fresh pen stroke
   *  over a previously erased area must render whole again. */
  const effectiveErasers = React.useMemo(() => {
    if (allStrokes && allStrokes.length > 0) {
      const strokeIndex = allStrokes.findIndex((s) => s.id === stroke.id);
      if (strokeIndex !== -1) {
        return allStrokes
          .slice(strokeIndex + 1)
          .filter((s) => s.mode === "eraser");
      }
    }
    return eraserStrokes.filter(
      (eraser) => (eraser.zIndex ?? 0) > (stroke.zIndex ?? 0),
    );
  }, [allStrokes, stroke.id, eraserStrokes, stroke.zIndex]);
  const {
    canvasZoom,
    updateAnnotationStroke,
    setSelectedTextId,
    setSelectedAssetId,
    setSelectedAnnotationShapeId,
    activeTool,
    annotation,
  } = useEditor();
  const elRef = React.useRef<HTMLDivElement>(null);
  const dragSession = useDragSession();
  // Only the eraser tool suppresses selection — every other annotation tool
  // selects/moves existing annotations.
  const suppressSelect = activeTool === "draw" && annotation.mode === "eraser";

  /** Canvas pixel size — strokes are stored in percent space (aspect-safe),
   *  the view renders them in pixels by scaling against this size. */
  const [canvasSize, setCanvasSize] = React.useState<{
    w: number;
    h: number;
  } | null>(null);
  React.useLayoutEffect(() => {
    const el = canvasRef?.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w && h) {
        setCanvasSize({ w, h });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasRef]);

  const pxScale = canvasSize
    ? { x: canvasSize.w / 100, y: canvasSize.h / 100 }
    : null;

  /** Percent points → canvas pixel space for rendering. */
  const toPx = React.useCallback(
    (pts: { x: number; y: number }[]) =>
      pxScale
        ? pts.map((p) => ({ x: p.x * pxScale.x, y: p.y * pxScale.y }))
        : pts,
    [pxScale],
  );

  // ── Drag session state (move stroke) ──────────────────────────────────
  const [dragOffset, setDragOffset] = React.useState({ dx: 0, dy: 0 });
  const dragRef = React.useRef<StrokeMoveSession | null>(null);

  // ── Resize session state (scale stroke points) ───────────────────────
  const resizeRef = React.useRef<StrokeResizeSession | null>(null);
  const [resizeState, setResizeState] =
    React.useState<StrokeResizeState | null>(null);

  // ── Rotate session state ─────────────────────────────────────────────
  const rotateRef = React.useRef<StrokeRotateSession | null>(null);
  const [rotation, setRotation] = React.useState(0);
  const [isRotateSnapped, setIsRotateSnapped] = React.useState(false);

  /** Points with the live resize scale applied (rotation is CSS-only). */
  const displayPoints = React.useMemo(() => {
    if (!resizeState) return stroke.points;
    const { sx, sy, pivotX, pivotY } = resizeState;
    return stroke.points.map((p) => ({
      x: pivotX + (p.x - pivotX) * sx,
      y: pivotY + (p.y - pivotY) * sy,
    }));
  }, [stroke.points, resizeState]);

  /** Display points converted to canvas pixel space. */
  const pxPoints = React.useMemo(
    () => toPx(displayPoints),
    [toPx, displayPoints],
  );

  /** Tight bounding box of the displayed (pixel-space) points. */
  const rawBBox = React.useMemo(
    () => getStrokeBoundingBox(pxPoints, 0),
    [pxPoints],
  );

  /** Bounding box in percent space — used for resize/commit math, where
   *  points (and the resize ratios) live in percent units. */
  const pctBBox = React.useMemo(
    () => getStrokeBoundingBox(displayPoints, 0),
    [displayPoints],
  );

  /** Bounding box inflated by half the stroke width (visual bounds). */
  const bbox = React.useMemo(() => {
    const pad = stroke.strokeWidth / 2;
    return {
      x: rawBBox.x - pad,
      y: rawBBox.y - pad,
      width: rawBBox.width + pad * 2,
      height: rawBBox.height + pad * 2,
      cx: rawBBox.cx,
      cy: rawBBox.cy,
    };
  }, [rawBBox, stroke.strokeWidth]);

  const { toolbarRect, toolbarHidden, refreshRect, setToolbarRect } =
    useFloatingToolbar({
      elRef,
      isSelected,
      kind: "annotation",
      elementId: stroke.id,
      enableAnimation: true,
    });

  React.useEffect(() => {
    if (!isSelected) return;
    refreshRect();
  }, [isSelected, refreshRect, bbox, dragOffset]);

  /** Select this stroke and deselect all other element types. */
  const selectStroke = () => {
    if (suppressSelect) return;
    onSelect(stroke.id);
    setSelectedTextId(null);
    setSelectedAssetId(null);
    setSelectedAnnotationShapeId(null);
  };

  // ── Drag (move stroke) ───────────────────────────────────────────────

  const startDrag = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    selectStroke();

    const canvas = canvasRef?.current;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      canvasW: canvas?.offsetWidth ?? 0,
      canvasH: canvas?.offsetHeight ?? 0,
    };
    dragSession.next();
    setDragOffset({ dx: 0, dy: 0 });
  };

  const moveDrag = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.preventDefault();

    const scale = canvasZoom / 100;
    let dx = (e.clientX - drag.startX) / scale;
    let dy = (e.clientY - drag.startY) / scale;

    // Center snap — when the stroke center is within SNAP_PX of the canvas
    // center, lock the offset so the center lands exactly at 50%.
    const centerX = ((bbox.cx + dx) / (drag.canvasW || 1)) * 100;
    const centerY = ((bbox.cy + dy) / (drag.canvasH || 1)) * 100;
    const snapDistX = (SNAP_PX / scale / (drag.canvasW || 1)) * 100;
    const snapDistY = (SNAP_PX / scale / (drag.canvasH || 1)) * 100;
    const snapX = Math.abs(centerX - 50) <= snapDistX;
    const snapY = Math.abs(centerY - 50) <= snapDistY;

    if (snapX) dx = (50 / 100) * drag.canvasW - bbox.cx;
    if (snapY) dy = (50 / 100) * drag.canvasH - bbox.cy;

    onCenterGuideChange?.({ x: snapX, y: snapY });

    setDragOffset({ dx, dy });
    if (elRef.current) setToolbarRect(elRef.current.getBoundingClientRect());
  };

  const endDrag = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.stopPropagation();

    // Commit the accumulated offset into the point data.
    if (dragOffset.dx !== 0 || dragOffset.dy !== 0) {
      const cw = drag.canvasW || 1;
      const ch = drag.canvasH || 1;
      const newPoints = stroke.points.map((p) => ({
        x: p.x + (dragOffset.dx / cw) * 100,
        y: p.y + (dragOffset.dy / ch) * 100,
      }));
      updateAnnotationStroke(stroke.id, newPoints);
    }

    dragRef.current = null;
    setDragOffset({ dx: 0, dy: 0 });
    onCenterGuideChange?.({ x: false, y: false });
  };

  // ── Resize (scale stroke points around a pivot) ──────────────────────

  const startResize =
    (handle: StrokeResizeSession["handle"]) => (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      selectStroke();
      dragSession.next();

      // Pivot = the corner/edge opposite to the dragged handle.
      let pivotX = 0;
      let pivotY = 0;
      const { x, y, width, height } = pctBBox;
      switch (handle) {
        case "tl":
          pivotX = x + width;
          pivotY = y + height;
          break;
        case "mt":
          pivotX = x + width / 2;
          pivotY = y + height;
          break;
        case "tr":
          pivotX = x;
          pivotY = y + height;
          break;
        case "ml":
          pivotX = x + width;
          pivotY = y + height / 2;
          break;
        case "mr":
          pivotX = x;
          pivotY = y + height / 2;
          break;
        case "bl":
          pivotX = x + width;
          pivotY = y;
          break;
        case "mb":
          pivotX = x + width / 2;
          pivotY = y;
          break;
        case "br":
          pivotX = x;
          pivotY = y;
          break;
      }

      resizeRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        handle,
        startBBox: pctBBox,
      };
      setResizeState({ sx: 1, sy: 1, pivotX, pivotY });
    };

  const moveResize = (e: React.PointerEvent) => {
    const r = resizeRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    const scale = canvasZoom / 100;
    const dxPx = (e.clientX - r.startX) / scale;
    const dyPx = (e.clientY - r.startY) / scale;

    // Convert screen deltas into the stroke's rotated local space so
    // resizing feels natural even when the stroke is rotated.
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const localDx = cos * dxPx + sin * dyPx;
    const localDy = -sin * dxPx + cos * dyPx;

    // Deltas into percent space (matches point units + startBBox units).
    const canvas = canvasRef?.current;
    const cw = canvas?.offsetWidth ?? 0;
    const ch = canvas?.offsetHeight ?? 0;
    const pctPerPxX = cw ? 100 / cw : 0;
    const pctPerPxY = ch ? 100 / ch : 0;
    const localDxPct = localDx * pctPerPxX;
    const localDyPct = localDy * pctPerPxY;

    const { handle, startBBox } = r;
    let newW = startBBox.width;
    let newH = startBBox.height;

    if (handle.includes("r")) newW += localDxPct;
    if (handle.includes("l")) newW -= localDxPct;
    if (handle.includes("b")) newH += localDyPct;
    if (handle.includes("t")) newH -= localDyPct;

    newW = Math.max(0.5, newW);
    newH = Math.max(0.5, newH);

    const sx = newW / startBBox.width;
    const sy = newH / startBBox.height;

    setResizeState((prev) => (prev ? { ...prev, sx, sy } : null));
    if (elRef.current) setToolbarRect(elRef.current.getBoundingClientRect());
  };

  const endResize = (e: React.PointerEvent) => {
    const r = resizeRef.current;
    if (!r || r.pointerId !== e.pointerId) return;
    e.stopPropagation();

    // Commit the scaled point cloud into the stroke data.
    if (resizeState && (resizeState.sx !== 1 || resizeState.sy !== 1)) {
      const { sx, sy, pivotX, pivotY } = resizeState;
      const newPoints = stroke.points.map((p) => ({
        x: pivotX + (p.x - pivotX) * sx,
        y: pivotY + (p.y - pivotY) * sy,
      }));
      updateAnnotationStroke(stroke.id, newPoints);
    }

    resizeRef.current = null;
    setResizeState(null);
  };

  // ── Rotate ───────────────────────────────────────────────────────────

  const startRotate = (e: React.PointerEvent<HTMLButtonElement>) => {
    const el = elRef.current;
    if (!el) return;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rotateRef.current = {
      pointerId: e.pointerId,
      startAngle: Math.atan2(e.clientY - cy, e.clientX - cx),
      startRotation: rotation,
      centerX: cx,
      centerY: cy,
    };
  };

  const moveRotate = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rot = rotateRef.current;
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
    setIsRotateSnapped(snapped);
    setRotation(next);
  };

  const endRotate = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rot = rotateRef.current;
    if (!rot || rot.pointerId !== e.pointerId) return;
    if (rotation !== 0) {
      const rad = (rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const cx = pctBBox.cx;
      const cy = pctBBox.cy;
      const newPoints = stroke.points.map((p) => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        return {
          x: cx + dx * cos - dy * sin,
          y: cy + dx * sin + dy * cos,
        };
      });
      updateAnnotationStroke(stroke.id, newPoints);
      setRotation(0);
    }
    rotateRef.current = null;
    setIsRotateSnapped(false);
  };

  const counterRotate = `rotate(${-rotation}deg)`;

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 touch-none pointer-events-none",
          isSelected && "z-50",
        )}
        style={{
          zIndex: isSelected ? 99999 : 60 + (stroke.zIndex ?? 0),
          transform: `translate(${dragOffset.dx}px, ${dragOffset.dy}px) rotate(${rotation}deg)`,
          transformOrigin: `${bbox.cx}px ${bbox.cy}px`,
        }}
      >
        {/* Selection chrome container — positioned at the stroke bbox */}
        <div
          ref={elRef}
          className="absolute pointer-events-none"
          style={{
            left: `${bbox.cx}px`,
            top: `${bbox.cy}px`,
            width: `${bbox.width}px`,
            height: `${bbox.height}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {isSelected && (
            <SelectionChrome
              counterRotate={counterRotate}
              isRotateSnapped={isRotateSnapped}
              startRotate={startRotate}
              moveRotate={moveRotate}
              endRotate={endRotate}
              startResize={startResize}
              moveResize={moveResize}
              endResize={endResize}
              onDragPointerDown={startDrag}
              onDragPointerMove={moveDrag}
              onDragPointerUp={endDrag}
            />
          )}
        </div>

        {/* Stroke SVG */}
        <svg
          aria-hidden
          data-export-stack="foreground"
          data-selected={isSelected ? "true" : undefined}
          className="absolute inset-0 h-full w-full overflow-visible"
          style={{
            mixBlendMode: stroke.mode === "highlight" ? "multiply" : "normal",
          }}
        >
          <defs>
            <mask
              id={maskId}
              x="0"
              y="0"
              width="100%"
              height="100%"
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
            >
              <rect
                x="-10000"
                y="-10000"
                width="20000"
                height="20000"
                fill="white"
              />
              {/* Eraser strokes punch black holes into the mask */}
              {effectiveErasers.map((eraser) => (
                <path
                  key={eraser.id}
                  data-annotation-eraser-id={eraser.id}
                  d={annotationPath(toPx(eraser.points))}
                  fill="none"
                  stroke="black"
                  strokeWidth={eraser.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            {/* Invisible hit-test path — wider than the visible stroke so
                thin strokes are easy to grab */}
            <path
              data-annotation-hit-path={stroke.id}
              d={annotationPath(pxPoints)}
              fill="none"
              stroke="transparent"
              strokeWidth={Math.max(
                MIN_HIT_TEST_WIDTH,
                stroke.strokeWidth + HIT_TEST_PADDING,
              )}
              className={cn(
                "pointer-events-auto",
                isSelected ? "cursor-move" : "cursor-pointer",
              )}
              onPointerDown={startDrag}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onClick={(e) => e.stopPropagation()}
            />
            {/* The visible styled path */}
            <path
              data-annotation-stroke-id={stroke.id}
              d={annotationPath(pxPoints)}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={
                ((stroke.opacity ?? 100) / 100) *
                (stroke.mode === "highlight" ? 0.42 : 1)
              }
              className="pointer-events-none transition-colors"
            />
          </g>
        </svg>
      </div>

      {/* Floating toolbar portal */}
      {isSelected &&
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
                  data-floating-anchor={`annotation-stroke:${stroke.id}`}
                  className="pointer-events-none fixed z-40"
                  style={{
                    top,
                    left,
                    transform: computeToolbarOffset(flipBelow, 1),
                    transformOrigin: flipBelow ? "top center" : "bottom center",
                  }}
                >
                  <div className="pointer-events-auto">
                    <AnnotationStrokeToolbar
                      stroke={stroke}
                      onDelete={onDelete}
                    />
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
