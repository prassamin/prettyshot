import type { CanvasState } from "../engine/types";

const computeNextZ = (items: { zIndex: number }[]) => {
  const max = items.length ? Math.max(...items.map((t) => t.zIndex)) : 0;
  return Math.max(max + 1, 1);
};

const getLayerItems = (c: CanvasState) => [
  c.screenshotLayer,
  ...c.slots,
  ...c.assets,
  ...c.texts,
  ...c.annotations,
  ...c.annotationShapes,
];

export const computeNextLayerZ = (c: CanvasState) =>
  computeNextZ(getLayerItems(c));

const getLayerRefs = (c: CanvasState) => [
  { key: "screenshot", zIndex: c.screenshotLayer.zIndex },
  ...c.slots.map((slot) => ({
    key: `slot:${slot.id}`,
    zIndex: slot.zIndex,
  })),
  ...c.assets.map((asset) => ({
    key: `asset:${asset.id}`,
    zIndex: asset.zIndex,
  })),
  ...c.texts.map((text) => ({
    key: `text:${text.id}`,
    zIndex: text.zIndex,
  })),
  ...c.annotations.reduce<{ key: string; zIndex: number }[]>(
    (refs, stroke, index) => {
      if (stroke.mode !== "eraser") {
        refs.push({
          key: `annotation-stroke:${stroke.id}`,
          zIndex: stroke.zIndex ?? index + 1,
        });
      }
      return refs;
    },
    [],
  ),
  ...c.annotationShapes.map((shape) => ({
    key: `annotation:${shape.id}`,
    zIndex: shape.zIndex,
  })),
];

function applyLayerOrder(
  c: CanvasState,
  refsBottomFirst: { key: string; zIndex: number }[],
): Partial<CanvasState> {
  const zByKey = new Map(
    refsBottomFirst.map((layer, index) => [layer.key, index + 1]),
  );
  return {
    screenshotLayer: {
      ...c.screenshotLayer,
      zIndex: zByKey.get("screenshot") ?? c.screenshotLayer.zIndex,
    },
    slots: c.slots.map((slot) => ({
      ...slot,
      zIndex: zByKey.get(`slot:${slot.id}`) ?? slot.zIndex,
    })),
    assets: c.assets.map((asset) => ({
      ...asset,
      zIndex: zByKey.get(`asset:${asset.id}`) ?? asset.zIndex,
    })),
    texts: c.texts.map((text) => ({
      ...text,
      zIndex: zByKey.get(`text:${text.id}`) ?? text.zIndex,
    })),
    annotations: c.annotations.map((stroke) => ({
      ...stroke,
      zIndex:
        stroke.mode !== "eraser"
          ? (zByKey.get(`annotation-stroke:${stroke.id}`) ?? stroke.zIndex)
          : stroke.zIndex,
    })),
    annotationShapes: c.annotationShapes.map((shape) => ({
      ...shape,
      zIndex: zByKey.get(`annotation:${shape.id}`) ?? shape.zIndex,
    })),
  };
}

export function moveLayerInStack(
  c: CanvasState,
  key: string,
  position: "front" | "back",
): Partial<CanvasState> {
  const refs = getLayerRefs(c).sort((a, b) => a.zIndex - b.zIndex);
  const index = refs.findIndex((layer) => layer.key === key);
  if (index < 0) return {};
  const [target] = refs.splice(index, 1);
  if (position === "front") refs.push(target);
  else refs.unshift(target);
  return applyLayerOrder(c, refs);
}
