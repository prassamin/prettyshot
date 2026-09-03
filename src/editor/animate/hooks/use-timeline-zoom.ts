"use client";

import * as React from "react";

import {
  MAX_PX_PER_SECOND,
  MIN_PX_PER_SECOND,
  PX_PER_SECOND,
} from "@/editor/lib/animation/timeline";

/**
 * Timeline zoom (px per second) + scroll anchoring.
 *
 * Zoom responds to the window-level wheel listener (ctrl/cmd + wheel, which
 * covers trackpad pinch) and to two-finger touch pinch — both anchored at the
 * pointer so the time under the cursor stays in place.
 */
export function useTimelineZoom() {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const trackRef = React.useRef<HTMLDivElement | null>(null);

  const [pxPerSecond, setPxPerSecond] = React.useState(PX_PER_SECOND);
  const pxPerSecondRef = React.useRef(pxPerSecond);
  React.useEffect(() => {
    pxPerSecondRef.current = pxPerSecond;
  }, [pxPerSecond]);

  const pendingScrollRef = React.useRef<number | null>(null);

  const [clipsAnimated, setClipsAnimated] = React.useState(true);
  const zoomIdleRef = React.useRef<number | null>(null);
  const zoomByRef = React.useRef<
    ((factor: number, anchorClientX: number) => void) | null
  >(null);

  const pxFor = React.useCallback(
    (ms: number) => (ms / 1000) * pxPerSecond,
    [pxPerSecond],
  );

  /** clientX → ms relative to the track element's left edge. */
  const msFromClientX = React.useCallback(
    (clientX: number, clampTo: number) => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const raw = ((clientX - rect.left) / pxPerSecondRef.current) * 1000;
      return Math.max(0, Math.min(clampTo, raw));
    },
    [],
  );

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const zoomBy = (factor: number, anchorClientX: number) => {
      setClipsAnimated(false);
      if (zoomIdleRef.current) window.clearTimeout(zoomIdleRef.current);
      zoomIdleRef.current = window.setTimeout(
        () => setClipsAnimated(true),
        140,
      );
      const rect = el.getBoundingClientRect();
      const pointerOffset = anchorClientX - rect.left;
      setPxPerSecond((prev: any) => {
        const next = Math.max(
          MIN_PX_PER_SECOND,
          Math.min(MAX_PX_PER_SECOND, prev * factor),
        );
        if (next === prev) return prev;
        const timeAtCursor = (el.scrollLeft + pointerOffset) / prev;
        pendingScrollRef.current = timeAtCursor * next - pointerOffset;
        return next;
      });
    };
    zoomByRef.current = zoomBy;

    // Window-level capture wheel listener — fires before the browser's default
    // ctrl+wheel/pinch (page zoom) and before React's passive wheel handling,
    // and can preventDefault reliably. Only acts when the wheel target is
    // inside this timeline scroller.
    const onWindowWheel = (e: WheelEvent) => {
      if (!el.contains(e.target as Node)) return;
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomByRef.current?.(Math.exp(-e.deltaY * 0.0018), e.clientX);
      } else if (e.shiftKey) {
        // Shift + Wheel = horizontal scroll along time axis
        el.scrollLeft += e.deltaY || e.deltaX;
        e.preventDefault();
      }
    };
    window.addEventListener("wheel", onWindowWheel, {
      passive: false,
      capture: true,
    });

    // Touch pinch zoom (mobile): two-finger distance ratio drives the zoom,
    // anchored at the pinch midpoint.
    let pinch: { dist: number; anchorX: number } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const a = e.touches[0];
        const b = e.touches[1];
        pinch = {
          dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
          anchorX: (a.clientX + b.clientX) / 2,
        };
      } else if (e.touches.length !== 2) {
        pinch = null;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      const a = e.touches[0];
      const b = e.touches[1];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (pinch.dist > 0) {
        e.preventDefault();
        zoomBy(dist / pinch.dist, pinch.anchorX);
        pinch.dist = dist;
        pinch.anchorX = (a.clientX + b.clientX) / 2;
      }
    };
    const onTouchEnd = () => {
      pinch = null;
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("wheel", onWindowWheel, {
        capture: true,
      } as EventListenerOptions);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      if (zoomIdleRef.current) window.clearTimeout(zoomIdleRef.current);
    };
  }, []);

  // Restore scroll after a zoom so the time under the cursor stays anchored.
  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || pendingScrollRef.current === null) return;
    el.scrollLeft = Math.max(0, pendingScrollRef.current);
    pendingScrollRef.current = null;
  }, [pxPerSecond]);

  return {
    scrollRef,
    trackRef,
    pxPerSecond,
    pxFor,
    msFromClientX,
    clipsAnimated,
  };
}

export type UseTimelineZoom = ReturnType<typeof useTimelineZoom>;
