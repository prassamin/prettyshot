"use client";

import * as React from "react";

import { ADD_SLOT_MS } from "@/editor/lib/animation/timeline";
import type { AnimationClip } from "@/editor/lib/animation/types";
import { useEditorEngine } from "@/editor/lib/engine";

import type { UseTimelineSelection } from "./use-timeline-selection";
import type { UseTimelineZoom } from "./use-timeline-zoom";

type Options = {
  selection: UseTimelineSelection;
  zoom: UseTimelineZoom;
  clips: AnimationClip[];
  durationMs: number;
  razorModeRef: React.RefObject<boolean>;
  startAutoScroll: (onTick: (clientX: number) => void) => void;
  stopAutoScroll: () => void;
  pointerXRef: React.RefObject<number>;
  dragActiveRef: React.RefObject<boolean>;
  scrubbingRef: React.RefObject<boolean>;
};

/**
 * Drop preview over the track rows, drag-range selection, and the
 * click-to-add keyframe handler.
 */
export function useTimelineDrop({
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
}: Options) {
  const { pxPerSecond, pxFor } = zoom;
  const addAnimationClip = useEditorEngine((s: any) => s.addAnimationClip);
  const selectLayerTarget = selection.selectLayer;
  const selectAnimationClip = selection.selectClip;

  const pxPerSecondRef = React.useRef(pxPerSecond);
  React.useEffect(() => {
    pxPerSecondRef.current = pxPerSecond;
  }, [pxPerSecond]);

  const clipsRef = React.useRef(clips);
  React.useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);

  const trackListRef = React.useRef<HTMLDivElement | null>(null);
  const dropPreviewRef = React.useRef<HTMLDivElement | null>(null);
  const dropPreviewStartMsRef = React.useRef(0);
  const [showDropPreview, setShowDropPreview] = React.useState(false);
  const [dropPreviewLayerId, setDropPreviewLayerId] = React.useState<
    string | null
  >(null);
  const dropPreviewWidthPx = pxFor(ADD_SLOT_MS);

  const dropPreviewRafRef = React.useRef<number | null>(null);
  const dropPreviewClientXRef = React.useRef(0);
  const dropPreviewHoveringRef = React.useRef(false);
  const dropPreviewLayerRef = React.useRef<string | null>(null);

  const rangeSelectRef = React.useRef<{
    startX: number;
    active: boolean;
  } | null>(null);
  const rangeSelectActiveRef = React.useRef(false);
  const suppressRowClickRef = React.useRef(false);
  const [rangeSelectRect, setRangeSelectRect] = React.useState<{
    left: number;
    width: number;
  } | null>(null);
  const [rangeSelectIds, setRangeSelectIds] = React.useState<string[]>([]);
  const rangeSelectIdsRef = React.useRef<string[]>([]);

  const applyRangeSelect = React.useCallback((clientX: number) => {
    const drag = rangeSelectRef.current;
    const el = trackListRef.current;
    if (!drag || !el) return;
    const rect = el.getBoundingClientRect();
    const pps = pxPerSecondRef.current;
    const curX = Math.max(0, clientX - rect.left);
    const left = Math.min(drag.startX, curX);
    const right = Math.max(drag.startX, curX);
    setRangeSelectRect({ left, width: right - left });
    const minMs = (left / pps) * 1000;
    const maxMs = (right / pps) * 1000;
    const ids = clipsRef.current
      .filter(
        (c: any) => c.startMs <= maxMs && c.startMs + c.durationMs >= minMs,
      )
      .map((c: any) => c.id);
    rangeSelectIdsRef.current = ids;
    setRangeSelectIds(ids);
  }, []);

  const writeDropPreview = React.useCallback(() => {
    dropPreviewRafRef.current = null;
    const el = trackListRef.current;
    const node = dropPreviewRef.current;
    if (!el) return;
    if (!node) {
      dropPreviewRafRef.current = requestAnimationFrame(writeDropPreview);
      return;
    }
    if (
      !dropPreviewHoveringRef.current ||
      dragActiveRef.current ||
      scrubbingRef.current ||
      rangeSelectActiveRef.current ||
      razorModeRef.current
    ) {
      setShowDropPreview(false);
      return;
    }
    const rect = el.getBoundingClientRect();
    const pps = pxPerSecondRef.current;
    if (rect.width - (ADD_SLOT_MS / 1000) * pps < 0) {
      setShowDropPreview(false);
      return;
    }
    const cursorMs = Math.max(
      0,
      Math.min(
        durationMs,
        ((dropPreviewClientXRef.current - rect.left) / pps) * 1000,
      ),
    );
    const layerId = dropPreviewLayerRef.current;
    const layerClips = layerId
      ? clipsRef.current.filter((c: any) => {
          const scope = c.target?.scope;
          if (layerId === "main") {
            return scope === "all" || scope === "main";
          }
          return scope === "slot" && c.target.slotId === layerId;
        })
      : [];
    if (
      layerClips.some(
        (c: any) =>
          cursorMs >= c.startMs && cursorMs <= c.startMs + c.durationMs,
      )
    ) {
      setShowDropPreview(false);
      return;
    }
    const start = Math.max(
      0,
      Math.min(
        Math.max(0, durationMs - ADD_SLOT_MS),
        cursorMs - ADD_SLOT_MS / 2,
      ),
    );
    dropPreviewStartMsRef.current = start;
    node.style.transform = `translate3d(${(start / 1000) * pps}px,0,0)`;
    setShowDropPreview(true);
  }, [durationMs, dragActiveRef, scrubbingRef, razorModeRef]);

  const scheduleDropPreview = React.useCallback(() => {
    if (dropPreviewRafRef.current == null) {
      dropPreviewRafRef.current = requestAnimationFrame(writeDropPreview);
    }
  }, [writeDropPreview]);

  const positionDropPreview = React.useCallback(
    (clientX: number) => {
      dropPreviewHoveringRef.current = true;
      dropPreviewClientXRef.current = clientX;
      scheduleDropPreview();
    },
    [scheduleDropPreview],
  );

  React.useEffect(() => {
    if (dropPreviewHoveringRef.current) scheduleDropPreview();
  }, [pxPerSecond, scheduleDropPreview]);

  React.useEffect(
    () => () => {
      if (dropPreviewRafRef.current != null)
        cancelAnimationFrame(dropPreviewRafRef.current);
    },
    [],
  );

  // --- row handlers --------------------------------------------------------
  const onTrackPointerDown = React.useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    if (e.button !== 0 || razorModeRef.current) return;
    const el = trackListRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    rangeSelectRef.current = {
      startX: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
      active: false,
    };
    el.setPointerCapture(e.pointerId);
    pointerXRef.current = e.clientX;
  }, []);

  const onTrackPointerMove = React.useCallback(
    (e: React.PointerEvent) => {
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const rowEl = hit?.closest?.("[data-layer-id]") ?? null;
      const layerId = rowEl?.getAttribute("data-layer-id") ?? null;
      if (layerId !== dropPreviewLayerRef.current) {
        dropPreviewLayerRef.current = layerId;
        setDropPreviewLayerId(layerId);
      }
      const drag = rangeSelectRef.current;
      if (drag) {
        if (!drag.active && Math.abs(e.clientX - pointerXRef.current) <= 4) {
          positionDropPreview(e.clientX);
          return;
        }
        if (!drag.active) {
          drag.active = true;
          rangeSelectActiveRef.current = true;
          dropPreviewHoveringRef.current = false;
          setShowDropPreview(false);
          startAutoScroll(applyRangeSelect);
        }
        pointerXRef.current = e.clientX;
        applyRangeSelect(e.clientX);
        return;
      }
      positionDropPreview(e.clientX);
    },
    [applyRangeSelect, positionDropPreview, startAutoScroll],
  );

  const onTrackPointerUp = React.useCallback(
    (e: React.PointerEvent) => {
      const drag = rangeSelectRef.current;
      if (!drag) return;
      rangeSelectRef.current = null;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      if (drag.active) {
        stopAutoScroll();
        rangeSelectActiveRef.current = false;
        suppressRowClickRef.current = true;
        selection.selectClips(rangeSelectIdsRef.current);
        setRangeSelectRect(null);
        setRangeSelectIds([]);
      }
    },
    [stopAutoScroll, selection],
  );

  const onTrackLeave = React.useCallback(() => {
    dropPreviewHoveringRef.current = false;
    dropPreviewLayerRef.current = null;
    setShowDropPreview(false);
    setDropPreviewLayerId(null);
  }, []);

  const onTrackClick = React.useCallback(
    (e: React.MouseEvent) => {
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const rowEl = hit?.closest?.("[data-layer-id]") ?? null;
      if (razorModeRef.current || dragActiveRef.current) return;
      if (suppressRowClickRef.current) {
        suppressRowClickRef.current = false;
        return;
      }
      const layerId = rowEl?.getAttribute("data-layer-id");
      if (!layerId) return;
      const el = trackListRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pps = pxPerSecondRef.current;
      if (rect.width - (ADD_SLOT_MS / 1000) * pps < 0) return;
      const cursorMs = Math.max(
        0,
        Math.min(durationMs, ((e.clientX - rect.left) / pps) * 1000),
      );
      const startMs = Math.max(
        0,
        Math.min(
          Math.max(0, durationMs - ADD_SLOT_MS),
          cursorMs - ADD_SLOT_MS / 2,
        ),
      );
      selectLayerTarget(layerId);
      selectAnimationClip(addAnimationClip(startMs));
    },
    [addAnimationClip, durationMs, selectAnimationClip, selectLayerTarget],
  );

  return {
    trackListRef,
    dropPreviewRef,
    dropPreviewWidthPx,
    showDropPreview,
    dropPreviewLayerId,
    rangeSelectRect,
    highlightedClipIds:
      selection.selectedClipIds.length === 0
        ? selection.selectedClipIds
        : rangeSelectIds.length
          ? Array.from(
              new Set([...selection.selectedClipIds, ...rangeSelectIds]),
            )
          : selection.selectedClipIds,
    onTrackPointerDown,
    onTrackPointerMove,
    onTrackPointerUp,
    onTrackLeave,
    onTrackClick,
  };
}
