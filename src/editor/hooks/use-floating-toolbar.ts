"use client";

/**
 * useElementToolbar — measures an element's rect for floating toolbar positioning.
 *
 * ── Why this exists ──
 * Each selected element needs a floating toolbar positioned next to it.
 * This hook:
 *   Watches the element via ResizeObserver + scroll/resize events
 *   Fires a setToolbarRect callback so the parent can portal the toolbar
 *   Handles "hide-toolbar" custom events (e.g. when an animation starts)
 *   Optionally animates position moves (smooth transition when toolbar
 *      follows the element to a new location)
 *
 * ── Custom event ──
 * Listens for `@editor/hide-element-toolbar` dispatched with detail
 * `{ kind, id?, durationMs? }`. The toolbar hides for `durationMs` then
 * reappears. If `enableAnimation` is true the position also animates.
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type Options = {
  /** The element whose rect the toolbar should track. */
  elRef: React.RefObject<HTMLElement | null>;
  isSelected: boolean;
  /** Identifies the element type (e.g. "text", "annotation-shape", "screenshot-tile"). */
  kind: string;
  /** Unique element ID — used to filter custom events so only the relevant toolbar hides. */
  elementId: string | null;
  /** When true the toolbar position animates smoothly after hiding. */
  enableAnimation?: boolean;
  /** Called on every rect measurement with the element ref. */
  onSizeChange?: (el: HTMLElement) => void;
};

type Result = {
  toolbarRect: DOMRect | null;
  toolbarHidden: boolean;
  animateEntry: boolean;
  refreshRect: () => void;
  setToolbarRect: React.Dispatch<React.SetStateAction<DOMRect | null>>;
};

export function useFloatingToolbar({
  elRef,
  isSelected,
  kind,
  elementId,
  enableAnimation = false,
  onSizeChange,
}: Options): Result {
  const [toolbarRect, setToolbarRect] = useState<DOMRect | null>(null);
  const [toolbarHidden, setToolbarHidden] = useState(false);
  const [animateEntry, setAnimateEntry] = useState(false);

  const onSizeChangeRef = useRef(onSizeChange);
  useLayoutEffect(() => {
    onSizeChangeRef.current = onSizeChange;
  });

  // Listen for hide-toolbar custom events
  useEffect(() => {
    const onHide = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          kind?: string;
          id?: string;
          durationMs?: number;
        }>
      ).detail;
      if (detail?.kind !== kind) return;
      if (elementId !== null && detail.id !== elementId) return;
      setToolbarHidden(true);
      const durationMs = detail.durationMs ?? 320;
      if (enableAnimation) {
        setAnimateEntry(true);
        window.setTimeout(() => setAnimateEntry(false), durationMs);
      }
      window.setTimeout(() => setToolbarHidden(false), durationMs);
    };
    window.addEventListener("@editor/hide-element-toolbar", onHide);
    return () =>
      window.removeEventListener("@editor/hide-element-toolbar", onHide);
  }, [elementId, kind, enableAnimation]);

  // Measure rect whenever the element resizes or the page scrolls/resizes.
  // The observer stays active even when unselected — clients use onSizeChange
  // for live geometry (e.g. arrow shapes), while the rect is only published
  // while selected.
  useEffect(() => {
    if (!elRef.current) return;
    const el = elRef.current;
    const update = () => {
      if (isSelected) setToolbarRect(el.getBoundingClientRect());
      onSizeChangeRef.current?.(el);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [isSelected]);

  // Re-measure once after toolbar reappears to account for layout shifts
  useEffect(() => {
    if (!isSelected || toolbarHidden || !elRef.current) return;
    const rafId = window.requestAnimationFrame(() => {
      if (!elRef.current) return;
      setToolbarRect(elRef.current.getBoundingClientRect());
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [toolbarHidden, isSelected, elementId]);

  const refreshRect = useCallback(() => {
    if (!elRef.current) return;
    setToolbarRect(elRef.current.getBoundingClientRect());
  }, [elRef]);

  return {
    toolbarRect,
    toolbarHidden,
    animateEntry,
    refreshRect,
    setToolbarRect,
  };
}
