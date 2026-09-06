/**
 * Geometry helpers for annotation strokes.
 */

/**
 * Build an SVG path `d` string from stroke points.
 * A single point renders a tiny 0.01px segment so dots stay visible.
 */
export function annotationPath(points: { x: number; y: number }[]) {
  const first = points[0];
  if (!first) return "";
  if (points.length === 1)
    return `M ${first.x} ${first.y} L ${first.x + 0.01} ${first.y + 0.01}`;
  return points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    )
    .join(" ");
}

/**
 * Axis-aligned bounding box of a set of points.
 * `strokeWidth` optionally inflates the box by half the stroke on each side.
 */
export function getStrokeBoundingBox(
  points: { x: number; y: number }[],
  strokeWidth = 0,
) {
  if (points.length === 0)
    return { x: 0, y: 0, width: 0, height: 0, cx: 0, cy: 0 };
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const pad = strokeWidth / 2;
  minX -= pad;
  maxX += pad;
  minY -= pad;
  maxY += pad;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}
