/**
 * 3D orientation angles (degrees) along X, Y, and Z axes.
 */
export type Tilt = {
  rx: number;
  ry: number;
  rz: number;
};

/**
 * Scope identifying whether a live preview target is the global canvas
 * or an individual slot element.
 */
export type TransformLiveScope = "canvas" | "slot";

/**
 * Target DOM element receiving live CSS transform custom properties.
 */
export type TransformLiveTarget = {
  element: HTMLElement;
  scope: TransformLiveScope;
};

/**
 * Transform axis identifier for live style manipulation.
 */
export type TransformAxis = "rx" | "ry" | "rz" | "scale" | "rot";

/**
 * Props for the Degree slider row component.
 */
export interface OrientationSliderRowProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onPreview: (value: number) => void;
  onCommit: (value: number) => void;
}

/**
 * Props for the layout and size controls (Inset & Scale).
 */
export interface TransformLayoutProps {
  inset: number;
  scale: number;
  borderRadius?: number;
  canvasRadiusDisabled?: boolean;
  onPreviewInset: (value: number) => void;
  onCommitInset: (value: number) => void;
  onPreviewScale: (value: number) => void;
  onCommitScale: (value: number) => void;
  onPreviewCanvasRadius?: (value: number) => void;
  onCommitCanvasRadius?: (value: number) => void;
}

/**
 * Props for the 3D orientation controls (Rotate X, Y, Z).
 */
export interface TransformOrientationProps {
  tilt: Tilt;
  rotationZ: number;
  onPreviewTilt: (tilt: Tilt) => void;
  onCommitTilt: (tilt: Tilt) => void;
  onPreviewRotationZ: (value: number) => void;
  onCommitRotationZ: (value: number) => void;
}
