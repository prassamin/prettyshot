/**
 * Main shot row — the primary screenshot (or its empty placeholder) plus
 * its floating toolbar.
 *
 * This is the top-level render for the canvas's main screenshot element:
 *
 * ── MainScreenshotRow ───────────────────────────────────────────────────────────
 * Adds the floating toolbar on top when the shot is selected: drag handle,
 * duplicate, image-fit picker, layer ordering. (The frame picker used to be
 * here — it moved out to a dedicated settings surface.)
 *
 * The toolbar is portal-rendered to `document.body` and positioned with
 * `useFloatingToolbar`, flipping above/below the stage depending on
 * available viewport space.
 */

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Expand, BringToFront, SendToBack } from "lucide-react";

import { FitSelectorPanel } from "@/editor/toolbar/panels/fit-selector-panel";
import {
  computeToolbarOffset,
  ActionButton,
  Divider,
  DuplicateAction,
  DeleteAction,
  ActionPopover,
  ToolPanel,
} from "@/editor/toolbar/controls";
import { useEditor, useEditorEngine } from "@/editor/lib/engine";
import { DeviceFrame } from "@/editor/frames/types";
import { useAnimationPlayerOptional } from "@/editor/animate/hooks/use-animation-player";
import { useFloatingToolbar } from "@/editor/hooks/use-floating-toolbar";
import { cn } from "@/lib/utils";

import {
  frameSelectionRadius,
  isDrawingArmed,
} from "@/editor/lib/canvas-helpers";
import { ScreenshotActionsMenu } from "./screenshot-actions";
import { ScreenshotFrameContent } from "../elements/screenshot-element/frame-content";
import { ScreenshotStage } from "../elements/screenshot-element/stage";

type ShotActions = {
  onPick: (e: { stopPropagation: () => void }) => void;
  onPickFile: (file: File) => void;
  onCropRequest: () => void;
  onReplaceWith: (file: File) => void;
  onRemove: () => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onWheel?: React.WheelEventHandler<HTMLDivElement>;
  onMediaLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
};

type MainScreenshotRowProps = {
  style: React.CSSProperties;
  offset: { x: number; y: number };
  mediaSrc: string | null;
  deviceFrame: DeviceFrame;
  url: string;
  onUrlChange: (value: string) => void;
  padding: number;
  transform: string;
  isDropHover: boolean;
  imageCss: React.CSSProperties;
  shadowCss: string | undefined;
  isSelected: boolean;
  toolbarScale: number;
  isDragging: boolean;
  onDuplicate: () => void;
  canDuplicate?: boolean;
  onBringToFront: () => void;
  onSendToBack: () => void;
  fit: "contain" | "cover" | "fill";
  onFitChange: (fit: "contain" | "cover" | "fill") => void;
  stageRef: React.RefObject<HTMLDivElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  onMediaLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  previewMode?: boolean;
  emptyCompact?: boolean;
  lightingStyle?: React.CSSProperties | null;
  mediaCss?: React.CSSProperties;
} & ShotActions;

/**
 * Primary screenshot row: stage + floating toolbar (portal).
 */
export function MainScreenshotRow({
  style,
  offset,
  mediaSrc,
  deviceFrame,
  url,
  onUrlChange,
  padding,
  transform,
  isDropHover,
  imageCss,
  shadowCss,
  isSelected,
  toolbarScale,
  isDragging,
  onPick,
  onPickFile,
  onCropRequest,
  onReplaceWith,
  onRemove,
  onDuplicate,
  canDuplicate = true,
  onBringToFront,
  onSendToBack,
  fit,
  onFitChange,
  stageRef,
  imageRef,
  onMediaLoad,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  previewMode = false,
  emptyCompact = false,
  lightingStyle,
  mediaCss,
}: MainScreenshotRowProps) {
  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const { isAnimateMode } = useEditorEngine();
  const { annotation, activeTool } = useEditor();
  const animationPlayer = useAnimationPlayerOptional();
  const isAnimationPlaying = animationPlayer?.isPlaying ?? false;

  const screenshotPositionDragging = useEditorEngine(
    (s) => s.screenshotPositionDragging,
  );
  const baseTransform = style.transform ?? "";
  const mergedStyle: React.CSSProperties = {
    ...style,
    transform:
      `${baseTransform} translate(var(--stage-offset-x, ${offset.x}px), var(--stage-offset-y, ${offset.y}px))`.trim(),
    // Match the screenshots' position easing so a group move animates the
    // primary box in lockstep with the tiles instead of snapping ahead of
    // them. Position travels via left/top (anchor) and the offset translate,
    // so both must transition. Disabled while dragging/previewing/animating
    // for instant tracking.
    transition:
      previewMode || isDragging || isAnimateMode || screenshotPositionDragging
        ? undefined
        : "left 300ms ease-out, top 300ms ease-out, transform 300ms ease-out",
  };
  const selectionRadius = frameSelectionRadius(
    deviceFrame.id,
    imageCss.borderRadius as number,
  );
  const showEditMenu =
    !previewMode &&
    !isAnimationPlaying &&
    mediaSrc &&
    (activeTool === "pointer" || annotation.mode === "move");
  const editMenu = showEditMenu ? (
    <div
      className={cn(
        "pointer-events-none absolute top-1/2 left-1/2 z-20 transition-opacity duration-200",
        editOpen || isSelected
          ? "opacity-100"
          : "opacity-0 group-hover/main-row:opacity-100",
        isDragging && !editOpen && "opacity-0!",
      )}
      style={{
        transform: `translate(-50%, -50%) ${transform}`,
        transformOrigin: "center",
        transformStyle: "preserve-3d",
      }}
    >
      <ScreenshotActionsMenu
        open={editOpen}
        onOpenChange={(open) => {
          if (isDragging) {
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
  ) : null;

  const { toolbarRect, toolbarHidden, refreshRect } = useFloatingToolbar({
    elRef: rowRef,
    isSelected,
    kind: "screenshot",
    elementId: null,
  });

  React.useEffect(() => {
    if (!isSelected) return;
    refreshRect();
  }, [isSelected, refreshRect, offset.x, offset.y, style.left, style.top]);

  return (
    <>
      <div
        ref={rowRef}
        data-box-hover-target={previewMode ? undefined : ""}
        data-editor-shadow-preview-scope="canvas"
        className={cn(
          "group/main-row",
          previewMode ? "pointer-events-none" : "pointer-events-auto",
          !previewMode &&
            (activeTool === "pointer" || annotation.mode === "move") &&
            "cursor-grab",
          !previewMode && isDragging && "cursor-grabbing",
        )}
        style={mergedStyle}
        onClick={
          previewMode
            ? undefined
            : (e) => {
                if (isDrawingArmed(activeTool, annotation.mode)) return;
                onPick(e);
              }
        }
        onPointerDown={
          previewMode
            ? undefined
            : (e) => {
                if (activeTool !== "pointer" && annotation.mode !== "move")
                  return;
                e.stopPropagation();
                onPointerDown(e);
              }
        }
        onPointerMove={previewMode ? undefined : onPointerMove}
        onPointerUp={previewMode ? undefined : onPointerUp}
        onPointerCancel={previewMode ? undefined : onPointerUp}
        onWheel={previewMode ? undefined : onWheel}
      >
        <ScreenshotStage
          padding={padding}
          transformedBoxStyle={{
            opacity: imageCss.opacity,
            mixBlendMode: imageCss.mixBlendMode,
            borderRadius: selectionRadius,
          }}
          selectionRadius={selectionRadius}
          contentTransform={transform}
          showSelectionBorder={
            isSelected &&
            !previewMode &&
            (deviceFrame.id !== "none" || !mediaSrc)
          }
          editMenu={editMenu}
        >
          <ScreenshotFrameContent
            src={mediaSrc}
            deviceFrame={deviceFrame}
            isDragOver={isDropHover}
            onBrowse={(file) => {
              if (isDrawingArmed(activeTool, annotation.mode)) return;
              onPickFile(file);
            }}
            shadowFilter={shadowCss}
            contentTransform={transform}
            bareStyle={imageCss}
            mediaStyle={mediaCss}
            applyTransformWhenEmpty
            suppressEmptyTransition
            readMainPreviewVars={false}
            emptyCompact={emptyCompact}
            objectFit={fit}
            isScreenshotSelected={isSelected && !previewMode}
            isDragging={isDragging}
            stageRef={stageRef}
            imageRef={imageRef}
            addressValue={url}
            onAddressChange={onUrlChange}
            onSelect={onPick}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onImageLoad={onMediaLoad}
            onCrop={onCropRequest}
            onReplaceFile={onReplaceWith}
            onDelete={onRemove}
            innerLightingStyle={lightingStyle}
          />
        </ScreenshotStage>
      </div>

      {isSelected &&
      !previewMode &&
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
                  data-floating-anchor="main-screenshot"
                  data-export-hidden="true"
                  className="pointer-events-none fixed z-40"
                  style={{
                    top,
                    left,
                    transform: computeToolbarOffset(flipBelow, toolbarScale),
                    transformOrigin: flipBelow ? "top center" : "bottom center",
                  }}
                >
                  <div className="pointer-events-auto">
                    <ToolPanel aria-label="Main screenshot controls">
                      {mediaSrc && (
                        <>
                          <ActionPopover
                            tooltip="Image fit"
                            contentClassName="p-2"
                            trigger={({ open }) => (
                              <ActionButton
                                aria-label="Image fit"
                                active={open}
                              >
                                <Expand className="size-4.5" />
                              </ActionButton>
                            )}
                          >
                            <FitSelectorPanel
                              selected={fit}
                              onSelect={onFitChange}
                            />
                          </ActionPopover>
                          <Divider />
                        </>
                      )}

                      <ActionButton
                        aria-label="Bring to front"
                        tooltip="Bring to front"
                        onClick={onBringToFront}
                      >
                        <BringToFront className="size-4.5" />
                      </ActionButton>

                      <ActionButton
                        aria-label="Send to back"
                        tooltip="Send to back"
                        onClick={onSendToBack}
                      >
                        <SendToBack className="size-4.5" />
                      </ActionButton>

                      {canDuplicate && (
                        <DuplicateAction
                          ariaLabel="Duplicate screenshot"
                          onDuplicate={onDuplicate}
                        />
                      )}

                      <DeleteAction
                        ariaLabel="Delete screenshot"
                        onDelete={onRemove}
                      />
                    </ToolPanel>
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
