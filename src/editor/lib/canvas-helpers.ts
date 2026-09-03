import type * as React from "react";

import { shadowDropFilterPreviewCss } from "@/editor/lib/css-utils";
import {
  TOKEN_LIGHTING_IMAGE,
  TOKEN_LIGHTING_OPACITY,
} from "@/editor/property-panel/sections/backdrop/constants";
import {
  MAIN_BARE_LEFT_TOKEN,
  MAIN_BARE_TOP_TOKEN,
} from "@/editor/lib/preview-tokens";
import { resolveOverlayUrl } from "@/editor/property-panel/sections/backdrop/utils";
import type {
  LightSourceConfig,
  OverlayConfig,
} from "@/editor/property-panel/sections/backdrop/types";
import { colord } from "colord";

function lightSourcePoint(direction: string) {
  if (direction === "center") return { x: 50, y: 50 };
  const match = direction.match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
  const row = Number(match?.[1]);
  const col = Number(match?.[2]);
  if (!Number.isFinite(row) || !Number.isFinite(col)) return { x: 50, y: 50 };
  return {
    x: clamp(col, -4, 8) * 25,
    y: clamp(row, -4, 8) * 25,
  };
}

function lightRgba(color: string, opacity: number) {
  const { r, g, b } = colord(color || "#ffffff").toRgb();
  return `rgba(${r}, ${g}, ${b}, ${opacity.toFixed(3)})`;
}

function lightGradientDirection(x: number, y: number) {
  const DEAD = 6;
  const dx = x - 50;
  const dy = y - 50;
  const vertical = Math.abs(dy) < DEAD ? "" : dy < 0 ? "bottom" : "top";
  const horizontal = Math.abs(dx) < DEAD ? "" : dx < 0 ? "right" : "left";
  const parts = [vertical, horizontal].filter(Boolean);
  if (parts.length === 0) return "to bottom";
  return `to ${parts.join(" ")}`;
}

export function lightingOverlayValues(
  lighting: LightSourceConfig | undefined,
  options: { inner?: boolean; forceMount?: boolean } = {},
): { image: string; opacity: number } | null {
  if (!lighting) return null;
  const off = lighting.intensity <= 0;

  if (off && !options.forceMount) return null;

  const intensity = clamp(lighting.intensity, 0, 100) / 100;
  const { x, y } = lightSourcePoint(lighting.direction);
  const strong = lightRgba(lighting.color, options.inner ? 0.56 : 0.62);
  const mid = lightRgba(lighting.color, options.inner ? 0.32 : 0.36);
  const soft = lightRgba(lighting.color, options.inner ? 0.22 : 0.26);

  return {
    image: [
      `radial-gradient(circle at ${x}% ${y}%, ${strong} 0%, ${mid} 22%, transparent 58%)`,
      `linear-gradient(${lightGradientDirection(x, y)}, ${soft} 0%, transparent 62%)`,
    ].join(", "),
    opacity: off ? 0 : 0.15 + intensity * 0.85,
  };
}

export function lightingOverlayCss(
  lighting: LightSourceConfig | undefined,
  options: { inner?: boolean; active?: boolean; forceMount?: boolean } = {},
): React.CSSProperties | null {
  const values = lightingOverlayValues(lighting, options);
  if (!values) return null;

  const suffix = options.inner ? "-in" : "";
  const restOpacity = options.active === false ? 0 : values.opacity;
  return {
    backgroundImage: `var(${TOKEN_LIGHTING_IMAGE}${suffix}, ${values.image})`,
    opacity:
      `var(${TOKEN_LIGHTING_OPACITY}${suffix}, ${restOpacity.toFixed(3)})` as unknown as number,
  };
}

export function overlayLayerCss(
  overlay: OverlayConfig,
  opacityVar: string,
  restOpaque: number,
): React.CSSProperties | null {
  if (overlay.id === null) return null;
  const own = clamp(overlay.opacity, 0, 100) / 100;
  const url = resolveOverlayUrl(overlay.id, overlay.url);
  return {
    backgroundImage: url ? `url("${url}")` : undefined,
    opacity:
      `calc(var(${opacityVar}, ${restOpaque}) * ${own})` as unknown as number,
  };
}

export function annotationPath(points: { x: number; y: number }[]) {
  const first = points[0];
  if (!first) return "";
  if (points.length === 1)
    return `M ${first.x} ${first.y} L ${first.x + 0.01} ${first.y + 0.01}`;
  return points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    )
    .join(" ");
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * True while the draw tool is active AND a brush/shape mode is selected.
 * While truly armed, the canvas must never treat presses as upload/replace
 * gestures — the drawing surface owns the pointer.
 */
export function isDrawingArmed(
  activeTool: string,
  annotationMode: string | null | undefined,
): boolean {
  return (
    activeTool === "draw" &&
    annotationMode != null &&
    annotationMode !== "none"
  );
}

export function snapCenterToTarget({
  centerX,
  centerY,
  targetX,
  targetY,
  threshold = 8,
}: {
  centerX: number;
  centerY: number;
  targetX: number;
  targetY: number;
  threshold?: number;
}) {
  const snapX = Math.abs(centerX - targetX) <= threshold;
  const snapY = Math.abs(centerY - targetY) <= threshold;

  return {
    deltaX: snapX ? targetX - centerX : 0,
    deltaY: snapY ? targetY - centerY : 0,
    guides: { x: snapX, y: snapY },
  };
}

export function snapBoxToTarget({
  centerX,
  centerY,
  width,
  height,
  targetX,
  targetY,
  threshold = 8,
}: {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  targetX: number;
  targetY: number;
  threshold?: number;
}) {
  const xCandidates = [centerX, centerX - width / 2, centerX + width / 2];
  const yCandidates = [centerY, centerY - height / 2, centerY + height / 2];
  const x = nearestSnapDelta(xCandidates, targetX, threshold);
  const y = nearestSnapDelta(yCandidates, targetY, threshold);

  return {
    deltaX: x.delta,
    deltaY: y.delta,
    guides: { x: x.snapped, y: y.snapped },
  };
}

function nearestSnapDelta(
  candidates: number[],
  target: number,
  threshold: number,
) {
  let bestDelta = 0;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const delta = target - candidate;
    const distance = Math.abs(delta);
    if (distance <= threshold && distance < bestDistance) {
      bestDelta = delta;
      bestDistance = distance;
    }
  }

  return { delta: bestDelta, snapped: bestDistance !== Infinity };
}

export function positionFloatingToolbar(
  target: string,
  rect: DOMRect,
  scale = 1,
) {
  if (typeof document === "undefined") return;
  const toolbar = document.querySelector<HTMLElement>(
    `[data-floating-anchor="${CSS.escape(target)}"]`,
  );
  if (!toolbar) return;

  const flipBelow = rect.top < 80;
  const placement = flipBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)";
  toolbar.style.top = `${flipBelow ? rect.bottom + 12 : rect.top - 12}px`;
  toolbar.style.left = `${rect.left + rect.width / 2}px`;
  toolbar.style.transform =
    scale === 1 ? placement : `${placement} scale(${scale})`;
  toolbar.style.transformOrigin = flipBelow ? "top center" : "bottom center";
}

/**
 * Screen geometry for a device id, with a phone-shaped fallback.
 */

export function fitContainBox(boxW: number, boxH: number, ratio: number) {
  const width = Math.min(boxW, boxH * ratio);
  return { width, height: width / ratio };
}

export function screenshotPlacementStyle(
  dims: {
    stageW: number;
    stageH: number;
    imgW: number;
    imgH: number;
  },
  scaleFactor: number,
  positionX: number,
  positionY: number,
): React.CSSProperties {
  const visualW = dims.imgW * scaleFactor;
  const visualH = dims.imgH * scaleFactor;
  const overflowX = Math.min(visualW * 0.18, dims.stageW * 0.24);
  const overflowY = Math.min(visualH * 0.18, dims.stageH * 0.24);

  const visualLeft =
    -overflowX + (dims.stageW - visualW + overflowX * 2) * positionX;
  const visualTop =
    -overflowY + (dims.stageH - visualH + overflowY * 2) * positionY;

  return {
    left: visualLeft + (visualW - dims.imgW) / 2,
    top: visualTop + (visualH - dims.imgH) / 2,
  };
}

import type { BareFreePlacement } from "@/editor/screenshot/types";

export type { BareFreePlacement };

export function bareFreePlacementStyle({
  freePlacement,
  boxStyle,
  transform,
  shadowFilter,
}: {
  freePlacement: BareFreePlacement;
  boxStyle?: React.CSSProperties;
  transform?: string;
  shadowFilter?: string;
}): React.CSSProperties {
  return {
    ...boxStyle,
    left: `var(${MAIN_BARE_LEFT_TOKEN}, ${freePlacement.left}px)`,
    top: `var(${MAIN_BARE_TOP_TOKEN}, ${freePlacement.top}px)`,
    width: freePlacement.width,
    height: freePlacement.height,
    maxWidth: "none",
    maxHeight: "none",
    transform: transform || undefined,
    transformOrigin: "center",
    transformStyle: "preserve-3d",
    filter: shadowDropFilterPreviewCss(shadowFilter) || undefined,
  };
}

/* ── Frame geometry (moved to @/editor/frames/geometry) ─────────────────── */

export {
  coverContainerBox,
  frameFitStyle,
  framePositionedStyle,
  framePositionTransform,
  frameSelectionRadius,
  isDesktopFrame,
  deviceFrameGeometry,
  deviceFrameViewportClip,
  deviceFrameViewportTransform,
  parseAspectRatio,
} from "@/editor/frames/geometry";
