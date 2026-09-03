import { colord } from "colord";
import {
  clipProgressEase,
  clipReleaseEase,
  clipReleaseMs,
  clipReturnsToDefault,
} from "./clip-easing";
import { DEFAULT_STATE } from "@/editor/lib/engine-core/initial-config";
import type {
  AnimationClip,
  AnimationClipTarget,
  AnimationEffect,
  ClipBaseline,
  ClipSlotPose,
} from "./types";
import type {
  BackdropAdjustments,
  BackdropFilterKind,
  LightSourceConfig,
  OverlayConfig,
} from "@/editor/property-panel/sections/backdrop/types";
import type { Background } from "@/editor/property-panel/sections/background/types";
import type { Border } from "@/editor/property-panel/sections/border/types";
import type { CropRegion } from "@/editor/crop/types";
import type { Shadow } from "@/editor/property-panel/sections/shadow/types";
import type { Tilt } from "@/editor/property-panel/sections/transform/types";

export const FULL_CROP_REGION: CropRegion = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

export const DEFAULT_BASELINE: ClipBaseline = {
  tilt: DEFAULT_STATE.tilt,
  scale: DEFAULT_STATE.scale,
  screenshotOffset: DEFAULT_STATE.screenshotOffset,
  padding: DEFAULT_STATE.padding,
  shadow: DEFAULT_STATE.shadow,
  backdropAdjustments: DEFAULT_STATE.backdrop.effects,
  lighting: DEFAULT_STATE.backdrop.lighting,
  background: DEFAULT_STATE.background,
  filter: DEFAULT_STATE.backdrop.filter,
  overlay: DEFAULT_STATE.overlay,
  border: DEFAULT_STATE.border,
  borderRadius: DEFAULT_STATE.borderRadius,
  crop: FULL_CROP_REGION,
  slots: {},
};

export const REST_LIGHTING: LightSourceConfig = {
  ...DEFAULT_STATE.backdrop.lighting,
  intensity: 0,
};

export function lightingEntranceRest(
  lighting?: LightSourceConfig,
): LightSourceConfig {
  const base = lighting ?? REST_LIGHTING;
  return { ...base, intensity: 0 };
}

export function clipBaseline(clip: AnimationClip): ClipBaseline {
  return clip.baseline ?? DEFAULT_BASELINE;
}

export const NEUTRAL_SLOT_POSE: ClipSlotPose = {
  tilt: { rx: 0, ry: 0, rz: 0 },
  scale: 100,
  rotation: 0,
  shadow: {
    type: "none",
    intensity: 0,
    color: "#000000",
    lightSource: "center",
  },
};

export function clipPose(clip: AnimationClip): ClipBaseline {
  return clip.pose ?? clip.baseline ?? DEFAULT_BASELINE;
}

function lightingGridPoint(direction: string): { r: number; c: number } {
  if (direction === "center") return { r: 2, c: 2 };
  const match = direction.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
  const r = Number(match?.[1]);
  const c = Number(match?.[2]);
  return { r: Number.isFinite(r) ? r : 2, c: Number.isFinite(c) ? c : 2 };
}

function lerpHexColor(from: string, to: string, p: number): string {
  const a = colord(from || "#ffffff").toRgb();
  const b = colord(to || "#ffffff").toRgb();
  const ch = (x: number, y: number) =>
    Math.round(clampChannel(lerp(x, y, p)))
      .toString(16)
      .padStart(2, "0");
  return `#${ch(a.r, b.r)}${ch(a.g, b.g)}${ch(a.b, b.b)}`;
}

function clampChannel(n: number) {
  return n < 0 ? 0 : n > 255 ? 255 : n;
}

export function lightingBetween(
  from: LightSourceConfig,
  to: LightSourceConfig,
  p: number,
): LightSourceConfig {
  const a = lightingGridPoint(from.direction);
  const b = lightingGridPoint(to.direction);
  return {
    target: to.target,
    intensity: lerp(from.intensity, to.intensity, p),
    direction: `${lerp(a.r, b.r, p)}-${lerp(a.c, b.c, p)}`,
    color: lerpHexColor(from.color, to.color, p),
  };
}

export function lightingSidesUsed(
  clips: readonly AnimationClip[],
  committed: LightSourceConfig,
): { inner: boolean; outer: boolean } {
  let inner = committed.intensity > 0 && committed.target === "inner";
  let outer = committed.intensity > 0 && committed.target === "outer";

  for (const c of clips) {
    if (!clipOwns(c, "lighting")) continue;

    if (!clipAffectsMain(c)) continue;

    const pose = clipPose(c).lighting;
    if (pose) {
      if (pose.target === "inner") inner = true;
      if (pose.target === "outer") outer = true;
    }
    const base = clipBaseline(c).lighting;

    if (base && base.intensity > 0) {
      if (base.target === "inner") inner = true;
      if (base.target === "outer") outer = true;
    }
  }

  return { inner, outer };
}

export function lightingTargetMixAt(
  frames: readonly {
    startMs: number;
    durationMs: number;
    value: LightSourceConfig;
    ease?: (rawT: number) => number;
    releaseMs?: number;
    releaseEase?: (rawT: number) => number;
  }[],
  timeMs: number,
  rest: LightSourceConfig,
): number {
  if (frames.length === 0) {
    return rest.target === "inner" ? 1 : 0;
  }
  const sides = new Set<string>();
  sides.add(rest.target === "inner" ? "inner" : "outer");
  for (const f of frames) {
    sides.add(f.value.target === "inner" ? "inner" : "outer");
  }
  if (sides.size === 1) {
    return sides.has("inner") ? 1 : 0;
  }
  const restMix = rest.target === "inner" ? 1 : 0;
  return (
    sampleKeyframes<number>(
      frames.map((f) => ({
        startMs: f.startMs,
        durationMs: f.durationMs,
        value: f.value.target === "inner" ? 1 : 0,
        ease: f.ease,

        releaseMs: f.releaseMs,
        releaseEase: f.releaseEase,
      })),
      timeMs,
      restMix,
      lerp,
    ) ?? restMix
  );
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clipTargetOf(clip: AnimationClip): AnimationClipTarget {
  return clip.target ?? { scope: "all" };
}

function shadowInvisible(s: Shadow): boolean {
  return s.type === "none" || s.intensity <= 0;
}

function borderVisible(b: Border): boolean {
  return !!b.color && b.width > 0;
}

export const INVISIBLE_BORDER: Border = {
  color: null,
  width: 0,
  style: "solid",
  padding: 0,
};

export function borderBetween(from: Border, to: Border, p: number): Border {
  const fromVis = borderVisible(from);
  const toVis = borderVisible(to);

  const fromRgb = colord(from.color || to.color || "#ffffff").toRgb();
  const toRgb = colord(to.color || from.color || "#ffffff").toRgb();
  const r = Math.round(clampChannel(lerp(fromRgb.r, toRgb.r, p)));
  const g = Math.round(clampChannel(lerp(fromRgb.g, toRgb.g, p)));
  const b = Math.round(clampChannel(lerp(fromRgb.b, toRgb.b, p)));
  const a = clamp01(lerp(fromVis ? 1 : 0, toVis ? 1 : 0, p));
  return {
    color: `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`,
    width: lerp(from.width, to.width, p),
    style: p >= 0.5 ? (to.style ?? "solid") : (from.style ?? "solid"),
    padding: lerp(from.padding, to.padding, p),
  };
}

function parseLightSource(ls: string): { r: number; c: number } {
  if (ls === "center") return { r: 2, c: 2 };
  const [r, c] = ls.split("-").map(Number);
  return { r: Number.isFinite(r) ? r : 2, c: Number.isFinite(c) ? c : 2 };
}

function shadowBetween(from: Shadow, to: Shadow, p: number): Shadow {
  const sameType = from.type === to.type;
  const fromIntensity = shadowInvisible(from) ? 0 : from.intensity;
  const toLs = parseLightSource(to.lightSource);
  const fromLs = sameType ? parseLightSource(from.lightSource) : toLs;
  return {
    ...to,
    intensity: lerp(fromIntensity, to.intensity, p),
    lightSource: `${lerp(fromLs.r, toLs.r, p)}-${lerp(fromLs.c, toLs.c, p)}`,
  };
}

export function sampleShadowLayers(
  frames: readonly {
    startMs: number;
    durationMs: number;
    value: Shadow;
    ease?: (rawT: number) => number;
    releaseMs?: number;
    releaseEase?: (rawT: number) => number;
  }[],
  timeMs: number,
  rest: Shadow,
): Shadow[] | null {
  if (frames.length === 0) return null;
  const sorted = [...frames].sort((a, b) => a.startMs - b.startMs);

  const releaseProgress = (i: number, at: number): number => {
    const f = sorted[i];
    const release = f.releaseMs ?? 0;
    if (release <= 0) return 0;
    const raw = clamp01((at - (f.startMs + f.durationMs)) / release);
    return raw <= 0 ? 0 : (f.releaseEase ?? easeOut)(raw);
  };

  const releasedLayers = (i: number, at: number): Shadow[] => {
    const p = releaseProgress(i, at);
    return p <= 0 ? [sorted[i].value] : layersBetween(sorted[i].value, rest, p);
  };

  if (timeMs < sorted[0].startMs) return [rest];
  for (let i = 0; i < sorted.length; i++) {
    const f = sorted[i];

    if (timeMs < f.startMs) return releasedLayers(i - 1, timeMs);
    if (timeMs <= f.startMs + f.durationMs) {
      const from = i > 0 ? releasedLayers(i - 1, f.startMs) : [rest];
      const p = (f.ease ?? easeOut)(
        clamp01((timeMs - f.startMs) / f.durationMs),
      );

      return from.length === 1
        ? layersBetween(from[0], f.value, p)
        : [
            ...from.map((s) => ({ ...s, intensity: lerp(s.intensity, 0, p) })),
            { ...f.value, intensity: lerp(0, f.value.intensity, p) },
          ];
    }
  }
  return releasedLayers(sorted.length - 1, timeMs);
}

function layersBetween(from: Shadow, to: Shadow, p: number): Shadow[] {
  const fromVisible = !shadowInvisible(from);
  const toVisible = !shadowInvisible(to);

  if (fromVisible && !toVisible) {
    return [{ ...from, intensity: lerp(from.intensity, 0, p) }];
  }

  if (fromVisible && toVisible && from.type !== to.type) {
    return [
      { ...from, intensity: lerp(from.intensity, 0, p) },
      { ...to, intensity: lerp(0, to.intensity, p) },
    ];
  }

  return [shadowBetween(from, to, p)];
}

export function backdropAdjustmentsBetween(
  from: BackdropAdjustments,
  to: BackdropAdjustments,
  p: number,
): BackdropAdjustments {
  return {
    noise: lerp(from.noise, to.noise, p),
    blur: lerp(from.blur, to.blur, p),
    brightness: lerp(from.brightness, to.brightness, p),
    contrast: lerp(from.contrast, to.contrast, p),
    saturation: lerp(from.saturation, to.saturation, p),
    hue: lerp(from.hue, to.hue, p),
    grayscale: lerp(from.grayscale, to.grayscale, p),
    sepia: lerp(from.sepia, to.sepia, p),
    invert: lerp(from.invert, to.invert, p),
    opacity: lerp(from.opacity, to.opacity, p),
  };
}

export function cropRegionBetween(
  from: CropRegion,
  to: CropRegion,
  p: number,
): CropRegion {
  return {
    x: lerp(from.x, to.x, p),
    y: lerp(from.y, to.y, p),
    width: lerp(from.width, to.width, p),
    height: lerp(from.height, to.height, p),
  };
}

export function clipOwns(
  clip: AnimationClip,
  effect: AnimationEffect,
): boolean {
  return (clip.effects ?? []).includes(effect);
}

export const backgroundLayerOpacityVar = (clipId: string) =>
  `--canvas-bg-op-${clipId}`;

export type AnimateBgLayer = {
  id: string;
  background: Background;
  restOpaque: boolean;
};

export type AnimateBgStack = {
  base: Background | null;
  layers: AnimateBgLayer[];
};

export const EMPTY_BG_STACK: AnimateBgStack = { base: null, layers: [] };

export function resolveAnimateBgStack(
  clips: readonly AnimationClip[],
  committedBackground: Background,
  selectedClipId: string | null,
): AnimateBgStack {
  const sorted = [...clips].sort((a, b) => a.startMs - b.startMs);
  const isBgKeyframe = (c: AnimationClip) =>
    clipAffectsMain(c) && clipOwns(c, "background");
  const bgClips = sorted.filter(isBgKeyframe);
  if (bgClips.length === 0) return EMPTY_BG_STACK;

  const base = clipBaseline(bgClips[0]).background;

  const selectedClip = selectedClipId
    ? (clips.find((c) => c.id === selectedClipId) ?? null)
    : null;

  const layers: AnimateBgLayer[] = bgClips.map((c) => {
    let restOpaque = false;
    if (selectedClip) {
      if (c.id === selectedClip.id) {
        restOpaque = true;
      } else if (c.startMs < selectedClip.startMs) {
        restOpaque = !clipReturnsToDefault(c);
      } else {
        restOpaque = false;
      }
    } else {
      const lastBg = bgClips[bgClips.length - 1];
      restOpaque = c.id === lastBg.id && !clipReturnsToDefault(c);
    }
    return {
      id: c.id,
      background:
        c.id === selectedClipId ? committedBackground : clipPose(c).background,
      restOpaque,
    };
  });
  return { base, layers };
}

export const filterLayerOpacityVar = (clipId: string) =>
  `--canvas-filter-op-${clipId}`;

export type AnimateFilterLayer = {
  id: string;
  filter: BackdropFilterKind;
  restOpaque: boolean;
};

export type AnimateFilterStack = {
  base: BackdropFilterKind;
  layers: AnimateFilterLayer[];
};

export const EMPTY_FILTER_STACK: AnimateFilterStack = {
  base: "none",
  layers: [],
};

export function resolveAnimateFilterStack(
  clips: readonly AnimationClip[],
  committedFilter: BackdropFilterKind,
  selectedClipId: string | null,
): AnimateFilterStack {
  const sorted = [...clips].sort((a, b) => a.startMs - b.startMs);
  const isFilterKeyframe = (c: AnimationClip) =>
    clipAffectsMain(c) && clipOwns(c, "filter");
  const filterClips = sorted.filter(isFilterKeyframe);
  if (filterClips.length === 0) return EMPTY_FILTER_STACK;

  const base = clipBaseline(filterClips[0]).filter ?? "none";

  const selectedClip = selectedClipId
    ? (clips.find((c) => c.id === selectedClipId) ?? null)
    : null;

  const layers: AnimateFilterLayer[] = filterClips.map((c) => {
    let restOpaque = false;
    if (selectedClip) {
      if (c.id === selectedClip.id) {
        restOpaque = true;
      } else if (c.startMs < selectedClip.startMs) {
        restOpaque = !clipReturnsToDefault(c);
      } else {
        restOpaque = false;
      }
    } else {
      const last = filterClips[filterClips.length - 1];
      restOpaque = c.id === last.id && !clipReturnsToDefault(c);
    }
    return {
      id: c.id,
      filter:
        c.id === selectedClipId
          ? committedFilter
          : (clipPose(c).filter ?? "none"),
      restOpaque,
    };
  });
  return { base, layers };
}

export const overlayLayerOpacityVar = (clipId: string) =>
  `--canvas-overlay-op-${clipId}`;

export const OVERLAY_BASE_OPACITY_VAR = "--canvas-overlay-op-base";

export type AnimateOverlayLayer = {
  id: string;
  overlay: OverlayConfig;
  restOpaque: boolean;
};

export type AnimateOverlayStack = {
  base: OverlayConfig;
  layers: AnimateOverlayLayer[];
};

export const EMPTY_OVERLAY_STACK: AnimateOverlayStack = {
  base: DEFAULT_STATE.overlay,
  layers: [],
};

export function resolveAnimateOverlayStack(
  clips: readonly AnimationClip[],
  committedOverlay: OverlayConfig,
  selectedClipId: string | null,
): AnimateOverlayStack {
  const sorted = [...clips].sort((a, b) => a.startMs - b.startMs);
  const isOverlayKeyframe = (c: AnimationClip) =>
    clipAffectsMain(c) && clipOwns(c, "overlay");
  const overlayClips = sorted.filter(isOverlayKeyframe);
  if (overlayClips.length === 0) return EMPTY_OVERLAY_STACK;

  const base = clipBaseline(overlayClips[0]).overlay ?? DEFAULT_STATE.overlay;

  const selectedClip = selectedClipId
    ? (clips.find((c) => c.id === selectedClipId) ?? null)
    : null;

  const layers: AnimateOverlayLayer[] = overlayClips.map((c) => {
    let restOpaque = false;
    if (selectedClip) {
      if (c.id === selectedClip.id) {
        restOpaque = true;
      } else if (c.startMs < selectedClip.startMs) {
        restOpaque = !clipReturnsToDefault(c);
      } else {
        restOpaque = false;
      }
    } else {
      const last = overlayClips[overlayClips.length - 1];
      restOpaque = c.id === last.id && !clipReturnsToDefault(c);
    }
    return {
      id: c.id,
      overlay:
        c.id === selectedClipId
          ? committedOverlay
          : (clipPose(c).overlay ?? DEFAULT_STATE.overlay),
      restOpaque,
    };
  });
  return { base, layers };
}

export function sampleKeyframes<V>(
  frames: readonly {
    startMs: number;
    durationMs: number;
    value: V;
    ease?: (rawT: number) => number;
    releaseMs?: number;
    releaseEase?: (rawT: number) => number;
  }[],
  timeMs: number,
  rest: V,
  lerpValue: (from: V, to: V, p: number) => V,
): V | null {
  if (frames.length === 0) return null;
  const sorted = [...frames].sort((a, b) => a.startMs - b.startMs);

  const settledAt = (i: number, at: number): V => {
    const f = sorted[i];
    const release = f.releaseMs ?? 0;
    if (release <= 0) return f.value;
    const p = clamp01((at - (f.startMs + f.durationMs)) / release);
    if (p <= 0) return f.value;
    return lerpValue(f.value, rest, (f.releaseEase ?? easeOut)(p));
  };

  if (timeMs < sorted[0].startMs) return rest;
  for (let i = 0; i < sorted.length; i++) {
    const f = sorted[i];
    if (timeMs < f.startMs) return settledAt(i - 1, timeMs);
    if (timeMs <= f.startMs + f.durationMs) {
      const from = i > 0 ? settledAt(i - 1, f.startMs) : rest;
      const ease = f.ease ?? easeOut;
      return lerpValue(
        from,
        f.value,
        ease(clamp01((timeMs - f.startMs) / f.durationMs)),
      );
    }
  }
  return settledAt(sorted.length - 1, timeMs);
}

export function clipAffectsMain(clip: AnimationClip): boolean {
  const t = clipTargetOf(clip);
  return t.scope === "main" || t.scope === "all";
}

export function clipAffectsSlot(clip: AnimationClip, slotId: string): boolean {
  const t = clipTargetOf(clip);
  return t.scope === "all" || (t.scope === "slot" && t.slotId === slotId);
}

export function clipSharesLayer(
  a: AnimationClip["target"] | undefined,
  b: AnimationClip["target"] | undefined,
): boolean {
  const aSlot = a?.scope === "slot";
  const bSlot = b?.scope === "slot";
  if (aSlot || bSlot) return aSlot && bSlot && a?.slotId === b?.slotId;
  return true;
}

export function clipsProgressAt(
  clips: readonly AnimationClip[],
  timeMs: number,
): number {
  if (clips.length === 0) return 1;
  const sorted = [...clips].sort((a, b) => a.startMs - b.startMs);

  const settledAt = (c: AnimationClip, at: number): number => {
    const release = clipReleaseMs(c);
    if (release <= 0) return 1;
    const p = clamp01((at - (c.startMs + c.durationMs)) / release);
    return 1 - clipReleaseEase(c)(p);
  };

  if (timeMs < sorted[0].startMs) return 0;
  for (let i = 0; i < sorted.length; i++) {
    const c = sorted[i];
    if (timeMs < c.startMs) return settledAt(sorted[i - 1], timeMs);
    if (timeMs <= c.startMs + c.durationMs) {
      return clipProgressEase(c)((timeMs - c.startMs) / c.durationMs);
    }
  }
  return settledAt(sorted[sorted.length - 1], timeMs);
}

const tiltLerp = (a: Tilt, b: Tilt, p: number): Tilt => ({
  rx: lerp(a.rx, b.rx, p),
  ry: lerp(a.ry, b.ry, p),
  rz: lerp(a.rz, b.rz, p),
});

export function poseAtCut(
  fromPose: ClipBaseline,
  toPose: ClipBaseline,
  fraction: number,
  effects: readonly AnimationEffect[],
  affectsMain: boolean,
  affectedSlotIds: readonly string[],
  mainPosition?: (easedProgress: number) => {
    screenshotOffset: { x: number; y: number };
  },
): ClipBaseline {
  const p = easeOut(clamp01(fraction));
  const owns = (e: AnimationEffect) => effects.includes(e);
  const disc = <V>(from: V, to: V): V => (p >= 0.5 ? to : from);
  const mid: ClipBaseline = { ...toPose, slots: { ...toPose.slots } };

  if (affectsMain) {
    if (owns("tilt")) mid.tilt = tiltLerp(fromPose.tilt, toPose.tilt, p);
    if (owns("zoom")) mid.scale = lerp(fromPose.scale, toPose.scale, p);
    if (owns("position")) {
      if (mainPosition) {
        const r = mainPosition(p);
        mid.screenshotOffset = r.screenshotOffset;
      } else {
        mid.screenshotOffset = {
          x: lerp(fromPose.screenshotOffset.x, toPose.screenshotOffset.x, p),
          y: lerp(fromPose.screenshotOffset.y, toPose.screenshotOffset.y, p),
        };
      }
    }
    if (owns("padding"))
      mid.padding = lerp(fromPose.padding, toPose.padding, p);
    if (owns("borderRadius")) {
      mid.borderRadius = lerp(
        fromPose.borderRadius ?? 0,
        toPose.borderRadius ?? 0,
        p,
      );
    }
    if (owns("shadow")) {
      mid.shadow = shadowBetween(fromPose.shadow, toPose.shadow, p);
    }
    if (owns("backdrop")) {
      mid.backdropAdjustments = backdropAdjustmentsBetween(
        fromPose.backdropAdjustments,
        toPose.backdropAdjustments,
        p,
      );
    }
    if (owns("lighting")) {
      const from = fromPose.lighting ?? REST_LIGHTING;
      mid.lighting = lightingBetween(from, toPose.lighting ?? from, p);
    }
    if (owns("border")) {
      const from = fromPose.border ?? INVISIBLE_BORDER;
      mid.border = borderBetween(from, toPose.border ?? from, p);
    }
    if (owns("borderRadius")) {
      mid.borderRadius = lerp(
        fromPose.borderRadius ?? 0,
        toPose.borderRadius ?? 0,
        p,
      );
    }
    if (owns("background")) {
      mid.background = disc(fromPose.background, toPose.background);
    }
    if (owns("filter")) mid.filter = disc(fromPose.filter, toPose.filter);
    if (owns("overlay")) mid.overlay = disc(fromPose.overlay, toPose.overlay);
  }

  for (const id of affectedSlotIds) {
    const f = fromPose.slots[id];
    const tp = toPose.slots[id];
    if (!f || !tp) continue;
    const s: ClipSlotPose = { ...tp };
    if (owns("tilt")) {
      s.tilt = tiltLerp(f.tilt, tp.tilt, p);
      s.rotation = lerp(f.rotation, tp.rotation, p);
    }
    if (owns("zoom")) s.scale = lerp(f.scale, tp.scale, p);
    if (owns("shadow") && f.shadow && tp.shadow) {
      s.shadow = shadowBetween(f.shadow, tp.shadow, p);
    }
    if (owns("position")) {
      s.xPct = lerp(f.xPct ?? tp.xPct ?? 0, tp.xPct ?? 0, p);
      s.yPct = lerp(f.yPct ?? tp.yPct ?? 0, tp.yPct ?? 0, p);
    }
    if (owns("border") && f.border && tp.border) {
      s.border = borderBetween(f.border, tp.border, p);
    }
    if (
      owns("borderRadius") &&
      f.borderRadius != null &&
      tp.borderRadius != null
    ) {
      s.borderRadius = lerp(f.borderRadius, tp.borderRadius, p);
    }
    if (owns("padding") && f.padding != null && tp.padding != null) {
      s.padding = lerp(f.padding, tp.padding, p);
    }
    if (owns("lighting") && f.lighting && tp.lighting) {
      s.lighting = lightingBetween(f.lighting, tp.lighting, p);
    }
    mid.slots[id] = s;
  }

  return mid;
}
