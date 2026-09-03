/**
 * Crop domain — type definitions.
 *
 * Shared types for `crop-canvas.tsx` (the react-image-crop wrapper) and
 * `crop-modal.tsx` (the dialog). Everything crop-related that isn't a
 * component or logic lives here.
 */

import type {
  ComponentProps,
  CSSProperties,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
  SyntheticEvent,
} from "react";
import type { PercentCrop, PixelCrop, ReactCropProps } from "react-image-crop";

/** A crop selection as percent-of-media coordinates. */
export type CropRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Which edge of the crop selection is being dragged. */
export type CropEdge = "n" | "e" | "s" | "w";

/** Shared state handed down through the CropCanvas context. */
export type CropCanvasContextValue = {
  file?: File;
  maxImageSize: number;
  imgSrc: string;
  crop: PercentCrop | undefined;
  completedCrop: PixelCrop | null;
  imgRef: RefObject<HTMLImageElement | null>;
  onCrop?: (croppedImage: string, region: PercentCrop) => void;
  reactCropProps: Omit<ReactCropProps, "onChange" | "onComplete" | "children">;
  handleChange: (pixelCrop: PixelCrop, percentCrop: PercentCrop) => void;
  handleComplete: (pixelCrop: PixelCrop, percentCrop: PercentCrop) => void;
  onImageLoad: (e: SyntheticEvent<HTMLImageElement>) => void;
  applyCrop: () => Promise<void>;
  resetCrop: () => void;
};

export type CropCanvasProps = {
  file?: File;
  src?: string;
  maxImageSize?: number;
  onCrop?: (croppedImage: string, region: PercentCrop) => void;
  children: ReactNode;
  onChange?: ReactCropProps["onChange"];
  onComplete?: ReactCropProps["onComplete"];
  initialCrop?: PercentCrop;
} & Omit<ReactCropProps, "onChange" | "onComplete" | "children">;

export type CropCanvasContentProps = {
  style?: CSSProperties;
  imageStyle?: CSSProperties;
  className?: string;
};

export type CropApplyButtonProps = ComponentProps<"button">;

export type CropResetButtonProps = ComponentProps<"button">;

/** An aspect-ratio preset chip (canvas default + fixed ratios). */
export type Preset = {
  label: string;
  aspect: number;
  /** Chip preview box size (px). */
  w: number;
  h: number;
};

/** Edge-resize handler signature (see crop-canvas). */
export type EdgeResizeHandler = (
  edge: CropEdge,
  e: ReactPointerEvent<HTMLDivElement>,
) => void;

/** Generic button click handler for the apply/reset actions. */
export type CropButtonClickHandler = (e: MouseEvent<HTMLButtonElement>) => void;
