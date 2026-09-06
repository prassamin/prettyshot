import type * as React from "react";

/** Supported photo filter styles applied to the canvas backdrop */
export type BackdropFilterKind =
  | "none"
  | "bw"
  | "sepia"
  | "vintage"
  | "warm"
  | "cool"
  | "fade"
  | "vivid"
  | "noir"
  | "dream"
  | "mono"
  | "invert";

/** Backdrop color correction and post-processing adjustments */
export type BackdropAdjustments = {
  noise: number;
  blur: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  grayscale: number;
  sepia: number;
  invert: number;
  opacity: number;
};

/** Directional light illumination plane */
export type LightTargetLayer = "inner" | "outer";

/** Directional lighting configuration */
export type LightSourceConfig = {
  target: LightTargetLayer;
  intensity: number;
  direction: string;
  color: string;
};

/** Shadow overlay stacking level */
export type OverlayLayerPlacement = "overlay" | "underlay";

/** Shadow asset overlay configuration */
export type OverlayConfig = {
  id: number | null;
  url?: string | null;
  opacity: number;
  position: OverlayLayerPlacement;
};

/** Comprehensive backdrop configuration state */
export type BackdropConfig = {
  effects: BackdropAdjustments;
  lighting: LightSourceConfig;
  filter?: BackdropFilterKind;
};

/** Panel display layout */
export type GalleryLayoutMode = "grid" | "carousel";

/** Accordion panel item properties */
export interface AccordionPanelProps {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onToggle: () => void;
  isActive?: boolean;
  disabled?: boolean;
  onReset?: () => void;
  resetTitle?: string;
  children: React.ReactNode;
  className?: string;
}

/** Predefined light tint swatch item */
export type LightTintPreset = {
  hex: string;
  label: string;
};

/** Filter display item metadata */
export type FilterDescriptor = {
  id: BackdropFilterKind;
  label: string;
  tag?: string;
  desc?: string;
};
