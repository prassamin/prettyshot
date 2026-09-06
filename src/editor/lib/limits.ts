/**
 * Central single-source-of-truth for all editor numeric boundaries,
 * slider ranges, steps, and default values.
 */

export interface RangeLimit {
  min: number;
  max: number;
  step?: number;
  default?: number;
  suffix?: string;
}

export const EDITOR_LIMITS = {
  // Border & Outline
  borderWidth: { min: 0, max: 48, step: 1, default: 0, suffix: "px" },
  borderPadding: { min: 0, max: 120, step: 1, default: 0, suffix: "px" },
  borderRadius: { min: 0, max: 80, step: 1, default: 0, suffix: "px" },

  // Padding & Spacing
  padding: { min: 0, max: 240, step: 1, default: 32, suffix: "px" },

  // Transformation & Position
  scale: { min: 10, max: 300, step: 1, default: 100, suffix: "%" },
  degree: { min: -180, max: 180, step: 1, default: 0, suffix: "°" },
  tiltDegree: { min: -60, max: 60, step: 1, default: 0, suffix: "°" },
  positionPercent: { min: -50, max: 150, step: 1, default: 50, suffix: "%" },

  // Backdrop & Color Adjustments
  brightness: { min: 0, max: 200, step: 1, default: 100, suffix: "%" },
  contrast: { min: 0, max: 200, step: 1, default: 100, suffix: "%" },
  saturation: { min: 0, max: 200, step: 1, default: 100, suffix: "%" },
  hue: { min: -180, max: 360, step: 1, default: 0, suffix: "°" },
  grayscale: { min: 0, max: 100, step: 1, default: 0, suffix: "%" },
  sepia: { min: 0, max: 100, step: 1, default: 0, suffix: "%" },
  invert: { min: 0, max: 100, step: 1, default: 0, suffix: "%" },
  blur: { min: 0, max: 30, step: 0.5, default: 0, suffix: "px" },
  noise: { min: 0, max: 100, step: 1, default: 0, suffix: "%" },
  opacity: { min: 0, max: 100, step: 1, default: 100, suffix: "%" },

  // Shadow Controls
  shadowIntensity: { min: 0, max: 100, step: 1, default: 50, suffix: "%" },
  shadowBlur: { min: 0, max: 120, step: 1, default: 20, suffix: "px" },
  shadowDistance: { min: -100, max: 100, step: 1, default: 10, suffix: "px" },
  shadowSpread: { min: -50, max: 50, step: 1, default: 0, suffix: "px" },

  // Generic Ranges
  percent: { min: 0, max: 100, step: 1, default: 100, suffix: "%" },
  bipolarPercent: { min: -100, max: 100, step: 1, default: 0, suffix: "%" },
  patternThickness: { min: 1, max: 10, step: 1, default: 1 },
} as const satisfies Record<string, RangeLimit>;

export type EditorLimitKey = keyof typeof EDITOR_LIMITS;
