"use client";

import * as React from "react";

import {
  MAX_DURATION_MS,
  MIN_DURATION_MS,
} from "@/editor/lib/animation/timeline";
import { useEditorEngine } from "@/editor/lib/engine";

import type { UseTimelineZoom } from "./use-timeline-zoom";

type Options = {
  zoom: UseTimelineZoom;
  durationMs: number;
  seek: (ms: number) => void;
  startAutoScroll: (onTick: (clientX: number) => void) => void;
  stopAutoScroll: () => void;
  pointerXRef: React.RefObject<number>;
  scrubbingRef: React.RefObject<boolean>;
};

/**
 * Playhead scrubbing (drag on the ruler or track to seek) plus the duration
 * handle (drag the right edge to change the total timeline length).
 */
export function useTimelineScrub({
  zoom,
  durationMs,
  seek,
  startAutoScroll,
  stopAutoScroll,
  pointerXRef,
  scrubbingRef,
}: Options) {
  const { trackRef, msFromClientX, pxPerSecond } = zoom;
  const setAnimationDuration = useEditorEngine(
    (s: any) => s.setAnimationDuration,
  );

  const pxPerSecondRef = React.useRef(pxPerSecond);
  React.useEffect(() => {
    pxPerSecondRef.current = pxPerSecond;
  }, [pxPerSecond]);

  const rawMsFromClientX = React.useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return ((clientX - rect.left) / pxPerSecondRef.current) * 1000;
    },
    [trackRef],
  );

  // --- scrub (playhead seek) ----------------------------------------------
  const applyScrub = React.useCallback(
    (clientX: number) => seek(msFromClientX(clientX, durationMs)),
    [seek, msFromClientX, durationMs],
  );

  const onScrubDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      scrubbingRef.current = true;
      pointerXRef.current = e.clientX;
      seek(msFromClientX(e.clientX, durationMs));
      startAutoScroll(applyScrub);
    },
    [
      applyScrub,
      msFromClientX,
      durationMs,
      seek,
      startAutoScroll,
      pointerXRef,
      scrubbingRef,
    ],
  );

  const onScrubMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!scrubbingRef.current) return;
      pointerXRef.current = e.clientX;
      seek(msFromClientX(e.clientX, durationMs));
    },
    [msFromClientX, durationMs, seek, pointerXRef, scrubbingRef],
  );

  const onScrubUp = React.useCallback(
    (e: React.PointerEvent) => {
      if (!scrubbingRef.current) return;
      scrubbingRef.current = false;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      stopAutoScroll();
    },
    [stopAutoScroll, scrubbingRef],
  );

  // --- duration handle -----------------------------------------------------
  const durationDraggingRef = React.useRef(false);
  const [isDurationDragging, setIsDurationDragging] = React.useState(false);

  const applyDurationDrag = React.useCallback(
    (clientX: number) => {
      const snapped = Math.round(rawMsFromClientX(clientX) / 100) * 100;
      const next = Math.max(
        MIN_DURATION_MS,
        Math.min(MAX_DURATION_MS, snapped),
      );
      setAnimationDuration(next);
    },
    [rawMsFromClientX, setAnimationDuration],
  );

  const onDurationHandleDown = React.useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      durationDraggingRef.current = true;
      setIsDurationDragging(true);
      pointerXRef.current = e.clientX;
      startAutoScroll(applyDurationDrag);
    },
    [applyDurationDrag, startAutoScroll, pointerXRef],
  );

  const onDurationHandleMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!durationDraggingRef.current) return;
      pointerXRef.current = e.clientX;
      applyDurationDrag(e.clientX);
    },
    [applyDurationDrag, pointerXRef],
  );

  const onDurationHandleUp = React.useCallback(
    (e: React.PointerEvent) => {
      if (!durationDraggingRef.current) return;
      durationDraggingRef.current = false;
      setIsDurationDragging(false);
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      stopAutoScroll();
    },
    [stopAutoScroll],
  );

  return {
    isDurationDragging,
    onScrubDown,
    onScrubMove,
    onScrubUp,
    onDurationHandleDown,
    onDurationHandleMove,
    onDurationHandleUp,
  };
}
