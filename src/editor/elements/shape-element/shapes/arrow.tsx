/**
 * Arrow shape — rendering + arrow-only interaction logic.
 *
 * ── Why a hook ──
 * The parent `ShapeElement` owns the shared interactions (move/resize/rotate/
 * selection). Arrows additionally support dragging their tail/head endpoints —
 * that logic lives here so the parent stays shape-agnostic.
 */
"use client";

import * as React from "react";

import type { AnnotationLineStyle, AnnotationShape } from "@/editor/elements/types";
import { clamp, getArrowGeometry, scaledDashArray } from "@/editor/lib/geometry";
import { computeArrowEndpoints } from "../geometry";

/** Smallest arrow length (px), scaled with stroke width. */
function arrowMinLengthPx(strokeWidth: number) {
  return Math.max(56, strokeWidth * 12);
}

/** Minimum arrow box size when resizing. */
export function arrowMinBounds(strokeWidth: number) {
  return {
    width: Math.max(56, strokeWidth * 12),
    height: Math.max(56, strokeWidth * 14),
  };
}

export function useArrowInteractions({
  shape,
  canvasRef,
  onUpdate,
}: {
  shape: AnnotationShape;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (patch: Partial<AnnotationShape>) => void;
}) {
  const endpointSession = React.useRef<{
    pointerId: number;
    endpoint: "tail" | "head";
    oppositeXPct: number;
    oppositeYPct: number;
    arrowHeightPct: number;
    canvasW: number;
    canvasH: number;
  } | null>(null);
  const [isTuningEndpoint, setIsTuningEndpoint] = React.useState(false);

  const beginEndpoint = (endpoint: "tail" | "head") => (e: React.PointerEvent<HTMLButtonElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const endpoints = computeArrowEndpoints(shape, rect.width, rect.height);
    const opposite = endpoint === "tail" ? endpoints.head : endpoints.tail;
    endpointSession.current = {
      pointerId: e.pointerId,
      endpoint,
      oppositeXPct: opposite.xPct,
      oppositeYPct: opposite.yPct,
      arrowHeightPct: shape.heightPct,
      canvasW: rect.width,
      canvasH: rect.height,
    };
    setIsTuningEndpoint(true);
  };

  const updateEndpoint = (e: React.PointerEvent<HTMLButtonElement>) => {
    const state = endpointSession.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const movingXPct = clamp(
      ((e.clientX - rect.left) / rect.width) * 100,
      -20,
      120,
    );
    const movingYPct = clamp(
      ((e.clientY - rect.top) / rect.height) * 100,
      -20,
      120,
    );
    const tail =
      state.endpoint === "tail"
        ? { xPct: movingXPct, yPct: movingYPct }
        : { xPct: state.oppositeXPct, yPct: state.oppositeYPct };
    const head =
      state.endpoint === "head"
        ? { xPct: movingXPct, yPct: movingYPct }
        : { xPct: state.oppositeXPct, yPct: state.oppositeYPct };
    const dxPx = ((head.xPct - tail.xPct) / 100) * state.canvasW;
    const dyPx = ((head.yPct - tail.yPct) / 100) * state.canvasH;
    const distancePx = Math.hypot(dxPx, dyPx);
    const minWidthPx = arrowMinLengthPx(shape.strokeWidth);

    // Rebuild the arrow from the two endpoints: midpoint + length + rotation.
    onUpdate({
      xPct: (tail.xPct + head.xPct) / 2,
      yPct: (tail.yPct + head.yPct) / 2,
      widthPct: (Math.max(minWidthPx, distancePx) / state.canvasW) * 100,
      heightPct: state.arrowHeightPct,
      rotation:
        distancePx > 0.5
          ? (Math.atan2(dyPx, dxPx) * 180) / Math.PI
          : shape.rotation,
    });
  };

  const finishEndpoint = (e: React.PointerEvent<HTMLButtonElement>) => {
    const state = endpointSession.current;
    if (!state || state.pointerId !== e.pointerId) return;
    endpointSession.current = null;
    setIsTuningEndpoint(false);
    e.stopPropagation();
  };

  return {
    beginEndpoint,
    updateEndpoint,
    finishEndpoint,
    isTuningEndpoint,
  };
}

/** SVG rendering for the arrow body. */
export function ArrowGlyph({
  geometry,
  color,
  lineStyle,
}: {
  geometry: ReturnType<typeof getArrowGeometry>;
  color: string;
  lineStyle: AnnotationLineStyle;
}) {
  return (
    <svg
      className="absolute inset-0 h-full w-full overflow-visible"
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      preserveAspectRatio="none"
    >
      {/* Shaft */}
      <line
        x1={geometry.tailX}
        y1={geometry.centerY}
        x2={geometry.tipX}
        y2={geometry.centerY}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={geometry.strokeWidth}
        strokeDasharray={scaledDashArray(lineStyle, geometry.strokeWidth)}
      />
      {/* Head */}
      <polyline
        points={geometry.headPoints}
        fill="none"
        stroke={color}
        strokeWidth={geometry.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={scaledDashArray(lineStyle, geometry.strokeWidth)}
      />
    </svg>
  );
}
