/**
 * Preview tokens — CSS custom-property plumbing for live element previews.
 *
 * ── Why this exists ──
 * During a drag, the store isn't updated until the pointer is released
 * (otherwise every pointermove would create an undo step). To still show the
 * element moving in real time, we write the live position into CSS custom
 * properties on the canvas host element(s). The elements' styles read these
 * tokens via `var(...)` fallbacks, so the DOM follows the pointer without
 * touching React state.
 *
 * ── Token naming ──
 * `--pv-el-<id>-x/-y`   per-element live position (drag preview)
 * `--stage-*`           shared preview tokens for the main screenshot
 *
 * All tokens are cleared when the gesture ends (or one frame after), letting
 * the committed store values take over.
 */

import { CANVAS_ID } from "@/editor/lib/engine-core/initial-config";

/** A position in canvas percentages (0–100, may go beyond for free placement). */
export type PreviewPosition = { xPct: number; yPct: number };

/** Attribute that marks a host element receiving preview tokens. */
export const PREVIEW_HOST_ATTR = "data-preview-host";

/**
 * Resolve the host elements for a canvas scope:
 * the canvas element itself + every element carrying `data-preview-host`.
 * Returns [] on the server.
 */
export function previewHosts(
  canvasId?: string | null | undefined,
): HTMLElement[] {
  if (typeof document === "undefined") return [];
  const id = CSS.escape(canvasId ?? CANVAS_ID);
  const canvasEl = document.querySelector<HTMLElement>(
    `[data-stage-id="${id}"]`,
  );
  const hosts = Array.from(
    document.querySelectorAll<HTMLElement>(`[${PREVIEW_HOST_ATTR}="${id}"]`),
  );
  return canvasEl ? [canvasEl, ...hosts] : hosts;
}

/**
 * Write (or remove) a single CSS custom property on every host element.
 * `value === null` removes the property.
 */
export function writeToken(
  hosts: HTMLElement[],
  name: string,
  value: string | null,
) {
  for (const host of hosts) {
    if (value === null) host.style.removeProperty(name);
    else host.style.setProperty(name, value);
  }
}

/** CSS custom property names that carry an element's live drag position. */
export function elementPositionTokens(elementId: string) {
  return {
    x: `--pv-el-${elementId}-x`,
    y: `--pv-el-${elementId}-y`,
  };
}

/** Write an element's live drag position (percentages) to the hosts. */
export function applyElementPosition(
  hosts: HTMLElement[],
  elementId: string,
  xPct: number,
  yPct: number,
) {
  const { x, y } = elementPositionTokens(elementId);
  writeToken(hosts, x, `${xPct}%`);
  writeToken(hosts, y, `${yPct}%`);
}

/** Remove an element's live drag position tokens from the hosts. */
export function resetElementPosition(hosts: HTMLElement[], elementId: string) {
  const { x, y } = elementPositionTokens(elementId);
  writeToken(hosts, x, null);
  writeToken(hosts, y, null);
}

// ── Shared screenshot preview tokens ─────────────────────────────────────
// The main screenshot can be moved independently of element drags (position
// presets, offset nudging, free placement). Those previews write to a fixed
// set of tokens consumed by the screenshot render paths.

export const ELEMENT_POS_X_TOKEN = "--stage-el-x";
export const ELEMENT_POS_Y_TOKEN = "--stage-el-y";
export const MAIN_POS_X_TOKEN = "--stage-main-x";
export const MAIN_POS_Y_TOKEN = "--stage-main-y";
export const MAIN_ANCHOR_X_TOKEN = "--stage-anchor-x";
export const MAIN_ANCHOR_Y_TOKEN = "--stage-anchor-y";
export const MAIN_OFFSET_X_TOKEN = "--stage-offset-x";
export const MAIN_OFFSET_Y_TOKEN = "--stage-offset-y";
export const MAIN_BARE_LEFT_TOKEN = "--stage-bare-left";
export const MAIN_BARE_TOP_TOKEN = "--stage-bare-top";

/** Every shared preview token — used to clear them all at once. */
export const POSITION_PREVIEW_TOKENS = [
  ELEMENT_POS_X_TOKEN,
  ELEMENT_POS_Y_TOKEN,
  MAIN_POS_X_TOKEN,
  MAIN_POS_Y_TOKEN,
  MAIN_ANCHOR_X_TOKEN,
  MAIN_ANCHOR_Y_TOKEN,
  MAIN_OFFSET_X_TOKEN,
  MAIN_OFFSET_Y_TOKEN,
  MAIN_BARE_LEFT_TOKEN,
  MAIN_BARE_TOP_TOKEN,
];

/** Normalize a single element / array / null into a flat element list. */
function toElements(
  input: HTMLElement | null | undefined | Array<HTMLElement | null | undefined>,
): HTMLElement[] {
  if (!input) return [];
  if (Array.isArray(input))
    return input.filter((el): el is HTMLElement => !!el);
  return [input];
}

/** Write an element's live position preview (used by position presets). */
export function applyElementPositionPreview(
  element: HTMLElement | null | undefined,
  point: PreviewPosition,
) {
  if (!element) return;
  element.style.setProperty(ELEMENT_POS_X_TOKEN, `${point.xPct}%`);
  element.style.setProperty(ELEMENT_POS_Y_TOKEN, `${point.yPct}%`);
}

/**
 * Write the main screenshot's live position preview, including the anchor
 * travel tokens used by frame-anchored layouts.
 */
export function applyMainPositionPreview(
  canvasElement:
    | HTMLElement
    | null
    | undefined
    | Array<HTMLElement | null | undefined>,
  point: PreviewPosition,
) {
  for (const el of toElements(canvasElement)) {
    el.style.setProperty(MAIN_POS_X_TOKEN, `${point.xPct}%`);
    el.style.setProperty(MAIN_POS_Y_TOKEN, `${point.yPct}%`);
    el.style.setProperty(MAIN_ANCHOR_X_TOKEN, anchorTravel(point.xPct, "x"));
    el.style.setProperty(MAIN_ANCHOR_Y_TOKEN, anchorTravel(point.yPct, "y"));
    el.style.setProperty(MAIN_OFFSET_X_TOKEN, "0px");
    el.style.setProperty(MAIN_OFFSET_Y_TOKEN, "0px");
  }
}

/** Write the bare (frameless) screenshot's pixel offsets. */
export function applyMainBarePreviewPx(
  canvasElement:
    | HTMLElement
    | null
    | undefined
    | Array<HTMLElement | null | undefined>,
  leftPx: number,
  topPx: number,
) {
  for (const el of toElements(canvasElement)) {
    el.style.setProperty(MAIN_BARE_LEFT_TOKEN, `${leftPx}px`);
    el.style.setProperty(MAIN_BARE_TOP_TOKEN, `${topPx}px`);
  }
}

/** Remove every shared preview token from an element. */
export function resetPositionTokens(element: HTMLElement | null | undefined) {
  if (!element) return;
  for (const name of POSITION_PREVIEW_TOKENS) {
    element.style.removeProperty(name);
  }
}

/**
 * Reset preview tokens, optionally deferred to the next paint so the browser
 * composites the final frame first. `shouldRun` guards against stale
 * callbacks (e.g. a new gesture already started).
 */
export function resetPositionTokensAfterPaint(
  elements: Array<HTMLElement | null | undefined>,
  shouldRun?: () => boolean,
) {
  if (typeof requestAnimationFrame === "undefined") {
    if (shouldRun && !shouldRun()) return;
    for (const element of elements) resetPositionTokens(element);
    return;
  }

  requestAnimationFrame(() => {
    if (shouldRun && !shouldRun()) return;
    for (const element of elements) resetPositionTokens(element);
  });
}

/**
 * Run a callback two frames after the preview tokens were cleared — enough
 * time for React to re-render from committed values.
 */
export function afterTokensCleared(cb: () => void, shouldRun?: () => boolean) {
  if (typeof requestAnimationFrame === "undefined") {
    if (!shouldRun || shouldRun()) cb();
    return;
  }
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      if (!shouldRun || shouldRun()) cb();
    }),
  );
}

/**
 * How far a position is from the canvas center as a fraction (-1…1).
 * Used to shift frame-anchored layouts when the screenshot moves off-center.
 */
function anchorTravel(percent: number, axis: "x" | "y") {
  const delta = Math.max(-1, Math.min(1, (percent - 50) / 50));
  if (delta === 0) return "0px";

  const containerUnit = axis === "x" ? "cqw" : "cqh";
  const formattedDelta = Number(delta.toFixed(4));
  return `calc(${formattedDelta} * 50${containerUnit})`;
}
