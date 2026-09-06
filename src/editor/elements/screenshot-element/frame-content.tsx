"use client";

import * as React from "react";

import {
  isBrowserFrame,
  resolveBrowserFrameColor,
} from "@/editor/frames/catalog";
import type { ScreenshotLayer } from "@/editor/screenshot/types";

import { DropPrompt } from "@/editor/screenshot/drop-prompt";
import { CanvasEmptyState } from "@/editor/screenshot/canvas-empty-state";
import { DeviceFrameDropSlot } from "@/editor/frames/device/empty-state";
import {
  deviceFrameGeometry,
  framePositionTransform,
  isDesktopFrame,
} from "@/editor/lib/canvas-helpers";
import { InnerLightingOverlay } from "@/editor/screenshot/inner-lighting-overlay";
import { ScreenshotPlain } from "@/editor/screenshot/screenshot-plain";
import {
  WebBrowserDropSlot,
  WebBrowserStage,
} from "@/editor/frames/browser";
import { DeviceFrameStage } from "@/editor/frames/device";
import type { DeviceFrame, DeviceOrientation } from "@/editor/frames/types";

type ScreenshotFrameContentProps = {
  src: string | null;
  deviceFrame: DeviceFrame;
  isDragOver: boolean;
  onBrowse: (file: File) => void;
  shadowFilter?: string;
  bareStyle?: React.CSSProperties;
  isDragging: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  addressValue: string;
  onAddressChange: (value: string) => void;
  onSelect: (e: { stopPropagation: () => void }) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onCrop: () => void;
  onReplaceFile: (file: File) => void;
  onDelete: () => void;
  contentTransform?: string;
  screenshotOffset?: { x: number; y: number };
  screenshotAnchor?: { x: number; y: number };
  applyTransformWhenEmpty?: boolean;
  suppressEmptyTransition?: boolean;
  emptyCompact?: boolean;
  objectFit?: "contain" | "cover" | "fill";
  aspectW?: number;
  aspectH?: number;
  deviceFrameScopeToMinSide?: boolean;
  readMainPreviewVars?: boolean;
  innerLightingStyle?: React.CSSProperties | null;
  isScreenshotSelected?: boolean;

  mediaStyle?: React.CSSProperties;
};

const CENTER_ANCHOR = { x: 50, y: 50 };
const ZERO_OFFSET = { x: 0, y: 0 };
const CONTENT_LAYER: ScreenshotLayer = {
  zIndex: 1,
  opacity: 100,
  hidden: false,
};

function emptyBareStyle(style?: React.CSSProperties) {
  if (!style) return undefined;
  const { transform, transformStyle, ...rest } = style;
  void transform;
  void transformStyle;
  return rest;
}

import {
  lookupDynamicDeviceFrameVariant,
  normalizeDeviceId,
  useFramesCatalog,
} from "@/editor/frames/dynamic-catalog";

export function ScreenshotFrameContent({
  src,
  deviceFrame,
  isDragOver,
  onBrowse,
  shadowFilter,
  bareStyle,
  isDragging,
  stageRef,
  imageRef,
  addressValue,
  onAddressChange,
  onSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onImageLoad,
  onCrop,
  onReplaceFile,
  onDelete,
  contentTransform = "",
  screenshotOffset = ZERO_OFFSET,
  screenshotAnchor = CENTER_ANCHOR,
  applyTransformWhenEmpty = false,
  suppressEmptyTransition = false,
  emptyCompact = false,
  objectFit = "cover",
  aspectW,
  aspectH,
  deviceFrameScopeToMinSide = false,
  readMainPreviewVars = true,
  innerLightingStyle,
  isScreenshotSelected = false,

  mediaStyle,
}: ScreenshotFrameContentProps) {
  const { allOptions } = useFramesCatalog();
  const isBrowser = isBrowserFrame(deviceFrame.id);
  const isDesktop = isDesktopFrame(deviceFrame.id);
  const currentOption = allOptions.find(
    (o) =>
      o.id === deviceFrame.id ||
      normalizeDeviceId(o.id) === normalizeDeviceId(deviceFrame.id),
  );
  const effectiveOrientation: DeviceOrientation | "horizontal" | "vertical" =
    isBrowser || isDesktop
      ? "horizontal"
      : currentOption && currentOption.supportsOrientation === false
        ? (currentOption.geometry?.aspectRatio?.split("/")[0] ?? "1") >
          (currentOption.geometry?.aspectRatio?.split("/")[1] ?? "1")
          ? "horizontal"
          : "vertical"
        : (deviceFrame.orientation || "vertical");
  const browserFrame = isBrowser;
  const browserFrameColor = resolveBrowserFrameColor(deviceFrame.variantId);
  const targetOrientation: DeviceOrientation =
    effectiveOrientation === "horizontal" ? "landscape" : "portrait";
  const deviceFrameAsset =
    deviceFrame.id === "none" || browserFrame
      ? null
      : lookupDynamicDeviceFrameVariant(
          deviceFrame.id,
          deviceFrame.variantId,
          targetOrientation,
        );
  const deviceFrameSpec = deviceFrameAsset
    ? deviceFrameGeometry(deviceFrame.id, effectiveOrientation)
    : null;
  const deviceFrameRotation = 0;
  const handleImageLoad = onImageLoad ?? (() => undefined);

  if (src) {
    if (browserFrame) {
      return (
        <WebBrowserStage
          mediaSrc={src}
          frameId={deviceFrame.id}
          tone={browserFrameColor}
          layer={CONTENT_LAYER}
          transform={contentTransform}
          shadowCss={shadowFilter}
          offset={screenshotOffset}
          anchor={screenshotAnchor}
          fit={objectFit}
          isSelected={false}
          isDragging={isDragging}
          stageRef={stageRef}
          imageRef={imageRef}
          url={addressValue}
          onUrlChange={onAddressChange}
          onPick={onSelect}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onMediaLoad={handleImageLoad}
          onCropRequest={onCrop}
          onReplaceWith={onReplaceFile}
          onRemove={onDelete}
          showHoverMenu={false}
          usePreviewTokens={readMainPreviewVars}
          lightingStyle={innerLightingStyle}
          mediaCss={mediaStyle}
        />
      );
    }

    if (deviceFrameAsset && deviceFrameSpec) {
      return (
        <DeviceFrameStage
          mediaSrc={src}
          deviceFrame={deviceFrameAsset}
          geometry={deviceFrameSpec}
          layer={CONTENT_LAYER}
          transform={contentTransform}
          rotation={deviceFrameRotation}
          shadowCss={shadowFilter}
          offset={screenshotOffset}
          anchor={screenshotAnchor}
          fit={objectFit}
          isSelected={false}
          isDragging={isDragging}
          stageDims={null}
          stageRef={stageRef}
          imageRef={imageRef}
          onPick={onSelect}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onMediaLoad={handleImageLoad}
          onCropRequest={onCrop}
          onReplaceWith={onReplaceFile}
          onRemove={onDelete}
          showHoverMenu={false}
          clampToMinSide={deviceFrameScopeToMinSide}
          usePreviewTokens={readMainPreviewVars}
          lightingStyle={innerLightingStyle}
          mediaCss={mediaStyle}
        />
      );
    }

    return (
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-full w-full"
        style={{
          transform: framePositionTransform({
            anchor: screenshotAnchor,
            offset: screenshotOffset,
            transform: "",
            readPreviewVars: false,
          }),
          transformOrigin: "center",
        }}
      >
        <ScreenshotPlain
          mediaSrc={src}
          mediaCss={bareStyle ?? {}}
          positionedCss={null}
          transform={contentTransform}
          freeLeft={undefined}
          freeTop={undefined}
          stageDims={null}
          layer={CONTENT_LAYER}
          isSelected={isScreenshotSelected}
          isDragging={isDragging}
          disableTransitions={false}
          activeTextId={null}
          stageRef={stageRef}
          imageRef={imageRef}
          fit={objectFit}
          attachShadowBox={deviceFrame.id === "none"}
          onStagePointerDown={() => undefined}
          onPick={onSelect}
          onPointerDown={(e) => onPointerDown(e)}
          onPointerMove={(e) => onPointerMove(e)}
          onPointerUp={(e) => onPointerUp(e)}
          onMediaLoad={handleImageLoad}
          onCropRequest={onCrop}
          onReplaceWith={onReplaceFile}
          onRemove={onDelete}
          lightingStyle={innerLightingStyle}
        />
      </div>
    );
  }

  if (browserFrame) {
    return (
      <WebBrowserDropSlot
        frameId={deviceFrame.id}
        tone={browserFrameColor}
        isDropHover={isDragOver}
        onPickFile={onBrowse}
        transform={contentTransform}
        shadowCss={shadowFilter}
        offset={screenshotOffset}
        anchor={screenshotAnchor}
        isDragging={isDragging}
        url={addressValue}
        onUrlChange={onAddressChange}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        compact={emptyCompact}
        usePreviewTokens={readMainPreviewVars}
        lightingStyle={innerLightingStyle}
      />
    );
  }

  if (deviceFrameAsset && deviceFrameSpec) {
    return (
      <DeviceFrameDropSlot
        compact={emptyCompact}
        clampToMinSide={deviceFrameScopeToMinSide}
        deviceFrame={deviceFrameAsset}
        geometry={deviceFrameSpec}
        isDropHover={isDragOver}
        onPickFile={onBrowse}
        transform={contentTransform}
        shadowCss={shadowFilter}
        rotation={deviceFrameRotation}
        offset={screenshotOffset}
        anchor={screenshotAnchor}
        isDragging={isDragging}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        usePreviewTokens={readMainPreviewVars}
        lightingStyle={innerLightingStyle}
      />
    );
  }

  const hasAspect = (aspectW ?? 0) > 0 && (aspectH ?? 0) > 0;

  const emptyPreviewStyle = applyTransformWhenEmpty
    ? bareStyle
    : emptyBareStyle(bareStyle);

  return (
    <div
      data-editor-shadow-box-target={deviceFrame.id === "none" ? "" : undefined}
      className={`relative h-full w-full overflow-hidden${
        applyTransformWhenEmpty && !suppressEmptyTransition
          ? "transition-transform duration-300 ease-out"
          : ""
      }`}
      style={hasAspect ? undefined : emptyPreviewStyle}
    >
      {hasAspect ? (
        <CanvasEmptyState
          isDropHover={isDragOver}
          onPickFile={onBrowse}
          compact={emptyCompact}
          previewCss={emptyPreviewStyle}
          aspectW={aspectW}
          aspectH={aspectH}
          noOuterPadding
          lightingStyle={innerLightingStyle}
        />
      ) : (
        <>
          <InnerLightingOverlay style={innerLightingStyle} />
          <DropPrompt
            isDropHover={isDragOver}
            onPickFile={onBrowse}
            compact={emptyCompact}
          />
        </>
      )}
    </div>
  );
}
