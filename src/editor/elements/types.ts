/**
 * Shared element types.
 *
 * ── Contents ──
 * Gesture session types — the core fields every element's drag/resize/
 *    rotate loop shares (extended per element in its own types.ts)
 * Element data models — the canonical definitions of every canvas element
 *    (text, asset, annotation stroke/shape, screenshot tile)
 */

import type {
  Border,
  BorderStyle,
} from "@/editor/property-panel/sections/border/types";
import type { CropRegion } from "@/editor/crop/types";
import type { LightSourceConfig } from "@/editor/property-panel/sections/backdrop/types";
import type { Shadow } from "@/editor/property-panel/sections/shadow/types";
import type { Tilt } from "@/editor/property-panel/sections/transform/types";
import type { DeviceFrame } from "@/editor/frames/types";

export type { Border, BorderStyle };

// ── Gesture session types ──────────────────────────────────────────────
// Naming: `startClient*` = viewport px at gesture start, `*Pct` = canvas %.

/** Which resize handle is being dragged. t/b/l/r = top/bottom/left/right, m = middle. */
export type ResizeHandleId =
  | "tl"
  | "tr"
  | "bl"
  | "br"
  | "ml"
  | "mr"
  | "mt"
  | "mb";

/** Core fields of a move-drag session. */
export type MoveGesture = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startXPct: number;
  startYPct: number;
  canvasW: number;
  canvasH: number;
  moved: boolean;
};

/** Core fields of a resize session. */
export type ResizeGesture = {
  pointerId: number;
  handle: ResizeHandleId;
  startClientX: number;
  startClientY: number;
  startXPct: number;
  startYPct: number;
  startWidthPct: number;
  startHeightPct: number;
  canvasW: number;
  canvasH: number;
};

/** Core fields of a rotation session. */
export type RotateGesture = {
  pointerId: number;
  centerX: number;
  centerY: number;
  startAngle: number;
  startRotation: number;
};

/** An imported image placed on the canvas. */
export type AssetElement = {
  id: string;
  src: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number | null;
  rotation: number;
  zIndex: number;
  opacity: number;
  hidden?: boolean;
  flipX?: boolean;
  flipY?: boolean;
};

export type TextAlign = "left" | "center" | "right";

/** A free-floating text element on the canvas. */
export type TextElement = {
  id: string;
  content: string;
  xPct: number;
  yPct: number;
  rotation: number;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  align: TextAlign;
  borderColor: string | null;
  borderWidth: number;
  borderStyle: BorderStyle;
  zIndex: number;
  widthPx: number | null;
  heightPx: number | null;
  autoColor: boolean;
  strokeColor?: string | null;
  strokeWidth?: number;
  textShadow?: string | null;
  opacity?: number;
  hidden?: boolean;
};

/** Annotation tool + config carried by the draw toolbar. */
export type AnnotationMode =
  | "move"
  | "pen"
  | "highlight"
  | "eraser"
  | "arrow"
  | "rect"
  | "ellipse";

export type AnnotationLineStyle = "solid" | "dashed" | "dotted";

/** Active annotation tool configuration. */
export type Annotation = {
  mode: AnnotationMode;
  color: string;
  strokeWidth: number;
  lineStyle: AnnotationLineStyle;
};

/** A single point of a freehand stroke, in canvas pixel coordinates. */
export type AnnotationPoint = {
  x: number;
  y: number;
};

/** A freehand pen / highlight / eraser stroke. */
export type AnnotationStroke = {
  id: string;
  mode: Extract<AnnotationMode, "pen" | "highlight" | "eraser">;
  color: string;
  strokeWidth: number;
  points: AnnotationPoint[];
  zIndex: number;
  opacity?: number;
  hidden?: boolean;
};

/** The boxed shape kinds (arrow / rect / ellipse). */
export type AnnotationShapeKind = Extract<
  AnnotationMode,
  "arrow" | "rect" | "ellipse"
>;

/** A rect / ellipse / arrow annotation. */
export type AnnotationShape = {
  id: string;
  kind: AnnotationShapeKind;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  rotation: number;
  color: string;
  strokeWidth: number;
  lineStyle: AnnotationLineStyle;
  zIndex: number;
  opacity?: number;
  hidden?: boolean;
};

/** A boxed screenshot tile — an additional screenshot on the canvas. */
export type Slot = {
  id: string;
  src: string | null;
  originalSrc?: string | null;
  lastCropRegion?: CropRegion | null;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
  rotation: number;
  tilt: Tilt;
  scale: number;
  zIndex: number;
  hidden?: boolean;
  objectFit?: "contain" | "cover" | "fill";
  border?: Border;
  borderRadius?: number;
  padding?: number;
  shadow?: Shadow;
  lighting?: LightSourceConfig;
  deviceFrame?: DeviceFrame;
};
