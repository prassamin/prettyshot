import type { FrameKind } from "@/editor/property-panel/sections/frame/types";
/**
 * Frames domain — shared type definitions.
 *
 * Every type that crosses the browser/device frame boundary lives here:
 * the `DeviceFrame` canvas setting, chrome tones, deviceFrame catalog types,
 * and the small geometry primitives both frame families share.
 *
 * Frame-specific prop contracts stay in `browser/types.tsx` and
 * `device/types.tsx`.
 */

/** Device frame orientation. */
export type FrameOrientation = "vertical" | "horizontal";

/** The frame setting attached to a canvas (device deviceFrame or browser frame). */
export type DeviceFrame = {
  id: string;
  variantId: string;
  orientation: FrameOrientation;
};

/** Browser chrome tone selection. */
export type BrowserFrameColor = "dark" | "light";

/** Device orientation a deviceFrame frame can depict. */
export type DeviceOrientation = "portrait" | "landscape";

/** One deviceFrame artwork filename. */
export type DeviceFrameFileName = string;

/**
 * A concrete deviceFrame deviceFrame: a single device × color × orientation image.
 */
export type DeviceFrameVariant = {
  deviceId: string;
  deviceName: string;
  variantId: string;
  orientation: DeviceOrientation;
  file?: string;
  src: string;
  thumbUrl?: string;
};

/**
 * A deviceFrame device as exposed in the frame picker: identity + the frames it
 * ships with (colors × orientations).
 */
export type DeviceFrameModel = {
  id: string;
  name: string;
  kind?: FrameKind;
  thumbnailSrc: string;
  variantIds: string[];
  orientations: DeviceOrientation[];
  assets: DeviceFrameVariant[];
};

/** How the captured media is fitted into the frame viewport/screen. */
export type MediaFit = "contain" | "cover" | "fill";

/** Anchor point (0–1, percent space) of the media within the deviceFrame. */
export type AnchorPoint = { x: number; y: number };

/** Offset (px) of the media from its anchor. */
export type OffsetPx = { x: number; y: number };
