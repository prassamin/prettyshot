"use client";

import * as React from "react";

import type { ScreenshotStylePatch } from "@/editor/lib/canvas-utils";
import {
  useEditorEngine,
  useSelectedScreenshotTile,
} from "@/editor/lib/engine";

export type ScreenshotStyleTarget = "slot" | "main" | "all";

export function useScreenshotStyleTarget() {
  const selectedSlot = useSelectedScreenshotTile();
  const isScreenshotSelected = useEditorEngine((s) => s.isScreenshotSelected);
  const applyScreenshotStyle = useEditorEngine((s) => s.applyScreenshotStyle);

  const target: ScreenshotStyleTarget = selectedSlot
    ? "slot"
    : isScreenshotSelected
      ? "main"
      : "all";

  const applyStyle = React.useCallback(
    (patch: ScreenshotStylePatch) => {
      if (selectedSlot) {
        applyScreenshotStyle({ slotId: selectedSlot.id }, patch);
        return;
      }
      applyScreenshotStyle(isScreenshotSelected ? "main" : "all", patch);
    },
    [applyScreenshotStyle, isScreenshotSelected, selectedSlot],
  );

  return { applyStyle, selectedSlot, target };
}
