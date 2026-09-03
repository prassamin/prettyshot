/**
 * Browser window deviceFrame stage for the screenshot element.
 *
 * This is the "web browser" frame flavor: when the user picks a browser frame
 * (WebKit/Chromium), this component renders the frame + the captured media,
 * wires up the hover edit menu (crop / replace / delete), and applies the
 * screenshot's positional styling (offset, anchor, transform, shadow) on top
 * of the frame's natural aspect ratio.
 *
 * ── Two siblings, one job ─────────────────────────────────────────────────
 * - `WebBrowserStage`    — the filled state: media + edit affordances.
 * - `WebBrowserDropSlot` — the empty state: drop target / compact upload UI.
 *
 * Both share the same geometry helpers (`frameFitStyle`,
 * `framePositionedStyle`, `framePositionTransform` from canvas-helpers) so
 * the empty drop target aligns pixel-perfect with the filled frame it will
 * become.
 *
 * ── DOM contract with the export pipeline ─────────────────────────────────
 * The outer element carries `data-box-hover-target`; the positioned frame
 * carries `data-editor-shadow-filter-target` + a base value. Both are read
 * by the export/DOM-clone path (see lib/editor/animation-export) and by the
 * shared CSS conventions, so they must stay on these elements.
 */

"use client";

import * as React from "react";

import { EmptyBackdrop } from "../../screenshot/empty-backdrop";
import { ScreenshotActionsMenu } from "../../screenshot/screenshot-actions";
import { UploadArea } from "../../screenshot/upload-area";
import { useAnimationPlayerOptional } from "@/editor/animate/hooks/use-animation-player";
import { ChromeFrame } from "./chrome";
import { SafariFrame } from "./safari";
import {
  BROWSER_FRAME_ASPECT_RATIO,
  CHROME_BROWSER_FRAME_ID,
  getBrowserFrame,
} from "../catalog";
import { useEditor } from "@/editor/lib/engine";
import { cn } from "@/lib/utils";
import {
  frameFitStyle,
  framePositionedStyle,
  framePositionTransform,
} from "../geometry";
import { InnerLightingOverlay } from "../../screenshot/inner-lighting-overlay";
import { WebBrowserDropSlotProps, WebBrowserStageProps } from "./types";

/**
 * Filled-state browser deviceFrame: frame + media + hover edit menu.
 */
export function WebBrowserStage({
  mediaSrc,
  frameId,
  tone,
  layer,
  transform,
  shadowCss,
  offset,
  anchor,
  fit = "cover",
  isSelected,
  isDragging,
  disableHoverMenu,
  stageRef,
  imageRef,
  url,
  onUrlChange,
  onPick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  onMediaLoad,
  onCropRequest,
  onReplaceWith,
  onRemove,
  showHoverMenu = true,
  usePreviewTokens = true,
  lightingStyle,
  mediaCss,
}: WebBrowserStageProps) {
  const { activeTool, annotation } = useEditor();
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const animationPlayer = useAnimationPlayerOptional();
  const isAnimationPlaying = animationPlayer?.isPlaying ?? false;

  const frame = getBrowserFrame(frameId);
  const aspectRatio = frame?.aspectRatio ?? BROWSER_FRAME_ASPECT_RATIO;
  const fitStyle = frameFitStyle(aspectRatio);
  const positionedStyle = framePositionedStyle({
    aspectRatio,
    anchor,
    offset,
    transform,
    shadowFilter: shadowCss,
    layer,
    readPreviewVars: usePreviewTokens,
  });
  const isMoveTool = activeTool === "pointer" || annotation.mode === "move";

  return (
    <div
      data-box-hover-target
      className="group/webbrowser pointer-events-none relative h-full w-full"
      style={{ containerType: "size" }}
    >
      {/* Positioned, theme-consistent frame element. */}
      <div
        data-editor-shadow-filter-target
        data-editor-shadow-filter-base={shadowCss || ""}
        ref={frameRef}
        className={cn(
          "pointer-events-auto absolute top-0 left-0 max-h-full max-w-full select-none",
          layer.hidden && "pointer-events-none",
          isDragging || activeTool === "position"
            ? "cursor-grabbing transition-none"
            : "transition-[transform,opacity,filter,box-shadow] duration-300 ease-out",
          isMoveTool && "cursor-grab",
        )}
        style={positionedStyle}
        onClick={onPick}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          onPick(e);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        role="button"
        tabIndex={isMoveTool && !layer.hidden ? 0 : -1}
        aria-label="Select browser screenshot"
      >
        {frameId === CHROME_BROWSER_FRAME_ID ? (
          <ChromeFrame
            mediaSrc={mediaSrc}
            tone={tone === "dark" ? "dark" : "light"}
            urlValue={url}
            onUrlChange={onUrlChange}
            viewportRef={stageRef}
            imageRef={imageRef}
            onMediaLoad={onMediaLoad}
            mediaCss={mediaCss}
            fit={fit}
            shimmer
            className="h-full w-full"
          />
        ) : (
          <SafariFrame
            mediaSrc={mediaSrc}
            tone={tone === "dark" ? "dark" : "light"}
            urlValue={url}
            onUrlChange={onUrlChange}
            viewportRef={stageRef}
            imageRef={imageRef}
            onMediaLoad={onMediaLoad}
            mediaCss={mediaCss}
            fit={fit}
            shimmer
            className="h-full w-full"
          />
        )}

        <InnerLightingOverlay
          style={lightingStyle}
          className="overflow-hidden rounded-[inherit]"
        />
      </div>

      {/* Hover edit menu — floats over the frame's footprint. */}
      {showHoverMenu && isMoveTool && !isAnimationPlaying && !layer.hidden ? (
        <div
          className="pointer-events-none absolute top-0 left-0 max-h-full max-w-full"
          style={{
            ...fitStyle,
            left: "50%",
            top: "50%",
            transform: framePositionTransform({
              anchor,
              offset,
              transform,
              readPreviewVars: usePreviewTokens,
            }),
            transformOrigin: "center",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className={cn(
              "pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200",
              editOpen || isSelected
                ? "opacity-100"
                : "opacity-0 group-hover/webbrowser:opacity-100",
              isDragging && !editOpen && "opacity-0!",
              disableHoverMenu && !editOpen && "opacity-0!",
            )}
          >
            <ScreenshotActionsMenu
              open={editOpen}
              onOpenChange={(open) => {
                if (disableHoverMenu) {
                  setEditOpen(false);
                  return;
                }
                setEditOpen(open);
              }}
              onCropRequest={onCropRequest}
              onReplaceWith={onReplaceWith}
              onRemove={onRemove}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Empty-state browser deviceFrame: shows the frame as a drop/upload target.
 *
 * In compact mode only a small "upload" chip is rendered (used when the
 * frame is small or tilted); otherwise the full upload zone appears.
 */
export function WebBrowserDropSlot({
  frameId,
  tone,
  isDropHover,
  onPickFile,
  transform,
  shadowCss,
  offset,
  anchor,
  isDragging,
  url,
  onUrlChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  compact = false,
  usePreviewTokens = true,
  lightingStyle,
}: WebBrowserDropSlotProps) {
  const { activeTool, annotation } = useEditor();

  const frame = getBrowserFrame(frameId);
  const aspectRatio = frame?.aspectRatio ?? BROWSER_FRAME_ASPECT_RATIO;
  const fitStyle = frameFitStyle(aspectRatio);
  const positionedStyle = framePositionedStyle({
    aspectRatio,
    anchor,
    offset,
    transform,
    shadowFilter: shadowCss,
    readPreviewVars: usePreviewTokens,
  });
  const isMoveTool = activeTool === "position" || annotation.mode === "move";

  return (
    <div
      className="pointer-events-none relative h-full w-full"
      style={{ containerType: "size" }}
    >
      <div
        data-editor-shadow-filter-target
        data-editor-shadow-filter-base={shadowCss || ""}
        className={cn(
          "pointer-events-auto absolute top-0 left-0 max-h-full max-w-full select-none",
          isDragging || activeTool === "position"
            ? "cursor-grabbing transition-none"
            : "transition-[transform,opacity,filter,box-shadow] duration-300 ease-out",
          isMoveTool && !isDragging && "cursor-grab",
        )}
        style={positionedStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {frameId === CHROME_BROWSER_FRAME_ID ? (
          <ChromeFrame
            tone={tone === "dark" ? "dark" : "light"}
            urlValue={url}
            onUrlChange={onUrlChange}
            className="h-full w-full"
          >
            <DropSlotBackdrop
              isDropHover={isDropHover}
              onPickFile={onPickFile}
              compact={compact}
            />
          </ChromeFrame>
        ) : (
          <SafariFrame
            tone={tone === "dark" ? "dark" : "light"}
            urlValue={url}
            onUrlChange={onUrlChange}
            className="h-full w-full"
          >
            <DropSlotBackdrop
              isDropHover={isDropHover}
              onPickFile={onPickFile}
              compact={compact}
            />
          </SafariFrame>
        )}

        <InnerLightingOverlay
          style={lightingStyle}
          className="overflow-hidden rounded-[inherit]"
        />
      </div>

      {/* Compact upload chip — positioned over the frame's footprint. */}
      {compact ? (
        <div
          className="pointer-events-none absolute top-0 left-0 max-h-full max-w-full"
          style={{
            ...fitStyle,
            left: "50%",
            top: "50%",
            transform: framePositionTransform({
              anchor,
              offset,
              transform: "",
              readPreviewVars: usePreviewTokens,
            }),
            transformOrigin: "center",
          }}
        >
          <CompactUploadChip
            isDropHover={isDropHover}
            onPickFile={onPickFile}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Full-size drop backdrop rendered inside the empty frame's viewport.
 */
function DropSlotBackdrop({
  isDropHover,
  onPickFile,
  compact = false,
}: {
  isDropHover: boolean;
  onPickFile: (file: File) => void;
  compact?: boolean;
}) {
  return (
    <div className="relative size-full">
      <EmptyBackdrop
        data-drag-over={isDropHover}
        className={cn(
          "flex size-full items-center justify-center text-white transition-all",
          compact && "pointer-events-none",
        )}
      >
        {compact ? null : (
          <UploadArea
            isDropHover={isDropHover}
            onPickFile={onPickFile}
            showHint
            className="w-full max-w-100"
          />
        )}
      </EmptyBackdrop>
    </div>
  );
}

/**
 * Small floating upload chip for compact empty states.
 *
 * Swallows pointer events on capture so a click/tap lands on the chip's
 * upload zone instead of starting a stage drag.
 */
function CompactUploadChip({
  isDropHover,
  onPickFile,
}: {
  isDropHover: boolean;
  onPickFile: (file: File) => void;
}) {
  const stopPointer = (e: React.PointerEvent) => e.stopPropagation();

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
      onPointerDownCapture={stopPointer}
      onPointerMoveCapture={stopPointer}
      onPointerUpCapture={stopPointer}
    >
      <UploadArea
        compact
        isDropHover={isDropHover}
        onPickFile={onPickFile}
        showHint
      />
    </div>
  );
}
