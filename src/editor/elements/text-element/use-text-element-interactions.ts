"use client";

/**
 * useTextElementInteractions — the brain behind every text element.
 *
 * Handles:
 * - Pointer drag → element move with center snap
 * - Rotation via the rotate handle (Shift toggles 15° steps, snaps to 90°)
 * - Resize via 8 corner/edge handles (font‑size based scaling)
 * - Two‑finger pinch → font size change (mobile/trackpad)
 * - Auto‑contrast color against the backdrop
 * - Delete key handler
 * - Custom event listeners for external selection/edit requests
 *
 * State is kept in refs during interaction and committed on pointer up,
 * so the editor doesn't re‑render on every pointer move.
 */

import * as React from "react";

import {
  resetElementPosition,
  previewHosts,
  applyElementPosition,
} from "@/editor/lib/preview-tokens";
import { useEditor } from "@/editor/lib/engine";
import { sampleContrastColor } from "@/editor/lib/color";
import { useFloatingToolbar } from "@/editor/hooks/use-floating-toolbar";
import { useDragSession } from "@/editor/hooks/use-drag-session";
import { SNAP_ENTER_DIST, SNAP_EXIT_DIST, MOVE_THRESHOLD } from "./constants";
import { getCanvasScale } from "./utils";
import { clamp } from "@/editor/lib/geometry";
import type {
  DragPayload,
  PinchSession,
  HandleAnchor,
  TextElement,
  ResizeSession,
  RotationState,
  TextElementViewProps,
} from "./types";

export function useTextElementInteractions({
  text,
  canvasRef,
  onCenterGuideChange,
}: Pick<TextElementViewProps, "text" | "canvasRef" | "onCenterGuideChange">) {
  const {
    id: canvasScopeId,
    canvasZoom,
    selectedTextId,
    setSelectedTextId,
    setSelectedAnnotationShapeId,
    updateText,
    screenshot,
    background,
  } = useEditor();
  const isSelected = selectedTextId === text.id;
  const [editingRequested, setEditingRequested] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isRotateSnapped, setIsRotateSnapped] = React.useState(false);
  const isEditing = isSelected && editingRequested;
  const elRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const textViewRef = React.useRef<HTMLDivElement>(null);
  const {
    toolbarRect,
    toolbarHidden,
    animateEntry,
    refreshRect,
    setToolbarRect,
  } = useFloatingToolbar({
    elRef,
    isSelected,
    kind: "text",
    elementId: text.id,
    enableAnimation: true,
  });
  const dragRef = React.useRef<DragPayload | null>(null);
  const dragSession = useDragSession();
  const rotateRef = React.useRef<RotationState | null>(null);
  const resizeRef = React.useRef<ResizeSession | null>(null);
  const pinchRef = React.useRef<PinchSession | null>(null);
  const activeTouches = React.useRef(
    new Map<number, { x: number; y: number }>(),
  );

  // Keep refs current without re-rendering the hook consumers
  const textRef = React.useRef(text);
  const canvasZoomRef = React.useRef(canvasZoom);
  const onCenterGuideChangeRef = React.useRef(onCenterGuideChange);
  const canvasScopeIdRef = React.useRef(canvasScopeId);
  React.useEffect(() => {
    textRef.current = text;
    canvasZoomRef.current = canvasZoom;
    onCenterGuideChangeRef.current = onCenterGuideChange;
    canvasScopeIdRef.current = canvasScopeId;
  });

  /** Current canvas scale factor (zoom × CSS fit). */
  const currentScale = React.useCallback(() => {
    const fitScale = getCanvasScale(
      canvasRef.current,
      canvasZoomRef.current / 100,
    );
    return Math.max(0.05, fitScale);
  }, [canvasRef]);

  // ── Edit mode ─────────────────────────────────────────────────────────
  // When the user starts editing, populate the contentEditable div with the
  // current text and select all.

  React.useEffect(() => {
    if (!isEditing) return;
    const node = editorRef.current;
    if (!node) return;
    node.innerText = text.content;
    node.focus();
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [isEditing, text.content, text.widthPx]);

  // ── Custom events from the toolbar / keyboard shortcuts ───────────────

  React.useEffect(() => {
    const selectText = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id !== text.id) return;
      setEditingRequested(false);
    };
    const editText = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: string }>).detail;
      if (detail?.id !== text.id) return;
      setSelectedTextId(text.id);
      setSelectedAnnotationShapeId(null);
      setEditingRequested(true);
    };

    window.addEventListener("ui:select-text-element", selectText);
    window.addEventListener("ui:edit-text-element", editText);
    return () => {
      window.removeEventListener("ui:select-text-element", selectText);
      window.removeEventListener("ui:edit-text-element", editText);
    };
  }, [setSelectedAnnotationShapeId, setSelectedTextId, text.id]);

  // ── Auto‑contrast color ──────────────────────────────────────────────
  // When the background changes, re-sample and pick a contrasting fg color.

  React.useEffect(() => {
    if (!text.autoColor) return;
    const canvas = canvasRef.current;
    const timer = setTimeout(() => {
      sampleContrastColor(canvas, text.xPct, text.yPct, screenshot, background)
        .then((color) => {
          if (color !== text.color) {
            updateText(text.id, { color, autoColor: true });
          }
        })
        .catch(() => {});
    }, 50);
    return () => clearTimeout(timer);
  }, [background, screenshot]);

  // ── Re-measure toolbar rect on any layout-affecting change ───────────

  React.useEffect(() => {
    if (false || !isSelected) return;
    refreshRect();
  }, [
    isSelected,
    refreshRect,
    text.xPct,
    text.yPct,
    text.rotation,
    text.fontSize,
    text.lineHeight,
    text.letterSpacing,
    text.content,
    text.widthPx,
    text.heightPx,
  ]);

  // ── Selection callbacks ──────────────────────────────────────────────

  const selectTextElement = React.useCallback(() => {
    setEditingRequested(false);
    setSelectedTextId(text.id);
    setSelectedAnnotationShapeId(null);
  }, [setSelectedAnnotationShapeId, setSelectedTextId, text.id]);

  const editTextElement = React.useCallback(() => {
    setSelectedTextId(text.id);
    setSelectedAnnotationShapeId(null);
    setEditingRequested(true);
  }, [setSelectedAnnotationShapeId, setSelectedTextId, text.id]);

  // ── Pointer drag (move element) ──────────────────────────────────────
  const startDrag = React.useCallback(
    (e: React.PointerEvent<Element>) => {
      const t = textRef.current;
      if (e.button !== 0) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.stopPropagation();
      e.preventDefault();

      activeTouches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      e.currentTarget.setPointerCapture?.(e.pointerId);

      // Two pointers = pinch → cancel any pending drag and start resize
      if (activeTouches.current.size >= 2) {
        if (dragRef.current) {
          dragRef.current = null;
          setIsDragging(false);
          onCenterGuideChangeRef.current?.({ x: false, y: false });
        }
        const ptrs = [...activeTouches.current.entries()];
        const [id1, p1] = ptrs[0];
        const [id2, p2] = ptrs[1];
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        pinchRef.current = {
          pointer1Id: id1,
          pointer2Id: id2,
          startDistance: Math.max(dist, 1),
          startFontSize: t.fontSize,
        };
        return;
      }

      setSelectedTextId(t.id);
      setSelectedAnnotationShapeId(null);
      setEditingRequested(false);
      const rect = canvas.getBoundingClientRect();
      dragRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startXPct: t.xPct,
        startYPct: t.yPct,
        canvasW: rect.width,
        canvasH: rect.height,
        moved: false,
        snapXActive: false,
        snapYActive: false,
        lastXPct: t.xPct,
        lastYPct: t.yPct,
      };
      dragSession.next();
    },
    [canvasRef, dragSession, setSelectedAnnotationShapeId, setSelectedTextId],
  );

  const moveDrag = React.useCallback(
    (e: React.PointerEvent<Element>) => {
      // Track pointer positions for pinch
      if (activeTouches.current.has(e.pointerId)) {
        activeTouches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // ── Pinch handling ──────────────────────────────────────────────
      const pinch = pinchRef.current;
      if (
        pinch &&
        (e.pointerId === pinch.pointer1Id || e.pointerId === pinch.pointer2Id)
      ) {
        e.preventDefault();
        const p1 = activeTouches.current.get(pinch.pointer1Id);
        const p2 = activeTouches.current.get(pinch.pointer2Id);
        if (p1 && p2) {
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          const scaleFactor = dist / pinch.startDistance;
          const newFontSize = clamp(
            Math.round(pinch.startFontSize * scaleFactor),
            8,
            200,
          );
          const textView = textViewRef.current;
          if (textView) textView.style.fontSize = `${newFontSize}px`;
        }
        return;
      }

      // ── Drag handling ───────────────────────────────────────────────
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      e.preventDefault();
      const pointerScale = canvasZoomRef.current / 100;
      const rawDx = e.clientX - drag.startClientX;
      const rawDy = e.clientY - drag.startClientY;
      if (!drag.moved && Math.hypot(rawDx, rawDy) < MOVE_THRESHOLD) return;
      if (!drag.moved) {
        drag.moved = true;
        setIsDragging(true);
      }

      const dx = rawDx / pointerScale;
      const dy = rawDy / pointerScale;
      let nextX = drag.startXPct + (dx / drag.canvasW) * 100;
      let nextY = drag.startYPct + (dy / drag.canvasH) * 100;

      // Center‑snap with hysteresis
      const snapEnterXPct =
        (SNAP_ENTER_DIST / pointerScale / drag.canvasW) * 100;
      const snapEnterYPct =
        (SNAP_ENTER_DIST / pointerScale / drag.canvasH) * 100;
      const snapExitXPct = (SNAP_EXIT_DIST / pointerScale / drag.canvasW) * 100;
      const snapExitYPct = (SNAP_EXIT_DIST / pointerScale / drag.canvasH) * 100;

      const xDistance = Math.abs(nextX - 50);
      const yDistance = Math.abs(nextY - 50);

      const shouldSnapX = drag.snapXActive
        ? xDistance <= snapExitXPct
        : xDistance <= snapEnterXPct;
      const shouldSnapY = drag.snapYActive
        ? yDistance <= snapExitYPct
        : yDistance <= snapEnterYPct;

      drag.snapXActive = shouldSnapX;
      drag.snapYActive = shouldSnapY;

      if (shouldSnapX) nextX = 50;
      if (shouldSnapY) nextY = 50;
      onCenterGuideChangeRef.current?.({ x: shouldSnapX, y: shouldSnapY });

      const clampedX = clamp(nextX, -20, 120);
      const clampedY = clamp(nextY, -20, 120);
      drag.lastXPct = clampedX;
      drag.lastYPct = clampedY;

      applyElementPosition(
        previewHosts(canvasScopeIdRef.current),
        textRef.current.id,
        clampedX,
        clampedY,
      );

      const el = elRef.current;
      if (el) setToolbarRect(el.getBoundingClientRect());
    },
    [setToolbarRect],
  );

  const endDrag = React.useCallback(
    (e: React.PointerEvent<Element>) => {
      activeTouches.current.delete(e.pointerId);

      // ── End pinch ───────────────────────────────────────────────────
      const pinch = pinchRef.current;
      if (
        pinch &&
        (e.pointerId === pinch.pointer1Id || e.pointerId === pinch.pointer2Id)
      ) {
        const textView = textViewRef.current;
        if (textView) {
          const liveFontSize = Number.parseFloat(textView.style.fontSize);
          if (
            Number.isFinite(liveFontSize) &&
            liveFontSize !== textRef.current.fontSize
          ) {
            updateText(textRef.current.id, { fontSize: liveFontSize });
          }
        }
        pinchRef.current = null;
        return;
      }

      // ── End drag ────────────────────────────────────────────────────
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      if (drag.moved) {
        const el = elRef.current;
        if (el) {
          const x = drag.lastXPct;
          const y = drag.lastYPct;
          const t = textRef.current;
          updateText(t.id, {
            xPct: clamp(x, -20, 120),
            yPct: clamp(y, -20, 120),
          });
          if (t.autoColor !== false) {
            const canvas = canvasRef.current;
            sampleContrastColor(
              canvas,
              clamp(x, -20, 120),
              clamp(y, -20, 120),
              screenshot,
              background,
            )
              .then((color) => updateText(t.id, { color, autoColor: true }))
              .catch(() => {});
          }
        }
      }
      dragRef.current = null;

      const textId = textRef.current.id;
      const roots = previewHosts(canvasScopeIdRef.current);
      const token = dragSession.value();
      const clearIfCurrent = () => {
        if (!dragSession.matches(token)) return;
        resetElementPosition(roots, textId);
      };
      if (typeof requestAnimationFrame === "undefined") {
        clearIfCurrent();
      } else {
        requestAnimationFrame(clearIfCurrent);
      }

      setIsDragging(false);
      onCenterGuideChangeRef.current?.({ x: false, y: false });
    },
    [updateText, screenshot, background, canvasRef, dragSession],
  );

  // ── Rotation ─────────────────────────────────────────────────────────

  const startRotate = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const el = elRef.current;
      if (!el) return;
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      rotateRef.current = {
        pointerId: e.pointerId,
        centerX: cx,
        centerY: cy,
        startAngle: Math.atan2(e.clientY - cy, e.clientX - cx),
        startRotation: textRef.current.rotation,
      };
    },
    [],
  );

  const moveRotate = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const rot = rotateRef.current;
      if (!rot || rot.pointerId !== e.pointerId) return;
      const angle = Math.atan2(
        e.clientY - rot.centerY,
        e.clientX - rot.centerX,
      );
      const delta = ((angle - rot.startAngle) * 180) / Math.PI;
      let next = rot.startRotation + delta;

      next = ((next % 360) + 360) % 360;
      let snapped = false;

      if (e.shiftKey) {
        // Shift = snap to 15° increments
        next = Math.round(next / 15) * 15;
        if (next % 90 === 0) snapped = true;
      } else {
        // Free rotation with snap‑to‑90° within 4° threshold
        const nearest90 = Math.round(next / 90) * 90;
        if (
          Math.abs(next - nearest90) < 4 ||
          Math.abs(next - nearest90 + 360) < 4
        ) {
          next = nearest90 % 360;
          snapped = true;
        }
      }

      setIsRotateSnapped(snapped);
      updateText(textRef.current.id, { rotation: next });
    },
    [updateText],
  );

  const endRotate = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const rot = rotateRef.current;
      if (!rot || rot.pointerId !== e.pointerId) return;
      rotateRef.current = null;
      setIsRotateSnapped(false);
    },
    [],
  );

  // ── Resize ───────────────────────────────────────────────────────────

  const startResize = React.useCallback(
    (handle: HandleAnchor) => (e: React.PointerEvent<HTMLButtonElement>) => {
      const elNode = elRef.current;
      const canvasNode = canvasRef.current;
      if (!canvasNode || !elNode) return;
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const canvasRect = canvasNode.getBoundingClientRect();
      const scale = currentScale();
      const t = textRef.current;
      const elRect = elNode.getBoundingClientRect();
      resizeRef.current = {
        pointerId: e.pointerId,
        handle,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startXPct: t.xPct,
        startYPct: t.yPct,
        startWidthPct: (elRect.width / canvasRect.width) * 100,
        startHeightPct: (elRect.height / canvasRect.height) * 100,
        startWidthPx: elRect.width / scale,
        startHeightPx: elRect.height / scale,
        startFontSize: t.fontSize,
        storeWidthPx: t.widthPx,
        storeHeightPx: t.heightPx,
        canvasW: canvasRect.width / scale,
        canvasH: canvasRect.height / scale,
        elW: elRect.width / scale,
        elH: elRect.height / scale,
        lastPatch: null,
      };
    },
    [canvasRef, currentScale],
  );

  const moveResize = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const rs = resizeRef.current;
      if (!rs || rs.pointerId !== e.pointerId) return;
      const el = elRef.current;
      if (!el) return;
      const scale = currentScale();
      const dx = (e.clientX - rs.startClientX) / scale;
      const dy = (e.clientY - rs.startClientY) / scale;

      const isCorner =
        rs.handle === "tl" ||
        rs.handle === "tr" ||
        rs.handle === "bl" ||
        rs.handle === "br";

      if (isCorner) {
        // ── Corner resize: scale font size proportionally ─────────────
        let scaleFactor: number;
        switch (rs.handle) {
          case "tl": {
            const sw = (rs.elW - dx) / rs.elW;
            const sh = (rs.elH - dy) / rs.elH;
            scaleFactor = Math.max(0.2, Math.max(sw, sh));
            break;
          }
          case "tr": {
            const sw = (rs.elW + dx) / rs.elW;
            const sh = (rs.elH - dy) / rs.elH;
            scaleFactor = Math.max(0.2, Math.max(sw, sh));
            break;
          }
          case "bl": {
            const sw = (rs.elW - dx) / rs.elW;
            const sh = (rs.elH + dy) / rs.elH;
            scaleFactor = Math.max(0.2, Math.max(sw, sh));
            break;
          }
          case "br":
          default: {
            const sw = (rs.elW + dx) / rs.elW;
            const sh = (rs.elH + dy) / rs.elH;
            scaleFactor = Math.max(0.2, Math.max(sw, sh));
            break;
          }
        }

        const newFontSize = clamp(
          Math.round(rs.startFontSize * scaleFactor),
          8,
          200,
        );
        const actualScale = newFontSize / rs.startFontSize;
        const newW = rs.elW * actualScale;
        const newH = rs.elH * actualScale;

        // Shift position so the opposite corner stays in place
        let xShiftPx = 0;
        let yShiftPx = 0;
        if (rs.handle === "tl" || rs.handle === "bl") {
          xShiftPx = (newW - rs.elW) / 2;
        } else {
          xShiftPx = -(newW - rs.elW) / 2;
        }
        if (rs.handle === "tl" || rs.handle === "tr") {
          yShiftPx = (newH - rs.elH) / 2;
        } else {
          yShiftPx = -(newH - rs.elH) / 2;
        }

        const xPct = clamp(
          rs.startXPct - (xShiftPx / rs.canvasW) * 100,
          -20,
          120,
        );
        const yPct = clamp(
          rs.startYPct - (yShiftPx / rs.canvasH) * 100,
          -20,
          120,
        );

        const patch: Partial<TextElement> = {
          fontSize: newFontSize,
          xPct,
          yPct,
        };
        if (rs.storeWidthPx != null)
          patch.widthPx = Math.max(
            20,
            Math.round(rs.storeWidthPx * actualScale),
          );
        if (rs.storeHeightPx != null)
          patch.heightPx = Math.max(
            16,
            Math.round(rs.storeHeightPx * actualScale),
          );
        rs.lastPatch = patch;

        // Apply live to DOM for immediate feedback
        el.style.left = `${xPct}%`;
        el.style.top = `${yPct}%`;
        const textView = textViewRef.current;
        if (textView) textView.style.fontSize = `${newFontSize}px`;
        if (patch.widthPx != null) el.style.width = `${patch.widthPx}px`;
        if (patch.heightPx != null) el.style.height = `${patch.heightPx}px`;
        setToolbarRect(el.getBoundingClientRect());
      } else {
        // ── Edge resize: only width or height changes ─────────────────
        let newW = rs.startWidthPx;
        let newH = rs.startHeightPx;
        let xShiftPx = 0;
        let yShiftPx = 0;

        switch (rs.handle) {
          case "ml":
            newW = Math.max(20, rs.startWidthPx - dx);
            xShiftPx = -(newW - rs.startWidthPx) / 2;
            break;
          case "mr":
            newW = Math.max(20, rs.startWidthPx + dx);
            xShiftPx = (newW - rs.startWidthPx) / 2;
            break;
          case "mt":
            newH = Math.max(16, rs.startHeightPx - dy);
            yShiftPx = -(newH - rs.startHeightPx) / 2;
            break;
          case "mb":
            newH = Math.max(16, rs.startHeightPx + dy);
            yShiftPx = (newH - rs.startHeightPx) / 2;
            break;
          default:
            return;
        }

        const xPct = clamp(
          rs.startXPct + (xShiftPx / rs.canvasW) * 100,
          -20,
          120,
        );
        const yPct = clamp(
          rs.startYPct + (yShiftPx / rs.canvasH) * 100,
          -20,
          120,
        );

        const patch: Partial<TextElement> = { xPct, yPct };
        if (rs.handle === "ml" || rs.handle === "mr")
          patch.widthPx = Math.round(newW);
        if (rs.handle === "mt" || rs.handle === "mb")
          patch.heightPx = Math.round(newH);
        rs.lastPatch = patch;

        el.style.left = `${xPct}%`;
        el.style.top = `${yPct}%`;
        if (patch.widthPx != null) el.style.width = `${patch.widthPx}px`;
        if (patch.heightPx != null) el.style.height = `${patch.heightPx}px`;
        setToolbarRect(el.getBoundingClientRect());
      }
    },
    [setToolbarRect, currentScale],
  );

  const endResize = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      const rs = resizeRef.current;
      if (!rs || rs.pointerId !== e.pointerId) return;
      if (rs.lastPatch) {
        updateText(textRef.current.id, rs.lastPatch);
      }
      resizeRef.current = null;
    },
    [updateText],
  );

  // ── Commit content ───────────────────────────────────────────────────

  const commitContent = React.useCallback(() => {
    const node = editorRef.current;
    if (!node) return;

    const next = node.innerText.replace(/(?<= )\u00A0|\u00A0(?= )/g, " ");
    updateText(text.id, { content: next || " " });
    setEditingRequested(false);
  }, [text.id, updateText]);

  return {
    commitContent,
    editTextElement,
    editorRef,
    elRef,
    endDrag,
    endResize,
    endRotate,
    toolbarHidden,
    isDragging,
    isEditing,
    isRotateSnapped,
    isSelected,
    moveDrag,
    moveResize,
    moveRotate,
    selectTextElement,
    animateEntry,
    startDrag,
    startResize,
    startRotate,
    textViewRef,
    toolbarRect,
  };
}
