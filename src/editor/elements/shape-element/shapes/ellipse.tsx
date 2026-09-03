/**
 * EllipseGlyph — SVG rendering for an ellipse annotation.
 */
"use client";

export function EllipseGlyph({
  color,
  strokeWidth,
  dashArray,
}: {
  color: string;
  strokeWidth: number;
  dashArray: string | undefined;
}) {
  return (
    <svg
      className="h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <ellipse
        cx="50"
        cy="50"
        rx="46"
        ry="46"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
