/**
 * Shape element constants.
 */

import type { AnnotationLineStyle } from "@/editor/elements/types";

/** Options for the line-style picker (solid / dashed / dotted). */
export const LINE_STYLE_OPTIONS: { id: AnnotationLineStyle; label: string }[] =
  [
    { id: "solid", label: "Solid" },
    { id: "dashed", label: "Dashed" },
    { id: "dotted", label: "Short Dash" },
  ];
