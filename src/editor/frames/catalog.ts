/**
 * Frames catalog — the unified frame registry.
 *
 * Everything the editor needs to look up frames:
 *
 * - Browser frames (`BROWSER_FRAMES`: Safari/Chrome ids, aspect ratios,
 *   colors, preview URLs) — defined here directly.
 * - Device frames (`DEVICE_FRAME_CATALOG` + lookups) — defined in
 *   `./device/utils.ts` and re-exported here so the whole frame domain has
 *   one import surface.
 */

import type { BrowserFrameColor } from "./types";
export {
  inferDeviceClassForFrame,
} from "./device/utils";
export type { DeviceFrameVariant, DeviceFrameModel, DeviceOrientation } from "./types";

export const SAFARI_BROWSER_FRAME_ID = "safari";
export const CHROME_BROWSER_FRAME_ID = "chrome";
export const BROWSER_FRAME_PREVIEW_IMAGE_URL = `/thumbnails/macos.webp`;

export const BROWSER_FRAME_COLORS = ["dark", "light"] as const;

export const BROWSER_FRAMES = [
  {
    id: SAFARI_BROWSER_FRAME_ID,
    name: "Safari",
    aspectRatio: "1203 / 753",
    colors: BROWSER_FRAME_COLORS,
    previewImageUrl: BROWSER_FRAME_PREVIEW_IMAGE_URL,
    size: { w: 1200, h: 700 },
  },
  {
    id: CHROME_BROWSER_FRAME_ID,
    name: "Chrome",
    aspectRatio: "1202 / 776",
    colors: BROWSER_FRAME_COLORS,
    previewImageUrl: BROWSER_FRAME_PREVIEW_IMAGE_URL,
    size: { w: 1200, h: 700 },
  },
] as const;

export const BROWSER_FRAME_ASPECT_RATIO = BROWSER_FRAMES[0].aspectRatio;

export function getBrowserFrame(id: string) {
  return BROWSER_FRAMES.find((frame) => frame.id === id) ?? null;
}

export function isBrowserFrame(id: string) {
  return getBrowserFrame(id) !== null;
}

export function resolveBrowserFrameColor(color: string): BrowserFrameColor {
  return color === "light" ? "light" : "dark";
}
