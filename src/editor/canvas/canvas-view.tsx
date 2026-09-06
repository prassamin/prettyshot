"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import {
  isBrowserFrame,
  resolveBrowserFrameColor,
} from "@/editor/frames/catalog";
import { SCREENSHOT_RADIUS_PREVIEW_VAR } from "@/editor/lib/css-utils";
import { buildScreenshotStyles } from "@/editor/lib/screenshot-styles";
import {
  CanvasPreviewScope,
  type CanvasState,
  useCanvasPreviewMode,
  useEditor,
  useEditorEngine,
} from "@/editor/lib/engine";

import {
  computeCropTarget,
  croppedNaturalSize,
  isActiveCropRegion,
  type CropTarget,
} from "@/editor/lib/crop-utils";
import type { DeviceOrientation } from "@/editor/frames/types";
import {
  lookupDynamicDeviceFrameModel,
  lookupDynamicDeviceFrameVariant,
  normalizeDeviceId,
  useFramesCatalog,
} from "@/editor/frames/dynamic-catalog";
import { clipOwns, lightingSidesUsed } from "@/editor/lib/animation/playback";
import {
  CenterGuides,
  useCenterGuides,
} from "@/editor/elements/shared/center-guides";
import { computeRowLayout, slotBoxAspectRatio } from "@/editor/lib/row-layout";
import {
  deviceFrameGeometry,
  isDesktopFrame,
  lightingOverlayCss,
  screenshotPlacementStyle,
} from "@/editor/lib/canvas-helpers";
import { mainScreenshotPositionPct } from "@/editor/lib/position-math";
import {
  previewHosts,
  applyMainBarePreviewPx,
  applyMainPositionPreview,
} from "@/editor/lib/preview-tokens";
import { useScreenshotDrag } from "@/editor/screenshot/use-screenshot-drag";
import { buildAdjustmentsFilterCss } from "@/editor/property-panel/sections/backdrop/utils";
import { TOKEN_CANVAS_CORNER_RADIUS } from "@/editor/property-panel/sections/backdrop/constants";

import { useCanvasAnimationStacks } from "./hooks/use-canvas-animation-stacks";
import { useBackgroundOptimizer } from "./hooks/use-background-optimizer";
import { useTransitionLock } from "./hooks/use-transition-lock";
import { useStageMeasurement } from "./hooks/use-stage-measurement";
import { useCanvasDropzone } from "./hooks/use-canvas-dropzone";
import { useCanvasAnnotation } from "./hooks/use-canvas-annotation";

import { CanvasBackdrop } from "./components/canvas-backdrop";
import { StageContent } from "./components/stage-content";
import { CanvasOverlayLayer } from "./components/canvas-overlay-layer";
import { CanvasElementsLayer } from "./components/canvas-elements-layer";
import {
  CanvasCropModals,
  type SlotCropRequest,
} from "./components/canvas-crop-modals";
import { CANVAS_ID } from "@/editor/lib/engine-core/initial-config";

type CanvasViewProps = {
  widthPx: number;
  heightPx: number;
  effectiveScale: number;
  previewMode?: boolean;
  canvasOverride?: Partial<CanvasState> | null;
};

function CanvasViewInner({
  widthPx,
  heightPx,
  effectiveScale,
}: CanvasViewProps) {
  useFramesCatalog();
  const {
    activeTool,
    screenshot,
    originalScreenshot,
    lastCropRegion,
    aspect,
    background,
    padding,
    borderRadius,
    canvasBorderRadius,
    border,
    backdrop,
    tilt,
    scale,
    screenshotOffset,
    screenshotLayer,
    shadow,
    overlay,
    deviceFrame,
    deviceFrameAddress,
    setDeviceFrameAddress,
    annotation,
    annotations,
    annotationShapes,
    setScreenshot,
    applyCroppedScreenshot,
    setScreenshotOffset,
    texts,
    selectedTextId,
    setSelectedTextId,
    updateText,
    assets,
    updateAsset,
    setSelectedAssetId,
    slots,
    setSelectedSlotId,
    setSlotImage,
    applyCroppedSlot,
    addSlot,
    bringScreenshotToFront,
    sendScreenshotToBack,
    addAnnotationStroke,
    updateAnnotationStroke,
    deleteAnnotationStroke,
    addAnnotationShape,
    updateAnnotationShape,
    deleteAnnotationShape,
    setSelectedAnnotationShapeId,
    selectedAnnotationStrokeId,
    setSelectedAnnotationStrokeId,
    isScreenshotSelected,
    setIsScreenshotSelected,
    objectFit,
    setObjectFit,
  } = useEditor();

  const isCanvasPreview = useCanvasPreviewMode();
  const isPreviewMode = useEditorEngine((s) => s.isPreviewMode);

  const isAnimateMode = useEditorEngine((s) => s.isAnimateMode);
  const selectedAnimationClipId = useEditorEngine(
    (s) => s.selectedAnimationClipId,
  );
  const canvasAnimation = useEditorEngine((s) => s.present.animation);
  const {
    bg: animateBgStack,
    filterStack: animateFilterStack,
    overlayStack: animateOverlayStack,
  } = useCanvasAnimationStacks({
    isAnimateMode,
    canvasAnimation,
    selectedClipId: selectedAnimationClipId,
    background,
    filter: backdrop.filter ?? "none",
    overlay,
  });

  useBackgroundOptimizer(background, isCanvasPreview);

  const canvasRef = React.useRef<HTMLDivElement>(null);
  const generatedAnnotationMaskId = React.useId();
  const annotationMaskId = `annotation-mask-${generatedAnnotationMaskId.replace(/:/g, "")}`;
  const sortedAnnotationShapes = React.useMemo(
    () => [...annotationShapes].sort((a, b) => a.zIndex - b.zIndex),
    [annotationShapes],
  );

  const [naturalDims, setNaturalDims] = React.useState<{
    w: number;
    h: number;
  } | null>(null);

  const activeNaturalDims = screenshot ? naturalDims : null;

  const [mainCropRequest, setMainCropRequest] =
    React.useState<CropTarget | null>(null);
  const [slotCropRequest, setSlotCropRequest] =
    React.useState<SlotCropRequest | null>(null);
  const [centerGuides, updateCenterGuides] = useCenterGuides();
  const [textCenterGuides, updateTextCenterGuides] = useCenterGuides();
  const stageRef = React.useRef<HTMLDivElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const annotationLayerRef = React.useRef<SVGSVGElement>(null);
  const suppressTransitionPadding = useTransitionLock(padding);
  const suppressTransitionSlots = useTransitionLock(slots.length);
  const suppressTransitionMedia = useTransitionLock(screenshot);
  const inRowMode = slots.length > 0;
  const { placementDims, measurePlacement } = useStageMeasurement({
    enabled: Boolean(screenshot),
    stageRef,
    imageRef,
    layoutKey: `${inRowMode ? "row" : "single"}:${deviceFrame.id}:${deviceFrame.orientation}:${slots.length}:${widthPx}:${heightPx}:${padding}:${objectFit ?? "cover"}:${activeNaturalDims ? `${activeNaturalDims.w}x${activeNaturalDims.h}` : "none"}`,
  });
  const suppressTransitionPlacement = useTransitionLock(
    placementDims
      ? `${Math.round(placementDims.imgW)}x${Math.round(placementDims.imgH)}:${Math.round(placementDims.stageW)}x${Math.round(placementDims.stageH)}`
      : "pending",
  );
  const suppressTransition =
    suppressTransitionPadding ||
    suppressTransitionSlots ||
    suppressTransitionMedia ||
    suppressTransitionPlacement;
  const resetNaturalDims = React.useCallback(() => setNaturalDims(null), []);
  const { isDragOver, readFile, dropHandlers } = useCanvasDropzone({
    setScreenshot,
    setSlotImage,
    onNaturalDimsReset: resetNaturalDims,
  });

  const cropAnimated =
    isAnimateMode && !!canvasAnimation?.clips.some((c) => clipOwns(c, "crop"));

  const isAuto = aspect.id === "auto" || aspect.w === 0 || aspect.h === 0;
  const canUseNaturalCanvasAspect =
    isAuto && activeNaturalDims && !inRowMode && deviceFrame.id === "none";

  const croppedDims =
    activeNaturalDims && lastCropRegion && isActiveCropRegion(lastCropRegion)
      ? croppedNaturalSize(
          activeNaturalDims.w,
          activeNaturalDims.h,
          lastCropRegion,
        )
      : null;

  const visibleNaturalDims = cropAnimated
    ? activeNaturalDims
    : (croppedDims ?? activeNaturalDims);

  const autoDims = canUseNaturalCanvasAspect ? visibleNaturalDims : null;
  const aw = autoDims ? autoDims.w : aspect.w || 16;
  const ah = autoDims ? autoDims.h : aspect.h || 10;
  const aspectRatio = `${aw} / ${ah}`;
  const canvasAspectRatio = aw / ah;
  const isPortraitOrSquareCanvas = ah >= aw;
  const browserFrame = isBrowserFrame(deviceFrame.id);
  const browserFrameColor = resolveBrowserFrameColor(deviceFrame.variantId);
  const deviceFrameModel =
    deviceFrame.id === "none" || browserFrame
      ? null
      : lookupDynamicDeviceFrameModel(deviceFrame.id);
  const isVerticalPortraitDevice =
    deviceFrame.orientation === "vertical" &&
    deviceFrameModel?.orientations.includes("portrait") === true;
  const isRotatedPortraitDevice =
    deviceFrame.orientation === "horizontal" &&
    deviceFrameModel?.orientations.includes("portrait") === true;

  const shouldScopeFrame =
    ((isPortraitOrSquareCanvas && isVerticalPortraitDevice) ||
      isRotatedPortraitDevice) &&
    slots.length === 0;
  const screenshotBoxAspect = slotBoxAspectRatio(
    deviceFrame,
    canvasAspectRatio,
    !inRowMode && deviceFrame.id === "none" ? visibleNaturalDims : null,
  );
  const rowLayoutItems = React.useMemo(
    () =>
      inRowMode
        ? computeRowLayout(
            [
              { id: "__main__", deviceFrame },
              ...slots.map((slot) => ({
                id: slot.id,
                deviceFrame: slot.deviceFrame ?? deviceFrame,
              })),
            ],
            canvasAspectRatio,
          )
        : null,
    [inRowMode, deviceFrame, slots, canvasAspectRatio],
  );
  const mainRowLayout = rowLayoutItems ? rowLayoutItems[0] : null;
  const slotRowLayoutById = React.useMemo(() => {
    if (!rowLayoutItems) return null;
    const map = new Map<string, { widthPct: number; xPct: number }>();
    for (const item of rowLayoutItems.slice(1)) {
      map.set(item.id, { widthPct: item.widthPct, xPct: item.xPct });
    }
    return map;
  }, [rowLayoutItems]);
  const screenshotAnchor = { x: 50, y: 50 };
  const mainScreenshotRowStyle: React.CSSProperties | null = mainRowLayout
    ? {
        position: "absolute",
        left: `var(--stage-main-x, ${mainRowLayout.xPct}%)`,
        top: "var(--stage-main-y, 50%)",
        width: `${mainRowLayout.widthPct}%`,
        aspectRatio: screenshotBoxAspect,
        transform: "translate(-50%, -50%)",
        zIndex: 60 + screenshotLayer.zIndex,
      }
    : null;

  const scaleFactor = scale / 100;
  const positionedStyle: React.CSSProperties | null = placementDims
    ? screenshotPlacementStyle(placementDims, scaleFactor, 0.5, 0.5)
    : null;

  const screenshotRadiusCss = `var(${SCREENSHOT_RADIUS_PREVIEW_VAR}, ${borderRadius}px)`;

  const borderAnimated =
    isAnimateMode &&
    !!canvasAnimation?.clips.some((c) => clipOwns(c, "border"));

  const {
    transform,
    imgStyle,
    shadowFilter: computedShadowFilter,
  } = buildScreenshotStyles({
    style: {
      tilt,
      scale,
      shadow,
      border,
      borderRadius,
      padding,
      lighting: backdrop.lighting,
      objectFit: objectFit ?? "cover",
    },
    transformVarPrefix: "canvas-transform",
    borderAnimated,
  });
  imgStyle.opacity = screenshotLayer.hidden ? 0 : screenshotLayer.opacity / 100;
  const effectiveObjectFit = objectFit ?? "cover";

  const emptyStateBoxStyle: React.CSSProperties = {
    borderRadius: screenshotRadiusCss,
  };
  if (imgStyle.outline) {
    emptyStateBoxStyle.outline = imgStyle.outline;
    emptyStateBoxStyle.outlineOffset = imgStyle.outlineOffset;
  }

  const adjustmentsFilter = buildAdjustmentsFilterCss(backdrop.effects);
  const noiseEnabled = backdrop.effects.noise > 0 && background.type !== "none";
  const noiseOpacity = noiseEnabled ? backdrop.effects.noise / 100 : 0;

  const lightingAnimated =
    isAnimateMode &&
    !!canvasAnimation?.clips.some((c) => clipOwns(c, "lighting"));
  const lightingSides = React.useMemo(
    () =>
      lightingAnimated && canvasAnimation
        ? lightingSidesUsed(canvasAnimation.clips, backdrop.lighting)
        : {
            inner: backdrop.lighting.target === "inner",
            outer: backdrop.lighting.target === "outer",
          },
    [lightingAnimated, canvasAnimation, backdrop.lighting],
  );
  const innerLightingStyle =
    backdrop.lighting.target === "inner" ||
    (lightingAnimated && lightingSides.inner)
      ? lightingOverlayCss(backdrop.lighting, {
          inner: true,
          active: backdrop.lighting.target === "inner",
          forceMount: lightingAnimated && lightingSides.inner,
        })
      : null;
  const canDragScreenshot =
    (activeTool === "pointer" || annotation.mode === "move") && positionedStyle;
  const { allOptions, isLoading: catalogLoading } = useFramesCatalog();
  const isDesktop = isDesktopFrame(deviceFrame.id);
  const currentOption = allOptions.find(
    (o) =>
      o.id === deviceFrame.id ||
      normalizeDeviceId(o.id) === normalizeDeviceId(deviceFrame.id),
  );
  const effectiveOrientation: DeviceOrientation | "horizontal" | "vertical" =
    browserFrame || isDesktop
      ? "horizontal"
      : currentOption && currentOption.supportsOrientation === false
        ? (currentOption.geometry?.aspectRatio?.split("/")[0] ?? "1") >
          (currentOption.geometry?.aspectRatio?.split("/")[1] ?? "1")
          ? "horizontal"
          : "vertical"
        : (deviceFrame.orientation || "vertical");
  const targetOrientation: DeviceOrientation =
    effectiveOrientation === "horizontal" ? "landscape" : "portrait";
  const deviceFrameRotation = 0;
  const deviceFrameAsset =
    deviceFrame.id === "none" || browserFrame
      ? null
      : lookupDynamicDeviceFrameVariant(
          deviceFrame.id,
          deviceFrame.variantId,
          targetOrientation,
        );
  // A frame is set in state but its asset isn't resolvable yet (the dynamic
  // catalog is still loading on first visit / after a saved-project hydrate).
  // True → the canvas should NOT fall back to the plain screenshot (which
  // looks like the frame "isn't applied"); it swaps in as soon as the catalog
  // lands.
  const framePending =
    deviceFrame.id !== "none" &&
    !browserFrame &&
    !deviceFrameAsset &&
    catalogLoading;
  const deviceFrameSpec = deviceFrameAsset
    ? deviceFrameGeometry(deviceFrame.id, effectiveOrientation)
    : null;

  const clearElementSelection = React.useCallback(() => {
    setSelectedTextId(null);
    setSelectedAssetId(null);
    setSelectedAnnotationShapeId(null);
    setSelectedSlotId(null);
    setSelectedAnnotationStrokeId(null);
  }, [
    setSelectedAssetId,
    setSelectedAnnotationShapeId,
    setSelectedSlotId,
    setSelectedAnnotationStrokeId,
    setSelectedTextId,
  ]);

  const setScreenshotPositionDragging = useEditorEngine(
    (s) => s.setScreenshotPositionDragging,
  );

  const previewLiveMainOffset = React.useCallback(
    (offset: { x: number; y: number }) => {
      const canvasEl = previewHosts();
      if (canvasEl.length === 0) return;

      if (inRowMode || deviceFrame.id !== "none") {
        const point = mainScreenshotPositionPct({
          aspect: { id: aspect.id, w: aw, h: ah },
          deviceFrame,
          offset,
          slots: slots,
        });
        applyMainPositionPreview(canvasEl, point);
        return;
      }

      if (
        positionedStyle &&
        typeof positionedStyle.left === "number" &&
        typeof positionedStyle.top === "number"
      ) {
        applyMainBarePreviewPx(
          canvasEl,
          positionedStyle.left + offset.x,
          positionedStyle.top + offset.y,
        );
        return;
      }

      const point = mainScreenshotPositionPct({
        aspect: { id: aspect.id, w: aw, h: ah },
        deviceFrame,
        offset,
        slots: slots,
      });
      applyMainPositionPreview(canvasEl, point);
    },
    [ah, aspect.id, aw, deviceFrame, inRowMode, positionedStyle, slots],
  );

  const {
    isDragging: isScreenshotDragging,
    liveOffset,
    startScreenshotDrag,
    moveScreenshot,
    stopScreenshotDrag,
    startFrameDrag: startDeviceFrameDrag,
    moveFrame: moveDeviceFrame,
    stopFrameDrag: stopDeviceFrameDrag,
  } = useScreenshotDrag({
    activeTool,
    annotation,
    draggable: Boolean(canDragScreenshot),
    scaleFactor: effectiveScale,
    stageDims: placementDims,
    positionedCss: positionedStyle,
    offset: screenshotOffset,
    frameCenterOffset: mainRowLayout
      ? { x: ((50 - mainRowLayout.xPct) / 100) * widthPx, y: 0 }
      : { x: 0, y: 0 },
    setOffset: setScreenshotOffset,
    setSelected: setIsScreenshotSelected,
    clearSelection: clearElementSelection,
    setCenterGuides: updateCenterGuides,
    setPositionDragging: setScreenshotPositionDragging,
    onOffsetPreview: previewLiveMainOffset,
    getPreviewCanvas: () => previewHosts(),
  });
  const effectiveOffset = liveOffset ?? screenshotOffset;
  const screenshotLeft =
    typeof positionedStyle?.left === "number"
      ? positionedStyle.left + effectiveOffset.x
      : undefined;
  const screenshotTop =
    typeof positionedStyle?.top === "number"
      ? positionedStyle.top + effectiveOffset.y
      : undefined;

  const {
    isAnnotating,
    annotationCursor,
    getEditorElementAtPoint,
    startAnnotation,
    moveAnnotation,
    stopAnnotation,
  } = useCanvasAnnotation({
    activeTool,
    canvasRef,
    annotationLayerRef,
    annotation,
    annotationShapes,
    texts,
    assets,
    addAnnotationStroke,
    updateAnnotationStroke,
    addAnnotationShape,
    updateAnnotationShape,
    deleteAnnotationShape,
    updateText,
    updateAsset,
    setSelectedTextId,
    setSelectedAssetId,
    setSelectedAnnotationShapeId,
    setIsScreenshotSelected,
    updateTextCenterGuides,
    setSelectedAnnotationStrokeId,
  });

  const handleScreenshotClickSelect = (e: { stopPropagation: () => void }) => {
    if (activeTool !== "pointer" && annotation.mode !== "move") return;
    e.stopPropagation();
    setIsScreenshotSelected(true);
    setSelectedTextId(null);
    setSelectedAssetId(null);
    setSelectedAnnotationShapeId(null);
    setSelectedSlotId(null);
  };

  const handleImageLoad = (e?: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e?.currentTarget ?? imageRef.current;
    const w = el?.naturalWidth || 0;
    const h = el?.naturalHeight || 0;
    if (!inRowMode && w > 0 && h > 0) {
      setNaturalDims({ w, h });
    }
    measurePlacement();
  };

  const openMainCropModal = React.useCallback(() => {
    const imageElement = imageRef.current;
    const target = computeCropTarget({
      deviceFrame,
      objectFit: objectFit ?? "cover",
      stageElement: stageRef.current,
      imageElement,
      fallbackAspect: canvasAspectRatio,
    });
    setMainCropRequest({
      ...target,
      initialRegion: lastCropRegion ?? target.initialRegion,
    });
  }, [canvasAspectRatio, deviceFrame, lastCropRegion, objectFit]);

  return (
    <>
      <div
        data-debug-frame-id={deviceFrame.id}
        data-debug-frame-asset={deviceFrameAsset ? "yes" : "no"}
        data-debug-catalog-len={allOptions.length}
        className="flex items-center justify-center"
        style={{ width: widthPx, height: heightPx }}
      >
        <motion.div
          ref={canvasRef}
          data-stage-id={CANVAS_ID}
          initial={false}
          style={{
            aspectRatio,
            borderRadius: `var(${TOKEN_CANVAS_CORNER_RADIUS}, ${canvasBorderRadius}px)`,
            width: widthPx,
            height: heightPx,
            touchAction: "none",
            overscrollBehavior: "none",
          }}
          className={cn(
            "relative flex items-center justify-center overflow-hidden transition-shadow",
            isCanvasPreview
              ? "ring-0"
              : isPreviewMode
                ? "ring-0"
                : "ring-1 ring-border/40",
          )}
          onClick={() => {
            setSelectedTextId(null);
            setSelectedAssetId(null);
            setSelectedAnnotationShapeId(null);
            setSelectedAnnotationStrokeId(null);
            setSelectedSlotId(null);
            setIsScreenshotSelected(false);
          }}
          {...dropHandlers}
        >
          <CenterGuides guides={centerGuides} />
          <CenterGuides guides={textCenterGuides} />

          <CanvasBackdrop
            background={background}
            backdrop={backdrop}
            adjustmentsFilter={adjustmentsFilter}
            noiseEnabled={noiseEnabled}
            noiseOpacity={noiseOpacity}
            overlay={overlay}
            animateBgStack={animateBgStack}
            animateFilterStack={animateFilterStack}
            animateOverlayStack={animateOverlayStack}
            lightingAnimated={lightingAnimated && lightingSides.outer}
          />

          <StageContent
            mainScreenshotRowStyle={mainScreenshotRowStyle}
            screenshot={screenshot}
            deviceFrame={deviceFrame}
            deviceFrameAddress={deviceFrameAddress}
            setDeviceFrameAddress={setDeviceFrameAddress}
            padding={padding}
            transform={transform}
            imgStyle={imgStyle}
            computedShadowFilter={computedShadowFilter}
            isDragOver={isDragOver}
            isScreenshotSelected={isScreenshotSelected}
            isScreenshotDragging={isScreenshotDragging}
            effectiveOffset={effectiveOffset}
            screenshotAnchor={screenshotAnchor}
            effectiveObjectFit={effectiveObjectFit}
            innerLightingStyle={innerLightingStyle}
            browserFrame={browserFrame}
            browserFrameColor={browserFrameColor}
            deviceFrameAsset={deviceFrameAsset}
            deviceFrameSpec={deviceFrameSpec}
            deviceFrameRotation={deviceFrameRotation}
            framePending={framePending}
            shouldScopeFrame={shouldScopeFrame}
            positionedStyle={positionedStyle}
            screenshotLeft={screenshotLeft}
            screenshotTop={screenshotTop}
            placementDims={placementDims}
            screenshotLayer={screenshotLayer}
            suppressTransition={suppressTransition}
            selectedTextId={selectedTextId}
            stageRef={stageRef}
            imageRef={imageRef}
            emptyStateBoxStyle={emptyStateBoxStyle}
            aw={aw}
            ah={ah}
            inRowMode={inRowMode}
            isPortraitOrSquareCanvas={isPortraitOrSquareCanvas}
            tilt={tilt}
            scale={scale}
            slotsCount={slots.length}
            isCanvasPreview={isCanvasPreview}
            handleScreenshotClickSelect={handleScreenshotClickSelect}
            readFile={readFile}
            openMainCropModal={openMainCropModal}
            setScreenshot={setScreenshot}
            setIsScreenshotSelected={setIsScreenshotSelected}
            addSlot={addSlot}
            setSlotImage={setSlotImage}
            setSelectedSlotId={setSelectedSlotId}
            bringScreenshotToFront={bringScreenshotToFront}
            sendScreenshotToBack={sendScreenshotToBack}
            setObjectFit={setObjectFit}
            handleImageLoad={handleImageLoad}
            startDeviceFrameDrag={startDeviceFrameDrag}
            moveDeviceFrame={moveDeviceFrame}
            stopDeviceFrameDrag={stopDeviceFrameDrag}
            startScreenshotDrag={startScreenshotDrag}
            moveScreenshot={moveScreenshot}
            stopScreenshotDrag={stopScreenshotDrag}
            setSelectedTextId={setSelectedTextId}
            setSelectedAnnotationShapeId={setSelectedAnnotationShapeId}
          />

          <CanvasOverlayLayer
            overlay={overlay}
            animateOverlayStack={animateOverlayStack}
          />

          <CanvasElementsLayer
            assets={assets}
            texts={texts}
            sortedAnnotationShapes={sortedAnnotationShapes}
            slots={slots}
            canvasRef={canvasRef}
            canvasAspectRatio={canvasAspectRatio}
            slotRowLayoutById={slotRowLayoutById}
            setSlotCropRequest={setSlotCropRequest}
            updateCenterGuides={updateCenterGuides}
            updateTextCenterGuides={updateTextCenterGuides}
            isCanvasPreview={isCanvasPreview}
            annotations={annotations}
            selectedAnnotationStrokeId={selectedAnnotationStrokeId}
            setSelectedAnnotationStrokeId={setSelectedAnnotationStrokeId}
            deleteAnnotationStroke={deleteAnnotationStroke}
            annotationMaskId={annotationMaskId}
            annotationLayerRef={annotationLayerRef}
            isAnnotating={isAnnotating}
            annotationCursor={annotationCursor}
            annotation={annotation}
            startAnnotation={startAnnotation}
            moveAnnotation={moveAnnotation}
            stopAnnotation={stopAnnotation}
            getEditorElementAtPoint={getEditorElementAtPoint}
          />
        </motion.div>
      </div>

      <CanvasCropModals
        isCanvasPreview={isCanvasPreview}
        mainCropRequest={mainCropRequest}
        setMainCropRequest={setMainCropRequest}
        screenshot={screenshot}
        originalScreenshot={originalScreenshot}
        applyCroppedScreenshot={applyCroppedScreenshot}
        slotCropRequest={slotCropRequest}
        setSlotCropRequest={setSlotCropRequest}
        slots={slots}
        applyCroppedSlot={applyCroppedSlot}
      />
    </>
  );
}

export function CanvasView(props: CanvasViewProps) {
  const inner = (
    <CanvasViewInner
      widthPx={props.widthPx}
      heightPx={props.heightPx}
      effectiveScale={props.effectiveScale}
    />
  );

  return props.previewMode ? (
    <CanvasPreviewScope override={props.canvasOverride ?? null}>
      {inner}
    </CanvasPreviewScope>
  ) : (
    inner
  );
}
