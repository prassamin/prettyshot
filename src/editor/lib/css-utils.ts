import type * as React from "react";

import type { Border } from "@/editor/property-panel/sections/border/types";
import type { Background } from "@/editor/property-panel/sections/background/types";

export {
  SHADOW_PREVIEW_VAR,
  SHADOW_FILTER_PREVIEW_VAR,
} from "@/editor/property-panel/sections/shadow/constants";

export {
  shadowCss,
  shadowDropFilterCss,
  shadowBoxShadowCss,
  shadowDropFilterPreviewCss,
  shadowRgba,
} from "@/editor/property-panel/sections/shadow/utils";

export const BORDER_OUTLINE_PREVIEW_VAR = "--editor-border-outline-preview";
export const BORDER_OFFSET_PREVIEW_VAR = "--editor-border-offset-preview";
export const SCREENSHOT_RADIUS_PREVIEW_VAR = "--editor-screenshot-radius";

export function borderOutlineCss(border: Border): string {
  if (border.style === "none" || !border.color || border.width <= 0) {
    return "0px solid transparent";
  }
  return `${Math.max(0, border.width)}px ${border.style || "solid"} ${
    border.color || "#ffffff"
  }`;
}

export function borderOffsetCss(border: Border): string {
  return `${border.padding || 0}px`;
}

export function backgroundCss(bg: Background): React.CSSProperties {
  if (bg.type === "none") return {};
  if (bg.type === "image") {
    return {
      backgroundImage: `url("${bg.value}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { background: bg.value };
}
