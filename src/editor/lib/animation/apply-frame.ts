import {
  bareScreenshotPositionPctRaw,
  bareScreenshotTargetLeftTopRaw,
  mainScreenshotPositionPct,
  type StagePlacementDims,
} from "@/editor/lib/position-math";
import {
  resetPositionTokens,
  applyElementPositionPreview,
  applyMainBarePreviewPx,
  applyMainPositionPreview,
} from "@/editor/lib/preview-tokens";
import {
  TOKEN_BACKDROP_FX_PREVIEW,
  TOKEN_BACKDROP_NOISE_PREVIEW,
  TOKEN_LIGHTING_IMAGE,
  TOKEN_LIGHTING_OPACITY,
  TOKEN_CANVAS_CORNER_RADIUS,
} from "@/editor/property-panel/sections/backdrop/constants";
import {
  coverContainerBox,
  fitContainBox,
  lightingOverlayValues,
} from "@/editor/lib/canvas-helpers";
import {
  backdropAdjustmentsBetween,
  backgroundLayerOpacityVar,
  borderBetween,
  clipAffectsMain,
  clipAffectsSlot,
  clipBaseline,
  clipOwns,
  clipPose,
  clipsProgressAt,
  cropRegionBetween,
  DEFAULT_BASELINE,
  filterLayerOpacityVar,
  FULL_CROP_REGION,
  INVISIBLE_BORDER,
  lerp,
  overlayLayerOpacityVar,
  OVERLAY_BASE_OPACITY_VAR,
  lightingEntranceRest,
  lightingBetween,
  lightingTargetMixAt,
  NEUTRAL_SLOT_POSE,
  REST_LIGHTING,
  sampleKeyframes,
  sampleShadowLayers,
} from "@/editor/lib/animation/playback";
import {
  BORDER_OFFSET_PREVIEW_VAR,
  BORDER_OUTLINE_PREVIEW_VAR,
  borderOffsetCss,
  borderOutlineCss,
  SCREENSHOT_RADIUS_PREVIEW_VAR,
  shadowCss,
  shadowDropFilterCss,
  SHADOW_FILTER_PREVIEW_VAR,
  SHADOW_PREVIEW_VAR,
} from "@/editor/lib/css-utils";
import {
  CROP_ANIMATION_VARS,
  CROP_FIT_ORIGIN_VAR,
  CROP_FIT_SX_VAR,
  CROP_FIT_SY_VAR,
  CROP_HEIGHT_VAR,
  CROP_LEFT_VAR,
  CROP_SHELL_H_VAR,
  CROP_SHELL_W_VAR,
  CROP_TOP_VAR,
  CROP_VIEW_BOX_VAR,
  CROP_WIDTH_VAR,
  cropObjectMetrics,
  cropOriginCss,
  cropRegionRatio,
  cropViewBoxValue,
} from "@/editor/lib/crop-utils";
import {
  clipProgressEase,
  clipReleaseEase,
  clipReleaseMs,
} from "@/editor/lib/animation/clip-easing";
import { captureClipPose } from "@/editor/lib/engine";
import type { AspectState } from "@/editor/aspect/types";
import type {
  AnimationClip,
  ClipBaseline,
  ClipSlotPose,
} from "@/editor/lib/animation/types";
import type { CanvasState } from "@/editor/lib/engine/types";
import type {
  BackdropAdjustments,
  LightSourceConfig,
} from "@/editor/property-panel/sections/backdrop/types";
import type { Border } from "@/editor/property-panel/sections/border/types";
import type { CropRegion } from "@/editor/crop/types";
import type { Shadow } from "@/editor/property-panel/sections/shadow/types";
import type { Tilt } from "@/editor/property-panel/sections/transform/types";
import { buildAdjustmentsFilterCss } from "@/editor/property-panel/sections/backdrop/utils";

const INVISIBLE_SHADOW: Shadow = {
  type: "none",
  intensity: 0,
  color: "#000000",
  lightSource: "center",
};

const tiltLerp = (a: Tilt, b: Tilt, p: number): Tilt => ({
  rx: lerp(a.rx, b.rx, p),
  ry: lerp(a.ry, b.ry, p),
  rz: lerp(a.rz, b.rz, p),
});

const pointLerp = (
  a: { xPct: number; yPct: number },
  b: { xPct: number; yPct: number },
  p: number,
) => ({ xPct: lerp(a.xPct, b.xPct, p), yPct: lerp(a.yPct, b.yPct, p) });

function setVar(el: HTMLElement, name: string, value: string | null) {
  if (value === null) el.style.removeProperty(name);
  else el.style.setProperty(name, value);
}

const PADDING_PREVIEW_VAR = "--editor-padding-preview";
const CANVAS_RADIUS_PREVIEW_VAR = TOKEN_CANVAS_CORNER_RADIUS;
const BG_OPACITY_VAR = "--canvas-bg-opacity";

const SCOPE_VARS = [
  PADDING_PREVIEW_VAR,
  SHADOW_PREVIEW_VAR,
  SHADOW_FILTER_PREVIEW_VAR,
  BORDER_OUTLINE_PREVIEW_VAR,
  BORDER_OFFSET_PREVIEW_VAR,
  SCREENSHOT_RADIUS_PREVIEW_VAR,
];
const CROP_VARS = CROP_ANIMATION_VARS;
const CANVAS_FX_VARS = [
  BG_OPACITY_VAR,
  ...CROP_VARS,
  TOKEN_BACKDROP_FX_PREVIEW,
  TOKEN_BACKDROP_NOISE_PREVIEW,
  TOKEN_LIGHTING_IMAGE,
  TOKEN_LIGHTING_OPACITY,
  `${TOKEN_LIGHTING_IMAGE}-in`,
  `${TOKEN_LIGHTING_OPACITY}-in`,
  CANVAS_RADIUS_PREVIEW_VAR,
];
const TILT_SCALE_VARS = [
  "--canvas-transform-rx",
  "--canvas-transform-ry",
  "--canvas-transform-rz",
  "--canvas-transform-scale",
];
const SLOT_VARS = [
  "--slot-transform-rx",
  "--slot-transform-ry",
  "--slot-transform-rz",
  "--slot-transform-scale",
  "--slot-transform-rot",
];
const SLOT_FX_VARS = [
  BORDER_OUTLINE_PREVIEW_VAR,
  BORDER_OFFSET_PREVIEW_VAR,
  SCREENSHOT_RADIUS_PREVIEW_VAR,
  PADDING_PREVIEW_VAR,
  `${TOKEN_LIGHTING_IMAGE}-in`,
  `${TOKEN_LIGHTING_OPACITY}-in`,
];

export function measureBareStageDims(
  canvasEl: HTMLElement,
): StagePlacementDims | null {
  const image = canvasEl.querySelector<HTMLElement>(
    "[data-editor-shadow-box-target]",
  );
  const stage = image?.parentElement;
  if (!image || !stage) return null;
  const computed = getComputedStyle(stage);
  const dims = {
    stageW: parseFloat(computed.width) || stage.clientWidth,
    stageH: parseFloat(computed.height) || stage.clientHeight,
    imgW: image.offsetWidth,
    imgH: image.offsetHeight,
  };
  if (!dims.stageW || !dims.stageH || !dims.imgW || !dims.imgH) return null;
  return dims;
}

export function clearAnimationFrameVars(
  canvasEl: HTMLElement,
  clips: AnimationClip[],
) {
  const mainScopeEl =
    canvasEl.querySelector<HTMLElement>(
      '[data-editor-shadow-preview-scope="canvas"]',
    ) ?? canvasEl;

  for (const v of TILT_SCALE_VARS) setVar(canvasEl, v, null);
  resetPositionTokens(canvasEl);
  for (const v of CANVAS_FX_VARS) setVar(canvasEl, v, null);
  setVar(canvasEl, OVERLAY_BASE_OPACITY_VAR, null);
  for (const c of clips) {
    setVar(canvasEl, backgroundLayerOpacityVar(c.id), null);
    setVar(canvasEl, filterLayerOpacityVar(c.id), null);
    setVar(canvasEl, overlayLayerOpacityVar(c.id), null);
  }
  for (const v of SCOPE_VARS) setVar(mainScopeEl, v, null);
  canvasEl
    .querySelectorAll<HTMLElement>("[data-screenshot-tile-id]")
    .forEach((slotEl) => {
      for (const v of SLOT_VARS) setVar(slotEl, v, null);
      for (const v of SLOT_FX_VARS) setVar(slotEl, v, null);
      setVar(slotEl, SHADOW_PREVIEW_VAR, null);
      setVar(slotEl, SHADOW_FILTER_PREVIEW_VAR, null);
      resetPositionTokens(slotEl);
    });
}

function cropFitGeometry(
  canvasEl: HTMLElement,
  canvas: CanvasState,
  region: CropRegion,
): {
  fit: "contain" | "cover";
  stageW: number;
  stageH: number;
  ratio: number;
  shellBox: { width: number; height: number } | null;
} | null {
  const fit = canvas.objectFit ?? "contain";
  if (fit === "fill") return null;

  const shell = canvasEl.querySelector<HTMLElement>(
    '[data-export-stack="media"]',
  );

  const media = shell?.querySelector<HTMLImageElement>("img");
  const stage = shell?.parentElement;
  if (!shell || !media || !stage) return null;

  const naturalW = media.naturalWidth || Number(media.dataset.naturalW) || 0;
  const naturalH = media.naturalHeight || Number(media.dataset.naturalH) || 0;
  const ratio = cropRegionRatio(region, naturalW, naturalH);
  const stageW = parseFloat(getComputedStyle(stage).width) || stage.clientWidth;
  const stageH =
    parseFloat(getComputedStyle(stage).height) || stage.clientHeight;
  if (!ratio || !(stageW > 0) || !(stageH > 0)) return null;

  return {
    fit,
    stageW,
    stageH,
    ratio,
    shellBox: fit === "contain" ? fitContainBox(stageW, stageH, ratio) : null,
  };
}

function applyCropFitVars(
  canvasEl: HTMLElement,
  region: CropRegion,
  geometry: ReturnType<typeof cropFitGeometry>,
) {
  const clearFit = () => {
    setVar(canvasEl, CROP_SHELL_W_VAR, null);
    setVar(canvasEl, CROP_SHELL_H_VAR, null);
    setVar(canvasEl, CROP_FIT_SX_VAR, null);
    setVar(canvasEl, CROP_FIT_SY_VAR, null);
    setVar(canvasEl, CROP_FIT_ORIGIN_VAR, null);
  };

  if (!geometry) return clearFit();
  const { stageW, stageH, ratio, shellBox } = geometry;

  setVar(canvasEl, CROP_FIT_ORIGIN_VAR, cropOriginCss(region));

  if (shellBox) {
    setVar(canvasEl, CROP_SHELL_W_VAR, `${shellBox.width}px`);
    setVar(canvasEl, CROP_SHELL_H_VAR, `${shellBox.height}px`);
    setVar(canvasEl, CROP_FIT_SX_VAR, "1");
    setVar(canvasEl, CROP_FIT_SY_VAR, "1");
    return;
  }

  const box = coverContainerBox(stageW, stageH, ratio);
  setVar(canvasEl, CROP_SHELL_W_VAR, null);
  setVar(canvasEl, CROP_SHELL_H_VAR, null);
  setVar(canvasEl, CROP_FIT_SX_VAR, String(box.width / stageW));
  setVar(canvasEl, CROP_FIT_SY_VAR, String(box.height / stageH));
}

type ApplyAnimationFrameOptions = {
  canvasEl: HTMLElement;
  canvas: CanvasState;
  globalAspect: AspectState;
  clips: AnimationClip[];
  timeMs: number;
  selectedClipId?: string | null;
  screenshotPositionDragging?: boolean;
  bareDims?: StagePlacementDims | null;
};

export function applyAnimationFrameAtTime({
  canvasEl,
  canvas,
  globalAspect,
  clips,
  timeMs,
  selectedClipId = null,
  screenshotPositionDragging = false,
  bareDims = null,
}: ApplyAnimationFrameOptions) {
  const playheadMs = timeMs;
  const slots = canvas.slots ?? [];
  const scale = canvas.scale ?? 100;
  const deviceFrame = canvas.deviceFrame;
  const hasDeviceFrame = (deviceFrame?.id ?? "none") !== "none";

  const isBareMainTarget = !hasDeviceFrame && slots.length === 0;

  const mainScopeEl =
    canvasEl.querySelector<HTMLElement>(
      '[data-editor-shadow-preview-scope="canvas"]',
    ) ?? canvasEl;

  const committedPose: ClipBaseline = captureClipPose(canvas);
  const poseOf = (c: AnimationClip): ClipBaseline =>
    selectedClipId && c.id === selectedClipId ? committedPose : clipPose(c);

  const mainClips = clips.filter(clipAffectsMain);
  if (mainClips.length > 0) {
    const framesFor = <V>(
      effect: Parameters<typeof clipOwns>[1],
      value: (pose: ClipBaseline) => V,
    ) =>
      mainClips
        .filter((c) => clipOwns(c, effect))
        .map((c) => ({
          startMs: c.startMs,
          durationMs: c.durationMs,
          value: value(poseOf(c)),
          ease: clipProgressEase(c),
          releaseMs: clipReleaseMs(c),
          releaseEase: clipReleaseEase(c),
        }));

    const restFor = <V>(
      effect: Parameters<typeof clipOwns>[1],
      value: (pose: ClipBaseline) => V,
      fallback: V,
    ): V => {
      const first = mainClips
        .filter((c) => clipOwns(c, effect))
        .sort((a, b) => a.startMs - b.startMs)[0];
      return first ? value(clipBaseline(first)) : fallback;
    };

    const tiltVal = sampleKeyframes<Tilt>(
      framesFor("tilt", (pz) => pz.tilt),
      playheadMs,
      restFor("tilt", (pz) => pz.tilt, { rx: 0, ry: 0, rz: 0 }),
      tiltLerp,
    );
    if (tiltVal) {
      setVar(canvasEl, "--canvas-transform-rx", `${tiltVal.rx}deg`);
      setVar(canvasEl, "--canvas-transform-ry", `${tiltVal.ry}deg`);
      setVar(canvasEl, "--canvas-transform-rz", `${tiltVal.rz}deg`);
    } else {
      setVar(canvasEl, "--canvas-transform-rx", null);
      setVar(canvasEl, "--canvas-transform-ry", null);
      setVar(canvasEl, "--canvas-transform-rz", null);
    }

    const zoomVal = sampleKeyframes<number>(
      framesFor("zoom", (pz) => pz.scale),
      playheadMs,
      restFor("zoom", (pz) => pz.scale, 100),
      lerp,
    );
    setVar(
      canvasEl,
      "--canvas-transform-scale",
      zoomVal != null ? String(zoomVal / 100) : null,
    );
    const placementScale = zoomVal ?? scale;

    const cropVal = sampleKeyframes<CropRegion>(
      framesFor("crop", (pz) => pz.crop ?? FULL_CROP_REGION),
      playheadMs,
      restFor("crop", (pz) => pz.crop ?? FULL_CROP_REGION, FULL_CROP_REGION),
      cropRegionBetween,
    );
    const cropGeometry = cropVal
      ? cropFitGeometry(canvasEl, canvas, cropVal)
      : null;

    const posFrames = mainClips.filter((c) => clipOwns(c, "position"));

    const cropResizesShell = cropGeometry?.shellBox != null;
    if (screenshotPositionDragging) {
    } else if ((posFrames.length > 0 || cropResizesShell) && deviceFrame) {
      const measured = isBareMainTarget
        ? (bareDims ?? measureBareStageDims(canvasEl))
        : null;

      const dims =
        measured && cropGeometry?.shellBox
          ? {
              ...measured,
              imgW: cropGeometry.shellBox.width,
              imgH: cropGeometry.shellBox.height,
            }
          : measured;
      const aspect = canvas.aspect ?? globalAspect;
      const pointFor = (off: { x: number; y: number }) =>
        dims != null
          ? bareScreenshotPositionPctRaw({
              dims,
              scaleFactor: placementScale / 100,
              offset: off,
            })
          : mainScreenshotPositionPct({
              aspect,
              deviceFrame,
              offset: off,
              slots,
            });
      const frames = posFrames.map((c) => {
        const pz = poseOf(c);
        return {
          startMs: c.startMs,
          durationMs: c.durationMs,
          value: pointFor(pz.screenshotOffset),
          ease: clipProgressEase(c),
          releaseMs: clipReleaseMs(c),
          releaseEase: clipReleaseEase(c),
        };
      });
      const posRest =
        posFrames.length > 0
          ? clipBaseline(
              [...posFrames].sort((a, b) => a.startMs - b.startMs)[0],
            )
          : null;

      const point = posRest
        ? sampleKeyframes(
            frames,
            playheadMs,
            pointFor(posRest.screenshotOffset),
            pointLerp,
          )
        : pointFor(committedPose.screenshotOffset);
      if (point && dims != null) {
        const { left, top } = bareScreenshotTargetLeftTopRaw(dims, point);
        applyMainBarePreviewPx(canvasEl, left, top);
      } else if (point) {
        applyMainPositionPreview(canvasEl, point);
      } else {
        resetPositionTokens(canvasEl);
      }
    } else {
      resetPositionTokens(canvasEl);
    }

    const padVal =
      slots.length === 0
        ? sampleKeyframes<number>(
            framesFor("padding", (pz) => pz.padding),
            playheadMs,
            restFor("padding", (pz) => pz.padding, 0),
            lerp,
          )
        : null;
    setVar(
      mainScopeEl,
      PADDING_PREVIEW_VAR,
      padVal != null
        ? `${(Math.max(0, Math.min(240, padVal)) / 12).toFixed(3)}%`
        : null,
    );

    const radiusVal = sampleKeyframes<number>(
      framesFor(
        "borderRadius",
        (pz) => pz.borderRadius ?? DEFAULT_BASELINE.borderRadius ?? 0,
      ),
      playheadMs,
      restFor(
        "borderRadius",
        (pz) => pz.borderRadius ?? DEFAULT_BASELINE.borderRadius ?? 0,
        DEFAULT_BASELINE.borderRadius ?? 0,
      ),
      lerp,
    );
    setVar(
      canvasEl,
      CANVAS_RADIUS_PREVIEW_VAR,
      radiusVal != null
        ? `${Math.max(0, Math.min(80, radiusVal)).toFixed(3)}px`
        : null,
    );

    const shadowLayers = sampleShadowLayers(
      framesFor("shadow", (pz) => pz.shadow),
      playheadMs,
      restFor("shadow", (pz) => pz.shadow, INVISIBLE_SHADOW),
    );
    if (shadowLayers) {
      const box = shadowLayers
        .map(shadowCss)
        .filter((v): v is string => Boolean(v))
        .join(", ");
      const filter = shadowLayers
        .map(shadowDropFilterCss)
        .filter((v): v is string => Boolean(v))
        .join(" ");
      setVar(mainScopeEl, SHADOW_PREVIEW_VAR, box || "none");
      setVar(mainScopeEl, SHADOW_FILTER_PREVIEW_VAR, filter || "none");
    } else {
      setVar(mainScopeEl, SHADOW_PREVIEW_VAR, null);
      setVar(mainScopeEl, SHADOW_FILTER_PREVIEW_VAR, null);
    }

    const borderVal = sampleKeyframes<Border>(
      framesFor("border", (pz) => pz.border ?? INVISIBLE_BORDER),
      playheadMs,
      restFor(
        "border",
        (pz) => pz.border ?? INVISIBLE_BORDER,
        INVISIBLE_BORDER,
      ),
      borderBetween,
    );
    if (borderVal) {
      setVar(
        mainScopeEl,
        BORDER_OUTLINE_PREVIEW_VAR,
        borderOutlineCss(borderVal),
      );
      setVar(
        mainScopeEl,
        BORDER_OFFSET_PREVIEW_VAR,
        borderOffsetCss(borderVal),
      );
    } else {
      setVar(mainScopeEl, BORDER_OUTLINE_PREVIEW_VAR, null);
      setVar(mainScopeEl, BORDER_OFFSET_PREVIEW_VAR, null);
    }

    const screenshotRadiusVal = sampleKeyframes<number>(
      framesFor(
        "borderRadius",
        (pz) => pz.borderRadius ?? DEFAULT_BASELINE.borderRadius ?? 0,
      ),
      playheadMs,
      restFor(
        "borderRadius",
        (pz) => pz.borderRadius ?? DEFAULT_BASELINE.borderRadius ?? 0,
        DEFAULT_BASELINE.borderRadius ?? 0,
      ),
      lerp,
    );
    setVar(
      mainScopeEl,
      SCREENSHOT_RADIUS_PREVIEW_VAR,
      screenshotRadiusVal != null
        ? `${Math.max(0, Math.min(48, screenshotRadiusVal)).toFixed(3)}px`
        : null,
    );

    for (const c of mainClips.filter((c) => clipOwns(c, "background"))) {
      setVar(
        canvasEl,
        backgroundLayerOpacityVar(c.id),
        String(clipsProgressAt([c], playheadMs)),
      );
    }

    for (const c of mainClips.filter((c) => clipOwns(c, "filter"))) {
      setVar(
        canvasEl,
        filterLayerOpacityVar(c.id),
        String(clipsProgressAt([c], playheadMs)),
      );
    }

    const overlayClips = mainClips
      .filter((c) => clipOwns(c, "overlay"))
      .sort((a, b) => a.startMs - b.startMs);
    if (overlayClips.length > 0) {
      setVar(
        canvasEl,
        OVERLAY_BASE_OPACITY_VAR,
        String(1 - clipsProgressAt([overlayClips[0]], playheadMs)),
      );
      overlayClips.forEach((c, i) => {
        const pIn = clipsProgressAt([c], playheadMs);
        const next = overlayClips[i + 1];
        const pOut = next ? clipsProgressAt([next], playheadMs) : 0;
        setVar(
          canvasEl,
          overlayLayerOpacityVar(c.id),
          String(pIn * (1 - pOut)),
        );
      });
    }

    const bdVal = sampleKeyframes<BackdropAdjustments>(
      framesFor("backdrop", (pz) => pz.backdropAdjustments),
      playheadMs,
      restFor(
        "backdrop",
        (pz) => pz.backdropAdjustments,
        DEFAULT_BASELINE.backdropAdjustments,
      ),
      backdropAdjustmentsBetween,
    );
    if (bdVal) {
      setVar(
        canvasEl,
        TOKEN_BACKDROP_FX_PREVIEW,
        buildAdjustmentsFilterCss(bdVal) ?? "brightness(1)",
      );
      setVar(canvasEl, TOKEN_BACKDROP_NOISE_PREVIEW, String(bdVal.noise / 100));
    } else {
      setVar(canvasEl, TOKEN_BACKDROP_FX_PREVIEW, null);
      setVar(canvasEl, TOKEN_BACKDROP_NOISE_PREVIEW, null);
    }

    if (cropVal) {
      const metrics = cropObjectMetrics(cropVal);
      setVar(canvasEl, CROP_VIEW_BOX_VAR, cropViewBoxValue(cropVal));
      setVar(canvasEl, CROP_WIDTH_VAR, metrics.width);
      setVar(canvasEl, CROP_HEIGHT_VAR, metrics.height);
      setVar(canvasEl, CROP_LEFT_VAR, metrics.left);
      setVar(canvasEl, CROP_TOP_VAR, metrics.top);
      applyCropFitVars(canvasEl, cropVal, cropGeometry);
    } else {
      for (const v of CROP_VARS) setVar(canvasEl, v, null);
    }

    const lightingFrames = framesFor(
      "lighting",
      (pz) => pz.lighting ?? REST_LIGHTING,
    );
    const lightingRestBase = restFor(
      "lighting",
      (pz) => pz.lighting ?? REST_LIGHTING,
      REST_LIGHTING,
    );

    const lightingRest =
      lightingRestBase.intensity > 0
        ? lightingRestBase
        : lightingEntranceRest(lightingFrames[0]?.value);
    const lightVal = sampleKeyframes<LightSourceConfig>(
      lightingFrames,
      playheadMs,
      lightingRest,
      lightingBetween,
    );
    const targetMix = lightingTargetMixAt(
      lightingFrames,
      playheadMs,
      lightingRest,
    );
    if (lightVal) {
      const driveOuter = targetMix < 1 - 1e-6;
      const driveInner = targetMix > 1e-6;
      const outer = driveOuter
        ? lightingOverlayValues(lightVal, { forceMount: true })
        : null;
      const inner = driveInner
        ? lightingOverlayValues(lightVal, { inner: true, forceMount: true })
        : null;
      setVar(canvasEl, TOKEN_LIGHTING_IMAGE, outer ? outer.image : "none");
      setVar(
        canvasEl,
        TOKEN_LIGHTING_OPACITY,
        outer ? (outer.opacity * (1 - targetMix)).toFixed(3) : "0",
      );
      setVar(
        canvasEl,
        `${TOKEN_LIGHTING_IMAGE}-in`,
        inner ? inner.image : "none",
      );
      setVar(
        canvasEl,
        `${TOKEN_LIGHTING_OPACITY}-in`,
        inner ? (inner.opacity * targetMix).toFixed(3) : "0",
      );
    } else {
      setVar(canvasEl, TOKEN_LIGHTING_IMAGE, null);
      setVar(canvasEl, TOKEN_LIGHTING_OPACITY, null);
      setVar(canvasEl, `${TOKEN_LIGHTING_IMAGE}-in`, null);
      setVar(canvasEl, `${TOKEN_LIGHTING_OPACITY}-in`, null);
    }
  } else {
    for (const v of TILT_SCALE_VARS) setVar(canvasEl, v, null);
    resetPositionTokens(canvasEl);
    for (const v of CANVAS_FX_VARS) setVar(canvasEl, v, null);
    for (const v of SCOPE_VARS) setVar(mainScopeEl, v, null);
  }

  for (const slot of slots) {
    const slotEl = canvasEl.querySelector<HTMLElement>(
      `[data-screenshot-tile-id="${slot.id}"]`,
    );
    if (!slotEl) continue;
    const slotClips = clips.filter((c) => clipAffectsSlot(c, slot.id));
    if (slotClips.length === 0) {
      for (const v of SLOT_VARS) setVar(slotEl, v, null);
      for (const v of SLOT_FX_VARS) setVar(slotEl, v, null);
      setVar(slotEl, SHADOW_PREVIEW_VAR, null);
      setVar(slotEl, SHADOW_FILTER_PREVIEW_VAR, null);
      resetPositionTokens(slotEl);
      continue;
    }
    const slotPoseOf = (c: AnimationClip) =>
      poseOf(c).slots[slot.id] ?? NEUTRAL_SLOT_POSE;

    const tiltVal = sampleKeyframes<{ tilt: Tilt; rotation: number }>(
      slotClips
        .filter((c) => clipOwns(c, "tilt"))
        .map((c) => {
          const sp = slotPoseOf(c);
          return {
            startMs: c.startMs,
            durationMs: c.durationMs,
            value: { tilt: sp.tilt, rotation: sp.rotation },
            ease: clipProgressEase(c),
            releaseMs: clipReleaseMs(c),
            releaseEase: clipReleaseEase(c),
          };
        }),
      playheadMs,
      { tilt: { rx: 0, ry: 0, rz: 0 }, rotation: 0 },
      (a, b, pr) => ({
        tilt: tiltLerp(a.tilt, b.tilt, pr),
        rotation: lerp(a.rotation, b.rotation, pr),
      }),
    );
    if (tiltVal) {
      setVar(slotEl, "--slot-transform-rx", `${tiltVal.tilt.rx}deg`);
      setVar(slotEl, "--slot-transform-ry", `${tiltVal.tilt.ry}deg`);
      setVar(slotEl, "--slot-transform-rz", `${tiltVal.tilt.rz}deg`);
      setVar(slotEl, "--slot-transform-rot", `${tiltVal.rotation}deg`);
    } else {
      setVar(slotEl, "--slot-transform-rx", null);
      setVar(slotEl, "--slot-transform-ry", null);
      setVar(slotEl, "--slot-transform-rz", null);
      setVar(slotEl, "--slot-transform-rot", null);
    }

    const slotZoom = sampleKeyframes<number>(
      slotClips
        .filter((c) => clipOwns(c, "zoom"))
        .map((c) => ({
          startMs: c.startMs,
          durationMs: c.durationMs,
          value: slotPoseOf(c).scale,
          ease: clipProgressEase(c),
          releaseMs: clipReleaseMs(c),
          releaseEase: clipReleaseEase(c),
        })),
      playheadMs,
      100,
      lerp,
    );
    setVar(
      slotEl,
      "--slot-transform-scale",
      slotZoom != null ? String(slotZoom / 100) : null,
    );

    const slotPosClips = slotClips.filter((c) => clipOwns(c, "position"));
    if (screenshotPositionDragging) {
    } else if (slotPosClips.length > 0) {
      const firstPos = [...slotPosClips].sort(
        (a, b) => a.startMs - b.startMs,
      )[0];
      const restPose = clipBaseline(firstPos).slots[slot.id];
      const slotPoint = sampleKeyframes<{ xPct: number; yPct: number }>(
        slotPosClips.map((c) => {
          const sp = slotPoseOf(c);
          return {
            startMs: c.startMs,
            durationMs: c.durationMs,
            value: {
              xPct: sp.xPct ?? slot.xPct,
              yPct: sp.yPct ?? slot.yPct,
            },
            ease: clipProgressEase(c),
            releaseMs: clipReleaseMs(c),
            releaseEase: clipReleaseEase(c),
          };
        }),
        playheadMs,
        {
          xPct: restPose?.xPct ?? slot.xPct,
          yPct: restPose?.yPct ?? slot.yPct,
        },
        pointLerp,
      );
      if (slotPoint) applyElementPositionPreview(slotEl, slotPoint);
      else resetPositionTokens(slotEl);
    } else {
      resetPositionTokens(slotEl);
    }

    const slotShadowLayers = sampleShadowLayers(
      slotClips
        .filter((c) => clipOwns(c, "shadow"))
        .map((c) => ({
          startMs: c.startMs,
          durationMs: c.durationMs,
          value: slotPoseOf(c).shadow ?? INVISIBLE_SHADOW,
          ease: clipProgressEase(c),
          releaseMs: clipReleaseMs(c),
          releaseEase: clipReleaseEase(c),
        })),
      playheadMs,
      INVISIBLE_SHADOW,
    );
    if (slotShadowLayers) {
      const box = slotShadowLayers
        .map(shadowCss)
        .filter((v): v is string => Boolean(v))
        .join(", ");
      const filter = slotShadowLayers
        .map(shadowDropFilterCss)
        .filter((v): v is string => Boolean(v))
        .join(" ");
      setVar(slotEl, SHADOW_PREVIEW_VAR, box || "none");
      setVar(slotEl, SHADOW_FILTER_PREVIEW_VAR, filter || "none");
    } else {
      setVar(slotEl, SHADOW_PREVIEW_VAR, null);
      setVar(slotEl, SHADOW_FILTER_PREVIEW_VAR, null);
    }

    const slotRestFor = <V>(
      effect: Parameters<typeof clipOwns>[1],
      extract: (sp: ClipSlotPose | undefined) => V | undefined,
      fallback: V,
    ): V => {
      const first = slotClips
        .filter((c) => clipOwns(c, effect))
        .sort((a, b) => a.startMs - b.startMs)[0];
      if (!first) return fallback;
      return extract(clipBaseline(first).slots[slot.id]) ?? fallback;
    };

    const committedBorder = slot.border ?? canvas.border ?? INVISIBLE_BORDER;
    const slotBorder = sampleKeyframes<Border>(
      slotClips
        .filter((c) => clipOwns(c, "border"))
        .map((c) => ({
          startMs: c.startMs,
          durationMs: c.durationMs,
          value: slotPoseOf(c).border ?? committedBorder,
          ease: clipProgressEase(c),
          releaseMs: clipReleaseMs(c),
          releaseEase: clipReleaseEase(c),
        })),
      playheadMs,
      slotRestFor("border", (sp) => sp?.border, INVISIBLE_BORDER),
      borderBetween,
    );
    if (slotBorder) {
      setVar(slotEl, BORDER_OUTLINE_PREVIEW_VAR, borderOutlineCss(slotBorder));
      setVar(slotEl, BORDER_OFFSET_PREVIEW_VAR, borderOffsetCss(slotBorder));
    } else {
      setVar(slotEl, BORDER_OUTLINE_PREVIEW_VAR, null);
      setVar(slotEl, BORDER_OFFSET_PREVIEW_VAR, null);
    }

    const committedRadius = slot.borderRadius ?? canvas.borderRadius ?? 0;
    const slotRadius = sampleKeyframes<number>(
      slotClips
        .filter((c) => clipOwns(c, "borderRadius"))
        .map((c) => ({
          startMs: c.startMs,
          durationMs: c.durationMs,
          value: slotPoseOf(c).borderRadius ?? committedRadius,
          ease: clipProgressEase(c),
          releaseMs: clipReleaseMs(c),
          releaseEase: clipReleaseEase(c),
        })),
      playheadMs,
      slotRestFor("borderRadius", (sp) => sp?.borderRadius, committedRadius),
      lerp,
    );
    setVar(
      slotEl,
      SCREENSHOT_RADIUS_PREVIEW_VAR,
      slotRadius != null ? `${Math.max(0, slotRadius).toFixed(3)}px` : null,
    );

    const committedPadding = slot.padding ?? canvas.padding ?? 0;
    const slotPadding = sampleKeyframes<number>(
      slotClips
        .filter((c) => clipOwns(c, "padding"))
        .map((c) => ({
          startMs: c.startMs,
          durationMs: c.durationMs,
          value: slotPoseOf(c).padding ?? committedPadding,
          ease: clipProgressEase(c),
          releaseMs: clipReleaseMs(c),
          releaseEase: clipReleaseEase(c),
        })),
      playheadMs,
      slotRestFor("padding", (sp) => sp?.padding, committedPadding),
      lerp,
    );
    setVar(
      slotEl,
      PADDING_PREVIEW_VAR,
      slotPadding != null
        ? `${(Math.max(0, Math.min(240, slotPadding)) / 12).toFixed(3)}%`
        : null,
    );

    const slotLightingFrames = slotClips
      .filter((c) => clipOwns(c, "lighting"))
      .map((c) => ({
        startMs: c.startMs,
        durationMs: c.durationMs,
        value: slotPoseOf(c).lighting ?? REST_LIGHTING,
        ease: clipProgressEase(c),
        releaseMs: clipReleaseMs(c),
        releaseEase: clipReleaseEase(c),
      }));
    if (slotLightingFrames.length > 0) {
      const restBase = slotRestFor(
        "lighting",
        (sp) => sp?.lighting,
        REST_LIGHTING,
      );
      const lightingRest =
        restBase.intensity > 0
          ? restBase
          : lightingEntranceRest(slotLightingFrames[0]?.value);
      const lightVal = sampleKeyframes<LightSourceConfig>(
        slotLightingFrames,
        playheadMs,
        lightingRest,
        lightingBetween,
      );

      const inner = lightVal
        ? lightingOverlayValues(lightVal, { inner: true, forceMount: true })
        : null;
      setVar(
        slotEl,
        `${TOKEN_LIGHTING_IMAGE}-in`,
        inner ? inner.image : "none",
      );
      setVar(
        slotEl,
        `${TOKEN_LIGHTING_OPACITY}-in`,
        inner ? inner.opacity.toFixed(3) : "0",
      );
    } else {
      setVar(slotEl, `${TOKEN_LIGHTING_IMAGE}-in`, null);
      setVar(slotEl, `${TOKEN_LIGHTING_OPACITY}-in`, null);
    }
  }
}
