import type { EditorState } from "../engine/types";
import { MESH_GRADIENT_PRESETS } from "@/editor/property-panel/sections/background/presets";

export const HISTORY_LIMIT = 100;
export const GROUP_MERGE_MS = 600;
export const MAX_SCREENSHOT_TILES = 3;

export const CLEAR_SELECTION = {
  selectedTextId: null,
  selectedAssetId: null,
  selectedAnnotationShapeId: null,
  selectedAnnotationStrokeId: null,
  selectedSlotId: null,
  isScreenshotSelected: false,
} as const;

export const CANVAS_ID = "canvas";

export const DEFAULT_STATE: EditorState = {
  id: CANVAS_ID,
  activeTool: "pointer",
  aspect: { id: "auto", w: 0, h: 0 },
  canvasZoom: 100,
  annotation: {
    mode: "pen",
    color: "#ef4444",
    strokeWidth: 4,
    lineStyle: "solid",
  },
  screenshot: null,
  originalScreenshot: null,
  lastCropRegion: null,
  background: {
    type: "gradient",
    value: MESH_GRADIENT_PRESETS[Math.floor(Math.random() * MESH_GRADIENT_PRESETS.length)],
  },
  padding: 40,
  borderRadius: 7,
  canvasBorderRadius: 7,
  border: { color: null, width: 0, style: "none", padding: 0 },
  backdrop: {
    effects: {
      noise: 0,
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      grayscale: 0,
      sepia: 0,
      invert: 0,
      opacity: 100,
    },
    lighting: {
      target: "inner",
      intensity: 0,
      direction: "0-0",
      color: "#FFFFFF",
    },
    filter: "none",
  },
  tilt: { rx: 0, ry: 0, rz: 0 },
  scale: 100,
  screenshotOffset: { x: 0, y: 0 },
  objectFit: "contain",
  screenshotLayer: {
    zIndex: 1,
    opacity: 100,
    hidden: false,
  },
  shadow: {
    type: "none",
    intensity: 40,
    lightSource: "center",
    color: "#050505",
  },
  overlay: {
    id: null,
    opacity: 50,
    position: "overlay",
  },
  deviceFrame: {
    id: "none",
    variantId: "black",
    orientation: "vertical",
  },
  texts: [],
  assets: [],
  annotations: [],
  annotationShapes: [],
  slots: [],
  deviceFrameAddress: "",
  animation: { durationMs: 5000, clips: [] },
};
