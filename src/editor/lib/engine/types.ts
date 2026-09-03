import type { EditorToolBarTool } from "@/types/editor";
import type { AspectState } from "@/editor/aspect/types";
import type { AnimationClip, CanvasAnimation } from "@/editor/lib/animation/types";
import type {
  BackdropAdjustments,
  BackdropConfig,
  BackdropFilterKind,
  OverlayConfig,
} from "@/editor/property-panel/sections/backdrop/types";
import type { Background } from "@/editor/property-panel/sections/background/types";
import type { Border } from "@/editor/property-panel/sections/border/types";
import type { CropRegion } from "@/editor/crop/types";
import type { ScreenshotLayer } from "@/editor/screenshot/types";
import type { Shadow } from "@/editor/property-panel/sections/shadow/types";
import type { Tilt } from "@/editor/property-panel/sections/transform/types";
import type { DeviceFrame } from "@/editor/frames/types";
import type { TextElement } from "@/editor/elements/text-element/types";
import type {
  ScreenshotStylePatch,
  ScreenshotStyleTarget,
} from "@/editor/lib/canvas-utils";
import type {
  Annotation,
  AnnotationPoint,
  AnnotationShape,
  AnnotationStroke,
  AssetElement,
  Slot,
} from "@/editor/elements/types";


export type CanvasState = {
  id: string;
  screenshot: string | null;
  originalScreenshot: string | null;
  lastCropRegion: CropRegion | null;
  background: Background;
  padding: number;
  borderRadius: number;
  canvasBorderRadius: number;
  border: Border;
  backdrop: BackdropConfig;
  tilt: Tilt;
  scale: number;
  screenshotOffset: { x: number; y: number };
  screenshotLayer: ScreenshotLayer;
  shadow: Shadow;
  overlay: OverlayConfig;
  deviceFrame: DeviceFrame;
  texts: TextElement[];
  assets: AssetElement[];
  annotations: AnnotationStroke[];
  annotationShapes: AnnotationShape[];
  slots: Slot[];
  deviceFrameAddress: string;
  objectFit?: "contain" | "cover" | "fill";
  aspect?: AspectState;
  animation?: CanvasAnimation;
};

export type EditorState = CanvasState & {
  activeTool: EditorToolBarTool;
  aspect: AspectState;
  canvasZoom: number;
  annotation: Annotation;
};

export type EditorActions = {
  setActiveTool: (t: EditorToolBarTool) => void;
  setScreenshot: (s: string | null) => void;
  applyCroppedScreenshot: (s: string, region: CropRegion) => void;
  setAspect: (a: AspectState) => void;
  setBackground: (b: Background, opts?: { silent?: boolean }) => void;
  setPadding: (n: number) => void;
  setBorderRadius: (n: number) => void;
  setCanvasBorderRadius: (n: number) => void;
  setBackdropAdjustments: (e: BackdropAdjustments) => void;
  setBackdropFilter: (f: BackdropFilterKind) => void;
  setScale: (n: number) => void;
  setScreenshotScale: (n: number) => void;
  setScreenshotOffset: (offset: { x: number; y: number }) => void;
  setScreenshotPlacement: (
    offset: { x: number; y: number },
  ) => void;
  updateScreenshotLayer: (patch: Partial<ScreenshotLayer>) => void;
  applyScreenshotStyle: (
    target: ScreenshotStyleTarget,
    patch: ScreenshotStylePatch,
  ) => void;
  setOverlay: (o: OverlayConfig) => void;
  setDeviceFrame: (f: DeviceFrame) => void;
  setDeviceFrameForMatchingSlots: (f: DeviceFrame) => void;
  setMainScreenshotDeviceFrame: (f: DeviceFrame) => void;
  setDeviceFrameAddress: (a: string) => void;
  setObjectFit: (fit: "contain" | "cover" | "fill") => void;
  bringScreenshotToFront: () => void;
  sendScreenshotToBack: () => void;
  setIsScreenshotSelected: (selected: boolean) => void;
  setSelectedSlotId: (id: string | null) => void;
  addSlot: () => string | null;
  updateSlot: (id: string, patch: Partial<Slot>) => void;
  setSlotImage: (id: string, src: string | null) => void;
  applyCroppedSlot: (
    id: string,
    src: string,
    region: CropRegion,
  ) => void;
  deleteSlot: (id: string) => void;
  duplicateSlot: (id: string) => string | null;
  bringSlotToFront: (id: string) => void;
  sendSlotToBack: (id: string) => void;
  setSlotGroupPosition: (position: {
    xPct: number;
    yPct: number;
  }) => void;

  setAnnotation: (a: Partial<Annotation>) => void;
  addAnnotationStroke: (stroke: Omit<AnnotationStroke, "id" | "zIndex">) => string;
  updateAnnotationStroke: (id: string, points: AnnotationPoint[]) => void;
  updateAnnotationStrokeLayer: (id: string, patch: Partial<AnnotationStroke>) => void;
  deleteAnnotationStroke: (id: string) => void;
  duplicateAnnotationStroke: (id: string) => string | null;
  bringAnnotationStrokeToFront: (id: string) => void;
  sendAnnotationStrokeToBack: (id: string) => void;
  addAnnotationShape: (shape: Omit<AnnotationShape, "id" | "zIndex">) => string;
  updateAnnotationShape: (
    id: string,
    patch: Partial<AnnotationShape>,
  ) => void;
  deleteAnnotationShape: (id: string) => void;
  duplicateAnnotationShape: (id: string) => string | null;
  bringAnnotationShapeToFront: (id: string) => void;
  sendAnnotationShapeToBack: (id: string) => void;
  clearAnnotations: () => void;
  addText: (content?: string) => string;
  updateText: (id: string, patch: Partial<TextElement>) => void;
  deleteText: (id: string) => void;
  duplicateText: (id: string) => string | null;
  bringTextToFront: (id: string) => void;
  sendTextToBack: (id: string) => void;
  setSelectedTextId: (id: string | null) => void;
  addAsset: (src: string) => string;
  updateAsset: (id: string, patch: Partial<AssetElement>) => void;
  deleteAsset: (id: string) => void;
  duplicateAsset: (id: string) => string | null;
  bringAssetToFront: (id: string) => void;
  sendAssetToBack: (id: string) => void;
  setSelectedAssetId: (id: string | null) => void;
  setSelectedAnnotationShapeId: (id: string | null) => void;
  setSelectedAnnotationStrokeId: (id: string | null) => void;

  setIsAnimateMode: (mode: boolean) => void;
  selectAnimationClip: (id: string | null) => void;
  setAnimationDuration: (durationMs: number) => void;
  addAnimationClip: (startMs?: number, durationMs?: number) => string;
  updateAnimationClip: (id: string, patch: Partial<AnimationClip>) => void;
  updateAnimationClips: (patches: { id: string; patch: Partial<AnimationClip> }[]) => void;
  moveAnimationClip: (id: string, startMs: number) => void;
  setAnimationClipSelection: (ids: string[]) => void;
  removeAnimationClips: (ids: string[]) => void;
  clearAnimationClipsEffects: (ids: string[]) => void;
  duplicateAnimationClips: (ids: string[]) => string[];
  splitAnimationClip: (id: string, atMs: number) => string | null;

  setIsPreviewMode: (p: boolean) => void;
  setScreenshotPositionDragging: (dragging: boolean) => void;
  setDesignId: (id: string | null) => void;
  hydrate: (canvas: Partial<CanvasState>, opts?: { resetHistory?: boolean }) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;

  setSaveStatus: (status: SaveStatus, error?: string | null) => void;
  requestSave: () => void;
  _registerSaveTrigger: (fn: (() => Promise<void>) | null) => void;
};

export type SaveStatus = "saved" | "unsaved" | "saving" | "error";

export type EditorStore = {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
  _lastGroup: string | null;
  _lastTs: number;
  designId: string | null;
  isAnimateMode: boolean;
  isPreviewMode: boolean;
  screenshotPositionDragging: boolean;
  selectedTextId: string | null;
  selectedAssetId: string | null;
  selectedAnnotationShapeId: string | null;
  selectedAnnotationStrokeId: string | null;
  selectedSlotId: string | null;
  isScreenshotSelected: boolean;
  selectedAnimationClipId: string | null;
  selectedAnimationClipIds: string[];
  saveStatus: SaveStatus;
  saveError: string | null;
  lastSavedAt: number | null;
  _saveTrigger: (() => Promise<void>) | null;
} & EditorActions;
