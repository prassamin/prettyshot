"use client";

import * as React from "react";

import { useAnimationPlayer } from "@/editor/animate/hooks/use-animation-player";
import { computeTicks, timelineEndFor } from "@/editor/lib/animation/timeline";
import { useEditorEngine } from "@/editor/lib/engine";

import type { ClipThumb, TimelineLayer } from "../types";
import {
  thumbnailsFor,
  effectIconsFor,
  clipsForScope,
} from "../timeline-utils";
import { useTimelineClipActions } from "./use-timeline-clip-actions";
import { useTimelineInteractions } from "./use-timeline-interactions";
import { useTimelineSelection } from "./use-timeline-selection";
import { useTimelineZoom } from "./use-timeline-zoom";

/**
 * Composition root for the animation timeline. Wires the selection, zoom,
 * pointer-interaction, and clip-action hooks together and exposes the state
 * + callbacks the AnimateBar needs. Pure helpers live in timeline-utils.ts;
 * each concern lives in its own hook under hooks/.
 */
export function useTimeline() {
  const { playheadMs, durationMs, isPlaying, toggle, reset, seek } =
    useAnimationPlayer();

  const screenshot = useEditorEngine((c: any) => c.present.screenshot) ?? null;
  const slots = useEditorEngine((c: any) => c.present.slots) ?? [];
  const clips = useEditorEngine((c: any) => c.present.animation?.clips) ?? [];

  const selection = useTimelineSelection();
  const zoom = useTimelineZoom();

  const clipActions = useTimelineClipActions({
    selection,
    clips,
    togglePlay: toggle,
  });

  const interactions = useTimelineInteractions({
    selection,
    zoom,
    clips,
    durationMs,
    razorModeRef: clipActions.razorModeRef,
    seek,
  });

  // --- layer rows (only main screenshot and screenshot slots) ---------------
  const layers = React.useMemo<TimelineLayer[]>(
    () => [
      {
        id: "main",
        label: "Main",
        kind: "main",
        src: screenshot,
        objectPosition: undefined,
      },
      ...slots.map((slot: any, i: number) => ({
        id: slot.id,
        label: `Layer ${i + 2}`,
        kind: "slot" as const,
        src: slot.src,
        objectPosition: undefined,
      })),
    ],
    [screenshot, slots],
  );

  // --- timeline geometry ----------------------------------------------------
  const lastClipEnd = clips.reduce(
    (max: any, clip: any) => Math.max(max, clip.startMs + clip.durationMs),
    0,
  );

  const timelineEndMs = timelineEndFor(durationMs, lastClipEnd);
  const ticks = computeTicks(timelineEndMs, zoom.pxPerSecond);

  // --- thumbnails -----------------------------------------------------------
  const staticMainThumb = React.useMemo<ClipThumb | null>(
    () => (screenshot ? { src: screenshot } : null),
    [screenshot],
  );

  const resolveClipImages = React.useCallback(
    (clip: any): ClipThumb[] => thumbnailsFor(clip, layers, staticMainThumb),
    [layers, staticMainThumb],
  );

  const resolveClipIcons = React.useCallback(
    (clip: any) => effectIconsFor(clip),
    [],
  );

  const selectedClip = React.useMemo(
    () => clips.find((c: any) => c.id === selection.selectedClipId) ?? null,
    [clips, selection.selectedClipId],
  );

  const clipsForLayer = React.useCallback(
    (layerId: string) => clipsForScope(clips, layerId),
    [clips],
  );

  return {
    playheadMs,
    durationMs,
    isPlaying,
    toggle,
    reset,
    layers,
    activeLayerId: selection.activeLayerId,
    onLayerSelect: selection.selectLayer,
    clipsForLayer,

    pxFor: zoom.pxFor,
    ticks,

    selectedClipIds: selection.selectedClipIds,
    highlightedClipIds: interactions.highlightedClipIds,
    selectedClip,
    updateAnimationClip: interactions.updateAnimationClip,
    draggingClipId: interactions.draggingClipId,
    interactingClipId: interactions.interactingClipId,
    clipsAnimated: zoom.clipsAnimated,

    scrollRef: zoom.scrollRef,
    trackRef: zoom.trackRef,
    trackListRef: interactions.trackListRef,
    dropPreviewRef: interactions.dropPreviewRef,

    resolveClipImages,
    resolveClipIcons,

    showDropPreview: interactions.showDropPreview,
    dropPreviewLayerId: interactions.dropPreviewLayerId,
    dropPreviewWidthPx: interactions.dropPreviewWidthPx,

    isDurationDragging: interactions.isDurationDragging,
    onDurationHandleDown: interactions.onDurationHandleDown,
    onDurationHandleMove: interactions.onDurationHandleMove,
    onDurationHandleUp: interactions.onDurationHandleUp,

    onScrubDown: interactions.onScrubDown,
    onScrubMove: interactions.onScrubMove,
    onScrubUp: interactions.onScrubUp,

    onTrackMove: interactions.onTrackPointerMove,
    onTrackLeave: interactions.onTrackLeave,
    onTrackClick: interactions.onTrackClick,
    onTrackPointerDown: interactions.onTrackPointerDown,
    onTrackPointerUp: interactions.onTrackPointerUp,
    onClipPointerDown: interactions.onClipPointerDown,
    onClipPointerMove: interactions.onClipPointerMove,
    onClipPointerUp: interactions.onClipPointerUp,

    rangeSelectRect: interactions.rangeSelectRect,

    deleteSelectedClip: clipActions.deleteSelectedClip,
    razorMode: clipActions.razorMode,
    canRazor: clipActions.canRazor,
    toggleRazor: clipActions.toggleRazor,

    requestExit: clipActions.requestExit,
  };
}
