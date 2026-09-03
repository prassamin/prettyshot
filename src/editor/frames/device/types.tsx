/**
 * Device frame stage — type definitions.
 *
 * Central home for the props of `DeviceFrameStage` (filled state) and
 * `DeviceFrameDropSlot` (empty state), plus the screen-projection types.
 * Catalog/frame types (DeviceFrameVariant, DeviceFrameModel, …) live in the shared
 * `frames/types.ts`; screen geometry data lives in `./constants.ts`.
 */

import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  RefObject,
  SyntheticEvent,
  WheelEventHandler,
} from "react";

import type { FrameGeometry } from "@/app/actions/frames";
import type { ScreenshotLayer } from "@/editor/screenshot/types";
import type {
  AnchorPoint,
  MediaFit,
  DeviceFrameVariant,
  OffsetPx,
} from "../types";

/** Screen projection geometry for the device. */
export type ScreenGeometry = FrameGeometry;

/** Measured dimensions of the stage, used to size the screen projection. */
export type StageDims = {
  stageW: number;
  stageH: number;
  imgW: number;
  imgH: number;
};

export type DeviceFrameStageProps = {
  /** Captured media URL to display inside the device screen. */
  mediaSrc: string;
  /** DeviceFrame frame (device × color × orientation image) for the media. */
  deviceFrame: DeviceFrameVariant;
  /** Screen projection geometry for the device. */
  geometry: ScreenGeometry;
  /** Layer visibility metadata for the screenshot element. */
  layer: ScreenshotLayer;
  /** CSS transform applied to the positioned deviceFrame. */
  transform: string;
  /** Extra rotation (deg) — e.g. -90 for portrait devices in landscape mode. */
  rotation: number;
  /** Optional CSS filter for the frame's drop shadow. */
  shadowCss?: string;
  /** Pixel offset of the media within the deviceFrame. */
  offset: OffsetPx;
  /** Anchor of the media within the deviceFrame. */
  anchor: AnchorPoint;
  /** Object-fit strategy for the media. */
  fit?: MediaFit;
  /** Whether the screenshot is currently selected (drives hover menu). */
  isSelected: boolean;
  /** Whether a drag gesture is in flight (suppresses hover menu). */
  isDragging: boolean;
  /** Measured stage dimensions; falls back to a ResizeObserver probe. */
  stageDims: StageDims | null;
  /** Ref to the stage wrapper (measured for placements). */
  stageRef: RefObject<HTMLDivElement | null>;
  /** Ref to the media `<img>` (natural dimensions). */
  imageRef: RefObject<HTMLImageElement | null>;
  /** Selects the screenshot (click). */
  onPick: (e: React.MouseEvent) => void;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onWheel?: WheelEventHandler<HTMLDivElement>;
  /** Fired when the media image loads (dimension measurement). */
  onMediaLoad: (e: SyntheticEvent<HTMLImageElement>) => void;
  /** Opens the crop modal. */
  onCropRequest: () => void;
  /** Replaces the media with a chosen file. */
  onReplaceWith: (file: File) => void;
  /** Removes the screenshot entirely. */
  onRemove: () => void;
  /** Whether to render the hover edit menu. */
  showHoverMenu?: boolean;
  /** Clamp the frame size to the stage's smaller side. */
  clampToMinSide?: boolean;
  /** Whether to read preview tokens from CSS vars (export consistency). */
  usePreviewTokens?: boolean;
  /** Optional inner lighting overlay styles. */
  lightingStyle?: CSSProperties | null;
  /** Extra inline styles for the media element. */
  mediaCss?: CSSProperties;
};

export type DeviceFrameDropSlotProps = {
  /** DeviceFrame frame (device × color × orientation image) for the media. */
  deviceFrame: DeviceFrameVariant;
  /** Screen projection geometry for the device. */
  geometry: ScreenGeometry;
  /** Whether a file drag is currently hovering the drop target. */
  isDropHover: boolean;
  /** Opens the file picker / consumes a dropped file. */
  onPickFile: (file: File) => void;
  /** CSS transform applied to the positioned deviceFrame. */
  transform: string;
  /** Extra rotation (deg) — e.g. -90 for portrait devices in landscape mode. */
  rotation: number;
  /** Pixel offset of the media within the deviceFrame. */
  offset: OffsetPx;
  /** Anchor of the media within the deviceFrame. */
  anchor: AnchorPoint;
  /** Whether a drag gesture is in flight. */
  isDragging: boolean;
  /** Optional CSS filter for the frame's drop shadow. */
  shadowCss?: string;
  onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => void;
  /** Compact mode shows the minimal upload UI. */
  compact?: boolean;
  /** Clamp the frame size to the stage's smaller side. */
  clampToMinSide?: boolean;
  /** Whether to read preview tokens from CSS vars (export consistency). */
  usePreviewTokens?: boolean;
  /** Optional inner lighting overlay styles. */
  lightingStyle?: CSSProperties | null;
};
