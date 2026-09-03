"use client";

/**
 * On-canvas Animate-mode playback.
 *
 * Drives the screenshots' live-preview override variables from the animation
 * timeline via the shared `applyAnimationFrameAtTime` sampler — the same
 * function the WebM exporter uses, so preview always matches export.
 *
 * Motion applies while playing or parked mid-timeline; at rest (playhead at 0,
 * not playing) every override is cleared so the static committed pose shows.
 */

import * as React from "react";

import { useAnimationPlayerOptional } from "@/editor/animate/hooks/use-animation-player";
import {
  applyAnimationFrameAtTime,
  clearAnimationFrameVars,
  measureBareStageDims,
} from "../lib/animation/apply-frame";
import type { StagePlacementDims } from "../lib/position-math";
import { useEditorEngine as useEditorStore } from "@/editor/lib/engine";
import { CANVAS_ID } from "@/editor/lib/engine-core/initial-config";

const stageSelector = `[data-stage-id="${CANVAS_ID}"]`;

function queryCanvasEl(): HTMLElement | null {
  return document.querySelector<HTMLElement>(stageSelector);
}

export function AnimationLayer() {
  const player = useAnimationPlayerOptional();
  const playheadMs = player?.playheadMs ?? 0;
  const isPlaying = player?.isPlaying ?? false;

  const canvas = useEditorStore((s) => s.present);
  const globalAspect = useEditorStore((s) => s.present.aspect);
  const clips = canvas?.animation?.clips;
  const scale = canvas?.scale ?? 100;
  const slotsLen = canvas?.slots?.length ?? 0;
  const selectedClipId = useEditorStore((s) => s.selectedAnimationClipId);
  const screenshotPositionDragging = useEditorStore(
    (s) => s.screenshotPositionDragging,
  );

  const frame = canvas?.deviceFrame;
  const hasTweet = false;
  const hasDeviceFrame = (frame?.id ?? "none") !== "none";
  const hasMainScreenshot = Boolean(canvas?.screenshot);
  const isBareMainTarget =
    !hasTweet && hasMainScreenshot && !hasDeviceFrame && slotsLen === 0;

  const dimsRef = React.useRef<StagePlacementDims | null>(null);
  React.useLayoutEffect(() => {
    dimsRef.current = null;
  }, [scale, canvas?.screenshot, globalAspect, canvas?.aspect]);

  // Suppress transform/placement transitions for the whole animate session so
  // per-frame playback isn't smeared ~300ms behind the playhead.
  React.useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const canvasEl = queryCanvasEl();
    if (!canvasEl) return;
    const targets = Array.from(
      canvasEl.querySelectorAll<HTMLElement>(
        "[data-editor-shadow-filter-target], [data-editor-shadow-box-target], [data-editor-slot-id]",
      ),
    );
    for (const el of targets) el.style.transition = "none";
    return () => {
      for (const el of targets) el.style.removeProperty("transition");
    };
  }, [isPlaying, hasMainScreenshot, slotsLen]);

  React.useLayoutEffect(() => {
    if (typeof document === "undefined" || !canvas) return;
    const canvasEl = queryCanvasEl();
    if (!canvasEl) return;
    const frameClips = clips ?? [];

    // When a keyframe is open for editing, the store has already loaded that
    // keyframe's resolved pose onto the committed canvas. If playback vars stay
    // active while paused/scrubbed, the screenshot renders at the sampled
    // timeline position while selection chrome and inspector controls still read
    // the committed keyframe pose. Clear overrides so edit handles stay attached
    // to the same visual pose the user is editing.
    if (!isPlaying && selectedClipId) {
      clearAnimationFrameVars(canvasEl, frameClips);
      return;
    }

    // Only at rest (stopped at the very start) clear overrides so the committed
    // inspector pose shows. While playing or parked mid-timeline with no open
    // keyframe, hold the sampled frame.
    if (!isPlaying && playheadMs <= 0) {
      clearAnimationFrameVars(canvasEl, frameClips);
      return;
    }

    let bareDims: StagePlacementDims | null = null;
    if (isBareMainTarget) {
      bareDims = dimsRef.current ?? measureBareStageDims(canvasEl);
      if (bareDims) dimsRef.current = bareDims;
    }

    applyAnimationFrameAtTime({
      canvasEl,
      canvas,
      globalAspect,
      clips: frameClips,
      timeMs: playheadMs,
      selectedClipId,
      screenshotPositionDragging,
      bareDims,
    });

    return () => {
      clearAnimationFrameVars(canvasEl, frameClips);
    };
  }, [
    canvas,
    isPlaying,
    playheadMs,
    clips,
    selectedClipId,
    screenshotPositionDragging,
    isBareMainTarget,
    globalAspect,
  ]);

  return null;
}
