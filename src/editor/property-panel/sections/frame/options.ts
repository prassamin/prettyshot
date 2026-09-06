/**
 * Frame picker — option catalog.
 *
 * Derives the flat browser + device option lists from the frame catalog,
 * groups them into gallery categories, and exposes the shared lookup/format
 * helpers used by the tabs, tiles, and controls.
 */


import type { DeviceFrameModel } from "@/editor/frames/types";
 
 import type { FrameOption, FrameCategory } from "./types";

/** "All" tab pseudo-id. */
export const ALL_CATEGORY_ID = "all";

export const FALLBACK_OPTIONS: FrameOption[] = [
  {
    id: "none",
    name: "None",
    w: 0,
    h: 0,
    kind: "none",
    variantIds: [],
    previewSrc: null,
    rotatePreview: false,
    isDevice: false,
  },
];

/** "Black" → "Black", "cosmic_orange" → "Cosmic Orange". */
export function formatColor(color: string) {
  return color
    .split("_")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

/** "vertical" → "Vertical". */
export function formatOrientation(orientation: string) {
  return orientation[0].toUpperCase() + orientation.slice(1);
}

/** Compact grid for phone-sized categories (tall frames). */
export function isCompactFrameCategory(category: FrameCategory | undefined | null) {
  if (!category || !category.options || category.options.length === 0) return false;
  
  // A category is compact if the majority of its frames are taller than they are wide.
  const tallCount = category.options.filter(o => o.h > o.w).length;
  return tallCount >= category.options.length / 2;
}

/** Resolve a valid color for the chosen frame (falling back to the first available). */
export function resolveFrameColor(
  option: FrameOption,
  device: DeviceFrameModel | null | undefined,
  requestedColor: string
): string {
  if (option.variantIds.includes(requestedColor)) return requestedColor;
  if (device && device.variantIds.includes(requestedColor)) return requestedColor;
  
  if (option.variantIds.length > 0) return option.variantIds[0];
  if (device && device.variantIds.length > 0) return device.variantIds[0];
  
  return "default";
}
