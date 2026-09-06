/**
 * Center guides — crosshair overlay shown when an element snaps to canvas center.
 *
 * Shared by all element types (text, shapes, strokes, screenshots).
 * Each element computes its own snap in its drag handler and reports the
 * result via `useCenterGuides()` → the `CenterGuides` renderer.
 */
"use client";

import * as React from "react";

import type { CenterGuidesState } from "@/editor/screenshot/types";

export type { CenterGuidesState };

export function useCenterGuides() {
  const [guides, setGuides] = React.useState<CenterGuidesState>({
    x: false,
    y: false,
  });

  const updateGuides = React.useCallback((next: CenterGuidesState) => {
    setGuides((prev) => (prev.x === next.x && prev.y === next.y ? prev : next));
  }, []);

  return [guides, updateGuides] as const;
}

export function CenterGuides({ guides }: { guides: CenterGuidesState }) {
  return (
    <>
      {guides.x ? (
        <div
          aria-hidden
          data-export-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-1/2 z-900 -translate-x-1/2 border-l border-dashed border-primary"
        />
      ) : null}
      {guides.y ? (
        <div
          aria-hidden
          data-export-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 z-900 -translate-y-1/2 border-t border-dashed border-primary"
        />
      ) : null}
    </>
  );
}
