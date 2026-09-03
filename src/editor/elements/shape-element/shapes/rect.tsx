/**
 * RectGlyph — SVG rendering for a rectangle annotation.
 */
"use client";

export function RectGlyph({
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
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="3"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
