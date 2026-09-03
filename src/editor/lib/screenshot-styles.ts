import type * as React from "react";
import type { ResolvedScreenshotStyle } from "@/editor/lib/canvas-utils";
import {
  BORDER_OFFSET_PREVIEW_VAR,
  BORDER_OUTLINE_PREVIEW_VAR,
  borderOffsetCss,
  borderOutlineCss,
  SCREENSHOT_RADIUS_PREVIEW_VAR,
  shadowBoxShadowCss,
  shadowCss,
  shadowDropFilterCss,
} from "@/editor/lib/css-utils";

export interface ScreenshotVisualOptions {
  style: ResolvedScreenshotStyle;
  transformVarPrefix: "canvas-transform" | "slot-transform";
  borderAnimated: boolean;
}

export interface ResolvedScreenshotStyles {
  transform: string;
  imgStyle: React.CSSProperties;
  shadowFilter: string | undefined;
}

/**
 * Builds computed 3D perspective transform, surface shadows, border outlines,
 * and drop-shadow filter styles for screenshot canvas layers.
 */
export function buildScreenshotStyles({
  style,
  transformVarPrefix,
  borderAnimated,
}: ScreenshotVisualOptions): ResolvedScreenshotStyles {
  const { tilt, scale, shadow, border, borderRadius } = style;

  const transform = [
    "perspective(1400px)",
    `rotateX(var(--${transformVarPrefix}-rx, ${tilt.rx}deg))`,
    `rotateY(var(--${transformVarPrefix}-ry, ${tilt.ry}deg))`,
    `rotateZ(var(--${transformVarPrefix}-rz, ${tilt.rz}deg))`,
    `scale(var(--${transformVarPrefix}-scale, ${scale / 100}))`,
  ].join(" ");

  const imgStyle: React.CSSProperties = {
    borderRadius: `var(${SCREENSHOT_RADIUS_PREVIEW_VAR}, ${borderRadius}px)`,
    transform,
    transformStyle: "preserve-3d",
    boxShadow: shadowBoxShadowCss(shadowCss(shadow)),
  };

  const borderVisible =
    Boolean(border.color) && border.width > 0 && border.style !== "none";

  if (borderAnimated || borderVisible) {
    const committedOutline = borderVisible
      ? borderOutlineCss(border)
      : "0px solid transparent";
    imgStyle.outline = `var(${BORDER_OUTLINE_PREVIEW_VAR}, ${committedOutline})`;
    imgStyle.outlineOffset = `var(${BORDER_OFFSET_PREVIEW_VAR}, ${borderOffsetCss(border)})`;
  }

  return {
    transform,
    imgStyle,
    shadowFilter: shadowDropFilterCss(shadow),
  };
}
