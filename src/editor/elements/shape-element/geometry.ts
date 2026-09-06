/**
 * Shape-specific geometry — arrow endpoint math.
 * Generic helpers live in `@/editor/lib/geometry`.
 */

import type { AnnotationShape } from "@/editor/elements/types";

/**
 * Resolve the tail/head positions of an arrow in canvas percentages.
 * The shaft length derives from `widthPct`; rotation spins it around the
 * shape center.
 */
export function computeArrowEndpoints(
  shape: AnnotationShape,
  canvasW: number,
  canvasH: number,
) {
  const centerX = (shape.xPct / 100) * canvasW;
  const centerY = (shape.yPct / 100) * canvasH;
  const length = (shape.widthPct / 100) * canvasW;
  const theta = ((shape.rotation ?? 0) * Math.PI) / 180;
  const dx = (Math.cos(theta) * length) / 2;
  const dy = (Math.sin(theta) * length) / 2;

  return {
    tail: {
      xPct: ((centerX - dx) / canvasW) * 100,
      yPct: ((centerY - dy) / canvasH) * 100,
    },
    head: {
      xPct: ((centerX + dx) / canvasW) * 100,
      yPct: ((centerY + dy) / canvasH) * 100,
    },
  };
}
