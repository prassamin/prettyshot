/**
 * Screenshot element types.
 *
 * A capture is a boxed screenshot placed on the canvas (a "screenshot tile").
 * It holds its own image, optional deviceFrame, crop region, object-fit, and layer
 * properties. Positions/sizes are canvas percentages.
 *
 * The canonical `Slot` domain type lives in the store schema —
 * re-exported here so element code imports locally.
 */

import type * as React from "react";
import type { MoveGesture } from "@/editor/elements/types";
import { Slot } from "@/editor/elements/types";
import { CropTarget } from "@/editor/lib/crop-utils";
import { DeviceFrame } from "@/editor/frames/types";

export type { Slot };

/** Props for the pure render sub-component (no interaction logic). */
export type ScreenshotRenderProps = {
  slot: Slot;
  canvasAspectRatio: number;
  rowLayout?: { widthPct: number; xPct: number } | null;
  containerRef?: React.Ref<HTMLDivElement>;
  stageRef: React.RefObject<HTMLDivElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  isSelected: boolean;
  isDragOver: boolean;
  isBeingDragged: boolean;
  editOpen: boolean;
  onEditOpenChange: (open: boolean) => void;
  canDeleteSlot: boolean;
  onSelect: (e: { stopPropagation: () => void }) => void;
  onBrowse: (file: File) => void;
  onCropClick: () => void;
  onReplaceFile: (file: File) => void;
  onDeleteFromMenu: () => void;
  onAddressChange: (value: string) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  previewMode?: boolean;
};

/** Props for the root capture element view. */
export type ScreenshotElementViewProps = {
  slot: Slot;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  canvasAspectRatio: number;
  rowLayout?: { widthPct: number; xPct: number } | null;
  onCropRequest: (request: CropTarget & { slotId: string }) => void;
  onCenterGuideChange?: (guides: { x: boolean; y: boolean }) => void;
  previewMode?: boolean;
};

/** Active move-drag session (base fields from shared gesture types). */
export type MoveSession = MoveGesture & {
  lastXPct: number;
  lastYPct: number;
};

/** Frame + shared canvas style read by the render sub-component. */
export type ScreenshotSharedStyle = {
  deviceFrame: DeviceFrame;
  deviceFrameAddress: string;
  opacity: number;
};
