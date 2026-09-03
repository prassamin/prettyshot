/**
 * DashStyleIcon — small SVG icon previewing a line style (solid/dashed/dotted)
 * rendered in the shape of a given annotation kind (arrow/rect/ellipse).
 *
 * Used by the annotation toolbar and the shape element toolbar as the
 * visual for line-style toggle buttons.
 */
"use client";

import type { AnnotationLineStyle, AnnotationShape } from "@/editor/elements/types";
import { cn } from "@/lib/utils";

import { dashPattern } from "@/editor/lib/geometry";

export function DashStyleIcon({
  style,
  kind,
  active,
}: {
  style: AnnotationLineStyle;
  kind: AnnotationShape["kind"];
  active: boolean;
}) {
  const dash = dashPattern(style);
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn(
        "size-6 overflow-visible",
        active ? "text-foreground" : "text-foreground/55",
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "arrow" ? (
        <>
          {/* Centered arrow pointing left: tip at (5, 12), tail at (19, 12) */}
          <path d="m12 19-7-7 7-7" strokeDasharray={dash} />
          <path d="M19 12H5" strokeDasharray={dash} />
        </>
      ) : kind === "rect" ? (
        /* 14x14 rect centered: 24 - 14 = 10px remaining space (5px padding on each side) */
        <rect
          x="5"
          y="5"
          width="14"
          height="14"
          rx="2.5"
          strokeDasharray={dash}
        />
      ) : (
        /* Centered circle: center at (12, 12) with a radius of 7 */
        <circle cx="12" cy="12" r="7" strokeDasharray={dash} />
      )}
    </svg>
  );
}
