import {
  resolveMainScreenshotStyle,
  resolveSlotScreenshotStyle,
} from "@/editor/lib/canvas-utils";
import {
  clipPose,
  clipBaseline,
  clipAffectsMain,
  clipAffectsSlot,
  DEFAULT_BASELINE,
  REST_LIGHTING,
} from "@/editor/lib/animation/playback";
import { clipReturnsToDefault } from "@/editor/lib/animation/clip-easing";
import { computeRowLayout } from "@/editor/lib/row-layout";
import type { AspectState } from "@/editor/aspect/types";
import type {
  AnimationClip,
  AnimationClipTarget,
  AnimationEffect,
  ClipBaseline,
  ClipSlotPose,
} from "@/editor/lib/animation/types";
import type { CanvasState } from "./types";
import type { CropRegion } from "@/editor/crop/types";
import type { Shadow } from "@/editor/property-panel/sections/shadow/types";
import type { DeviceFrame } from "@/editor/frames/types";
import type { Slot } from "@/editor/elements/types";

const REST_SHADOW: Shadow = {
  type: "none",
  intensity: 0,
  color: "#000000",
  lightSource: "center",
};

const EFFECT_MAIN_POSE_FIELDS: Record<
  AnimationEffect,
  readonly (keyof ClipBaseline)[]
> = {
  position: ["screenshotOffset"],
  zoom: ["scale"],
  tilt: ["tilt"],
  padding: ["padding"],
  shadow: ["shadow"],
  background: ["background"],
  backdrop: ["backdropAdjustments"],
  lighting: ["lighting"],
  filter: ["filter"],
  overlay: ["overlay"],
  border: ["border"],
  borderRadius: ["borderRadius"],
  crop: ["crop"],
};

const EFFECT_SLOT_POSE_FIELDS: Partial<
  Record<AnimationEffect, readonly (keyof ClipSlotPose)[]>
> = {
  position: ["xPct", "yPct"],
  zoom: ["scale"],
  tilt: ["tilt", "rotation"],
  padding: ["padding"],
  shadow: ["shadow"],
  border: ["border"],
  borderRadius: ["borderRadius"],
  lighting: ["lighting"],
};

const getCanvasAnimation = (
  canvas: CanvasState,
): { durationMs: number; clips: AnimationClip[] } =>
  canvas.animation ?? { durationMs: 5000, clips: [] };

export { getCanvasAnimation };

const poseValueEq = (a: unknown, b: unknown): boolean =>
  a === b || JSON.stringify(a) === JSON.stringify(b);

const overlaySlotPositions = (
  slots: Record<string, ClipSlotPose>,
  from: Record<string, ClipSlotPose>,
): Record<string, ClipSlotPose> =>
  Object.fromEntries(
    Object.entries(slots).map(([id, sp]) => {
      const p = from[id];
      return [
        id,
        p && p.xPct != null && p.yPct != null
          ? { ...sp, xPct: p.xPct, yPct: p.yPct }
          : sp,
      ];
    }),
  );

export { overlaySlotPositions };

export const captureClipPose = (canvas: CanvasState): ClipBaseline => {
  const main = resolveMainScreenshotStyle(canvas);
  return {
    tilt: main.tilt,
    scale: main.scale,
    screenshotOffset: canvas.screenshotOffset,
    padding: main.padding,
    shadow: main.shadow,
    backdropAdjustments: canvas.backdrop.effects,
    lighting: main.lighting,
    background: canvas.background,
    filter: canvas.backdrop.filter,
    overlay: canvas.overlay,
    border: main.border,
    borderRadius: main.borderRadius,
    crop: canvas.lastCropRegion,
    slots: Object.fromEntries(
      canvas.slots.map((s) => {
        const style = resolveSlotScreenshotStyle(s, canvas);
        return [
          s.id,
          {
            tilt: style.tilt,
            scale: style.scale,
            rotation: s.rotation,
            shadow: style.shadow,
            xPct: s.xPct,
            yPct: s.yPct,
            border: style.border,
            borderRadius: style.borderRadius,
            padding: style.padding,
            lighting: style.lighting,
          },
        ];
      }),
    ),
  };
};

const poseCrop = (pose: ClipBaseline, live: CropRegion | null) =>
  pose.crop !== undefined ? pose.crop : live;

export const applyPoseToCanvas = (
  canvas: CanvasState,
  pose: ClipBaseline,
): Partial<CanvasState> => ({
  tilt: pose.tilt,
  scale: pose.scale,
  screenshotOffset: pose.screenshotOffset,
  padding: pose.padding,
  shadow: pose.shadow,
  background: pose.background,
  overlay: pose.overlay ?? canvas.overlay,
  border: pose.border ?? canvas.border,
  borderRadius: pose.borderRadius ?? canvas.borderRadius,
  lastCropRegion: poseCrop(pose, canvas.lastCropRegion),
  backdrop: {
    ...canvas.backdrop,
    effects: pose.backdropAdjustments,
    lighting: pose.lighting ?? canvas.backdrop.lighting,
    filter: pose.filter ?? canvas.backdrop.filter,
  },
  slots: canvas.slots.map((s) => {
    const sp = pose.slots[s.id];
    if (!sp) return s;
    return {
      ...s,
      tilt: sp.tilt,
      scale: sp.scale,
      rotation: sp.rotation,
      ...(sp.shadow ? { shadow: sp.shadow } : {}),
      ...(sp.xPct != null && sp.yPct != null
        ? { xPct: sp.xPct, yPct: sp.yPct }
        : {}),
      ...(sp.border ? { border: sp.border } : {}),
      ...(sp.borderRadius != null ? { borderRadius: sp.borderRadius } : {}),
      ...(sp.padding != null ? { padding: sp.padding } : {}),
      ...(sp.lighting ? { lighting: sp.lighting } : {}),
    };
  }),
});

export const buildRestingPose = (
  clips: readonly AnimationClip[],
): ClipBaseline | null => {
  const sorted = [...clips].sort((a, b) => a.startMs - b.startMs);
  if (sorted.length === 0) return null;
  const base = clipBaseline(sorted[0]);

  const effectOwner = (
    owns: (c: AnimationClip) => boolean,
  ): AnimationClip | null => {
    let owner: AnimationClip | null = null;
    for (const c of sorted) {
      if (owns(c)) owner = c;
    }
    if (owner && !clipReturnsToDefault(owner)) return owner;
    return null;
  };

  const ownsMain = (effect: AnimationEffect) => (c: AnimationClip) =>
    clipAffectsMain(c) && (c.effects ?? []).includes(effect);
  const ownsSlot =
    (slotId: string, effect: AnimationEffect) => (c: AnimationClip) =>
      clipAffectsSlot(c, slotId) && (c.effects ?? []).includes(effect);

  const mainVal = <V>(
    effect: AnimationEffect,
    extract: (p: ClipBaseline) => V,
    def: V,
  ): V => {
    const owner = effectOwner(ownsMain(effect));
    return owner ? extract(clipPose(owner)) : def;
  };

  return {
    tilt: mainVal("tilt", (p) => p.tilt, base.tilt ?? { rx: 0, ry: 0, rz: 0 }),
    scale: mainVal("zoom", (p) => p.scale, base.scale ?? 100),
    screenshotOffset: mainVal(
      "position",
      (p) => p.screenshotOffset,
      base.screenshotOffset ?? { x: 0, y: 0 },
    ),
    padding: mainVal("padding", (p) => p.padding, base.padding ?? 0),
    borderRadius: mainVal(
      "borderRadius",
      (p) => p.borderRadius,
      base.borderRadius,
    ),
    shadow: mainVal("shadow", (p) => p.shadow, base.shadow ?? REST_SHADOW),
    background: mainVal("background", (p) => p.background, base.background),
    filter: mainVal("filter", (p) => p.filter, base.filter),
    overlay: mainVal("overlay", (p) => p.overlay, base.overlay),
    border: mainVal("border", (p) => p.border, base.border),
    crop: mainVal("crop", (p) => p.crop, base.crop),
    backdropAdjustments: mainVal(
      "backdrop",
      (p) => p.backdropAdjustments,
      base.backdropAdjustments,
    ),
    lighting: mainVal("lighting", (p) => p.lighting, base.lighting),
    slots: Object.fromEntries(
      Object.keys(base.slots).map((id) => {
        const baseSlot = base.slots[id];
        const slotVal = <V>(
          effect: AnimationEffect,
          extract: (sp: ClipSlotPose) => V | undefined,
          def: V,
        ): V => {
          const owner = effectOwner(ownsSlot(id, effect));
          return (
            (owner && owner.pose?.slots[id]
              ? extract(owner.pose.slots[id])
              : undefined) ?? def
          );
        };
        return [
          id,
          {
            tilt: slotVal(
              "tilt",
              (s) => s.tilt,
              baseSlot?.tilt ?? { rx: 0, ry: 0, rz: 0 },
            ),
            rotation: slotVal("tilt", (s) => s.rotation, baseSlot?.rotation ?? 0),
            scale: slotVal("zoom", (s) => s.scale, baseSlot?.scale ?? 100),
            shadow: slotVal(
              "shadow",
              (s) => s.shadow,
              baseSlot?.shadow ?? REST_SHADOW,
            ),
            xPct: slotVal("position", (s) => s.xPct, baseSlot?.xPct),
            yPct: slotVal("position", (s) => s.yPct, baseSlot?.yPct),
            border: slotVal("border", (s) => s.border, baseSlot?.border),
            borderRadius: slotVal(
              "borderRadius",
              (s) => s.borderRadius,
              baseSlot?.borderRadius,
            ),
            padding: slotVal("padding", (s) => s.padding, baseSlot?.padding),
            lighting: slotVal("lighting", (s) => s.lighting, baseSlot?.lighting),
          },
        ];
      }),
    ),
  };
};

export const mergeEffectsIntoPose = (
  basePose: ClipBaseline,
  before: ClipBaseline,
  edited: ClipBaseline,
  effects: AnimationEffect[],
): ClipBaseline => {
  const next: ClipBaseline = { ...basePose, slots: { ...basePose.slots } };
  const nextRec = next as Record<string, unknown>;
  for (const effect of effects) {
    for (const field of EFFECT_MAIN_POSE_FIELDS[effect]) {
      if (poseValueEq(before[field], edited[field])) continue;
      nextRec[field] = edited[field];
    }
    const slotFields = EFFECT_SLOT_POSE_FIELDS[effect];
    if (!slotFields) continue;
    for (const [slotId, editedSlot] of Object.entries(edited.slots)) {
      const target = next.slots[slotId];
      if (!target) continue;
      const beforeSlot = before.slots[slotId];
      let mergedSlot = target;
      for (const field of slotFields) {
        if (poseValueEq(beforeSlot?.[field], editedSlot[field])) continue;
        if (mergedSlot === target) mergedSlot = { ...target };
        (mergedSlot as Record<string, unknown>)[field] = editedSlot[field];
      }
      if (mergedSlot !== target) next.slots[slotId] = mergedSlot;
    }
  }
  return next;
};

export const resolveSelectionTarget = (
  canvas: CanvasState,
  selectedSlotId: string | null,
  isScreenshotSelected: boolean,
): AnimationClipTarget => {
  if (
    selectedSlotId &&
    canvas.slots.some((s) => s.id === selectedSlotId)
  ) {
    return { scope: "slot", slotId: selectedSlotId };
  }
  if (isScreenshotSelected) return { scope: "main" };
  return { scope: "main" };
};

const POSITION_BASE_CANVAS_WIDTH = 1100;
const mainPositionBase = (
  aspect: AspectState,
  deviceFrame: DeviceFrame,
  slots: Slot[],
) => {
  const aw = aspect.w || 16;
  const ah = aspect.h || 10;
  const width = POSITION_BASE_CANVAS_WIDTH;
  const height = (POSITION_BASE_CANVAS_WIDTH * ah) / aw;
  let baseX = 50;
  const baseY = 50;

  if (slots.length > 0) {
    const rowLayout = computeRowLayout(
      [
        { id: "__main__", deviceFrame },
        ...slots.map((s) => ({ id: s.id, deviceFrame: s.deviceFrame ?? deviceFrame })),
      ],
      aw / ah,
    );
    const mainLayout = rowLayout[0];
    if (mainLayout) {
      baseX = mainLayout.xPct;
    }
  }
  return { width, height, baseX, baseY };
};

export const mainPositionPoint = (
  aspect: AspectState,
  deviceFrame: DeviceFrame,
  offset: { x: number; y: number },
  slots: Slot[],
) => {
  const { width, height, baseX, baseY } = mainPositionBase(
    aspect,
    deviceFrame,
    slots,
  );
  return {
    xPct: baseX + (offset.x / width) * 100,
    yPct: baseY + (offset.y / height) * 100,
  };
};

export const mainPositionOffsetForPoint = (
  aspect: AspectState,
  deviceFrame: DeviceFrame,
  slots: Slot[],
  point: { xPct: number; yPct: number },
) => {
  const { width, height, baseX, baseY } = mainPositionBase(
    aspect,
    deviceFrame,
    slots,
  );
  return {
    x: ((point.xPct - baseX) / 100) * width,
    y: ((point.yPct - baseY) / 100) * height,
  };
};

export const resolveKeyframePose = (
  canvas: CanvasState,
  clips: AnimationClip[],
  target: AnimationClip,
): ClipBaseline => {
  const sorted = [...clips].sort((a, b) => a.startMs - b.startMs);
  const basePose =
    sorted.length > 0 ? clipBaseline(sorted[0]) : captureClipPose(canvas);

  const activeOwner = (
    owns: (c: AnimationClip) => boolean,
  ): AnimationClip | null => {
    if (owns(target)) return target;
    let earlierOwner: AnimationClip | null = null;
    for (const c of clips) {
      if (!owns(c)) continue;
      if (
        c.startMs < target.startMs &&
        (!earlierOwner || c.startMs >= earlierOwner.startMs)
      ) {
        earlierOwner = c;
      }
    }
    if (earlierOwner && !clipReturnsToDefault(earlierOwner)) {
      return earlierOwner;
    }
    return null;
  };

  const ownsMain = (effect: AnimationEffect) => (c: AnimationClip) =>
    clipAffectsMain(c) && (c.effects ?? []).includes(effect);
  const ownsSlot =
    (slotId: string, effect: AnimationEffect) => (c: AnimationClip) =>
      clipAffectsSlot(c, slotId) && (c.effects ?? []).includes(effect);

  const main = <V>(
    effect: AnimationEffect,
    extract: (p: ClipBaseline) => V,
    rest: V,
  ): V => {
    const owner = activeOwner(ownsMain(effect));
    if (owner) return extract(clipPose(owner));
    return rest;
  };

  const mainReveal = <V>(
    effect: AnimationEffect,
    extract: (p: ClipBaseline) => V,
    fallbackVal: V,
  ): V => {
    const owner = activeOwner(ownsMain(effect));
    if (owner) return extract(clipPose(owner));
    return fallbackVal;
  };

  return {
    tilt: main("tilt", (p) => p.tilt, basePose.tilt ?? { rx: 0, ry: 0, rz: 0 }),
    scale: main("zoom", (p) => p.scale, basePose.scale ?? 100),
    screenshotOffset: main(
      "position",
      (p) => p.screenshotOffset,
      basePose.screenshotOffset ?? { x: 0, y: 0 },
    ),
    padding: main("padding", (p) => p.padding, basePose.padding ?? 0),
    borderRadius: main(
      "borderRadius",
      (p) => p.borderRadius ?? canvas.borderRadius,
      basePose.borderRadius ?? DEFAULT_BASELINE.borderRadius ?? 0,
    ),
    shadow: main("shadow", (p) => p.shadow, basePose.shadow ?? REST_SHADOW),
    background: main("background", (p) => p.background, basePose.background),
    filter: mainReveal(
      "filter",
      (p) => p.filter ?? "none",
      basePose.filter ?? "none",
    ),
    overlay: mainReveal(
      "overlay",
      (p) => p.overlay ?? canvas.overlay,
      basePose.overlay ?? canvas.overlay,
    ),
    border: mainReveal(
      "border",
      (p) => p.border ?? canvas.border,
      basePose.border ?? canvas.border,
    ),
    crop: mainReveal(
      "crop",
      (p) => poseCrop(p, canvas.lastCropRegion),
      poseCrop(basePose, canvas.lastCropRegion),
    ),
    backdropAdjustments: main(
      "backdrop",
      (p) => p.backdropAdjustments,
      basePose.backdropAdjustments ?? DEFAULT_BASELINE.backdropAdjustments,
    ),
    lighting: main(
      "lighting",
      (p) => p.lighting ?? canvas.backdrop.lighting,
      basePose.lighting ?? REST_LIGHTING,
    ),
    slots: Object.fromEntries(
      canvas.slots.map((s) => {
        const committed: ClipSlotPose = {
          tilt: s.tilt,
          scale: s.scale,
          rotation: s.rotation,
          shadow: s.shadow ?? canvas.shadow,
          xPct: s.xPct,
          yPct: s.yPct,
        };
        const baseSlot = basePose.slots[s.id];
        const slot = (effect: AnimationEffect, rest: ClipSlotPose) => {
          const owner = activeOwner(ownsSlot(s.id, effect));
          if (owner) return clipPose(owner).slots[s.id] ?? rest;
          return baseSlot ?? committed;
        };
        const t = slot("tilt", {
          ...committed,
          tilt: { rx: 0, ry: 0, rz: 0 },
          rotation: 0,
        });
        const z = slot("zoom", { ...committed, scale: 100 });
        const sh = slot("shadow", { ...committed, shadow: REST_SHADOW });

        const slotReveal = <V>(
          effect: AnimationEffect,
          extract: (sp: ClipSlotPose | undefined) => V | undefined,
          committedVal: V,
        ): V => {
          const owner = activeOwner(ownsSlot(s.id, effect));
          if (owner) {
            const src = clipPose(owner).slots[s.id];
            return extract(src) ?? committedVal;
          }
          return extract(baseSlot) ?? committedVal;
        };
        return [
          s.id,
          {
            tilt: t.tilt,
            rotation: t.rotation,
            scale: z.scale,
            shadow: sh.shadow ?? committed.shadow,
            xPct: slotReveal("position", (sp) => sp?.xPct, s.xPct),
            yPct: slotReveal("position", (sp) => sp?.yPct, s.yPct),
            border: slotReveal(
              "border",
              (sp) => sp?.border,
              s.border ?? canvas.border,
            ),
            borderRadius: slotReveal(
              "borderRadius",
              (sp) => sp?.borderRadius,
              s.borderRadius ?? canvas.borderRadius,
            ),
            padding: slotReveal(
              "padding",
              (sp) => sp?.padding,
              s.padding ?? canvas.padding,
            ),
            lighting: slotReveal(
              "lighting",
              (sp) => sp?.lighting,
              s.lighting ?? canvas.backdrop.lighting,
            ),
          },
        ];
      }),
    ),
  };
};
