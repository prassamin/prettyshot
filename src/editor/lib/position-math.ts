import { screenshotPlacementStyle } from "@/editor/lib/canvas-helpers";
import { computeRowLayout } from "./row-layout";
import type { AspectState } from "@/editor/aspect/types";
import type { DeviceFrame } from "@/editor/frames/types";
import type { Slot } from "@/editor/elements/types";
import { clampPercent } from "@/editor/toolbar/geometry";

export type PercentPoint = { xPct: number; yPct: number };
type PercentBox = PercentPoint & { widthPct: number; heightPct: number };

export type StagePlacementDims = {
  stageW: number;
  stageH: number;
  imgW: number;
  imgH: number;
};

const BASE_CANVAS_WIDTH = 1100;

function placementLeftTop(
  dims: StagePlacementDims,
  scaleFactor: number,
) {
  const placement = screenshotPlacementStyle(
    dims,
    scaleFactor,
    0.5,
    0.5,
  );
  return {
    left: typeof placement.left === "number" ? placement.left : 0,
    top: typeof placement.top === "number" ? placement.top : 0,
  };
}

export function bareScreenshotTargetLeftTop(
  dims: StagePlacementDims,
  point: PercentPoint,
) {
  return bareScreenshotTargetLeftTopRaw(dims, {
    xPct: clampPercent(point.xPct),
    yPct: clampPercent(point.yPct),
  });
}

export function bareScreenshotTargetLeftTopRaw(
  dims: StagePlacementDims,
  point: PercentPoint,
) {
  return {
    left: (point.xPct / 100) * dims.stageW - dims.imgW / 2,
    top: (point.yPct / 100) * dims.stageH - dims.imgH / 2,
  };
}

export function resolveBareScreenshotPlacement({
  dims,
  scaleFactor,
  point,
}: {
  dims: StagePlacementDims;
  scaleFactor: number;
  point: PercentPoint;
}): { offset: { x: number; y: number } } {
  const target = bareScreenshotTargetLeftTop(dims, point);
  const center = placementLeftTop(dims, scaleFactor);
  return {
    offset: { x: target.left - center.left, y: target.top - center.top },
  };
}

export function bareScreenshotPositionPct({
  dims,
  scaleFactor,
  offset,
}: {
  dims: StagePlacementDims;
  scaleFactor: number;
  offset: { x: number; y: number };
}): PercentPoint {
  const raw = bareScreenshotPositionPctRaw({
    dims,
    scaleFactor,
    offset,
  });
  return { xPct: clampPercent(raw.xPct), yPct: clampPercent(raw.yPct) };
}

export function bareScreenshotPositionPctRaw({
  dims,
  scaleFactor,
  offset,
}: {
  dims: StagePlacementDims;
  scaleFactor: number;
  offset: { x: number; y: number };
}): PercentPoint {
  const { left, top } = placementLeftTop(dims, scaleFactor);
  return {
    xPct: ((left + offset.x + dims.imgW / 2) / dims.stageW) * 100,
    yPct: ((top + offset.y + dims.imgH / 2) / dims.stageH) * 100,
  };
}

function canvasDimsFromAspect(aspect: AspectState) {
  const aw = aspect.w || 16;
  const ah = aspect.h || 10;
  return {
    width: BASE_CANVAS_WIDTH,
    height: (BASE_CANVAS_WIDTH * ah) / aw,
    ratio: aw / ah,
  };
}

export function mainScreenshotPositionPct({
  aspect,
  deviceFrame,
  offset,
  slots,
}: {
  aspect: AspectState;
  deviceFrame: DeviceFrame;
  offset: { x: number; y: number };
  slots: Slot[];
}): PercentPoint {
  const dims = canvasDimsFromAspect(aspect);

  if (slots.length > 0) {
    const rowLayout = computeRowLayout(
      [
        { id: "__main__", deviceFrame },
        ...slots.map((slot) => ({ id: slot.id, deviceFrame: slot.deviceFrame ?? deviceFrame })),
      ],
      dims.ratio,
    );
    const mainLayout = rowLayout[0];
    if (mainLayout) {
      return {
        xPct: mainLayout.xPct + (offset.x / dims.width) * 100,
        yPct: 50 + (offset.y / dims.height) * 100,
      };
    }
  }

  return {
    xPct: 50 + (offset.x / dims.width) * 100,
    yPct: 50 + (offset.y / dims.height) * 100,
  };
}

export function mainScreenshotOffsetForPoint({
  aspect,
  deviceFrame,
  slots,
  point,
}: {
  aspect: AspectState;
  deviceFrame: DeviceFrame;
  slots: Slot[];
  point: PercentPoint;
}) {
  const dims = canvasDimsFromAspect(aspect);
  let baseX = 50;
  const baseY = 50;

  if (slots.length > 0) {
    const rowLayout = computeRowLayout(
      [
        { id: "__main__", deviceFrame },
        ...slots.map((slot) => ({ id: slot.id, deviceFrame: slot.deviceFrame ?? deviceFrame })),
      ],
      dims.ratio,
    );
    const mainLayout = rowLayout[0];
    if (mainLayout) {
      baseX = mainLayout.xPct;
    }
  }

  return {
    x: ((point.xPct - baseX) / 100) * dims.width,
    y: ((point.yPct - baseY) / 100) * dims.height,
  };
}

export function screenshotTileGroupCenter(slots: Slot[]) {
  if (slots.length === 0) return null;
  const boxes: PercentBox[] = slots.map((slot) => ({
    xPct: slot.xPct,
    yPct: slot.yPct,
    widthPct: slot.widthPct,
    heightPct: slot.heightPct,
  }));
  const bounds = boxes.reduce(
    (acc, box) => ({
      minX: Math.min(acc.minX, box.xPct - box.widthPct / 2),
      maxX: Math.max(acc.maxX, box.xPct + box.widthPct / 2),
      minY: Math.min(acc.minY, box.yPct - box.heightPct / 2),
      maxY: Math.max(acc.maxY, box.yPct + box.heightPct / 2),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );
  return {
    xPct: clampPercent((bounds.minX + bounds.maxX) / 2),
    yPct: clampPercent((bounds.minY + bounds.maxY) / 2),
  };
}
