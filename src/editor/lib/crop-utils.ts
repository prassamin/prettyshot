import { getBrowserFrame, isBrowserFrame } from "@/editor/frames/catalog";
import { deviceFrameGeometry } from "@/editor/frames/geometry";

import type { CropRegion } from "@/editor/crop/types";
import type { DeviceFrame } from "@/editor/frames/types";
import { lookupDynamicDeviceFrameModel } from "../frames/dynamic-catalog";

export function isActiveCropRegion(
  region: CropRegion | null | undefined,
): region is CropRegion {
  if (!region) return false;
  return (
    region.x > 0.05 ||
    region.y > 0.05 ||
    region.width < 99.95 ||
    region.height < 99.95
  );
}

export function supportsObjectViewBox(): boolean {
  try {
    return (
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("object-view-box", "inset(0%)")
    );
  } catch {
    return false;
  }
}

export const CROP_VIEW_BOX_VAR = "--crop-view-box";
export const CROP_WIDTH_VAR = "--crop-w";
export const CROP_HEIGHT_VAR = "--crop-h";
export const CROP_LEFT_VAR = "--crop-left";
export const CROP_TOP_VAR = "--crop-top";
export const CROP_SHELL_W_VAR = "--crop-shell-w";
export const CROP_SHELL_H_VAR = "--crop-shell-h";
export const CROP_FIT_SX_VAR = "--crop-fit-sx";
export const CROP_FIT_SY_VAR = "--crop-fit-sy";
export const CROP_FIT_ORIGIN_VAR = "--crop-fit-origin";

export const CROP_ANIMATION_VARS = [
  CROP_VIEW_BOX_VAR,
  CROP_WIDTH_VAR,
  CROP_HEIGHT_VAR,
  CROP_LEFT_VAR,
  CROP_TOP_VAR,
  CROP_SHELL_W_VAR,
  CROP_SHELL_H_VAR,
  CROP_FIT_SX_VAR,
  CROP_FIT_SY_VAR,
  CROP_FIT_ORIGIN_VAR,
];

export function cropRegionRatio(
  region: CropRegion,
  naturalW: number,
  naturalH: number,
) {
  const w = region.width * naturalW;
  const h = region.height * naturalH;
  return w > 0 && h > 0 ? w / h : null;
}

export function cropOriginCss(region: CropRegion) {
  return `${region.x + region.width / 2}% ${region.y + region.height / 2}%`;
}

export function cropViewBoxValue(region: CropRegion): string {
  const { x, y, width, height } = region;
  return `inset(${y}% ${100 - x - width}% ${100 - y - height}% ${x}%)`;
}

export function cropObjectMetrics(region: CropRegion) {
  const width = Math.max(region.width, 0.001);
  const height = Math.max(region.height, 0.001);
  return {
    width: `${(100 / width) * 100}%`,
    height: `${(100 / height) * 100}%`,
    left: `${(-region.x / width) * 100}%`,
    top: `${(-region.y / height) * 100}%`,
  };
}

export function croppedNaturalSize(
  naturalW: number,
  naturalH: number,
  region: CropRegion,
): { w: number; h: number } {
  return {
    w: naturalW * (region.width / 100),
    h: naturalH * (region.height / 100),
  };
}

type CoverPosition = "center" | "top";

export type CropTarget = {
  aspect: number | null;
  initialRegion: CropRegion | null;
};

type CropTargetOptions = {
  deviceFrame: DeviceFrame;
  objectFit?: "contain" | "cover" | "fill";
  stageElement?: HTMLElement | null;
  imageElement?: HTMLImageElement | null;
  fallbackAspect?: number | null;
};

function computeCoverCropRegion(
  naturalW: number,
  naturalH: number,
  containerW: number,
  containerH: number,
  position: CoverPosition = "center",
): CropRegion | null {
  if (!naturalW || !naturalH || !containerW || !containerH) return null;
  const imageAspect = naturalW / naturalH;
  const containerAspect = containerW / containerH;

  if (Math.abs(imageAspect - containerAspect) < 0.01) return null;

  if (imageAspect > containerAspect) {
    const visibleWidthFraction = containerAspect / imageAspect;
    const widthPct = visibleWidthFraction * 100;

    const xPct = (100 - widthPct) / 2;
    return { x: xPct, y: 0, width: widthPct, height: 100 };
  } else {
    const visibleHeightFraction = imageAspect / containerAspect;
    const heightPct = visibleHeightFraction * 100;
    const yPct = position === "top" ? 0 : (100 - heightPct) / 2;
    return { x: 0, y: yPct, width: 100, height: heightPct };
  }
}

function computeCoverCropRegionForAspect(
  naturalW: number,
  naturalH: number,
  targetAspect: number,
  position: CoverPosition = "center",
): CropRegion | null {
  if (!targetAspect || !Number.isFinite(targetAspect) || targetAspect <= 0) {
    return null;
  }

  return computeCoverCropRegion(naturalW, naturalH, targetAspect, 1, position);
}

function insetCropRegion(
  region: CropRegion,
  factor = 0.88,
  position: CoverPosition = "center",
): CropRegion {
  const safeFactor = Math.max(0.1, Math.min(1, factor));
  const width = region.width * safeFactor;
  const height = region.height * safeFactor;
  const x = region.x + (region.width - width) / 2;
  const y =
    position === "top" && region.y === 0
      ? region.y
      : region.y + (region.height - height) / 2;

  return { x, y, width, height };
}

function cropCoverPositionForFrame(deviceFrame: DeviceFrame): CoverPosition {
  return isBrowserFrame(deviceFrame.id) ? "top" : "center";
}

function cropAspectForFrameScreen(deviceFrame: DeviceFrame): number | null {
  if (deviceFrame.id === "none") return null;

  const browserFrame = getBrowserFrame(deviceFrame.id);
  if (browserFrame) {
    return browserFrame.size.w / browserFrame.size.h;
  }

  const spec = deviceFrameGeometry(deviceFrame.id);
  if (!spec) return null;

  const screenAspect = parseRatio(spec.screen.aspectRatio);
  if (!screenAspect) return null;

  const device = lookupDynamicDeviceFrameModel(deviceFrame.id);
  const rotatesPortraitAsset =
    deviceFrame.orientation === "horizontal" &&
    device?.orientations.includes("portrait") === true &&
    screenAspect < 1;

  return rotatesPortraitAsset ? 1 / screenAspect : screenAspect;
}

export function computeCropTarget({
  deviceFrame,
  objectFit = "cover",
  stageElement,
  imageElement,
  fallbackAspect,
}: CropTargetOptions): CropTarget {
  const aspect =
    elementAspect(stageElement) ??
    cropAspectForFrameScreen(deviceFrame) ??
    validAspect(fallbackAspect);

  if (!aspect) return { aspect: null, initialRegion: null };

  const naturalW = imageElement?.naturalWidth ?? 0;
  const naturalH = imageElement?.naturalHeight ?? 0;
  const coverPosition = cropCoverPositionForFrame(deviceFrame);
  const coverRegion =
    objectFit === "cover"
      ? computeCoverCropRegionForAspect(
          naturalW,
          naturalH,
          aspect,
          coverPosition,
        )
      : null;
  const initialRegion =
    coverRegion && (coverRegion.width >= 99 || coverRegion.height >= 99)
      ? insetCropRegion(coverRegion, 0.88, coverPosition)
      : coverRegion;

  return { aspect, initialRegion };
}

function elementAspect(element: HTMLElement | null | undefined) {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  const width = rect.width || element.clientWidth;
  const height = rect.height || element.clientHeight;
  if (!width || !height) return null;
  return width / height;
}

function parseRatio(value: string) {
  const [w, h] = value.split("/").map((part) => Number(part.trim()));
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    return null;
  }
  return w / h;
}

function validAspect(value: number | null | undefined) {
  return value && Number.isFinite(value) && value > 0 ? value : null;
}
