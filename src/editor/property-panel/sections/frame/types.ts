/**
 * Frame picker — shared types.
 */

import type * as React from "react";

/** Coarse category of a frame option. */
/** The physical structural class of the deviceFrame. */
export type FrameKind = 
  | "phone"
  | "tablet"
  | "desktop"
  | "laptop"
  | "browser"
  | "watch"
  | "ereader"
  | "tv"
  | "none";

/** How the media fits into the frame viewport. */
export type ImageFit = "contain" | "cover" | "fill";

import type { FrameGeometry } from "@/app/actions/frames";

/** A selectable frame (browser skin or device deviceFrame). */
export type FrameOption = {
  id: string;
  name: string;
  w: number;
  h: number;
  kind: FrameKind;
  variantIds: string[];
  colorMap?: Record<string, string>;
  previewSrc: string | null;
  rotatePreview: boolean;
  isDevice: boolean;
  isFree?: boolean;
  supportsOrientation?: boolean;
  geometry?: FrameGeometry | null;
};

/** A gallery group: label + icon + optional custom SVG iconUrl + its options. */
export type FrameCategory = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconUrl?: string | null;
  options: FrameOption[];
};
