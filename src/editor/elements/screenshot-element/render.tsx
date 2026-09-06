/**
 * ScreenshotRender — pure visual renderer for a capture element.
 *
 * No interaction logic here; the parent wires pointer/drag/drop events.
 * Handles frame styling, object-fit, crop selection radius, edit menu,
 * and the entrance animation.
 */
"use client";

import * as React from "react";
import { motion } from "framer-motion";

import {
  frameSelectionRadius,
  lightingOverlayCss,
} from "@/editor/lib/canvas-helpers";
import { ScreenshotActionsMenu } from "@/editor/screenshot/screenshot-actions";
import { useAnimationPlayerOptional } from "@/editor/animate/hooks/use-animation-player";
import { ScreenshotFrameContent } from "./frame-content";
import { ScreenshotStage } from "./stage";
import { slotBoxAspectRatio } from "@/editor/lib/row-layout";
import { resolveSlotScreenshotStyle } from "@/editor/lib/canvas-utils";
import { buildScreenshotStyles } from "@/editor/lib/screenshot-styles";
import { clipAffectsSlot, clipOwns } from "@/editor/lib/animation/playback";
import { useEditorStateField, useEditorEngine } from "@/editor/lib/engine";
import { cn } from "@/lib/utils";

import type { ScreenshotRenderProps, ScreenshotSharedStyle } from "./types";

function useSharedCanvasStyle(): ScreenshotSharedStyle {
  return useEditorStateField((canvas) => ({
    deviceFrame: canvas.deviceFrame,
    deviceFrameAddress: canvas.deviceFrameAddress,
    opacity: canvas.screenshotLayer.opacity,
  }));
}

export function ScreenshotRender({
  slot,
  canvasAspectRatio,
  rowLayout,
  containerRef,
  stageRef,
  imageRef,
  isSelected,
  isDragOver,
  isBeingDragged,
  editOpen,
  onEditOpenChange,
  onSelect,
  onBrowse,
  onCropClick,
  onReplaceFile,
  onDeleteFromMenu,
  onAddressChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onDragOver,
  onDragLeave,
  onDrop,
  previewMode = false,
}: ScreenshotRenderProps) {
  const shared = useSharedCanvasStyle();

  const resolved = useEditorStateField((canvas) =>
    resolveSlotScreenshotStyle(slot, canvas),
  );
  const effectivePadding = resolved.padding;
  const effectiveLighting = resolved.lighting;
  const effectiveBorderRadius = resolved.borderRadius;

  const isAnimateMode = useEditorEngine((s) => s.isAnimateMode);
  const positionDragging = useEditorEngine((s) => s.screenshotPositionDragging);
  const canvasClips = useEditorStateField((c) => c.animation?.clips ?? []);
  const slotOwns = React.useCallback(
    (effect: Parameters<typeof clipOwns>[1]) =>
      !previewMode &&
      isAnimateMode &&
      canvasClips.some(
        (c) => clipAffectsSlot(c, slot.id) && clipOwns(c, effect),
      ),
    [canvasClips, isAnimateMode, previewMode, slot.id],
  );
  const borderAnimated = slotOwns("border");
  const lightingAnimated = slotOwns("lighting");

  const innerLightingStyle =
    effectiveLighting.target === "inner" || lightingAnimated
      ? lightingOverlayCss(effectiveLighting, {
          inner: true,
          active: effectiveLighting.target === "inner",
          forceMount: lightingAnimated,
        })
      : null;

  const effectiveObjectFit = slot.objectFit ?? "contain";

  const {
    transform: contentTransform,
    imgStyle: bareImgStyle,
    shadowFilter: computedShadowFilter,
  } = buildScreenshotStyles({
    style: resolved,
    transformVarPrefix: "slot-transform",
    borderAnimated,
  });

  const effectiveFrame = slot.deviceFrame ?? shared.deviceFrame;
  const boxAspectRatio = slotBoxAspectRatio(effectiveFrame, canvasAspectRatio);
  const effectiveWidthPct = rowLayout?.widthPct ?? slot.widthPct;

  const containerStyle: React.CSSProperties = {
    left: `var(--stage-el-x, ${slot.xPct}%)`,
    top: `var(--stage-el-y, ${slot.yPct}%)`,
    width: `${effectiveWidthPct}%`,
    aspectRatio: boxAspectRatio,
    transform: `translate(-50%, -50%) rotate(var(--slot-transform-rot, ${slot.rotation}deg))`,
    zIndex: 60 + slot.zIndex,
    display: slot.hidden ? "none" : undefined,
    transition:
      previewMode || isBeingDragged || positionDragging
        ? undefined
        : "left 300ms ease-out, top 300ms ease-out",
  };

  const selectionRadius = frameSelectionRadius(
    effectiveFrame.id,
    effectiveBorderRadius,
  );
  const transformedStyle: React.CSSProperties = {
    opacity: shared.opacity / 100,
    borderRadius: selectionRadius,
  };

  const animationPlayer = useAnimationPlayerOptional();
  const isAnimationPlaying = animationPlayer?.isPlaying ?? false;
  const showEditMenu = !previewMode && !isAnimationPlaying && Boolean(slot.src);
  const editMenu = showEditMenu ? (
    <div
      className={cn(
        "pointer-events-none absolute top-1/2 left-1/2 z-20 transition-opacity duration-200",
        editOpen || isSelected
          ? "opacity-100"
          : "opacity-0 group-hover/screenshot:opacity-100",
      )}
      style={{
        transform: `translate(-50%, -50%) ${contentTransform}`,
        transformOrigin: "center",
        transformStyle: "preserve-3d",
      }}
    >
      <ScreenshotActionsMenu
        open={editOpen}
        onOpenChange={onEditOpenChange}
        onCropRequest={onCropClick}
        onReplaceWith={onReplaceFile}
        onRemove={onDeleteFromMenu}
      />
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      data-box-hover-target={previewMode ? undefined : ""}
      data-screenshot-id={slot.id}
      data-screenshot-tile-id={slot.id}
      data-editor-shadow-preview-scope={slot.id}
      data-export-stack="foreground"
      onPointerDown={previewMode ? undefined : onPointerDown}
      onPointerMove={previewMode ? undefined : onPointerMove}
      onPointerUp={previewMode ? undefined : onPointerUp}
      onPointerCancel={
        previewMode ? undefined : (onPointerCancel ?? onPointerUp)
      }
      onClick={previewMode ? undefined : onSelect}
      onDragOver={previewMode ? undefined : onDragOver}
      onDragLeave={previewMode ? undefined : onDragLeave}
      onDrop={previewMode ? undefined : onDrop}
      className={cn(
        "group/capture nodrag nopan absolute select-none",
        previewMode
          ? "pointer-events-none"
          : isSelected
            ? "cursor-grabbing"
            : "cursor-grab",
      )}
      style={containerStyle}
    >
      <motion.div
        className="absolute inset-0"
        initial={previewMode ? false : { opacity: 0, scale: 0.82 }}
        animate={previewMode ? undefined : { opacity: 1, scale: 1 }}
        exit={previewMode ? undefined : { opacity: 0, scale: 0.82 }}
        transition={
          previewMode
            ? undefined
            : { type: "spring", stiffness: 420, damping: 28, mass: 0.75 }
        }
      >
        <ScreenshotStage
          padding={effectivePadding}
          transformedBoxStyle={transformedStyle}
          selectionRadius={selectionRadius}
          contentTransform={contentTransform}
          showSelectionBorder={
            isSelected &&
            !previewMode &&
            (effectiveFrame.id !== "none" || !slot.src)
          }
          editMenu={editMenu}
        >
          <ScreenshotFrameContent
            src={slot.src}
            deviceFrame={effectiveFrame}
            isDragOver={isDragOver}
            onBrowse={onBrowse}
            shadowFilter={computedShadowFilter}
            contentTransform={contentTransform}
            bareStyle={bareImgStyle}
            applyTransformWhenEmpty
            suppressEmptyTransition
            readMainPreviewVars={false}
            emptyCompact={Boolean(rowLayout)}
            objectFit={effectiveObjectFit}
            isScreenshotSelected={isSelected && !previewMode}
            isDragging={false}
            stageRef={stageRef}
            imageRef={imageRef}
            addressValue={shared.deviceFrameAddress}
            onAddressChange={onAddressChange}
            onSelect={onSelect}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onCrop={onCropClick}
            onReplaceFile={onReplaceFile}
            onDelete={onDeleteFromMenu}
            innerLightingStyle={innerLightingStyle}
          />
        </ScreenshotStage>
      </motion.div>
    </div>
  );
}
