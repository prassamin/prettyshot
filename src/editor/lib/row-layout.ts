import { isBrowserFrame } from "@/editor/frames/catalog";
import { deviceFrameGeometry } from "@/editor/frames/geometry";
import type { DeviceFrame } from "@/editor/frames/types";

/**
 * Configuration constants for stage screenshot row layout calculations.
 */
export const STAGE_ROW_CONFIG = {
  marginPct: 1,
  gapPct: 2,
  soloMaxHeightPct: 70,
  multiMaxHeightPct: 92,
  browserAspect: 16 / 10,
  landscapeFallbackAspect: 16 / 10,
  portraitFallbackAspect: 10 / 14,
} as const;

export interface StageLayoutItem {
  id: string;
  deviceFrame: DeviceFrame;
}

export interface ComputedItemLayout {
  id: string;
  widthPct: number;
  xPct: number;
}

/**
 * Resolves the natural aspect ratio (width / height) of a device frame deviceFrame.
 */
export function getFrameNaturalAspect(deviceFrame: DeviceFrame): number | null {
  if (deviceFrame.id === "none") return null;
  if (isBrowserFrame(deviceFrame.id)) return STAGE_ROW_CONFIG.browserAspect;

  const spec = deviceFrameGeometry(deviceFrame.id);
  if (!spec) return null;

  const [w, h] = spec.aspectRatio
    .split("/")
    .map((part) => Number(part.trim()));
  if (!w || !h) return null;

  const naturalRatio = w / h;
  if (deviceFrame.orientation === "horizontal" && naturalRatio < 1) {
    return 1 / naturalRatio;
  }
  return naturalRatio;
}

/**
 * Fallback aspect ratio when no device frame is active.
 */
function getFallbackAspect(canvasAspect: number): number {
  return canvasAspect < 0.85
    ? STAGE_ROW_CONFIG.portraitFallbackAspect
    : STAGE_ROW_CONFIG.landscapeFallbackAspect;
}

/**
 * Resolves the CSS aspect-ratio property for a screenshot slot/deviceFrame.
 */
export function resolveSlotAspectRatio(
  deviceFrame: DeviceFrame,
  canvasAspect: number,
  naturalDims?: { w: number; h: number } | null,
): string {
  if (deviceFrame.id === "none") {
    if (naturalDims && naturalDims.w > 0 && naturalDims.h > 0) {
      return `${naturalDims.w} / ${naturalDims.h}`;
    }
    return canvasAspect < 0.85 ? "10 / 14" : "16 / 10";
  }

  const aspect = getFrameNaturalAspect(deviceFrame) ?? getFallbackAspect(canvasAspect);
  return String(aspect);
}

/**
 * Computes side-by-side horizontal row layout positioning and widths
 * for multiple screenshot device frames on the canvas stage.
 */
export function calculateRowLayout(
  items: StageLayoutItem[],
  canvasAspect: number,
): ComputedItemLayout[] {
  if (items.length === 0) return [];

  const aspects = items.map(
    (item) =>
      getFrameNaturalAspect(item.deviceFrame) ?? getFallbackAspect(canvasAspect),
  );

  const totalGaps = STAGE_ROW_CONFIG.gapPct * (items.length - 1);
  const usableWidth = 100 - 2 * STAGE_ROW_CONFIG.marginPct;
  const widthBudget = Math.max(0, usableWidth - totalGaps);
  const aspectSum = aspects.reduce((acc, aspect) => acc + aspect, 0);

  const maxHeightByWidth =
    aspectSum > 0 ? (widthBudget * canvasAspect) / aspectSum : Infinity;
  const maxHeightByCap =
    items.length === 1
      ? STAGE_ROW_CONFIG.soloMaxHeightPct
      : STAGE_ROW_CONFIG.multiMaxHeightPct;
  const targetHeight = Math.min(maxHeightByWidth, maxHeightByCap);

  const widths = aspects.map((aspect) => (targetHeight * aspect) / canvasAspect);
  const totalWidth = widths.reduce((acc, width) => acc + width, 0) + totalGaps;
  const startX = 50 - totalWidth / 2;

  let cursor = startX;
  return items.map((item, index) => {
    const width = widths[index];
    const centerX = cursor + width / 2;
    cursor += width + STAGE_ROW_CONFIG.gapPct;
    return {
      id: item.id,
      widthPct: width,
      xPct: centerX,
    };
  });
}

// Backward-compatible named exports for smooth transitions
export const computeRowLayout = calculateRowLayout;
export const slotBoxAspectRatio = resolveSlotAspectRatio;
