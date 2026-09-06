import type { PositionSliderPoint } from "@/editor/components/position-slider";
import type { BackdropFilterKind, BackdropAdjustments } from "./types";

const overlayUrlRegistry = new Map<number, string>();

/**
 * Registers dynamic remote CDN URLs for overlays in the runtime cache.
 */
export function registerOverlayUrls(
  overlays: Array<{ id: number; url: string }>,
) {
  for (const item of overlays) {
    if (item.id && item.url) {
      overlayUrlRegistry.set(item.id, item.url);
    }
  }
}

/**
 * Resolves full asset image URL for a given overlay by ID or direct URL.
 */
export function resolveOverlayUrl(
  id: number | null | undefined,
  directUrl?: string | null,
): string {
  if (directUrl) return directUrl;
  if (!id) return "";
  return overlayUrlRegistry.get(id) || "";
}

/**
 * Builds CSS filter rule for preset aesthetic photo color gradings.
 */
export function buildColorFilterCss(
  kind: BackdropFilterKind,
): string | undefined {
  switch (kind) {
    case "bw":
      return "grayscale(1) contrast(1.05)";
    case "sepia":
      return "sepia(0.85) saturate(1.1)";
    case "vintage":
      return "sepia(0.4) contrast(0.95) saturate(0.9) hue-rotate(-10deg)";
    case "warm":
      return "saturate(1.15) hue-rotate(-12deg) brightness(1.04)";
    case "cool":
      return "saturate(1.1) hue-rotate(15deg) brightness(1.02)";
    case "fade":
      return "contrast(0.85) brightness(1.08) saturate(0.85)";
    case "vivid":
      return "saturate(1.5) contrast(1.15)";
    case "noir":
      return "grayscale(1) contrast(1.35) brightness(0.9)";
    case "dream":
      return "blur(0.5px) saturate(1.2) brightness(1.05) contrast(0.95)";
    case "mono":
      return "grayscale(1) sepia(0.3) contrast(1.05)";
    case "invert":
      return "invert(1) hue-rotate(180deg)";
    case "none":
    default:
      return undefined;
  }
}

/**
 * Generates chained CSS filter string from backdrop adjustment properties.
 */
export function buildAdjustmentsFilterCss(
  adj: BackdropAdjustments,
): string | undefined {
  const rules: string[] = [];
  if (adj.blur > 0) rules.push(`blur(${adj.blur}px)`);
  if (adj.brightness !== 100) rules.push(`brightness(${adj.brightness}%)`);
  if (adj.contrast !== 100) rules.push(`contrast(${adj.contrast}%)`);
  if (adj.saturation !== 100) rules.push(`saturate(${adj.saturation}%)`);
  if (adj.hue !== 0) rules.push(`hue-rotate(${adj.hue}deg)`);
  if (adj.grayscale > 0) rules.push(`grayscale(${adj.grayscale}%)`);
  if (adj.sepia > 0) rules.push(`sepia(${adj.sepia}%)`);
  if (adj.invert > 0) rules.push(`invert(${adj.invert}%)`);
  if (adj.opacity !== 100) rules.push(`opacity(${adj.opacity}%)`);
  return rules.length > 0 ? rules.join(" ") : undefined;
}

/**
 * Evaluates whether adjustments deviate from standard neutral values.
 */
export function checkAdjustmentsDirty(adj: BackdropAdjustments): boolean {
  return (
    adj.brightness !== 100 ||
    adj.contrast !== 100 ||
    adj.saturation !== 100 ||
    adj.hue !== 0 ||
    adj.grayscale !== 0 ||
    adj.sepia !== 0 ||
    adj.invert !== 0 ||
    adj.blur !== 0 ||
    adj.noise !== 0 ||
    adj.opacity !== 100
  );
}

/**
 * Translates direction token (e.g. "0-0", "center", "2.5-1.5") into 2D percentage coordinates.
 */
export function parseAngleTokenToPoint(direction: string): PositionSliderPoint {
  if (direction === "center") return { xPct: 50, yPct: 50 };
  const matched = direction.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
  const row = Number(matched?.[1]);
  const col = Number(matched?.[2]);
  if (!Number.isFinite(row) || !Number.isFinite(col)) {
    return { xPct: 50, yPct: 50 };
  }
  return {
    xPct: Math.max(0, Math.min(100, col * 25)),
    yPct: Math.max(0, Math.min(100, row * 25)),
  };
}

/**
 * Formats a 2D slider point into a normalized direction token string.
 */
export function formatPointToAngleToken(point: PositionSliderPoint): string {
  const snapX = Math.round(point.xPct);
  const snapY = Math.round(point.yPct);
  if (snapX === 50 && snapY === 50) return "center";
  const row = (point.yPct / 25).toFixed(2);
  const col = (point.xPct / 25).toFixed(2);
  return `${row}-${col}`;
}
