/**
 * Frames domain — geometry & placement math.
 *
 * All positioning/measurement logic shared by the frame stages:
 *
 * - `framePositionedStyle` / `frameFitStyle` / `framePositionTransform` —
 *   the placement pipeline that turns anchor + offset + transform + layer
 *   into the positioned frame box (with preview-token CSS vars).
 * - `deviceFrameGeometry` / `deviceFrameViewportClip` / `deviceFrameViewportTransform` —
 *   device screen projection (aspect fit, corner shaping, scale/offset).
 * - `frameSelectionRadius` — per-frame selection outline radii.
 * - `parseAspectRatio` / `coverContainerBox` / `clamp` — small math
 *   primitives.
 *
 * Extracted from the old `canvas-helpers`; canvas-helpers re-exports these
 * so existing importers keep working — new code should import from here.
 */

import { shadowDropFilterPreviewCss } from "@/editor/lib/css-utils";
import type { ScreenshotLayer } from "@/editor/screenshot/types";
import {
  CHROME_BROWSER_FRAME_ID,
  isBrowserFrame,
  SAFARI_BROWSER_FRAME_ID,
} from "./catalog";

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function frameSelectionRadius(frameId: string, fallback: number) {
  if (frameId === "none") return fallback;
  if (frameId === CHROME_BROWSER_FRAME_ID) return 8;
  if (frameId === SAFARI_BROWSER_FRAME_ID) return 14;
  if (isBrowserFrame(frameId)) return 12;
  return fallback;
}

import { lookupDynamicGeometry } from "./dynamic-catalog";

import type { DeviceOrientation } from "./types";

export function deviceFrameGeometry(
  deviceId: string,
  orientation?: DeviceOrientation | "horizontal" | "vertical",
) {
  return lookupDynamicGeometry(deviceId, orientation);
}


export function deviceFrameViewportTransform(screen: {
  scale: number;
  offsetX?: number;
  offsetY?: number;
}) {
  const transforms = [`scale(${screen.scale})`];
  if (screen.offsetX) transforms.push(`translateX(${screen.offsetX}%)`);
  if (screen.offsetY) transforms.push(`translateY(${screen.offsetY}%)`);
  return transforms.join(" ");
}


export function deviceFrameViewportClip(
  screen: {
    aspectRatio: string;
    borderRadius: number;
  },
  stageWidth?: number,
): React.CSSProperties {
  const supportsCornerShape =
    typeof CSS !== "undefined" &&
    CSS.supports?.("corner-shape", "superellipse(1.3)");
  const radius = supportsCornerShape
    ? screen.borderRadius
    : Math.max(0, screen.borderRadius - 10);
  const screenWidth = deviceFrameScreenAspectWidth(screen.aspectRatio);
  const borderRadius =
    stageWidth && screenWidth
      ? `${(radius / screenWidth) * stageWidth}px`
      : `calc(${radius / 16} * 1em)`;

  return {
    borderRadius,
    ...({
      cornerShape: "var(--theme-corner-shape, superellipse(1.3))",
    } as React.CSSProperties),
  };
}

export function frameFitStyle(
  aspectRatio: string,
  rotation = 0,
  options: { scopeToMinSide?: boolean; fitFraction?: number } = {},
): React.CSSProperties {
  const ratio = parseAspectRatio(aspectRatio) ?? 16 / 10;
  const normalizedRotation = Math.abs(rotation % 180);
  const { scopeToMinSide = false, fitFraction = 0.8 } = options;

  if (normalizedRotation === 90) {
    const inverseRatio = 1 / ratio;
    if (scopeToMinSide) {
      const rotatedFitFraction = Math.min(fitFraction, 0.75);
      return {
        aspectRatio,
        width: "auto",
        height: `min(calc(100cqw * ${rotatedFitFraction}), calc(100cqh * ${rotatedFitFraction} * ${inverseRatio}))`,
        maxWidth: "none",
        maxHeight: "none",
      };
    }
    return {
      aspectRatio,
      width: "auto",
      height: `min(100cqw, calc(100cqh * ${inverseRatio}))`,
      maxWidth: "none",
      maxHeight: "none",
    };
  }

  if (scopeToMinSide) {
    return {
      aspectRatio,
      width: `min(100cqw, calc(100cqh * ${fitFraction} * ${ratio}))`,
      height: "auto",
    };
  }
  return {
    aspectRatio,
    width: `min(100cqw, calc(100cqh * ${ratio}))`,
    height: "auto",
  };
}

export function framePositionTransform({
  anchor,
  offset,
  transform,
  rotation = 0,
  readPreviewVars = true,
}: {
  anchor: { x: number; y: number };
  offset: { x: number; y: number };
  transform: string;
  rotation?: number;
  readPreviewVars?: boolean;
}) {
  const rotationTransform = rotation ? ` rotate(${rotation}deg)` : "";

  const anchorLeg = readPreviewVars
    ? `translate(var(--stage-anchor-x, ${frameAnchorTravel(anchor.x, "x")}), var(--stage-anchor-y, ${frameAnchorTravel(anchor.y, "y")}))`
    : `translate(${frameAnchorTravel(anchor.x, "x")}, ${frameAnchorTravel(anchor.y, "y")})`;
  const offsetLeg = readPreviewVars
    ? `translate(var(--stage-offset-x, ${offset.x}px), var(--stage-offset-y, ${offset.y}px))`
    : `translate(${offset.x}px, ${offset.y}px)`;

  return [
    "translate(-50%, -50%)",
    anchorLeg,
    offsetLeg,
    transform,
    rotationTransform,
  ].join(" ");
}


function frameAnchorTravel(percent: number, axis: "x" | "y") {
  const delta = clamp((percent - 50) / 50, -1, 1);
  if (delta === 0) return "0px";

  const containerUnit = axis === "x" ? "cqw" : "cqh";
  const formattedDelta = Number(delta.toFixed(4));

  return `calc(${formattedDelta} * 50${containerUnit})`;
}


function deviceFrameScreenAspectWidth(aspectRatio: string) {
  const [width] = aspectRatio.split("/");
  const parsed = Number(width?.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}


export function parseAspectRatio(aspectRatio: string) {
  const [width, height] = aspectRatio
    .split("/")
    .map((part) => Number(part.trim()));

  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  if (!width || !height || height <= 0) return null;
  return width / height;
}


export function coverContainerBox(boxW: number, boxH: number, ratio: number) {
  const width = Math.max(boxW, boxH * ratio);
  return { width, height: width / ratio };
}

/**
 * Whether the device is a desktop machine (laptop / monitor / all-in-one).
 * Desktop devices show the hover edit menu centered on the screen.
 */

export function isDesktopFrame(deviceId: string) {
  return (
    deviceId.startsWith("macbook") ||
    deviceId.startsWith("imac") ||
    deviceId.includes("display")
  );
}


export function framePositionedStyle({
  aspectRatio,
  rotation = 0,
  scopeToMinSide = false,
  fitFraction,
  anchor,
  offset,
  transform,
  shadowFilter,
  layer,
  readPreviewVars = true,
}: {
  aspectRatio: string;
  rotation?: number;
  scopeToMinSide?: boolean;
  fitFraction?: number;
  anchor: { x: number; y: number };
  offset: { x: number; y: number };
  transform: string;
  shadowFilter?: string;
  layer?: ScreenshotLayer;
  readPreviewVars?: boolean;
}): React.CSSProperties {
  const filter =
    [shadowDropFilterPreviewCss(shadowFilter)].filter(Boolean).join(" ") ||
    undefined;

  return {
    ...frameFitStyle(aspectRatio, rotation, {
      scopeToMinSide,
      ...(fitFraction !== undefined ? { fitFraction } : {}),
    }),
    left: "50%",
    top: "50%",
    transform: framePositionTransform({
      anchor,
      offset,
      transform,
      rotation,
      readPreviewVars,
    }),
    transformOrigin: "center",

    filter,
    ...(layer
      ? {
          opacity: layer.hidden ? 0 : layer.opacity / 100,
        }
      : null),
  };
}
