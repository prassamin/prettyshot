import {
  computeNextLayerZ,
  moveLayerInStack,
} from "../../engine-core/layer-manager";
import { duplicateLayerItem, CANVAS_BASE_W } from "@/editor/lib/canvas-utils";
import { CLEAR_SELECTION } from "../../engine-core/initial-config";
import type { EditorActions } from "../types";
import type { SliceContext } from "./canvas";
import { makeId } from "@/editor/lib";
import type { AnnotationStroke } from "@/editor/elements/types";

export function createElementActions(
  ctx: SliceContext,
): Partial<EditorActions> {
  const { set, get, commit, commitCanvas } = ctx;

  return {
    setAnnotation: (patch) =>
      commit(
        (state) => ({ annotation: { ...state.annotation, ...patch } }),
        "annotation",
      ),

    addAnnotationStroke: (stroke) => {
      const id = makeId();
      commitCanvas(
        (canvas) => ({
          annotations: [
            ...canvas.annotations,
            { ...stroke, id, zIndex: computeNextLayerZ(canvas) },
          ],
        }),
        `annotation-stroke-${id}`,
      );
      return id;
    },

    updateAnnotationStroke: (id, points) =>
      commitCanvas(
        (canvas) => ({
          annotations: canvas.annotations.map((stroke) =>
            stroke.id === id ? { ...stroke, points } : stroke,
          ),
        }),
        `annotation-stroke-${id}`,
      ),

    updateAnnotationStrokeLayer: (id, patch) =>
      commitCanvas(
        (canvas) => ({
          annotations: canvas.annotations.map((stroke) =>
            stroke.id === id ? { ...stroke, ...patch } : stroke,
          ),
        }),
        `annotation-stroke-${id}`,
      ),

    deleteAnnotationStroke: (id) =>
      commitCanvas(
        (canvas) => ({
          annotations: canvas.annotations.filter((stroke) => stroke.id !== id),
        }),
        null,
      ),

    duplicateAnnotationStroke: (id) => {
      const copyId = makeId();
      let didCopy = false;
      commitCanvas((canvas) => {
        const item = canvas.annotations.find((s) => s.id === id);
        if (!item) return {};
        const dupStroke: AnnotationStroke = {
          ...item,
          id: copyId,
          zIndex: computeNextLayerZ(canvas),
          points: item.points.map((p) => ({ x: p.x + 10, y: p.y + 10 })),
        };
        didCopy = true;
        return { annotations: [...canvas.annotations, dupStroke] };
      }, null);
      return didCopy ? copyId : null;
    },

    bringAnnotationStrokeToFront: (id) =>
      commitCanvas(
        (c) => moveLayerInStack(c, `annotation-stroke:${id}`, "front"),
        null,
      ),

    sendAnnotationStrokeToBack: (id) =>
      commitCanvas(
        (c) => moveLayerInStack(c, `annotation-stroke:${id}`, "back"),
        null,
      ),

    addAnnotationShape: (shape) => {
      const id = makeId();
      commitCanvas(
        (canvas) => ({
          annotationShapes: [
            ...canvas.annotationShapes,
            { ...shape, id, zIndex: computeNextLayerZ(canvas) },
          ],
        }),
        null,
      );
      return id;
    },

    updateAnnotationShape: (id, patch) =>
      commitCanvas(
        (canvas) => ({
          annotationShapes: canvas.annotationShapes.map((shape) =>
            shape.id === id ? { ...shape, ...patch } : shape,
          ),
        }),
        `annotation-shape-${id}`,
      ),

    deleteAnnotationShape: (id) =>
      commitCanvas(
        (canvas) => ({
          annotationShapes: canvas.annotationShapes.filter(
            (shape) => shape.id !== id,
          ),
        }),
        null,
      ),

    duplicateAnnotationShape: (id) => {
      const copyId = makeId();
      let didCopy = false;
      commitCanvas((canvas) => {
        const result = duplicateLayerItem(
          canvas.annotationShapes,
          id,
          copyId,
          computeNextLayerZ(canvas),
          { offset: 3, maxPct: 98 },
        );
        didCopy = result.ok;
        return { annotationShapes: result.items };
      }, null);
      return didCopy ? copyId : null;
    },

    bringAnnotationShapeToFront: (id) =>
      commitCanvas(
        (c) => moveLayerInStack(c, `annotation:${id}`, "front"),
        null,
      ),

    sendAnnotationShapeToBack: (id) =>
      commitCanvas(
        (c) => moveLayerInStack(c, `annotation:${id}`, "back"),
        null,
      ),

    clearAnnotations: () =>
      commitCanvas({ annotations: [], annotationShapes: [] }, null),

    addText: () => {
      const id = makeId();
      const state = get();
      const aw = state.present.aspect.w || 16;
      const ah = state.present.aspect.h || 10;
      const canvasW = CANVAS_BASE_W;
      const canvasH = (CANVAS_BASE_W * ah) / aw;
      const defaultFontSize = Math.round(
        Math.min(96, Math.max(18, Math.max(canvasW, canvasH) * 0.028)),
      );
      commitCanvas(
        (canvas) => ({
          texts: [
            ...canvas.texts,
            {
              id,
              content: "Double-click to edit",
              xPct: 50,
              yPct: 85,
              rotation: 0,
              fontSize: defaultFontSize,
              fontWeight: 500,
              lineHeight: 1.3,
              letterSpacing: 0,
              color: "#ffffff",
              align: "left",
              borderColor: null,
              borderWidth: 0,
              borderStyle: "solid" as const,
              zIndex: computeNextLayerZ(canvas),
              widthPx: null,
              heightPx: null,
              autoColor: true,
              opacity: 100,
            },
          ],
        }),
        null,
      );
      return id;
    },

    updateText: (id, patch) =>
      commitCanvas(
        (canvas) => ({
          texts: canvas.texts.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        }),
        `text-${id}`,
      ),

    deleteText: (id) =>
      commitCanvas(
        (canvas) => ({ texts: canvas.texts.filter((t) => t.id !== id) }),
        null,
      ),

    duplicateText: (id) => {
      const copyId = makeId();
      let didCopy = false;
      commitCanvas((canvas) => {
        const result = duplicateLayerItem(
          canvas.texts,
          id,
          copyId,
          computeNextLayerZ(canvas),
        );
        didCopy = result.ok;
        return { texts: result.items };
      }, null);
      return didCopy ? copyId : null;
    },

    bringTextToFront: (id) =>
      commitCanvas((c) => moveLayerInStack(c, `text:${id}`, "front"), null),

    sendTextToBack: (id) =>
      commitCanvas((c) => moveLayerInStack(c, `text:${id}`, "back"), null),

    setSelectedTextId: (id) =>
      set(
        id
          ? { ...CLEAR_SELECTION, selectedTextId: id }
          : { selectedTextId: null },
      ),

    addAsset: (src) => {
      const id = makeId();
      commitCanvas(
        (canvas) => ({
          assets: [
            ...canvas.assets,
            {
              id,
              src,
              xPct: 50,
              yPct: 50,
              widthPct: 25,
              heightPct: null,
              rotation: 0,
              zIndex: computeNextLayerZ(canvas),
              opacity: 100,
              hidden: false,
            },
          ],
        }),
        null,
      );
      return id;
    },

    updateAsset: (id, patch) =>
      commitCanvas(
        (canvas) => ({
          assets: canvas.assets.map((a) =>
            a.id === id ? { ...a, ...patch } : a,
          ),
        }),
        `asset-${id}`,
      ),

    deleteAsset: (id) =>
      commitCanvas(
        (canvas) => ({ assets: canvas.assets.filter((a) => a.id !== id) }),
        null,
      ),

    duplicateAsset: (id) => {
      const copyId = makeId();
      let didCopy = false;
      commitCanvas((canvas) => {
        const result = duplicateLayerItem(
          canvas.assets,
          id,
          copyId,
          computeNextLayerZ(canvas),
        );
        didCopy = result.ok;
        return { assets: result.items };
      }, null);
      return didCopy ? copyId : null;
    },

    bringAssetToFront: (id) =>
      commitCanvas((c) => moveLayerInStack(c, `asset:${id}`, "front"), null),

    sendAssetToBack: (id) =>
      commitCanvas((c) => moveLayerInStack(c, `asset:${id}`, "back"), null),

    setSelectedAssetId: (id) =>
      set(
        id
          ? { ...CLEAR_SELECTION, selectedAssetId: id }
          : { selectedAssetId: null },
      ),
    setSelectedAnnotationShapeId: (id) =>
      set(
        id
          ? { ...CLEAR_SELECTION, selectedAnnotationShapeId: id }
          : { selectedAnnotationShapeId: null },
      ),
    setSelectedAnnotationStrokeId: (id) =>
      set(
        id
          ? { ...CLEAR_SELECTION, selectedAnnotationStrokeId: id }
          : { selectedAnnotationStrokeId: null },
      ),
    setSelectedSlotId: (id) =>
      set(
        id
          ? { ...CLEAR_SELECTION, selectedSlotId: id }
          : { selectedSlotId: null },
      ),
    setIsScreenshotSelected: (selected) =>
      set(
        selected
          ? { ...CLEAR_SELECTION, isScreenshotSelected: true }
          : { isScreenshotSelected: false },
      ),
  };
}
