/**
 * Element text types.
 *
 * ── How text elements work ──
 * A text element is a free‑floating piece of text on the canvas.
 * It can be dragged, rotated, resized, and styled (font, border, shadow, etc).
 * The element stores its position as percentages (xPct/yPct) relative to the
 * canvas so it stays in place at any zoom level or canvas size.
 *
 * Width/height are nullable — when null the element auto‑sizes to its content.
 * autoColor tells the editor to periodically sample the backdrop and pick
 * a contrasting foreground color automatically.
 */

import type * as React from "react";
import type {
  MoveGesture,
  ResizeGesture,
  RotateGesture,
  ResizeHandleId,
} from "@/editor/elements/types";
import { BorderStyle } from "../types";

export type TextAlign = "left" | "center" | "right";

/** Canonical text element stored in editor state. */
export type TextElement = {
  id: string;
  content: string;
  /** Center X as percentage of canvas width (0–100, but clamped –20…120). */
  xPct: number;
  /** Center Y as percentage of canvas height (same clamp). */
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
  /** Null = auto‑width (shrink‑wrap content). */
  widthPx: number | null;
  /** Null = auto‑height. */
  heightPx: number | null;
  /** When true the editor picks a contrasting color based on the backdrop. */
  autoColor: boolean;
  strokeColor?: string | null;
  strokeWidth?: number;
  textShadow?: string | null;
  opacity?: number;
  hidden?: boolean;
};

/** Props accepted by <TextElementView>. */
export type TextElementViewProps = {
  text: TextElement;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  /** Called while dragging near the canvas center (snap guides). */
  onCenterGuideChange?: (guides: { x: boolean; y: boolean }) => void;
  previewMode?: boolean;
};

// ── Internal interaction state types ──────────────────────────────────────
// These are held in refs during pointer sessions and committed on release.
// Core fields come from the shared gesture types.

/** Active drag session (move element) + center-snap hysteresis state. */
export type DragPayload = MoveGesture & {
  snapXActive: boolean;
  snapYActive: boolean;
  lastXPct: number;
  lastYPct: number;
};

/** Active rotation session. */
export type RotationState = RotateGesture;

/** Which resize handle is being dragged (shared union). */
export type HandleAnchor = ResizeHandleId;

/** Active resize session — scale the text by dragging a corner/edge handle. */
export type ResizeSession = ResizeGesture & {
  startWidthPx: number;
  startHeightPx: number;
  startFontSize: number;
  storeWidthPx: number | null;
  storeHeightPx: number | null;
  elW: number;
  elH: number;
  /** Accumulated patches applied live during drag; committed on release. */
  lastPatch: Partial<TextElement> | null;
};

export type PinchSession = {
  pointer1Id: number;
  pointer2Id: number;
  startDistance: number;
  startFontSize: number;
};