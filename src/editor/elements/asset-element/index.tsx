/**
 * AssetElementView — an imported image placed on the canvas.
 *
 * ── Layout ──
 * Position is driven by CSS custom properties (see preview-tokens.ts) for
 * live drags; the store is only written on release. Width is percentage-based;
 * height can be auto (keeps intrinsic aspect) or explicit.
 *
 * ── Interactions ──
 * - Move: pointer drag (committed on release)
 * - Resize: shared SelectionChrome — corners keep aspect ratio, edges stretch
 *   a single axis
 *
 * ── Styling ──
 * Supports opacity and flip (scaleX/scaleY transforms). Filter & blend modes
 * are deferred — see roadmap_note.md.
 */
"use client";

import * as React from "react";
import { createPortal } from "react-dom";

import { ProgressiveImage } from "@/components/progressive-image";

import {
  applyElementPosition,
  elementPositionTokens,
  previewHosts,
  resetElementPosition,
} from "@/editor/lib/preview-tokens";
import { useFloatingToolbar } from "@/editor/hooks/use-floating-toolbar";
import { computeToolbarOffset } from "@/editor/toolbar/controls";
import { useDragSession } from "@/editor/hooks/use-drag-session";
import { SelectionChrome } from "@/editor/elements/shared/selection-chrome";
import { useEditor } from "@/editor/lib/engine";
import { cn } from "@/lib/utils";

import { AssetToolbar } from "./toolbar";
import type {
  AssetElementViewProps,
  AssetResizePatch,
  MoveSession,
  ResizeHandleId,
  ResizeSession,
} from "./types";

export function AssetElementView({
  asset,
  canvasRef,
  previewMode,
}: AssetElementViewProps) {
  const {
    id: canvasScopeId,
    selectedAssetId,
    setSelectedAssetId,
    setSelectedTextId,
    setSelectedAnnotationShapeId,
    updateAsset,
  } = useEditor();
  const isSelected = selectedAssetId === asset.id;

  const positionTokens = elementPositionTokens(asset.id);

  const hostRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const moveRef = React.useRef<MoveSession | null>(null);
  const dragSession = useDragSession();
  const resizeSession = React.useRef<ResizeSession | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);

  const {
    toolbarRect,
    toolbarHidden,
    animateEntry,
    refreshRect,
    setToolbarRect,
  } = useFloatingToolbar({
    elRef: hostRef,
    isSelected,
    kind: "asset",
    elementId: asset.id,
    enableAnimation: true,
  });

  React.useEffect(() => {
    if (!isSelected) return;
    refreshRect();
  }, [
    isSelected,
    refreshRect,
    asset.xPct,
    asset.yPct,
    asset.widthPct,
    asset.heightPct,
    asset.rotation,
  ]);

  const select = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAssetId(asset.id);
    setSelectedTextId(null);
    setSelectedAnnotationShapeId(null);
  };

  // ── Move ──────────────────────────────────────────────────────────────

  const beginMove = (e: React.PointerEvent<Element>) => {
    if (!canvasRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedAssetId(asset.id);
    setSelectedTextId(null);
    const rect = canvasRef.current.getBoundingClientRect();
    moveRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXPct: asset.xPct,
      startYPct: asset.yPct,
      canvasW: rect.width,
      canvasH: rect.height,
      lastXPct: asset.xPct,
      lastYPct: asset.yPct,
      moved: false,
    };
    dragSession.next();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const updateMove = (e: React.PointerEvent<Element>) => {
    const move = moveRef.current;
    if (!move || move.pointerId !== e.pointerId) return;
    const dxPct = ((e.clientX - move.startClientX) / move.canvasW) * 100;
    const dyPct = ((e.clientY - move.startClientY) / move.canvasH) * 100;
    const nextX = Math.max(0, Math.min(100, move.startXPct + dxPct));
    const nextY = Math.max(0, Math.min(100, move.startYPct + dyPct));
    move.lastXPct = nextX;
    move.lastYPct = nextY;
    move.moved = true;

    applyElementPosition(previewHosts(canvasScopeId), asset.id, nextX, nextY);
    const host = hostRef.current;
    if (host) setToolbarRect(host.getBoundingClientRect());
  };

  const finishMove = (e: React.PointerEvent<Element>) => {
    const move = moveRef.current;
    if (!move || move.pointerId !== e.pointerId) return;
    moveRef.current = null;
    if (move.moved) {
      updateAsset(asset.id, {
        xPct: move.lastXPct,
        yPct: move.lastYPct,
      });
      // Drop live-position tokens so the committed store values take over.
      const hosts = previewHosts(canvasScopeId);
      const token = dragSession.value();
      requestAnimationFrame(() => {
        if (!dragSession.matches(token)) return;
        resetElementPosition(hosts, asset.id);
      });
    }
    setIsDragging(false);
  };

  // ── Resize ────────────────────────────────────────────────────────────

  const beginResize =
    (handle: ResizeHandleId) => (e: React.PointerEvent<HTMLButtonElement>) => {
      const canvas = canvasRef.current;
      const host = hostRef.current;
      if (!canvas || !host) return;
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const rect = canvas.getBoundingClientRect();
      const hostRect = host.getBoundingClientRect();
      const heightPct =
        asset.heightPct ??
        (rect.height ? (hostRect.height / rect.height) * 100 : 0);
      resizeSession.current = {
        pointerId: e.pointerId,
        handle,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startXPct: asset.xPct,
        startYPct: asset.yPct,
        startWidthPct: asset.widthPct,
        startHeightPct: heightPct,
        canvasW: rect.width,
        canvasH: rect.height,
        lastPatch: null,
      };
      setIsResizing(true);
    };

  const updateResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rs = resizeSession.current;
    if (!rs || rs.pointerId !== e.pointerId) return;
    const host = hostRef.current;
    if (!host) return;
    const dxPct = ((e.clientX - rs.startClientX) / rs.canvasW) * 100;
    const dyPct = ((e.clientY - rs.startClientY) / rs.canvasH) * 100;

    // Free resize on both axes — corners move width AND height independently,
    // edges stretch a single axis. Aspect-lock (Shift) is planned later.
    let newW = rs.startWidthPct;
    let newH = rs.startHeightPct;
    let xShift = 0;
    let yShift = 0;

    if (rs.handle.includes("l")) {
      newW = Math.max(2, rs.startWidthPct - dxPct);
      xShift = -(newW - rs.startWidthPct) / 2;
    }
    if (rs.handle.includes("r")) {
      newW = Math.max(2, rs.startWidthPct + dxPct);
      xShift = (newW - rs.startWidthPct) / 2;
    }
    if (rs.handle.includes("t")) {
      newH = Math.max(2, rs.startHeightPct - dyPct);
      yShift = -(newH - rs.startHeightPct) / 2;
    }
    if (rs.handle.includes("b")) {
      newH = Math.max(2, rs.startHeightPct + dyPct);
      yShift = (newH - rs.startHeightPct) / 2;
    }

    applyResizePatch(rs, host, {
      widthPct: Math.min(200, newW),
      heightPct: Math.min(200, newH),
      xPct: Math.max(-20, Math.min(120, rs.startXPct + xShift)),
      yPct: Math.max(-20, Math.min(120, rs.startYPct + yShift)),
    });
  };

  /** Apply a resize patch live to the DOM and stash it for commit on release. */
  const applyResizePatch = (
    rs: ResizeSession,
    host: HTMLDivElement,
    patch: AssetResizePatch,
  ) => {
    rs.lastPatch = patch;
    host.style.left = `${patch.xPct}%`;
    host.style.top = `${patch.yPct}%`;
    host.style.width = `${patch.widthPct}%`;
    host.style.height = `${patch.heightPct}%`;
    if (imgRef.current) imgRef.current.style.objectFit = "fill";
    setToolbarRect(host.getBoundingClientRect());
  };

  const finishResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rs = resizeSession.current;
    if (!rs || rs.pointerId !== e.pointerId) return;
    if (rs.lastPatch) updateAsset(asset.id, rs.lastPatch);
    resizeSession.current = null;
    setIsResizing(false);
  };

  const heightStyle = asset.heightPct != null ? `${asset.heightPct}%` : "auto";

  return (
    <>
      <div
        ref={hostRef}
        onPointerDown={beginMove}
        onPointerMove={updateMove}
        onPointerUp={finishMove}
        onPointerCancel={finishMove}
        onClick={select}
        data-asset-ref={asset.id}
        data-export-stack="foreground"
        className={cn(
          "nodrag nopan absolute touch-none select-none",
          isSelected ? "cursor-grabbing" : "cursor-grab",
        )}
        style={{
          left: `var(${positionTokens.x}, var(--stage-el-x, ${asset.xPct}%))`,
          top: `var(${positionTokens.y}, var(--stage-el-y, ${asset.yPct}%))`,
          width: `${asset.widthPct}%`,
          height: heightStyle,
          transform: `translate(-50%, -50%) rotate(${asset.rotation}deg) scaleX(${asset.flipX ? -1 : 1}) scaleY(${asset.flipY ? -1 : 1})`,
          transition:
            !isDragging && !isResizing && animateEntry
              ? "left 300ms ease-out, top 300ms ease-out"
              : "none",
          zIndex: 60 + asset.zIndex,
          display: asset.hidden ? "none" : undefined,
        }}
      >
        <ProgressiveImage
          ref={imgRef}
          src={asset.src}
          alt=""
          style={{
            opacity: asset.opacity / 100,
          }}
          className={cn(
            "block h-full w-full select-none",
            asset.heightPct != null ? "object-fill" : "object-contain",
          )}
        />

        {/* Selection chrome — resize handles only (no rotate for assets) */}
        {isSelected && !previewMode ? (
          <SelectionChrome
            startResize={beginResize}
            moveResize={updateResize}
            endResize={finishResize}
            onDragPointerDown={beginMove}
            onDragPointerMove={updateMove}
            onDragPointerUp={finishMove}
          />
        ) : null}
      </div>

      {/* Floating toolbar portal */}
      {!previewMode &&
      isSelected &&
      !toolbarHidden &&
      toolbarRect &&
      typeof document !== "undefined"
        ? createPortal(
            (() => {
              const flipBelow = toolbarRect.top < 80;
              const top = flipBelow
                ? toolbarRect.bottom + 12
                : toolbarRect.top - 12;
              const left = toolbarRect.left + toolbarRect.width / 2;
              return (
                <div
                  data-floating-anchor={`asset:${asset.id}`}
                  className="pointer-events-none fixed z-40"
                  style={{
                    top,
                    left,
                    transform: computeToolbarOffset(flipBelow, 1),
                    transformOrigin: flipBelow ? "top center" : "bottom center",
                  }}
                >
                  <div className="pointer-events-auto">
                    <AssetToolbar asset={asset} />
                  </div>
                </div>
              );
            })(),
            document.body,
          )
        : null}
    </>
  );
}
