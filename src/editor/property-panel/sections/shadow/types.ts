import type * as React from "react";

/**
 * Projection algorithm styles supported by the shadow rendering engine.
 */
export type ShadowType =
  | "none"
  | "drop"
  | "soft"
  | "hard"
  | "glow"
  | "float"
  | "linear";

/**
 * State schema representing a complete shadow configuration.
 */
export type Shadow = {
  type: ShadowType;
  intensity: number;
  lightSource: string;
  color: string;
};

/**
 * 2D normalized grid coordinates [0..4] representing the light origin.
 */
export type LightCoordinate = {
  row: number;
  col: number;
};

/**
 * Metadata descriptor for shadow style selection cards.
 */
export type ShadowPresetItem = {
  id: ShadowType;
  label: string;
  icon: React.ReactNode;
};

/**
 * Props for the TypeGrid selection component.
 */
export interface TypeGridProps {
  value: ShadowType;
  onChange: (style: ShadowType) => void;
  disabled?: boolean;
}

/**
 * Props for the DirectionField 2D interactive lighting controller.
 */
export interface DirectionFieldProps {
  color: string;
  disabled: boolean;
  lightSource: string;
  onChange: (lightSource: string) => void;
  onPreview: (lightSource: string) => void;
}
