/**
 * Shape element types.
 *
 * A shape is a rect / ellipse / arrow annotation on the canvas. Positions
 * and sizes are stored as canvas percentages so they survive zoom/resize.
 *
 * The canonical domain types (`AnnotationShape`, `AnnotationShapeKind`) live
 * in the editor store schema — this file re-exports them so element code can
 * import locally, and defines the interaction-session types used during
 * pointer gestures.
 */

import type * as React from "react";
import type {
  MoveGesture,
  ResizeGesture,
  RotateGesture,
} from "@/editor/elements/types";
import type {
  AnnotationShape,
  AnnotationShapeKind,
} from "../types";

export type { AnnotationShape, AnnotationShapeKind };
export type {
  MoveGesture,
  ResizeGesture,
  RotateGesture,
  ResizeHandleId,
} from "@/editor/elements/types";

/** Props for the root shape element view. */
export type ShapeElementProps = {
  shape: AnnotationShape;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  previewMode?: boolean;
};

// ── Interaction session types (base fields from the shared gesture types) ───

/** Active move-drag session (+ next position for commit-on-release). */
export type MoveSession = MoveGesture & {
  nextXPct: number;
  nextYPct: number;
};

/** Active resize session. */
export type ResizeSession = ResizeGesture;

/** Active rotation session. */
export type RotateSession = RotateGesture;
