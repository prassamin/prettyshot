/**
 * Device deviceFrame utilities and runtime lookups.
 */

import { lookupDynamicDeviceFrameModel } from "../dynamic-catalog";

/**
 * Infer device class (desktop, tablet, mobile) from dynamic device info.
 */
export function inferDeviceClassForFrame(deviceFrame: {
  id: string;
  orientation: "vertical" | "horizontal";
}): "desktop" | "tablet" | "mobile" {
  const device = lookupDynamicDeviceFrameModel(deviceFrame.id);
  if (!device) return "desktop";

  if (device.kind === "phone" || device.kind === "watch") return "mobile";
  if (device.kind === "tablet" || device.kind === "ereader") return "tablet";
  if (
    device.kind === "desktop" ||
    device.kind === "laptop" ||
    device.kind === "tv"
  )
    return "desktop";
  return "desktop";
}
