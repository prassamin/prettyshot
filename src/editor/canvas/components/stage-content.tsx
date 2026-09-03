"use client";

import * as React from "react";
import { toast } from "@heroui/react";

import type { BrowserFrameColor, DeviceFrame } from "@/editor/frames/types";
import { MainScreenshotRow } from "@/editor/screenshot/main-screenshot-row";
import { ScreenshotPlain } from "@/editor/screenshot/screenshot-plain";
import {
  WebBrowserDropSlot,
  WebBrowserStage,
} from "@/editor/frames/browser";
import { DeviceFrameStage } from "@/editor/frames/device";
import { DeviceFrameDropSlot } from "@/editor/frames/device/empty-state";
import { CanvasEmptyState } from "@/editor/screenshot/canvas-empty-state";
import type { PlacementDims } from "@/editor/screenshot/types";

type StageContentProps = {
  mainScreenshotRowStyle: React.CSSProperties | null;
  screenshot: string | null;
  deviceFrame: DeviceFrame;
  deviceFrameAddress: string;
  setDeviceFrameAddress: (address: string) => void;
  padding: number;
  transform: string;
  imgStyle: React.CSSProperties;
  computedShadowFilter: string | undefined;
  isDragOver: boolean;
  isScreenshotSelected: boolean;
  isScreenshotDragging: boolean;
  effectiveOffset: { x: number; y: number };
  screenshotAnchor: { x: number; y: number };
  effectiveObjectFit: "cover" | "contain" | "fill";
  innerLightingStyle: React.CSSProperties | null;
  browserFrame: boolean;
  browserFrameColor: BrowserFrameColor;
  deviceFrameAsset: any;
  deviceFrameSpec: any;
  deviceFrameRotation: number;
  /** A device frame is set in state but its asset is still loading (catalog). */
  framePending?: boolean;
  shouldScopeFrame: boolean;
  positionedStyle: React.CSSProperties | null;
  screenshotLeft: number | undefined;
  screenshotTop: number | undefined;
  placementDims: PlacementDims | null;
  screenshotLayer: { zIndex: number; hidden: boolean; opacity: number };
  suppressTransition: boolean;
  selectedTextId: string | null;
  stageRef: React.RefObject<HTMLDivElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  emptyStateBoxStyle: React.CSSProperties;
  aw: number;
  ah: number;
  inRowMode: boolean;
  isPortraitOrSquareCanvas: boolean;
  tilt: { rx: number; ry: number; rz: number };
  scale: number;
  slotsCount: number;
  isCanvasPreview: boolean;
  handleScreenshotClickSelect: (e: { stopPropagation: () => void }) => void;
  readFile: (file: File) => void;
  openMainCropModal: () => void;
  setScreenshot: (src: string | null) => void;
  setIsScreenshotSelected: (sel: boolean) => void;
  addSlot: () => string | null;
  setSlotImage: (id: string, src: string) => void;
  setSelectedSlotId: (id: string | null) => void;
  bringScreenshotToFront: () => void;
  sendScreenshotToBack: () => void;
  setObjectFit: (fit: "cover" | "contain" | "fill") => void;
  handleImageLoad: (e?: React.SyntheticEvent<HTMLImageElement>) => void;
  startDeviceFrameDrag: (e: React.PointerEvent<any>) => void;
  moveDeviceFrame: (e: React.PointerEvent<any>) => void;
  stopDeviceFrameDrag: (e: React.PointerEvent<any>) => void;
  startScreenshotDrag: (e: React.PointerEvent<any>) => void;
  moveScreenshot: (e: React.PointerEvent<any>) => void;
  stopScreenshotDrag: (e: React.PointerEvent<any>) => void;
  setSelectedTextId: (id: string | null) => void;
  setSelectedAnnotationShapeId: (id: string | null) => void;
};

export const StageContent = React.memo(
  ({
    mainScreenshotRowStyle,
    screenshot,
    deviceFrame,
    deviceFrameAddress,
    setDeviceFrameAddress,
    padding,
    transform,
    imgStyle,
    computedShadowFilter,
    isDragOver,
    isScreenshotSelected,
    isScreenshotDragging,
    effectiveOffset,
    screenshotAnchor,
    effectiveObjectFit,
    innerLightingStyle,
    browserFrame,
    browserFrameColor,
    deviceFrameAsset,
    deviceFrameSpec,
    deviceFrameRotation,
    framePending,
    shouldScopeFrame,
    positionedStyle,
    screenshotLeft,
    screenshotTop,
    placementDims,
    screenshotLayer,
    suppressTransition,
    selectedTextId,
    stageRef,
    imageRef,
    emptyStateBoxStyle,
    aw,
    ah,
    inRowMode,
    isPortraitOrSquareCanvas,
    tilt,
    scale,
    slotsCount,
    isCanvasPreview,
    handleScreenshotClickSelect,
    readFile,
    openMainCropModal,
    setScreenshot,
    setIsScreenshotSelected,
    addSlot,
    setSlotImage,
    setSelectedSlotId,
    bringScreenshotToFront,
    sendScreenshotToBack,
    setObjectFit,
    handleImageLoad,
    startDeviceFrameDrag,
    moveDeviceFrame,
    stopDeviceFrameDrag,
    startScreenshotDrag,
    moveScreenshot,
    stopScreenshotDrag,
    setSelectedTextId,
    setSelectedAnnotationShapeId,
  }: StageContentProps) => {
    if (mainScreenshotRowStyle) {
      return (
        <MainScreenshotRow
          style={mainScreenshotRowStyle}
          offset={effectiveOffset}
          mediaSrc={screenshot}
          deviceFrame={deviceFrame}
          url={deviceFrameAddress}
          onUrlChange={setDeviceFrameAddress}
          padding={padding}
          transform={transform}
          isDropHover={isDragOver}
          imageCss={imgStyle}
          shadowCss={computedShadowFilter}
          isSelected={isScreenshotSelected}
          toolbarScale={1}
          isDragging={isScreenshotDragging}
          onPick={handleScreenshotClickSelect}
          onPickFile={readFile}
          onCropRequest={openMainCropModal}
          onReplaceWith={readFile}
          onRemove={() => {
            setIsScreenshotSelected(false);
            setScreenshot(null);
          }}
          lightingStyle={innerLightingStyle}
          canDuplicate={true}
          onDuplicate={() => {
            const newId = addSlot();
            if (!newId) {
              toast.info(`Screenshot box limit reached`);
              return;
            }
            if (screenshot) setSlotImage(newId, screenshot);
            setSelectedSlotId(newId);
            setIsScreenshotSelected(false);
          }}
          onBringToFront={() => bringScreenshotToFront()}
          onSendToBack={() => sendScreenshotToBack()}
          fit={effectiveObjectFit}
          onFitChange={setObjectFit}
          stageRef={stageRef}
          imageRef={imageRef}
          onMediaLoad={handleImageLoad}
          onPointerDown={(e) => {
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
            startDeviceFrameDrag(e);
          }}
          onPointerMove={moveDeviceFrame}
          onPointerUp={stopDeviceFrameDrag}
          previewMode={isCanvasPreview}
          emptyCompact={inRowMode}
        />
      );
    }

    return (
      <div
        data-editor-shadow-preview-scope="canvas"
        className="pointer-events-none relative flex h-full w-full items-center justify-center"
        style={{
          padding: `var(--editor-padding-preview, ${(padding / 1200) * 100}%)`,
          zIndex: 60 + screenshotLayer.zIndex,
        }}
      >
        {screenshot ? (
          browserFrame ? (
            <WebBrowserStage
              mediaSrc={screenshot}
              frameId={deviceFrame.id}
              tone={browserFrameColor}
              layer={screenshotLayer}
              transform={transform}
              shadowCss={computedShadowFilter}
              offset={effectiveOffset}
              anchor={screenshotAnchor}
              fit={effectiveObjectFit}
              isSelected={isScreenshotSelected}
              isDragging={isScreenshotDragging}
              disableHoverMenu={isScreenshotDragging}
              stageRef={stageRef}
              imageRef={imageRef}
              url={deviceFrameAddress}
              onUrlChange={setDeviceFrameAddress}
              onPick={handleScreenshotClickSelect}
              onPointerDown={(e) => {
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                startDeviceFrameDrag(e);
              }}
              onPointerMove={moveDeviceFrame}
              onPointerUp={stopDeviceFrameDrag}
              onMediaLoad={handleImageLoad}
              onCropRequest={openMainCropModal}
              onReplaceWith={readFile}
              onRemove={() => {
                setIsScreenshotSelected(false);
                setScreenshot(null);
              }}
              lightingStyle={innerLightingStyle}
            />
          ) : deviceFrameAsset && deviceFrameSpec ? (
            <DeviceFrameStage
              mediaSrc={screenshot}
              deviceFrame={deviceFrameAsset}
              geometry={deviceFrameSpec}
              layer={screenshotLayer}
              transform={transform}
              rotation={deviceFrameRotation}
              shadowCss={computedShadowFilter}
              offset={effectiveOffset}
              anchor={screenshotAnchor}
              fit={effectiveObjectFit}
              isSelected={isScreenshotSelected}
              isDragging={isScreenshotDragging}
              stageDims={placementDims}
              stageRef={stageRef}
              imageRef={imageRef}
              clampToMinSide={shouldScopeFrame}
              onPick={handleScreenshotClickSelect}
              onPointerDown={(e) => {
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                startDeviceFrameDrag(e);
              }}
              onPointerMove={moveDeviceFrame}
              onPointerUp={stopDeviceFrameDrag}
              onMediaLoad={handleImageLoad}
              onCropRequest={openMainCropModal}
              onReplaceWith={readFile}
              onRemove={() => {
                setIsScreenshotSelected(false);
                setScreenshot(null);
              }}
              lightingStyle={innerLightingStyle}
            />
          ) : framePending ? (
            // A device frame is set but its asset is still loading from the
            // catalog — hold instead of showing the plain screenshot, which
            // would look like the frame "isn't applied".
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
            </div>
          ) : (
            <ScreenshotPlain
              mediaSrc={screenshot}
              mediaCss={imgStyle}
              positionedCss={positionedStyle}
              transform={transform}
              freeLeft={screenshotLeft}
              freeTop={screenshotTop}
              stageDims={placementDims}
              layer={screenshotLayer}
              isSelected={isScreenshotSelected}
              isDragging={isScreenshotDragging}
              disableTransitions={suppressTransition}
              activeTextId={selectedTextId}
              stageRef={stageRef}
              imageRef={imageRef}
              attachShadowBox={deviceFrame.id === "none"}
              fit={effectiveObjectFit}
              onStagePointerDown={(e) => {
                if (e.target === e.currentTarget) {
                  setIsScreenshotSelected(false);
                }
              }}
              onPick={handleScreenshotClickSelect}
              onPointerDown={(e) => {
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
                setSelectedTextId(null);
                setSelectedAnnotationShapeId(null);
                startScreenshotDrag(e);
              }}
              onPointerMove={moveScreenshot}
              onPointerUp={stopScreenshotDrag}
              onMediaLoad={handleImageLoad}
              onCropRequest={openMainCropModal}
              onReplaceWith={readFile}
              onRemove={() => {
                setIsScreenshotSelected(false);
                setScreenshot(null);
              }}
              lightingStyle={innerLightingStyle}
            />
          )
        ) : browserFrame ? (
          <WebBrowserDropSlot
            frameId={deviceFrame.id}
            tone={browserFrameColor}
            isDropHover={isDragOver}
            onPickFile={readFile}
            transform={transform}
            shadowCss={computedShadowFilter}
            offset={effectiveOffset}
            anchor={screenshotAnchor}
            isDragging={isScreenshotDragging}
            url={deviceFrameAddress}
            onUrlChange={setDeviceFrameAddress}
            compact={
              isPortraitOrSquareCanvas ||
              tilt.rx !== 0 ||
              tilt.ry !== 0 ||
              tilt.rz !== 0 ||
              scale !== 100 ||
              slotsCount > 0
            }
            onPointerDown={(e) => {
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              startDeviceFrameDrag(e);
            }}
            onPointerMove={moveDeviceFrame}
            onPointerUp={stopDeviceFrameDrag}
            lightingStyle={innerLightingStyle}
          />
        ) : deviceFrameAsset && deviceFrameSpec ? (
          <DeviceFrameDropSlot
            deviceFrame={deviceFrameAsset}
            geometry={deviceFrameSpec}
            isDropHover={isDragOver}
            onPickFile={readFile}
            transform={transform}
            shadowCss={computedShadowFilter}
            rotation={deviceFrameRotation}
            offset={effectiveOffset}
            anchor={screenshotAnchor}
            isDragging={isScreenshotDragging}
            clampToMinSide={shouldScopeFrame}
            compact={
              tilt.rx !== 0 ||
              tilt.ry !== 0 ||
              tilt.rz !== 0 ||
              scale !== 100 ||
              slotsCount > 0
            }
            onPointerDown={(e) => {
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              startDeviceFrameDrag(e);
            }}
            onPointerMove={moveDeviceFrame}
            onPointerUp={stopDeviceFrameDrag}
            lightingStyle={innerLightingStyle}
          />
        ) : (
          <CanvasEmptyState
            isDropHover={isDragOver}
            onPickFile={readFile}
            lightingStyle={innerLightingStyle}
            anchor={screenshotAnchor}
            offset={effectiveOffset}
            transform={transform}
            shadowCss={computedShadowFilter}
            boxCss={emptyStateBoxStyle}
            aspectW={aw}
            aspectH={ah}
            compact={
              tilt.rx !== 0 ||
              tilt.ry !== 0 ||
              tilt.rz !== 0 ||
              scale !== 100 ||
              slotsCount > 0
            }
            isBeingDragged={isScreenshotDragging}
            onPointerDown={(e) => {
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              startDeviceFrameDrag(e);
            }}
            onPointerMove={moveDeviceFrame}
            onPointerUp={stopDeviceFrameDrag}
          />
        )}
      </div>
    );
  },
);

StageContent.displayName = "StageContent";
