import { colord } from "colord";
import { clamp } from "@/editor/lib/geometry";
import {
  SHADOW_FILTER_PREVIEW_VAR,
  SHADOW_PREVIEW_VAR,
} from "./constants";
import type { LightCoordinate, Shadow } from "./types";

/**
 * Parses a serialized lightSource identifier (e.g. "center" or "1.50-3.20")
 * into a 2D LightCoordinate on a [0..4] Cartesian plane.
 */
export function parseLightCoordinate(lightSource: string): LightCoordinate {
  if (lightSource === "center") return { row: 2, col: 2 };

  const [row, col] = lightSource.split("-").map(Number);
  if (!Number.isFinite(row) || !Number.isFinite(col)) {
    return { row: 2, col: 2 };
  }

  return {
    row: clamp(row, 0, 4),
    col: clamp(col, 0, 4),
  };
}

/**
 * Formats a 2D LightCoordinate into a serialized identifier string.
 */
export function formatLightCoordinate(row: number, col: number): string {
  const safeRow = clamp(row, 0, 4);
  const safeCol = clamp(col, 0, 4);
  const isCenter = Math.abs(safeRow - 2) < 0.01 && Math.abs(safeCol - 2) < 0.01;
  return isCenter ? "center" : `${safeRow.toFixed(2)}-${safeCol.toFixed(2)}`;
}

/**
 * Calculates directional offset delta factors (deltaX, deltaY) relative
 * to the center origin for direct shadow offset manipulation.
 */
export function calculateLightDelta(lightSource: string): {
  deltaX: number;
  deltaY: number;
} {
  if (lightSource === "center") return { deltaX: 0, deltaY: 0 };
  const coord = parseLightCoordinate(lightSource);
  return {
    deltaX: coord.col - 2,
    deltaY: coord.row - 2,
  };
}

/**
 * Formats a color and alpha opacity into a valid rgba(...) CSS expression.
 * Multiplies the color's inherent alpha channel (from color picker opacity)
 * with the shadow layer formula opacity.
 */
export function shadowRgba(color: string, opacity: number): string {
  const parsed = colord(color || "#000000").toRgb();
  const baseAlpha = parsed.a !== undefined ? parsed.a : 1;
  const effectiveAlpha = Math.max(0, Math.min(1, baseAlpha * opacity));
  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${effectiveAlpha.toFixed(3)})`;
}

/**
 * Generates the complete CSS `box-shadow` property value for a given Shadow.
 */
export function shadowCss(shadow: Shadow): string | undefined {
  if (shadow.type === "none" || shadow.intensity <= 0) return undefined;

  const normalizedIntensity = shadow.intensity / 100;
  const shadowColor = shadow.color || "#000000";
  const { deltaX, deltaY } = calculateLightDelta(shadow.lightSource);

  switch (shadow.type) {
    case "glow": {
      const blurRadius = 30 + normalizedIntensity * 90;
      const spreadRadius = normalizedIntensity * 8;
      const alpha = 0.18 + normalizedIntensity * 0.42;
      return `0 0 ${blurRadius}px ${spreadRadius}px ${shadowRgba(shadowColor, alpha)}`;
    }

    case "soft": {
      const unitScale = normalizedIntensity * 10;
      const blurRadius = 40 + normalizedIntensity * 80;
      const spreadRadius = normalizedIntensity * 4;
      const alpha = 0.1 + normalizedIntensity * 0.2;
      const offsetX = (deltaX * unitScale).toFixed(1);
      const offsetY = (deltaY * unitScale).toFixed(1);
      return `${offsetX}px ${offsetY}px ${blurRadius.toFixed(1)}px ${spreadRadius.toFixed(1)}px ${shadowRgba(shadowColor, alpha)}`;
    }

    case "hard": {
      const unitScale = normalizedIntensity * 12;
      const alpha = 0.25 + normalizedIntensity * 0.45;
      const offsetX = (deltaX * unitScale).toFixed(1);
      const offsetY = (deltaY * unitScale).toFixed(1);
      return `${offsetX}px ${offsetY}px 0px 0px ${shadowRgba(shadowColor, alpha)}`;
    }

    case "float": {
      const alphaPrimary = 0.12 + normalizedIntensity * 0.18;
      const alphaSecondary = 0.08 + normalizedIntensity * 0.12;
      const blurPrimary = 15 + normalizedIntensity * 25;
      const blurSecondary = 40 + normalizedIntensity * 60;
      const offsetYPrimary = 4 + normalizedIntensity * 12;
      const offsetYSecondary = 8 + normalizedIntensity * 20;
      return `0 ${offsetYPrimary.toFixed(1)}px ${blurPrimary.toFixed(1)}px 0px ${shadowRgba(shadowColor, alphaPrimary)}, 0 ${offsetYSecondary.toFixed(1)}px ${blurSecondary.toFixed(1)}px 0px ${shadowRgba(shadowColor, alphaSecondary)}`;
    }

    case "linear": {
      const unitScale = normalizedIntensity * 12;
      const s1 = `${(deltaX * unitScale * 0.5).toFixed(1)}px ${(deltaY * unitScale * 0.5).toFixed(1)}px ${(10 + normalizedIntensity * 15).toFixed(1)}px 0px ${shadowRgba(shadowColor, 0.1 + normalizedIntensity * 0.15)}`;
      const s2 = `${(deltaX * unitScale * 1.2).toFixed(1)}px ${(deltaY * unitScale * 1.2).toFixed(1)}px ${(25 + normalizedIntensity * 35).toFixed(1)}px 0px ${shadowRgba(shadowColor, 0.08 + normalizedIntensity * 0.12)}`;
      const s3 = `${(deltaX * unitScale * 2.2).toFixed(1)}px ${(deltaY * unitScale * 2.2).toFixed(1)}px ${(45 + normalizedIntensity * 65).toFixed(1)}px 0px ${shadowRgba(shadowColor, 0.05 + normalizedIntensity * 0.08)}`;
      const s4 = `${(deltaX * unitScale * 3.5).toFixed(1)}px ${(deltaY * unitScale * 3.5).toFixed(1)}px ${(70 + normalizedIntensity * 100).toFixed(1)}px 0px ${shadowRgba(shadowColor, 0.02 + normalizedIntensity * 0.05)}`;
      return `${s1}, ${s2}, ${s3}, ${s4}`;
    }

    case "drop":
    default: {
      const unitScale = normalizedIntensity * 16;
      const blurRadius = 20 + normalizedIntensity * 60;
      const spreadRadius = -2;
      const alpha = 0.15 + normalizedIntensity * 0.35;
      const offsetX = (deltaX * unitScale).toFixed(1);
      const offsetY = (deltaY * unitScale).toFixed(1);
      return `${offsetX}px ${offsetY}px ${blurRadius.toFixed(1)}px ${spreadRadius}px ${shadowRgba(shadowColor, alpha)}`;
    }
  }
}

/**
 * Converts a multi-layer box-shadow expression into an equivalent
 * SVG/CSS `drop-shadow(...)` filter chain.
 */
export function shadowDropFilterCss(shadow: Shadow): string | undefined {
  const boxShadow = shadowCss(shadow);
  if (!boxShadow) return undefined;

  const dropShadowParts = parseBoxShadowSegments(boxShadow)
    .map(convertSegmentToDropShadow)
    .filter((part): part is string => Boolean(part));

  return dropShadowParts.length ? dropShadowParts.join(" ") : undefined;
}

/**
 * Returns a CSS variable fallback expression for live box-shadow previews.
 */
export function shadowBoxShadowCss(
  committedStyle: string | undefined,
): string | undefined {
  if (!committedStyle) return undefined;
  return `var(${SHADOW_PREVIEW_VAR}, ${committedStyle})`;
}

/**
 * Returns a CSS variable fallback expression for live drop-shadow filter previews.
 */
export function shadowDropFilterPreviewCss(
  committedStyle: string | undefined,
): string | undefined {
  if (!committedStyle) return undefined;
  return `var(${SHADOW_FILTER_PREVIEW_VAR}, ${committedStyle})`;
}

/**
 * Splits a composite CSS shadow value along top-level commas.
 */
function parseBoxShadowSegments(compositeValue: string): string[] {
  const segments: string[] = [];
  let buffer = "";
  let nestedParenDepth = 0;

  for (const char of compositeValue) {
    if (char === "(") nestedParenDepth += 1;
    else if (char === ")") nestedParenDepth -= 1;

    if (char === "," && nestedParenDepth === 0) {
      if (buffer.trim()) segments.push(buffer.trim());
      buffer = "";
      continue;
    }
    buffer += char;
  }

  if (buffer.trim()) segments.push(buffer.trim());
  return segments;
}

/**
 * Converts an individual box-shadow layer segment to drop-shadow(...).
 */
function convertSegmentToDropShadow(segment: string): string | null {
  const tokens: string[] = [];
  let buffer = "";
  let parenDepth = 0;

  for (const char of segment) {
    if (char === "(") parenDepth += 1;
    else if (char === ")") parenDepth -= 1;

    if (/\s/.test(char) && parenDepth === 0) {
      if (buffer) {
        tokens.push(buffer);
        buffer = "";
      }
      continue;
    }
    buffer += char;
  }
  if (buffer) tokens.push(buffer);

  // Drop-shadow filters do not support the inset keyword
  const filteredTokens = tokens.filter((tok) => tok.toLowerCase() !== "inset");

  const isNumericLength = /^-?\d+(\.\d+)?(px|em|rem|%)?$/;
  const lengthValues: string[] = [];
  let colorValue = "";

  for (const tok of filteredTokens) {
    if (isNumericLength.test(tok) && !colorValue) {
      lengthValues.push(tok);
    } else {
      colorValue = colorValue ? `${colorValue} ${tok}` : tok;
    }
  }

  if (lengthValues.length < 2) return null;

  const [offsetX, offsetY, blurRaw, spreadRaw] = lengthValues;
  const blur = parseFloat(blurRaw ?? "0");
  const spread = parseFloat(spreadRaw ?? "0");
  const effectiveBlur = Math.max(0, blur + Math.max(0, spread) * 2);

  return `drop-shadow(${offsetX} ${offsetY} ${effectiveBlur}px ${colorValue})`;
}
