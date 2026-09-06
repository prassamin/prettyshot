/**
 * Annotation stroke element types.
 *
 * A stroke is a freehand pen / highlight / eraser drawing on the canvas.
 * It's stored as a list of absolute pixel points (canvas coordinate space)
 * plus styling. Eraser strokes are special: they're never rendered directly,
 * instead they punch holes in the other strokes via an SVG `<mask>`.
 */

import type * as React from "react";
import type { CenterGuidesState } from "@/editor/elements/shared/center-guides";
import type { ResizeHandleId, RotateGesture } from "@/editor/elements/types";
import type { getStrokeBoundingBox } from "./utils";

/** A single point of a stroke, in canvas pixel coordinates. */
export type AnnotationPoint = {
  x: number;
  y: number;
};

/** A freehand annotation stroke. */
export type AnnotationStroke = {
  id: string;
  mode: "pen" | "highlight" | "eraser";
  color: string;
  strokeWidth: number;
  points: AnnotationPoint[];
  zIndex: number;
  opacity?: number;
  hidden?: boolean;
};

/** Props for a single stroke view (renders one stroke + its selection chrome). */
export type AnnotationStrokeViewProps = {
  stroke: AnnotationStroke;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  /** Reports center-snap state so the shared CenterGuides can render. */
  onCenterGuideChange?: (guides: CenterGuidesState) => void;
  /** Eraser strokes used to mask out this stroke's pixels. */
  eraserStrokes: AnnotationStroke[];
  /** Complete ordered list of all strokes (used to determine chronological eraser masking). */
  allStrokes?: AnnotationStroke[];
  /** Namespace prefix for the per-stroke SVG mask id. */
  annotationMaskId: string;
  /** Canvas container ref — used to compute canvas size for center snap. */
  canvasRef?: React.RefObject<HTMLElement | null>;
};

/** Props for the layer that renders ALL strokes + the drawing surface. */
export type AnnotationStrokesLayerProps = {
  strokes: AnnotationStroke[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCenterGuideChange?: (guides: CenterGuidesState) => void;
  annotationMaskId: string;
  /** Ref for the drawing surface SVG (captures pointer events while annotating). */
  layerRef: React.RefObject<SVGSVGElement | null>;
  isAnnotating: boolean;
  cursorClass: string;
  eraserBrushSize?: number | null;
  canvasRef?: React.RefObject<HTMLElement | null>;
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
  onClick: (e: React.MouseEvent<SVGSVGElement>) => void;
  onDoubleClick: (e: React.MouseEvent<SVGSVGElement>) => void;
};

// ── Interaction session types ───────────────────────────────────────────
// Strokes work in canvas-pixel space (unlike other elements which use
// percentages), so the move/resize sessions are stroke-specific. The rotate
// session matches the shared RotateGesture exactly.

/** Active stroke move-drag session (pixel offsets). */
export type StrokeMoveSession = {
  pointerId: number;
  startX: number;
  startY: number;
  canvasW: number;
  canvasH: number;
};

/** Active stroke resize session (scales the point cloud around a pivot). */
export type StrokeResizeSession = {
  pointerId: number;
  startX: number;
  startY: number;
  handle: ResizeHandleId;
  startBBox: ReturnType<typeof getStrokeBoundingBox>;
};

/** Live resize scale state (applied to points during the gesture). */
export type StrokeResizeState = {
  sx: number;
  sy: number;
  pivotX: number;
  pivotY: number;
};

/** Active rotation session. */
export type StrokeRotateSession = RotateGesture;
