"use client";

import React, { createContext, useCallback, useContext, useRef } from "react";
import { useShallow } from "zustand/react/shallow";

import type { CanvasState, EditorState } from "../engine/types";
import type { Slot } from "@/editor/elements/types";

import { DEFAULT_STATE } from "./initial-config";
import type { EditorActions, EditorStore } from "@/editor/lib/engine";
import { useEditorEngine } from "@/editor/lib/engine";

const CanvasOverrideContext = createContext<Partial<CanvasState> | null>(null);

const CanvasPreviewModeContext = createContext<boolean>(false);

export function CanvasPreviewScope({
  override,
  children,
}: {
  override: Partial<CanvasState> | null;
  children: React.ReactNode;
}) {
  return (
    <CanvasPreviewModeContext.Provider value={true}>
      <CanvasOverrideContext.Provider value={override}>
        {children}
      </CanvasOverrideContext.Provider>
    </CanvasPreviewModeContext.Provider>
  );
}

export function useCanvasPreviewMode() {
  return useContext(CanvasPreviewModeContext);
}

export function useSelectedScreenshotTile(): Slot | null {
  const selectedId = useEditorEngine((s) => s.selectedSlotId);
  const slots = useEditorEngine((s) => s.present.slots);
  return selectedId
    ? (slots.find((slot) => slot.id === selectedId) ?? null)
    : null;
}

export function useEditorStateField<T>(selector: (state: EditorState) => T): T {
  const override = useContext(CanvasOverrideContext);

  const overrideRef = useRef(override);
  const selectorRef = useRef(selector);

  overrideRef.current = override;
  selectorRef.current = selector;

  const mergedCacheRef = useRef<{
    base: EditorState | null;
    ov: Partial<CanvasState> | null;
    merged: EditorState | null;
  }>({ base: null, ov: null, merged: null });

  const stableSelector = useCallback((s: EditorStore) => {
    const base = s.present ?? DEFAULT_STATE;
    const ov = overrideRef.current;
    let state: EditorState;
    if (ov) {
      const cache = mergedCacheRef.current;
      if (cache.base === base && cache.ov === ov && cache.merged !== null) {
        state = cache.merged;
      } else {
        state = { ...base, ...ov } as EditorState;
        mergedCacheRef.current = { base, ov, merged: state };
      }
    } else {
      state = base;
    }
    return selectorRef.current(state);
  }, []);

  return useEditorEngine(useShallow(stableSelector));
}

export type EditorContext = EditorState &
  EditorActions & {
    isPreviewMode: boolean;
    selectedTextId: string | null;
    selectedAssetId: string | null;
    selectedAnnotationShapeId: string | null;
    selectedAnnotationStrokeId: string | null;
    selectedSlotId: string | null;
    isScreenshotSelected: boolean;
    canUndo: boolean;
    canRedo: boolean;
  };

export function useEditor(): EditorContext {
  const activeTool = useEditorEngine((s) => s.present.activeTool);
  const aspect = useEditorEngine((s) => s.present.aspect);
  const canvasZoom = useEditorEngine((s) => s.present.canvasZoom);
  const annotation = useEditorEngine((s) => s.present.annotation);

  const state = useEditorStateField((s) => ({
    id: s.id,
    screenshot: s.screenshot,
    originalScreenshot: s.originalScreenshot,
    lastCropRegion: s.lastCropRegion,
    background: s.background,
    padding: s.padding,
    borderRadius: s.borderRadius,
    canvasBorderRadius: s.canvasBorderRadius,
    border: s.border,
    backdrop: s.backdrop,
    tilt: s.tilt,
    scale: s.scale,
    screenshotOffset: s.screenshotOffset,
    screenshotLayer: s.screenshotLayer,
    shadow: s.shadow,
    overlay: s.overlay,
    deviceFrame: s.deviceFrame,
    deviceFrameAddress: s.deviceFrameAddress,
    texts: s.texts,
    assets: s.assets,
    annotations: s.annotations,
    annotationShapes: s.annotationShapes,
    slots: s.slots,
    objectFit: s.objectFit,
    animation: s.animation,
  }));
  const isPreviewMode = useEditorEngine((s) => s.isPreviewMode);
  const selectedTextId = useEditorEngine((s) => s.selectedTextId);
  const selectedAssetId = useEditorEngine((s) => s.selectedAssetId);
  const selectedAnnotationShapeId = useEditorEngine(
    (s) => s.selectedAnnotationShapeId,
  );
  const selectedAnnotationStrokeId = useEditorEngine(
    (s) => s.selectedAnnotationStrokeId,
  );
  const selectedSlotId = useEditorEngine((s) => s.selectedSlotId);
  const isScreenshotSelected = useEditorEngine((s) => s.isScreenshotSelected);
  const canUndo = useEditorEngine((s) => s.past.length > 0);
  const canRedo = useEditorEngine((s) => s.future.length > 0);
  const store = useEditorEngine.getState();

  return {
    activeTool,
    aspect,
    canvasZoom,
    annotation,
    ...state,

    isPreviewMode,
    selectedTextId,
    selectedAssetId,
    selectedAnnotationShapeId,
    selectedAnnotationStrokeId,
    selectedSlotId,
    isScreenshotSelected,
    canUndo,
    canRedo,

    setActiveTool: store.setActiveTool,
    setScreenshot: store.setScreenshot,
    applyCroppedScreenshot: store.applyCroppedScreenshot,
    setAspect: store.setAspect,
    setBackground: store.setBackground,
    setPadding: store.setPadding,
    setBorderRadius: store.setBorderRadius,
    setCanvasBorderRadius: store.setCanvasBorderRadius,
    setBackdropAdjustments: store.setBackdropAdjustments,
    setBackdropFilter: store.setBackdropFilter,
    setScale: store.setScale,
    setScreenshotScale: store.setScreenshotScale,
    setScreenshotOffset: store.setScreenshotOffset,
    setScreenshotPlacement: store.setScreenshotPlacement,
    updateScreenshotLayer: store.updateScreenshotLayer,
    applyScreenshotStyle: store.applyScreenshotStyle,
    setOverlay: store.setOverlay,
    setDeviceFrame: store.setDeviceFrame,
    setDeviceFrameForMatchingSlots: store.setDeviceFrameForMatchingSlots,
    setMainScreenshotDeviceFrame: store.setMainScreenshotDeviceFrame,
    setObjectFit: store.setObjectFit,
    setDeviceFrameAddress: store.setDeviceFrameAddress,
    bringScreenshotToFront: store.bringScreenshotToFront,
    sendScreenshotToBack: store.sendScreenshotToBack,
    setAnnotation: store.setAnnotation,
    addAnnotationStroke: store.addAnnotationStroke,
    updateAnnotationStroke: store.updateAnnotationStroke,
    updateAnnotationStrokeLayer: store.updateAnnotationStrokeLayer,
    deleteAnnotationStroke: store.deleteAnnotationStroke,
    duplicateAnnotationStroke: store.duplicateAnnotationStroke,
    bringAnnotationStrokeToFront: store.bringAnnotationStrokeToFront,
    sendAnnotationStrokeToBack: store.sendAnnotationStrokeToBack,
    addAnnotationShape: store.addAnnotationShape,
    updateAnnotationShape: store.updateAnnotationShape,
    deleteAnnotationShape: store.deleteAnnotationShape,
    duplicateAnnotationShape: store.duplicateAnnotationShape,
    bringAnnotationShapeToFront: store.bringAnnotationShapeToFront,
    sendAnnotationShapeToBack: store.sendAnnotationShapeToBack,
    clearAnnotations: store.clearAnnotations,
    addText: store.addText,
    updateText: store.updateText,
    deleteText: store.deleteText,
    duplicateText: store.duplicateText,
    bringTextToFront: store.bringTextToFront,
    sendTextToBack: store.sendTextToBack,
    setSelectedTextId: store.setSelectedTextId,
    addAsset: store.addAsset,
    updateAsset: store.updateAsset,
    deleteAsset: store.deleteAsset,
    duplicateAsset: store.duplicateAsset,
    bringAssetToFront: store.bringAssetToFront,
    sendAssetToBack: store.sendAssetToBack,
    setSelectedAssetId: store.setSelectedAssetId,
    setSelectedAnnotationShapeId: store.setSelectedAnnotationShapeId,
    setSelectedAnnotationStrokeId: store.setSelectedAnnotationStrokeId,
    setSelectedSlotId: store.setSelectedSlotId,
    setIsScreenshotSelected: store.setIsScreenshotSelected,
    setIsAnimateMode: store.setIsAnimateMode,
    selectAnimationClip: store.selectAnimationClip,
    setAnimationDuration: store.setAnimationDuration,
    addAnimationClip: store.addAnimationClip,
    updateAnimationClip: store.updateAnimationClip,
    updateAnimationClips: store.updateAnimationClips,
    moveAnimationClip: store.moveAnimationClip,
    setAnimationClipSelection: store.setAnimationClipSelection,
    removeAnimationClips: store.removeAnimationClips,
    clearAnimationClipsEffects: store.clearAnimationClipsEffects,
    duplicateAnimationClips: store.duplicateAnimationClips,
    splitAnimationClip: store.splitAnimationClip,
    setIsPreviewMode: store.setIsPreviewMode,
    setScreenshotPositionDragging: store.setScreenshotPositionDragging,
    setDesignId: store.setDesignId,
    hydrate: store.hydrate,
    reset: store.reset,
    undo: store.undo,
    redo: store.redo,
    addSlot: store.addSlot,
    updateSlot: store.updateSlot,
    setSlotImage: store.setSlotImage,
    applyCroppedSlot: store.applyCroppedSlot,
    deleteSlot: store.deleteSlot,
    duplicateSlot: store.duplicateSlot,
    bringSlotToFront: store.bringSlotToFront,
    sendSlotToBack: store.sendSlotToBack,
    setSlotGroupPosition: store.setSlotGroupPosition,
    setSaveStatus: store.setSaveStatus,
    requestSave: store.requestSave,
    _registerSaveTrigger: store._registerSaveTrigger,
  };
}
