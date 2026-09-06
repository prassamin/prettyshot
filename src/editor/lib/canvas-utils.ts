import { computeRowLayout } from "@/editor/lib/row-layout";
import type { AspectState } from "@/editor/aspect/types";
import type { AnimationEffect } from "@/editor/lib/animation/types";
import type { CanvasState, EditorState } from "@/editor/lib/engine/types";
import type { LightSourceConfig } from "@/editor/property-panel/sections/backdrop/types";
import type { Border } from "@/editor/property-panel/sections/border/types";
import type { Shadow } from "@/editor/property-panel/sections/shadow/types";
import type { Tilt } from "@/editor/property-panel/sections/transform/types";
import type { AnnotationStroke, Slot } from "@/editor/elements/types";
import type { DeviceFrame } from "@/editor/frames/types";
import { makeId } from "@/editor/lib";

export const CANVAS_BASE_W = 1100;
export const CANVAS_GAP = 80;

export const PRESET_DESIGN_HEIGHT = CANVAS_BASE_W * (10 / 16);

export const SLOT_DEFAULT_HEIGHT_PCT = 28;
export const SLOT_DEFAULT_FALLBACK_WIDTH = 60;

export const clampPct = (value: number) => Math.max(-20, Math.min(120, value));

export const canvasHeightFromAspectRatio = (canvasAspect: number) =>
  CANVAS_BASE_W / canvasAspect;

export const aspectRatioFromState = (aspect: AspectState): number => {
  const w = aspect.w || 16;
  const h = aspect.h || 10;
  return w / h;
};

export const stateCanvasAspect = (state: EditorState): number =>
  aspectRatioFromState(state.aspect);

export const scaleScreenshotOffsetForAspectChange = (
  offset: { x: number; y: number },
  currentAspect: number,
  nextAspect: number,
) => {
  const currentHeight = canvasHeightFromAspectRatio(currentAspect);
  const nextHeight = canvasHeightFromAspectRatio(nextAspect);
  if (!currentHeight || !nextHeight) return offset;
  return {
    x: offset.x,
    y: offset.y * (nextHeight / currentHeight),
  };
};

export const scaleAnnotationStrokesForAspectChange = (
  annotations: AnnotationStroke[],
  currentAspect: number,
  nextAspect: number,
): AnnotationStroke[] => {
  const currentHeight = canvasHeightFromAspectRatio(currentAspect);
  const nextHeight = canvasHeightFromAspectRatio(nextAspect);
  if (!currentHeight || !nextHeight) return annotations;

  const scaleY = nextHeight / currentHeight;
  if (!Number.isFinite(scaleY) || Math.abs(scaleY - 1) < 0.0001) {
    return annotations;
  }

  return annotations.map((stroke) => ({
    ...stroke,
    points: stroke.points.map((point) => ({
      x: point.x,
      y: point.y * scaleY,
    })),
  }));
};

export const layoutSlotsInRow = (
  slots: Slot[],
  canvasFrame: DeviceFrame,
  canvasAspect: number,
  options: { preservePositions?: boolean } = {},
): Slot[] => {
  const n = slots.length;
  if (n === 0) return slots;

  const layout = computeRowLayout(
    [
      { id: "__main__", deviceFrame: canvasFrame },
      ...slots.map((slot) => ({
        id: slot.id,
        deviceFrame: slot.deviceFrame ?? canvasFrame,
      })),
    ],
    canvasAspect,
  );
  const slotLayoutById = new Map(
    layout.slice(1).map((entry) => [entry.id, entry]),
  );
  return slots.map((slot) => {
    const entry = slotLayoutById.get(slot.id);
    if (!entry) return slot;
    if (options.preservePositions) {
      return {
        ...slot,
        widthPct: entry.widthPct,
        heightPct: SLOT_DEFAULT_HEIGHT_PCT,
      };
    }
    return {
      ...slot,
      xPct: entry.xPct,
      yPct: 50,
      widthPct: entry.widthPct,
      heightPct: SLOT_DEFAULT_HEIGHT_PCT,
      rotation: 0,
    };
  });
};

export const placeNewSlotInRow = (
  existingSlots: Slot[],
  newSlot: Slot,
  deviceFrame: DeviceFrame,
  aspect: number,
): Slot[] => {
  return layoutSlotsInRow([...existingSlots, newSlot], deviceFrame, aspect);
};

export const removeSlotFromRow = (
  slots: Slot[],
  slotId: string,
  deviceFrame: DeviceFrame,
  aspect: number,
): Slot[] => {
  return layoutSlotsInRow(
    slots.filter((slot) => slot.id !== slotId),
    deviceFrame,
    aspect,
  );
};

export function applySharedFrameToCanvas(
  canvas: CanvasState,
  state: EditorState,
  deviceFrame: DeviceFrame,
  options: { preservePositions?: boolean } = { preservePositions: true },
): Partial<CanvasState> {
  const sharedFrame = { ...deviceFrame };
  return {
    deviceFrame: sharedFrame,
    slots: layoutSlotsInRow(
      canvas.slots,
      sharedFrame,
      stateCanvasAspect(state),
      options,
    ),
  };
}

export const createScreenshotTile = (
  base: Partial<Slot>,
  zIndex: number,
): Slot => ({
  id: makeId(),
  src: null,
  originalSrc: null,
  lastCropRegion: null,
  xPct: 50,
  yPct: 50,
  widthPct: SLOT_DEFAULT_FALLBACK_WIDTH,
  heightPct: SLOT_DEFAULT_HEIGHT_PCT,
  rotation: 0,
  tilt: { rx: 0, ry: 0, rz: 0 },
  scale: 100,
  zIndex,
  objectFit: "contain",
  ...base,
});

export const mirrorToSlots = (
  slots: Slot[],
  patch: Partial<Slot> | ((slot: Slot) => Partial<Slot>),
): Slot[] =>
  slots.map((slot) => ({
    ...slot,
    ...(typeof patch === "function" ? patch(slot) : patch),
  }));

export const cloneBorder = (border: Border): Border => ({ ...border });
export const cloneShadow = (shadow: Shadow): Shadow => ({ ...shadow });
export const cloneLighting = (
  lighting: LightSourceConfig,
): LightSourceConfig => ({
  ...lighting,
});

export function applySlotStyleDefaults(slot: Slot, canvas: CanvasState) {
  const style = resolveSlotScreenshotStyle(slot, canvas);
  return {
    ...slot,
    border: cloneBorder(style.border),
    borderRadius: style.borderRadius,
    padding: style.padding,
    shadow: cloneShadow(style.shadow),
    lighting: cloneLighting(style.lighting),
  };
}

export type ResolvedScreenshotStyle = {
  tilt: Tilt;
  scale: number;
  shadow: Shadow;
  border: Border;
  borderRadius: number;
  padding: number;
  lighting: LightSourceConfig;
  objectFit: "contain" | "cover" | "fill";
};

export function resolveMainScreenshotStyle(
  canvas: CanvasState,
): ResolvedScreenshotStyle {
  return {
    tilt: canvas.tilt,
    scale: canvas.scale,
    shadow: canvas.shadow,
    border: canvas.border,
    borderRadius: canvas.borderRadius,
    padding: canvas.padding,
    lighting: canvas.backdrop.lighting,
    objectFit: canvas.objectFit ?? "cover",
  };
}

export function resolveSlotScreenshotStyle(
  slot: Slot,
  canvas: CanvasState,
): ResolvedScreenshotStyle {
  return {
    tilt: slot.tilt,
    scale: slot.scale,
    shadow: slot.shadow ?? canvas.shadow,
    border: slot.border ?? canvas.border,
    borderRadius: slot.borderRadius ?? canvas.borderRadius,
    padding: slot.padding ?? canvas.padding,
    lighting: slot.lighting ?? canvas.backdrop.lighting,
    objectFit: slot.objectFit ?? "contain",
  };
}

export type ScreenshotStylePatch = {
  tilt?: Tilt;
  scale?: number;
  rotation?: number;
  shadow?: Shadow;
  border?: Border;
  borderRadius?: number;
  padding?: number;
  lighting?: LightSourceConfig;
  objectFit?: "contain" | "cover" | "fill";
};

export type ScreenshotStyleTarget = "main" | "all" | { slotId: string };

const patchMainCanvasStyle = (
  canvas: CanvasState,
  patch: ScreenshotStylePatch,
): Partial<CanvasState> => {
  const next: Partial<CanvasState> = {};
  if (patch.tilt) next.tilt = patch.tilt;
  if (patch.rotation !== undefined) {
    next.tilt = { ...(next.tilt ?? canvas.tilt), rz: patch.rotation };
  }
  if (patch.scale !== undefined) next.scale = patch.scale;
  if (patch.shadow) next.shadow = patch.shadow;
  if (patch.border) next.border = patch.border;
  if (patch.borderRadius !== undefined) next.borderRadius = patch.borderRadius;
  if (patch.padding !== undefined) next.padding = patch.padding;
  if (patch.objectFit) next.objectFit = patch.objectFit;
  if (patch.lighting) {
    next.backdrop = { ...canvas.backdrop, lighting: patch.lighting };
  }
  return next;
};

const patchSlotStyle = (patch: ScreenshotStylePatch): Partial<Slot> => {
  const next: Partial<Slot> = {};
  if (patch.tilt) next.tilt = { ...patch.tilt };
  if (patch.rotation !== undefined) next.rotation = patch.rotation;
  if (patch.scale !== undefined) next.scale = patch.scale;
  if (patch.shadow) next.shadow = cloneShadow(patch.shadow);
  if (patch.border) next.border = cloneBorder(patch.border);
  if (patch.borderRadius !== undefined) next.borderRadius = patch.borderRadius;
  if (patch.padding !== undefined) next.padding = patch.padding;
  if (patch.objectFit) next.objectFit = patch.objectFit;
  if (patch.lighting) next.lighting = cloneLighting(patch.lighting);
  return next;
};

export function applyScreenshotStyle(
  canvas: CanvasState,
  target: ScreenshotStyleTarget,
  patch: ScreenshotStylePatch,
): Partial<CanvasState> {
  if (target === "main") {
    return patchMainCanvasStyle(canvas, patch);
  }
  if (target === "all") {
    return {
      ...patchMainCanvasStyle(canvas, patch),
      slots: mirrorToSlots(canvas.slots, () => patchSlotStyle(patch)),
    };
  }
  const slotPatch = patchSlotStyle(patch);
  return {
    slots: canvas.slots.map((slot) =>
      slot.id === target.slotId ? { ...slot, ...slotPatch } : slot,
    ),
  };
}

const SCREENSHOT_STYLE_EFFECT: Partial<
  Record<keyof ScreenshotStylePatch, AnimationEffect>
> = {
  tilt: "tilt",
  rotation: "tilt",
  scale: "zoom",
  shadow: "shadow",
  border: "border",
  borderRadius: "borderRadius",
  padding: "padding",
  lighting: "lighting",
};

export function screenshotStyleEffects(
  patch: ScreenshotStylePatch,
): AnimationEffect[] {
  const effects = new Set<AnimationEffect>();
  for (const key of Object.keys(patch) as (keyof ScreenshotStylePatch)[]) {
    const effect = SCREENSHOT_STYLE_EFFECT[key];
    if (effect) effects.add(effect);
  }
  return [...effects];
}

export function screenshotStyleGroup(patch: ScreenshotStylePatch): string {
  return `screenshot-style:${Object.keys(patch).sort().join(",")}`;
}

export function migrateLegacySlot(raw: unknown): Slot {
  const slot = (raw ?? {}) as Partial<Slot> & {
    tilt?: Partial<{ rx: number; ry: number; rz: number }>;
  };
  const base: Partial<Slot> = {};
  if (typeof slot.id === "string") base.id = slot.id;
  if (slot.src === null || typeof slot.src === "string") base.src = slot.src;
  if (slot.originalSrc === null || typeof slot.originalSrc === "string") {
    base.originalSrc = slot.originalSrc;
  }
  if (slot.lastCropRegion) base.lastCropRegion = slot.lastCropRegion;
  if (typeof slot.xPct === "number") base.xPct = slot.xPct;
  if (typeof slot.yPct === "number") base.yPct = slot.yPct;
  if (typeof slot.widthPct === "number") base.widthPct = slot.widthPct;
  if (typeof slot.heightPct === "number") base.heightPct = slot.heightPct;
  if (typeof slot.rotation === "number") base.rotation = slot.rotation;
  if (slot.tilt) {
    base.tilt = {
      rx: slot.tilt.rx ?? 0,
      ry: slot.tilt.ry ?? 0,
      rz: slot.tilt.rz ?? 0,
    };
  }
  if (typeof slot.scale === "number") base.scale = slot.scale;
  if (typeof slot.zIndex === "number") base.zIndex = slot.zIndex;
  if (typeof slot.hidden === "boolean") base.hidden = slot.hidden;
  if (slot.objectFit) base.objectFit = slot.objectFit;
  if (slot.border) base.border = cloneBorder(slot.border);
  if (typeof slot.borderRadius === "number") {
    base.borderRadius = slot.borderRadius;
  }
  if (typeof slot.padding === "number") base.padding = slot.padding;
  if (slot.shadow) base.shadow = cloneShadow(slot.shadow);
  if (slot.lighting) base.lighting = cloneLighting(slot.lighting);
  if (slot.deviceFrame && typeof slot.deviceFrame.id === "string") {
    base.deviceFrame = { ...slot.deviceFrame };
  }
  return createScreenshotTile(base, slot.zIndex ?? 1);
}

export type DuplicableLayerItem = {
  id: string;
  xPct: number;
  yPct: number;
  zIndex: number;
};

export const duplicateLayerItem = <T extends DuplicableLayerItem>(
  items: T[],
  id: string,
  copyId: string,
  nextZ: number,
  options: { offset?: number; maxPct?: number } = {},
): { items: T[]; ok: boolean } => {
  const offset = options.offset ?? 4;
  const maxPct = options.maxPct ?? 95;
  const src = items.find((item) => item.id === id);
  if (!src) return { items, ok: false };
  const copy = {
    ...src,
    id: copyId,
    xPct: Math.min(maxPct, src.xPct + offset),
    yPct: Math.min(maxPct, src.yPct + offset),
    zIndex: nextZ,
  };
  return { items: [...items, copy], ok: true };
};

export const placementAfterCanvas = () => ({ x: 0, y: 0 });
