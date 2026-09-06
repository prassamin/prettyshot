/**
 * Asset element types.
 *
 * An asset is an imported image placed on the canvas. It can be moved,
 * resized (aspect-locked on corners), flipped, filtered, and blended.
 *
 * The canonical `AssetElement` domain type lives in the store schema —
 * re-exported here so element code imports locally.
 */

import type * as React from "react";
import type { MoveGesture, ResizeGesture } from "@/editor/elements/types";
import type { AssetElement } from "@/editor/elements/types";

export type { AssetElement };
export type {
  MoveGesture,
  ResizeGesture,
  ResizeHandleId,
} from "@/editor/elements/types";

/** Props for the root asset element view. */
export type AssetElementViewProps = {
  asset: AssetElement;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  previewMode?: boolean;
};

// ── Interaction session types (base fields from the shared gesture types) ───

/** Active move-drag session (+ last position for commit-on-release). */
export type MoveSession = MoveGesture & {
  lastXPct: number;
  lastYPct: number;
};

/** A subset of AssetElement that resize can patch. */
export type AssetResizePatch = Pick<
  AssetElement,
  "xPct" | "yPct" | "widthPct" | "heightPct"
>;

/** Active resize session (free resize; aspect-lock planned with Shift). */
export type ResizeSession = ResizeGesture & {
  lastPatch: AssetResizePatch | null;
};
