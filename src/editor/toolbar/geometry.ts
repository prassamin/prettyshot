import { computeRowLayout } from "@/editor/lib/row-layout";
import type { AspectState } from "@/editor/aspect/types";
import type { Slot } from "../elements/types";
import type { DeviceFrame } from "@/editor/frames/types";

export type BulkLayout = "grid" | "row" | "column";

export const BASE_CANVAS_WIDTH = 1100;
const ARRANGE_GAP = 80;
const SCREENSHOT_GROUP_BOX_HEIGHT_PCT = 28;

export type PercentPoint = { xPct: number; yPct: number };
type PercentBox = PercentPoint & { widthPct: number; heightPct: number };

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
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

function mainScreenshotRowPositionPct({
  aspect,
  deviceFrame,
  offset,
  slots,
}: {
  aspect: AspectState;
  deviceFrame: DeviceFrame;
  offset: { x: number; y: number };
  slots: Slot[];
}) {
  if (slots.length === 0) return null;
  const dims = canvasDimsFromAspect(aspect);
  const rowLayout = computeRowLayout(
    [
      { id: "__main__", deviceFrame },
      ...slots.map((slot) => ({ id: slot.id, deviceFrame: slot.deviceFrame ?? deviceFrame })),
    ],
    dims.ratio,
  );
  const mainLayout = rowLayout[0];
  if (!mainLayout) return null;

  return {
    xPct: mainLayout.xPct + (offset.x / dims.width) * 100,
    yPct: 50 + (offset.y / dims.height) * 100,
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
  const rowPosition = mainScreenshotRowPositionPct({
    aspect,
    deviceFrame,
    offset,
    slots,
  });
  if (rowPosition) return rowPosition;

  const dims = canvasDimsFromAspect(aspect);
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

function centerOfBoxes(boxes: PercentBox[]): PercentPoint | null {
  if (boxes.length === 0) return null;
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
    xPct: (bounds.minX + bounds.maxX) / 2,
    yPct: (bounds.minY + bounds.maxY) / 2,
  };
}

export function screenshotTileGroupCenter(slots: Slot[]) {
  return centerOfBoxes(
    slots.map((slot) => ({
      xPct: slot.xPct,
      yPct: slot.yPct,
      widthPct: slot.widthPct,
      heightPct: slot.heightPct,
    })),
  );
}

export function allScreenshotGroupCenter({
  hasMainScreenshot,
  aspect,
  deviceFrame,
  offset,
  slots,
}: {
  hasMainScreenshot: boolean;
  aspect: AspectState;
  deviceFrame: DeviceFrame;
  offset: { x: number; y: number };
  slots: Slot[];
}) {
  const boxes: PercentBox[] = slots.map((slot) => ({
    xPct: slot.xPct,
    yPct: slot.yPct,
    widthPct: slot.widthPct,
    heightPct: slot.heightPct,
  }));

  if (hasMainScreenshot) {
    const dims = canvasDimsFromAspect(aspect);
    const rowLayout =
      slots.length > 0
        ? computeRowLayout(
            [
              { id: "__main__", deviceFrame },
              ...slots.map((slot) => ({
                id: slot.id,
                deviceFrame: slot.deviceFrame ?? deviceFrame,
              })),
            ],
            dims.ratio,
          )
        : null;
    const mainCenter = mainScreenshotPositionPct({
      aspect,
      deviceFrame,
      offset,
      slots,
    });
    boxes.push({
      ...mainCenter,
      widthPct: rowLayout?.[0]?.widthPct ?? 60,
      heightPct: SCREENSHOT_GROUP_BOX_HEIGHT_PCT,
    });
  }

  return centerOfBoxes(boxes);
}

export function computeArrangedPositions(
  canvasIds: string[],
  layout: BulkLayout,
  widthPx: number,
  heightPx: number,
): Record<string, { x: number; y: number }> {
  const n = canvasIds.length;
  const positions: Record<string, { x: number; y: number }> = {};
  if (n === 0) return positions;

  if (layout === "row") {
    const stride = widthPx + ARRANGE_GAP;
    const totalW = stride * (n - 1);
    canvasIds.forEach((id, i) => {
      positions[id] = { x: -totalW / 2 + i * stride, y: 0 };
    });
    return positions;
  }
  if (layout === "column") {
    const stride = heightPx + ARRANGE_GAP;
    const totalH = stride * (n - 1);
    canvasIds.forEach((id, i) => {
      positions[id] = { x: 0, y: -totalH / 2 + i * stride };
    });
    return positions;
  }

  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const strideX = widthPx + ARRANGE_GAP;
  const strideY = heightPx + ARRANGE_GAP;
  const totalW = strideX * (cols - 1);
  const totalH = strideY * (rows - 1);
  canvasIds.forEach((id, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    positions[id] = {
      x: -totalW / 2 + col * strideX,
      y: -totalH / 2 + row * strideY,
    };
  });
  return positions;
}
