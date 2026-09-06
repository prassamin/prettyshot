"use client";

import * as React from "react";

import { toast } from "@heroui/react";

import { MAX_DURATION_MS, MIN_CLIP_MS } from "@/editor/lib/animation/timeline";
import { clipSharesLayer } from "@/editor/lib/animation/playback";
import type { AnimationClip } from "@/editor/lib/animation/types";
import { useEditorEngine } from "@/editor/lib/engine";

import type { ClipDragMode } from "../types";
import { useTimelineDrop } from "./use-timeline-drop";
import { useTimelineScrub } from "./use-timeline-scrub";
import type { UseTimelineSelection } from "./use-timeline-selection";
import type { UseTimelineZoom } from "./use-timeline-zoom";

type Options = {
  selection: UseTimelineSelection;
  zoom: UseTimelineZoom;
  clips: AnimationClip[];
  durationMs: number;
  razorModeRef: React.RefObject<boolean>;
  seek: (ms: number) => void;
};

/**
 * Clip drag/trim gestures, playhead scrubbing, and the duration handle.
 * Drop preview, range selection, and row clicks live in useTimelineDrop.
 */
export function useTimelineInteractions({
  selection,
  zoom,
  clips,
  durationMs,
  razorModeRef,
  seek,
}: Options) {
  const { scrollRef, trackRef, pxPerSecond } = zoom;

  const updateAnimationClip = useEditorEngine(
    (s: any) => s.updateAnimationClip,
  );
  const updateAnimationClips = useEditorEngine(
    (s: any) => s.updateAnimationClips,
  );
  const moveAnimationClip = useEditorEngine((s: any) => s.moveAnimationClip);
  const splitAnimationClip = useEditorEngine((s: any) => s.splitAnimationClip);
  const selectAnimationClip = selection.selectClip;

  const pxPerSecondRef = React.useRef(pxPerSecond);
  React.useEffect(() => {
    pxPerSecondRef.current = pxPerSecond;
  }, [pxPerSecond]);

  const clipsRef = React.useRef(clips);
  React.useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);

  const selectedClipId = selection.selectedClipId;
  const selectedClipIds = selection.selectedClipIds;
  const selectedIdsRef = React.useRef(selectedClipIds);
  React.useEffect(() => {
    selectedIdsRef.current = selectedClipIds;
  }, [selectedClipIds]);

  // --- shared pointer state ------------------------------------------------
  const pointerXRef = React.useRef(0);
  const dragActiveRef = React.useRef(false);
  const scrubbingRef = React.useRef(false);
  const autoScrollRef = React.useRef<{
    raf: number | null;
    onTick: ((clientX: number) => void) | null;
  }>({ raf: null, onTick: null });

  const startAutoScroll = React.useCallback(
    (onTick: (clientX: number) => void) => {
      const state = autoScrollRef.current;
      const el = scrollRef.current;
      if (!el) return;
      state.onTick = onTick;
      const step = () => {
        const x = pointerXRef.current;
        const rect = el.getBoundingClientRect();
        let dx = 0;
        const EDGE = 48;
        if (x > rect.right - EDGE) dx = Math.min(24, x - (rect.right - EDGE));
        else if (x < rect.left + EDGE) dx = -Math.min(24, rect.left + EDGE - x);
        if (dx !== 0) {
          el.scrollLeft += dx;
          onTick(x);
        }
        state.raf = requestAnimationFrame(step);
      };
      state.raf = requestAnimationFrame(step);
    },
    [scrollRef],
  );

  const stopAutoScroll = React.useCallback(() => {
    const state = autoScrollRef.current;
    if (state.raf !== null) cancelAnimationFrame(state.raf);
    state.raf = null;
    state.onTick = null;
  }, []);

  // --- clip drag / trim ----------------------------------------------------
  const dragRef = React.useRef<{
    id: string;
    mode: ClipDragMode;
    grabOffsetMs: number;
    startMs: number;
    durationMs: number;
    initialClips: Array<{
      id: string;
      startMs: number;
      durationMs: number;
      target?: any;
    }>;
    wasSelected: boolean;
    downX: number;
    moved: boolean;
  } | null>(null);

  const [draggingClipId, setDraggingClipId] = React.useState<string | null>(
    null,
  );
  const [interactingClipId, setInteractingClipId] = React.useState<
    string | null
  >(null);

  const rawMsFromClientX = React.useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return ((clientX - rect.left) / pxPerSecondRef.current) * 1000;
    },
    [trackRef],
  );

  const clipMsFromClientX = React.useCallback(
    (clientX: number) =>
      Math.max(0, Math.min(MAX_DURATION_MS, rawMsFromClientX(clientX))),
    [rawMsFromClientX],
  );

  const applyClipDrag = React.useCallback(
    (clientX: number) => {
      const drag = dragRef.current;
      if (!drag) return;
      const initialClips = drag.initialClips ?? clipsRef.current;
      const currentInitial = initialClips.find((c: any) => c.id === drag.id);
      const currentTarget = currentInitial?.target;
      const pointerMs = clipMsFromClientX(clientX);

      if (drag.mode === "move") {
        const nextStart = Math.max(
          0,
          Math.min(
            MAX_DURATION_MS - drag.durationMs,
            pointerMs - drag.grabOffsetMs,
          ),
        );
        updateAnimationClip(drag.id, { startMs: nextStart });
      } else if (drag.mode === "trim-start") {
        const initialEnd =
          (currentInitial?.startMs ?? drag.startMs) +
          (currentInitial?.durationMs ?? drag.durationMs);
        const others = initialClips
          .filter(
            (c: any) =>
              c.id !== drag.id && clipSharesLayer(c.target, currentTarget),
          )
          .sort((a: any, b: any) => a.startMs - b.startMs);
        const prevEnd = others
          .filter((o: any) => o.startMs + o.durationMs <= initialEnd)
          .reduce(
            (max: any, o: any) => Math.max(max, o.startMs + o.durationMs),
            0,
          );
        const nextStart = Math.max(
          prevEnd,
          Math.min(initialEnd - MIN_CLIP_MS, pointerMs),
        );
        updateAnimationClip(drag.id, {
          startMs: nextStart,
          durationMs: initialEnd - nextStart,
        });
      } else {
        // trim-end (resize right handle) — push subsequent clips to the right
        const initialStart = currentInitial?.startMs ?? drag.startMs;
        const desiredDuration = Math.max(MIN_CLIP_MS, pointerMs - initialStart);
        let currentEnd = initialStart + desiredDuration;

        const subsequentClips = initialClips
          .filter(
            (c: any) =>
              c.id !== drag.id &&
              clipSharesLayer(c.target, currentTarget) &&
              c.startMs >= initialStart,
          )
          .sort((a: any, b: any) => a.startMs - b.startMs);

        const patches: { id: string; patch: Partial<any> }[] = [
          { id: drag.id, patch: { durationMs: desiredDuration } },
        ];

        for (const sub of subsequentClips) {
          const newStart = Math.max(sub.startMs, currentEnd);
          patches.push({ id: sub.id, patch: { startMs: newStart } });
          currentEnd = newStart + sub.durationMs;
        }

        updateAnimationClips(patches);
      }
    },
    [clipMsFromClientX, updateAnimationClip, updateAnimationClips],
  );

  const onClipPointerDown = React.useCallback(
    (e: React.PointerEvent, clip: AnimationClip, mode: ClipDragMode) => {
      if (e.button !== 0) {
        if (!selectedIdsRef.current.includes(clip.id))
          selectAnimationClip(clip.id);
        return;
      }
      e.stopPropagation();

      if (razorModeRef.current) {
        const newId = splitAnimationClip(clip.id, clipMsFromClientX(e.clientX));
        if (newId) selectAnimationClip(newId);
        else toast.danger("Clip is too short to cut");
        return;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      const wasSelected = selectedClipId === clip.id;
      selectAnimationClip(clip.id);
      dragRef.current = {
        id: clip.id,
        mode,
        grabOffsetMs: clipMsFromClientX(e.clientX) - clip.startMs,
        startMs: clip.startMs,
        durationMs: clip.durationMs,
        initialClips: clipsRef.current.map((c: any) => ({
          id: c.id,
          startMs: c.startMs,
          durationMs: c.durationMs,
          target: c.target,
        })),
        wasSelected,
        downX: e.clientX,
        moved: false,
      };
      dragActiveRef.current = true;
      setInteractingClipId(clip.id);
      if (mode === "move") setDraggingClipId(clip.id);
      pointerXRef.current = e.clientX;
      startAutoScroll(applyClipDrag);
    },
    [
      applyClipDrag,
      clipMsFromClientX,
      startAutoScroll,
      selectAnimationClip,
      selectedClipId,
      splitAnimationClip,
      razorModeRef,
    ],
  );

  const onClipPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      if (Math.abs(e.clientX - dragRef.current.downX) > 4)
        dragRef.current.moved = true;
      pointerXRef.current = e.clientX;
      applyClipDrag(e.clientX);
    },
    [applyClipDrag],
  );

  const onClipPointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      e.currentTarget.releasePointerCapture?.(e.pointerId);

      if (drag.mode === "move") {
        const dropped =
          clipsRef.current.find((c: any) => c.id === drag.id)?.startMs ??
          drag.startMs;
        moveAnimationClip(drag.id, dropped);
      }

      if (!drag.moved && drag.wasSelected) selectAnimationClip(null);
      dragRef.current = null;
      dragActiveRef.current = false;
      setDraggingClipId(null);
      setInteractingClipId(null);
      stopAutoScroll();
    },
    [moveAnimationClip, stopAutoScroll, selectAnimationClip],
  );

  // --- scrub + duration handle --------------------------------------------
  const scrub = useTimelineScrub({
    zoom,
    durationMs,
    seek,
    startAutoScroll,
    stopAutoScroll,
    pointerXRef,
    scrubbingRef,
  });

  // --- drop preview + range select + row clicks ---------------------------
  const drop = useTimelineDrop({
    selection,
    zoom,
    clips,
    durationMs,
    razorModeRef,
    startAutoScroll,
    stopAutoScroll,
    pointerXRef,
    dragActiveRef,
    scrubbingRef,
  });

  return {
    ...drop,
    ...scrub,
    draggingClipId,
    interactingClipId,
    updateAnimationClip,
    onClipPointerDown,
    onClipPointerMove,
    onClipPointerUp,
  };
}
