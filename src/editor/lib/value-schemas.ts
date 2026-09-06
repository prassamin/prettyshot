import { z } from "zod/v4";
import { clampNumber } from "./geometry";
import { EDITOR_LIMITS, type RangeLimit } from "./limits";

const finiteNumber = z.number().finite();

function createRangeSchema(limit: RangeLimit) {
  return finiteNumber.min(limit.min).max(limit.max);
}

export const editorValueSchemas = {
  degree: createRangeSchema(EDITOR_LIMITS.degree),
  tiltDegree: createRangeSchema(EDITOR_LIMITS.tiltDegree),
  scale: createRangeSchema(EDITOR_LIMITS.scale),
  percent: createRangeSchema(EDITOR_LIMITS.percent),
  bipolarPercent: createRangeSchema(EDITOR_LIMITS.bipolarPercent),
  hue: createRangeSchema(EDITOR_LIMITS.hue),
  blurPx: createRangeSchema(EDITOR_LIMITS.blur),
  padding: createRangeSchema(EDITOR_LIMITS.padding),
  borderWidth: createRangeSchema(EDITOR_LIMITS.borderWidth),
  borderInnerPadding: createRangeSchema(EDITOR_LIMITS.borderPadding),
  borderRadius: createRangeSchema(EDITOR_LIMITS.borderRadius),
  patternThickness: createRangeSchema(EDITOR_LIMITS.patternThickness),
  brightness: createRangeSchema(EDITOR_LIMITS.brightness),
  contrast: createRangeSchema(EDITOR_LIMITS.contrast),
  saturation: createRangeSchema(EDITOR_LIMITS.saturation),
  shadowIntensity: createRangeSchema(EDITOR_LIMITS.shadowIntensity),
  opacity: createRangeSchema(EDITOR_LIMITS.opacity),
  positionPercent: createRangeSchema(EDITOR_LIMITS.positionPercent),
} as const;

export type EditorValueKey = keyof typeof editorValueSchemas;

export function parseEditorNumber(
  raw: unknown,
  min: number = Number.NEGATIVE_INFINITY,
  max: number = Number.POSITIVE_INFINITY,
): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return clampNumber(n, min, max);
}
