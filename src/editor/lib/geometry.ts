/**
 * Shared geometric / math helpers used across editor elements.
 */

/** Clamp a number to [min, max]. */
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Clamp with input validation — the strict sibling of `clamp`.
 *
 * Returns `null` when the raw value is not finite (NaN / Infinity / bad
 * casts), and treats `±Infinity` bounds as "no bound" (safe because the
 * clamping schema rejects infinities). Used where a bad value must be
 * rejected instead of silently coerced, e.g. crop percentages.
 */
export function clampNumber(
  raw: number,
  min: number = Number.NEGATIVE_INFINITY,
  max: number = Number.POSITIVE_INFINITY,
): number | null {
  if (!Number.isFinite(raw)) return null;
  const lo = min === Number.NEGATIVE_INFINITY ? -Number.MAX_SAFE_INTEGER : min;
  const hi = max === Number.POSITIVE_INFINITY ? Number.MAX_SAFE_INTEGER : max;
  return Math.max(lo, Math.min(hi, raw));
}

/**
 * Clamp a 2D percent point (xPct/yPct) into [0, 100] — used by the
 * position pad and placement math.
 */
export function clampPointPercent(point: {
  xPct: number;
  yPct: number;
} | null): { xPct: number; yPct: number } {
  return {
    xPct: clamp(point?.xPct ?? 50, 0, 100),
    yPct: clamp(point?.yPct ?? 50, 0, 100),
  };
}

/** SVG dash pattern (user units) for a line style. */
export function dashPattern(style: string | undefined) {
  if (style === "dashed") return "5 3";
  if (style === "dotted") return "2.2 2.2";
  return undefined;
}

/**
 * SVG dash pattern scaled relative to a stroke width.
 * Keeps dash proportions consistent when the stroke scales.
 */
export function scaledDashArray(
  style: string | undefined,
  strokeWidth: number,
) {
  if (style === "dashed") return `${strokeWidth * 2.2} ${strokeWidth * 1.35}`;
  if (style === "dotted") return `0.1 ${strokeWidth * 1.75}`;
  return undefined;
}

/**
 * Geometry for rendering an arrow inside a bounding box.
 * Returns shaft/head coordinates and a head polygon string
 * suitable for an SVG `<polyline points="...">`.
 */
export function getArrowGeometry(
  width: number,
  height: number,
  strokeWidth: number,
) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const visualStrokeWidth = clamp(
    strokeWidth * 2.8,
    8,
    Math.max(8, safeHeight * 0.58),
  );
  const pad = Math.max(visualStrokeWidth / 2, 1);
  const centerY = safeHeight / 2;
  const tipX = Math.max(pad, safeWidth - pad);
  const tailX = Math.min(pad, tipX - 1);
  const availableLength = Math.max(1, tipX - tailX);
  const targetHead = clamp(visualStrokeWidth * 3.2, 28, 72);
  const headLength = Math.min(targetHead, availableLength * 0.42);
  const headSpread = Math.min(
    targetHead * 0.72,
    Math.max(4, safeHeight / 2 - pad),
  );
  const headBaseX = Math.max(tailX, tipX - headLength);
  const topY = clamp(centerY - headSpread, pad, safeHeight - pad);
  const bottomY = clamp(centerY + headSpread, pad, safeHeight - pad);

  return {
    width: safeWidth,
    height: safeHeight,
    tailX,
    tipX,
    centerY,
    strokeWidth: visualStrokeWidth,
    headPoints: `${headBaseX},${topY} ${tipX},${centerY} ${headBaseX},${bottomY}`,
  };
}
