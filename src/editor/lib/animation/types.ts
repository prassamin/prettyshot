/**
 * Animation domain — shared type definitions.
 */

import type { Background } from "@/editor/property-panel/sections/background/types";
import type { Border } from "@/editor/property-panel/sections/border/types";
import type {
  BackdropAdjustments,
  BackdropFilterKind,
  LightSourceConfig,
  OverlayConfig,
} from "@/editor/property-panel/sections/backdrop/types";
import type { Tilt } from "@/editor/property-panel/sections/transform/types";
import type { Shadow } from "@/editor/property-panel/sections/shadow/types";
import type { CropRegion } from "@/editor/crop/types";

export type AnimationClipTarget =
  | { scope: "all" }
  | { scope: "main" }
  | { scope: "slot"; slotId: string };

export type AnimationEffect =
  | "position"
  | "zoom"
  | "tilt"
  | "padding"
  | "shadow"
  | "background"
  | "backdrop"
  | "borderRadius"
  | "lighting"
  | "filter"
  | "overlay"
  | "border"
  | "borderRadius"
  | "crop";

export type ClipEasingKind =
  | "linear"
  | "cubic"
  | "in"
  | "out"
  | "inOut"
  | "outCirc"
  | "custom";

export type ClipSlotPose = {
  tilt: Tilt;
  scale: number;
  rotation: number;
  shadow?: Shadow;
  xPct?: number;
  yPct?: number;
  border?: Border;
  borderRadius?: number;
  padding?: number;
  lighting?: LightSourceConfig;
};

export type ClipBaseline = {
  tilt: Tilt;
  scale: number;
  screenshotOffset: { x: number; y: number };
  padding: number;
  shadow: Shadow;
  backdropAdjustments: BackdropAdjustments;
  lighting?: LightSourceConfig;
  background: Background;
  filter?: BackdropFilterKind;
  overlay?: OverlayConfig;
  border?: Border;
  borderRadius?: number;
  crop?: CropRegion | null;
  slots: Record<string, ClipSlotPose>;
};

export type AnimationClip = {
  id: string;
  startMs: number;
  durationMs: number;
  target?: AnimationClipTarget;
  pose?: ClipBaseline;
  effects?: AnimationEffect[];
  baseline?: ClipBaseline;
  easing?: ClipEasingKind;
  easingBezier?: ClipEasingBezier;
  speed?: number;
  returnToDefault?: boolean;
};

export type CanvasAnimation = {
  durationMs: number;
  clips: AnimationClip[];
};

export type ClipEasingBezier = {
  x1: number
  y1: number
  x2: number
  y2: number
}