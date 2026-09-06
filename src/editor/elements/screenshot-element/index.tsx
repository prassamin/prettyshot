/**
 * ScreenshotElementView — a boxed screenshot ("screenshot") on the canvas.
 *
 * ── Responsibilities ──
 * - Move: pointer drag with center-snap (guides via onCenterGuideChange)
 * - Drop-zone for new images, replace via the inline edit menu
 * - Crop request forwarding to the crop modal
 * - Floating toolbar portal (frame, fit, duplicate, delete, ordering)
 *
 * The visual layer is `ScreenshotRender`; all pointer logic lives here.
 */
"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { toast } from "@heroui/react";

import { snapBoxToTarget } from "@/editor/lib/canvas-helpers";
import { computeCropTarget } from "@/editor/lib/crop-utils";
import { useEditor, useEditorEngine } from "@/editor/lib/engine";
import { readImageFileAsDataUrl } from "@/editor/lib/image-resize";
import { computeToolbarOffset } from "@/editor/toolbar/controls";
import { useFloatingToolbar } from "@/editor/hooks/use-floating-toolbar";
import {
  afterTokensCleared,
  applyElementPositionPreview,
  resetPositionTokensAfterPaint,
} from "@/editor/lib/preview-tokens";

import { ScreenshotRender } from "./render";
import { ScreenshotToolbar } from "./toolbar";
import type { ScreenshotElementViewProps, MoveSession } from "./types";
import { MAX_FILE_SIZE } from "@/config";

const readFileAsDataUrl = (file: File): Promise<string> =>
  readImageFileAsDataUrl(file, {
    downscaleAbove: MAX_FILE_SIZE,
    maxDimension: 2400,
  });

export function ScreenshotElementView({
  slot,
  canvasRef,
  canvasAspectRatio,
  rowLayout,
  onCropRequest,
  onCenterGuideChange,
  previewMode = false,
}: ScreenshotElementViewProps) {
  const {
    selectedSlotId,
    setSelectedSlotId,
    setSelectedAssetId,
    setSelectedTextId,
    setSelectedAnnotationShapeId,
    updateSlot,
    setSlotImage,
    setIsScreenshotSelected,
    setDeviceFrameAddress,
    deviceFrame: canvasFrame,
  } = useEditor();
  const isSelected = selectedSlotId === slot.id;
  const canDeleteSlot = !previewMode;
  const [slotEditOpen, setSlotEditOpen] = React.useState(false);

  const elRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const moveRef = React.useRef<MoveSession | null>(null);
  const [isBeingDragged, setIsBeingDragged] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const { toolbarRect, toolbarHidden, refreshRect, setToolbarRect } =
    useFloatingToolbar({
      elRef,
      isSelected,
      kind: "screenshot",
      elementId: slot.id,
    });

  React.useEffect(() => {
    if (!isSelected) return;
    refreshRect();
  }, [
    isSelected,
    refreshRect,
    slot.xPct,
    slot.yPct,
    slot.widthPct,
    slot.heightPct,
    slot.rotation,
    canvasAspectRatio,
    rowLayout?.widthPct,
    rowLayout?.xPct,
  ]);

  const select = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    setSelectedSlotId(slot.id);
    setSelectedAssetId(null);
    setSelectedTextId(null);
    setSelectedAnnotationShapeId(null);
    setIsScreenshotSelected(false);
  };

  const handleFile = React.useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.danger("Please drop an image");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.danger("Image size must be less than 10MB");
        return;
      }
      try {
        const src = await readFileAsDataUrl(file);
        setSlotImage(slot.id, src);
      } catch {
        toast.danger("Could not read image");
      }
    },
    [setSlotImage, slot.id],
  );

  const requestCrop = React.useCallback(() => {
    const target = computeCropTarget({
      deviceFrame: canvasFrame,
      objectFit: slot.objectFit ?? "contain",
      stageElement: stageRef.current,
      imageElement: imageRef.current,
      fallbackAspect: canvasAspectRatio,
    });
    onCropRequest({
      slotId: slot.id,
      ...target,
      initialRegion: slot.lastCropRegion ?? target.initialRegion,
    });
  }, [
    canvasAspectRatio,
    canvasFrame,
    imageRef,
    onCropRequest,
    slot.id,
    slot.lastCropRegion,
    slot.objectFit,
    stageRef,
  ]);

  const setScreenshotPositionDragging = useEditorEngine(
    (s) => s.setScreenshotPositionDragging,
  );

  // ── Move (with center snap) ──────────────────────────────────────────

  const beginMove = (e: React.PointerEvent<Element>) => {
    if (!canvasRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    select(e);
    setIsBeingDragged(true);

    setScreenshotPositionDragging(true);
    const rect = canvasRef.current.getBoundingClientRect();
    moveRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXPct: slot.xPct,
      startYPct: slot.yPct,
      canvasW: rect.width,
      canvasH: rect.height,
      moved: false,
      lastXPct: slot.xPct,
      lastYPct: slot.yPct,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const updateMove = (e: React.PointerEvent<Element>) => {
    const move = moveRef.current;
    if (!move || move.pointerId !== e.pointerId) return;
    e.preventDefault();
    const dxPct = ((e.clientX - move.startClientX) / move.canvasW) * 100;
    const dyPct = ((e.clientY - move.startClientY) / move.canvasH) * 100;
    let nextX = Math.max(-20, Math.min(120, move.startXPct + dxPct));
    let nextY = Math.max(-20, Math.min(120, move.startYPct + dyPct));
    const centerX = (nextX / 100) * move.canvasW;
    const centerY = (nextY / 100) * move.canvasH;
    const rect = elRef.current?.getBoundingClientRect();
    const snap = snapBoxToTarget({
      centerX,
      centerY,
      width: rect?.width ?? 0,
      height: rect?.height ?? 0,
      targetX: move.canvasW / 2,
      targetY: move.canvasH / 2,
      threshold: 16,
    });
    nextX += (snap.deltaX / move.canvasW) * 100;
    nextY += (snap.deltaY / move.canvasH) * 100;
    move.lastXPct = nextX;
    move.lastYPct = nextY;
    move.moved = true;
    onCenterGuideChange?.(snap.guides);
    const host = elRef.current;
    if (host) {
      applyElementPositionPreview(host, { xPct: nextX, yPct: nextY });
      setToolbarRect(host.getBoundingClientRect());
    }
  };

  const finishMove = (e: React.PointerEvent<Element>) => {
    const move = moveRef.current;
    if (!move || move.pointerId !== e.pointerId) return;
    const host = elRef.current;
    if (move.moved) {
      try {
        updateSlot(slot.id, {
          xPct: move.lastXPct,
          yPct: move.lastYPct,
        });
      } finally {
        resetPositionTokensAfterPaint([host]);
      }
    }
    moveRef.current = null;
    setIsBeingDragged(false);
    onCenterGuideChange?.({ x: false, y: false });

    afterTokensCleared(() => setScreenshotPositionDragging(false));
  };

  const onBrowse = (file: File) => {
    setSelectedSlotId(slot.id);
    setSelectedAssetId(null);
    setSelectedTextId(null);
    setSelectedAnnotationShapeId(null);
    setIsScreenshotSelected(false);
    handleFile(file);
  };

  const handleDeleteFromMenu = () => {
    setSlotImage(slot.id, null);
  };

  return (
    <>
      <ScreenshotRender
        slot={slot}
        canvasAspectRatio={canvasAspectRatio}
        rowLayout={rowLayout}
        containerRef={elRef}
        stageRef={stageRef}
        imageRef={imageRef}
        previewMode={previewMode}
        isSelected={isSelected && !previewMode}
        isDragOver={isDragOver}
        isBeingDragged={isBeingDragged}
        editOpen={slotEditOpen}
        onEditOpenChange={setSlotEditOpen}
        canDeleteSlot={canDeleteSlot}
        onSelect={select}
        onBrowse={onBrowse}
        onCropClick={requestCrop}
        onReplaceFile={(file) => void handleFile(file)}
        onDeleteFromMenu={handleDeleteFromMenu}
        onAddressChange={(value) => setDeviceFrameAddress(value)}
        onPointerDown={beginMove}
        onPointerMove={updateMove}
        onPointerUp={finishMove}
        onPointerCancel={finishMove}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
      />

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
                  data-floating-anchor={`screenshot:${slot.id}`}
                  className="pointer-events-none fixed z-40"
                  style={{
                    top,
                    left,
                    transform: computeToolbarOffset(flipBelow, 1),
                    transformOrigin: flipBelow ? "top center" : "bottom center",
                  }}
                >
                  <div className="pointer-events-auto">
                    <ScreenshotToolbar
                      slot={slot}
                      canDeleteSlot={canDeleteSlot}
                    />
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
