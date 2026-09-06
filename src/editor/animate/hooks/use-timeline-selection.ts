"use client";

import * as React from "react";
import { useShallow } from "zustand/react/shallow";

import { useEditorEngine } from "@/editor/lib/engine";

/**
 * Layer + clip selection state for the animation timeline.
 * Layer selection decides which target new keyframes bind to; clip selection
 * drives the inspector/controls and multi-select range operations.
 */
export function useTimelineSelection() {
  const selectedSlotId = useEditorEngine((s: any) => s.selectedSlotId);
  const setSelectedSlotId = useEditorEngine((s: any) => s.setSelectedSlotId);
  const setIsScreenshotSelected = useEditorEngine(
    (s: any) => s.setIsScreenshotSelected,
  );
  const selectedTextId = useEditorEngine((s: any) => s.selectedTextId);
  const setSelectedTextId = useEditorEngine((s: any) => s.setSelectedTextId);
  const isScreenshotSelected = useEditorEngine(
    (s: any) => s.isScreenshotSelected,
  );

  const selectedClipId = useEditorEngine((s: any) => s.selectedAnimationClipId);
  const selectedClipIds = useEditorEngine(
    useShallow((s: any) => s.selectedAnimationClipIds),
  );
  const selectAnimationClipRaw = useEditorEngine(
    (s: any) => s.selectAnimationClip,
  );
  const setAnimationClipSelectionRaw = useEditorEngine(
    (s: any) => s.setAnimationClipSelection,
  );

  const selectLayer = React.useCallback(
    (layerId: string) => {
      if (layerId === "main") {
        setSelectedSlotId(null);
        setIsScreenshotSelected(true);
        setSelectedTextId(null);
      } else if (layerId.startsWith("text:")) {
        setSelectedTextId(layerId.slice(5));
      } else {
        setSelectedSlotId(layerId);
        setIsScreenshotSelected(false);
        setSelectedTextId(null);
      }
    },
    [setSelectedSlotId, setIsScreenshotSelected, setSelectedTextId],
  );

  const selectClip = React.useCallback(
    (id: string | null, canvasId?: string) => {
      selectAnimationClipRaw(id, canvasId);
    },
    [selectAnimationClipRaw],
  );

  const selectClips = React.useCallback(
    (ids: string[], canvasId?: string) => {
      setAnimationClipSelectionRaw(ids, canvasId);
    },
    [setAnimationClipSelectionRaw],
  );

  /** "main" or a slot id — the layer new keyframes bind to. */
  const activeLayerId = selectedSlotId
    ? selectedSlotId
    : selectedTextId
      ? `text:${selectedTextId}`
      : "main";

  return {
    selectedSlotId,
    selectedTextId,
    isScreenshotSelected,
    selectedClipId,
    selectedClipIds,
    activeLayerId,
    selectLayer,
    selectClip,
    selectClips,
  };
}

export type UseTimelineSelection = ReturnType<typeof useTimelineSelection>;
