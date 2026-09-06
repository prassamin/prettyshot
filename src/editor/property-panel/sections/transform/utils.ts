import { getTransformTokenName } from "./constants";
import type {
  TransformAxis,
  TransformLiveScope,
  TransformLiveTarget,
} from "./types";

/**
 * Sets or removes a live CSS transform variable on a target element.
 */
export function setLiveTransformStyle(
  element: HTMLElement | null,
  scope: TransformLiveScope,
  axis: TransformAxis,
  value: string | null,
): void {
  if (!element) return;
  const token = getTransformTokenName(scope, axis);
  if (value === null) {
    element.style.removeProperty(token);
  } else {
    element.style.setProperty(token, value);
  }
}

/**
 * Clears all live transform variables from an element.
 */
export function clearLiveTransformStyles(
  element: HTMLElement | null,
  scope: TransformLiveScope,
): void {
  const axes: TransformAxis[] = ["rx", "ry", "rz", "scale", "rot"];
  for (const axis of axes) {
    setLiveTransformStyle(element, scope, axis, null);
  }
}

/**
 * Broadcasts a live transform style property to a specific target.
 */
export function broadcastLiveTransform(
  target: TransformLiveTarget,
  axis: TransformAxis,
  value: string | null,
): void {
  setLiveTransformStyle(target.element, target.scope, axis, value);
}

/**
 * Clears all active live transform styles across multiple target elements.
 */
export function clearAllLiveTransforms(targets: TransformLiveTarget[]): void {
  for (const target of targets) {
    clearLiveTransformStyles(target.element, target.scope);
  }
}

/**
 * Schedules a callback on the next animation frame if supported.
 */
export function executeNextFrame(callback: () => void): void {
  if (typeof requestAnimationFrame === "undefined") {
    callback();
    return;
  }
  requestAnimationFrame(callback);
}
