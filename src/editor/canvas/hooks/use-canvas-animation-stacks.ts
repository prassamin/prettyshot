"use client";

import * as React from "react";

import {
  EMPTY_BG_STACK,
  EMPTY_FILTER_STACK,
  EMPTY_OVERLAY_STACK,
  resolveAnimateBgStack,
  resolveAnimateFilterStack,
  resolveAnimateOverlayStack,
} from "@/editor/lib/animation/playback";
import type {
  BackdropFilterKind,
  OverlayConfig,
} from "@/editor/property-panel/sections/backdrop/types";
import type { Background } from "@/editor/property-panel/sections/background/types";
import type { CanvasAnimation } from "@/editor/lib/animation/types";

export interface CanvasAnimationStacksOptions {
  isAnimateMode: boolean;
  canvasAnimation: CanvasAnimation | undefined;
  selectedClipId: string | null;
  background: Background;
  filter: BackdropFilterKind;
  overlay: OverlayConfig;
}

/**
 * Computes the multi-layer background, backdrop filter, and overlay stacks
 * for keyframe animation playback and live timeline scrubbing.
 */
export function useCanvasAnimationStacks({
  isAnimateMode,
  canvasAnimation,
  selectedClipId,
  background,
  filter,
  overlay,
}: CanvasAnimationStacksOptions) {
  const activeClips = isAnimateMode ? (canvasAnimation?.clips ?? null) : null;

  const bgStack = React.useMemo(
    () =>
      activeClips
        ? resolveAnimateBgStack(activeClips, background, selectedClipId)
        : EMPTY_BG_STACK,
    [activeClips, background, selectedClipId],
  );

  const filterStack = React.useMemo(
    () =>
      activeClips
        ? resolveAnimateFilterStack(activeClips, filter, selectedClipId)
        : EMPTY_FILTER_STACK,
    [activeClips, filter, selectedClipId],
  );

  const overlayStack = React.useMemo(
    () =>
      activeClips
        ? resolveAnimateOverlayStack(activeClips, overlay, selectedClipId)
        : EMPTY_OVERLAY_STACK,
    [activeClips, overlay, selectedClipId],
  );

  return {
    bg: bgStack,
    filterStack,
    overlayStack,
  };
}
