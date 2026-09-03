import type { Tilt, TransformAxis, TransformLiveScope } from "./types";

/** Default baseline neutral tilt */
export const DEFAULT_TILT: Tilt = {
  rx: 0,
  ry: 0,
  rz: 0,
};

/** CSS variable name used for real-time canvas inset / padding preview */
export const PADDING_PREVIEW_CSS_VAR = "--editor-padding-preview";

/**
 * Returns the CSS custom property name for a specific transform axis
 * on the target scope (e.g. `--canvas-transform-rx` or `--slot-transform-rot`).
 */
export function getTransformTokenName(
  scope: TransformLiveScope,
  axis: TransformAxis,
): string {
  return `--${scope}-transform-${axis}`;
}
