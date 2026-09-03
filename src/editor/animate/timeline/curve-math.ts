import {
  BEZIER_Y_MAX,
  BEZIER_Y_MIN,
  normalizeBezier,
  type ClipEasingBezier,
} from "@/editor/lib/animation/clip-easing";

export const VIEW_H = 100;
/** Enough padding for the corner endpoint squares — the plot is full-bleed. */
export const PAD = 4;
/** Handle size in viewBox units (not CSS px). */
export const HANDLE_R = 2.8;
export const ENDPOINT_R = 2.4;
/** Fallback aspect ratio used for the first paint before the box is measured. */
export const INITIAL_ASPECT = 1.6;
/** Unit-space step for arrow-key nudges on control points. */
export const KEY_NUDGE = 0.02;

export type DragTarget = "p1" | "p2";

/** client px → unit [0,1] coords inside the plot (y flipped: up = +). */
function clientToUnit(
  el: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  // The viewBox tracks the box aspect, so one uniform scale maps px → units.
  const scale = rect.height / VIEW_H;
  const padPx = PAD * scale;
  const spanX = rect.width - padPx * 2;
  const spanY = rect.height - padPx * 2;
  return {
    x: (clientX - rect.left - padPx) / spanX,
    y: 1 - (clientY - rect.top - padPx) / spanY,
  };
}

/** Clamp + normalize a handle drag into a valid bezier. */
export function applyHandle(
  target: DragTarget,
  base: ClipEasingBezier,
  el: SVGSVGElement,
  clientX: number,
  clientY: number,
): ClipEasingBezier {
  const u = clientToUnit(el, clientX, clientY);
  const x = Math.min(1, Math.max(0, u.x));
  const y = Math.min(BEZIER_Y_MAX, Math.max(BEZIER_Y_MIN, u.y));
  return target === "p1"
    ? normalizeBezier({ ...base, x1: x, y1: y })
    : normalizeBezier({ ...base, x2: x, y2: y });
}
