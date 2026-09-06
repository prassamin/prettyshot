import {
  computeNextLayerZ,
  moveLayerInStack,
} from "../../engine-core/layer-manager";
import {
  applyScreenshotStyle,
  applySharedFrameToCanvas,
  aspectRatioFromState,
  clampPct,
  cloneBorder,
  cloneLighting,
  cloneShadow,
  createScreenshotTile,
  layoutSlotsInRow,
  placeNewSlotInRow,
  removeSlotFromRow,
  scaleAnnotationStrokesForAspectChange,
  scaleScreenshotOffsetForAspectChange,
  screenshotStyleEffects,
  screenshotStyleGroup,
  stateCanvasAspect,
} from "@/editor/lib/canvas-utils";
import { makeId } from "@/editor/lib";
import { MAX_SCREENSHOT_TILES } from "../../engine-core/initial-config";
import { getCanvasAnimation } from "../pose";
import type { AnimationEffect } from "@/editor/lib/animation/types";
import type { Slot } from "@/editor/elements/types";
import type { EditorActions, EditorState, EditorStore } from "../types";

type SetPatch =
  | Partial<EditorState>
  | ((state: EditorState) => Partial<EditorState>);

export interface SliceContext {
  set: (
    partial:
      | Partial<EditorStore>
      | ((state: EditorStore) => Partial<EditorStore>),
  ) => void;
  get: () => EditorStore;
  commit: (patch: SetPatch, group: string | null) => void;
  commitCanvas: (patch: SetPatch, group: string | null) => void;
  commitCanvasEffect: (
    patch: SetPatch,
    group: string | null,
    effects: AnimationEffect | AnimationEffect[],
  ) => void;
  makeLayerOps: (
    prefix: string,
    getGroup?: (id: string) => string | null,
  ) => {
    toFront: (id: string) => void;
    toBack: (id: string) => void;
  };
}

export function createCanvasActions(ctx: SliceContext): Partial<EditorActions> {
  const { get, commit, commitCanvas, commitCanvasEffect } = ctx;

  return {
    setScreenshot: (screenshot) => {
      commitCanvas(
        (state) => ({
          screenshot,
          originalScreenshot: screenshot,
          lastCropRegion: null,
          objectFit: state.objectFit ?? "contain",
          screenshotLayer: {
            ...state.screenshotLayer,
            zIndex:
              screenshot && !state.screenshot
                ? computeNextLayerZ(state)
                : state.screenshotLayer.zIndex,
            hidden: false,
          },
        }),
        null,
      );
    },

    applyCroppedScreenshot: (s, region) =>
      commitCanvas(
        { screenshot: s, lastCropRegion: region },
        "applyCroppedScreenshot",
      ),

    setAspect: (a) => {
      commit((state) => {
        const currentAspect = aspectRatioFromState(state.aspect);
        const nextAspect = aspectRatioFromState(a);
        return {
          aspect: a,
          slots: layoutSlotsInRow(
            state.slots,
            state.deviceFrame,
            nextAspect,
          ),
          screenshotOffset: scaleScreenshotOffsetForAspectChange(
            state.screenshotOffset,
            currentAspect,
            nextAspect,
          ),
          annotations: scaleAnnotationStrokesForAspectChange(
            state.annotations,
            currentAspect,
            nextAspect,
          ),
        };
      }, "aspect");
    },

    setBackground: (b, opts) => {
      if (opts?.silent) {
        commitCanvas((state) => {
          const anim = getCanvasAnimation(state);
          if (anim.clips.length === 0) return { background: b };
          const prev = state.background;
          const matchesPrev = (
            bg: { type?: string; sourceUrl?: string } | undefined,
          ) =>
            bg?.type === "image" &&
            prev.type === "image" &&
            bg.sourceUrl === prev.sourceUrl;
          const clips = anim.clips.map((c) => {
            const pose =
              c.pose && matchesPrev(c.pose.background)
                ? { ...c.pose, background: b }
                : c.pose;
            const baseline =
              c.baseline && matchesPrev(c.baseline.background)
                ? { ...c.baseline, background: b }
                : c.baseline;
            if (pose === c.pose && baseline === c.baseline) return c;
            return { ...c, pose, baseline };
          });
          return { background: b, animation: { ...anim, clips } };
        }, "background");
        return;
      }
      commitCanvasEffect({ background: b }, "background", "background");
    },

    setPadding: (n) =>
      commitCanvasEffect(
        (state) => applyScreenshotStyle(state, "all", { padding: n }),
        "padding",
        "padding",
      ),
    setBorderRadius: (n) =>
      commitCanvasEffect(
        (state) => applyScreenshotStyle(state, "all", { borderRadius: n }),
        "borderRadius",
        "borderRadius",
      ),
    setCanvasBorderRadius: (n) =>
      commitCanvas(
        (state) => ({ ...state, canvasBorderRadius: n }),
        "canvas-border-radius",
      ),
    setBackdropAdjustments: (e) =>
      commitCanvasEffect(
        (state) => ({ backdrop: { ...state.backdrop, effects: e } }),
        "backdrop-adjustments",
        "backdrop",
      ),
    setBackdropFilter: (f) =>
      commitCanvasEffect(
        (state) => ({ backdrop: { ...state.backdrop, filter: f } }),
        "backdrop-filter",
        "filter",
      ),
    setScale: (n) =>
      commitCanvasEffect(
        (state) => applyScreenshotStyle(state, "main", { scale: n }),
        "scale",
        "zoom",
      ),
    setScreenshotScale: (n) =>
      commitCanvasEffect(
        (state) => applyScreenshotStyle(state, "all", { scale: n }),
        "scale",
        "zoom",
      ),
    setScreenshotOffset: (o) =>
      commitCanvasEffect(
        { screenshotOffset: o },
        "screenshotOffset",
        "position",
      ),
    setScreenshotPlacement: (o) =>
      commitCanvasEffect(
        { screenshotOffset: o },
        "screenshotPlacement",
        "position",
      ),
    updateScreenshotLayer: (patch) =>
      commitCanvas(
        (state) => ({
          screenshotLayer: { ...state.screenshotLayer, ...patch },
        }),
        "screenshotLayer",
      ),

    applyScreenshotStyle: (target, patch) => {
      const scope =
        target === "main" || target === "all"
          ? target
          : `slot-${target.slotId}`;
      commitCanvasEffect(
        (state) => applyScreenshotStyle(state, target, patch),
        `${screenshotStyleGroup(patch)}:${scope}`,
        screenshotStyleEffects(patch),
      );
    },

    setOverlay: (o) => commitCanvasEffect({ overlay: o }, "overlay", "overlay"),

    setDeviceFrame: (f) =>
      commitCanvas((state) => applySharedFrameToCanvas(state, state, f), "frame"),

    setDeviceFrameForMatchingSlots: (f) =>
      commitCanvas((state) => {
        const cleared: EditorState = {
          ...state,
          slots: state.slots.map((slot) =>
            slot.deviceFrame ? { ...slot, deviceFrame: undefined } : slot,
          ),
        };
        return applySharedFrameToCanvas(cleared, state, f);
      }, "frame"),

    setMainScreenshotDeviceFrame: (f) =>
      commitCanvas((state) => {
        const prev = state.deviceFrame;
        return {
          deviceFrame: { ...f },
          slots: state.slots.map((slot) =>
            slot.deviceFrame ? slot : { ...slot, deviceFrame: { ...prev } },
          ),
        };
      }, "frame"),

    setDeviceFrameAddress: (address) =>
      commitCanvas({ deviceFrameAddress: address }, "frame-address"),

    setObjectFit: (fit) => commitCanvas({ objectFit: fit }, "objectFit"),
    bringScreenshotToFront: () =>
      commitCanvas(
        (state) => moveLayerInStack(state, "screenshot", "front"),
        "screenshot-layer",
      ),
    sendScreenshotToBack: () =>
      commitCanvas(
        (state) => moveLayerInStack(state, "screenshot", "back"),
        "screenshot-layer",
      ),

    addSlot: () => {
      const state = get().present;
      if (state.slots.length >= MAX_SCREENSHOT_TILES)
        return null;
      const id = makeId();
      commitCanvas((s) => {
        const next = createScreenshotTile(
          {
            id,
            tilt: { ...s.tilt },
            scale: s.scale,
            border: cloneBorder(s.border),
            borderRadius: s.borderRadius,
            padding: s.padding,
            shadow: cloneShadow(s.shadow),
            lighting: cloneLighting(s.backdrop.lighting),
          },
          computeNextLayerZ(s),
        );
        return {
          slots: placeNewSlotInRow(
            s.slots,
            next,
            s.deviceFrame,
            stateCanvasAspect(s),
          ),
        };
      }, null);
      return id;
    },

    updateSlot: (id, patch) => {
      const apply = (state: EditorState) => ({
        slots: state.slots.map((slot) =>
          slot.id === id ? { ...slot, ...patch } : slot,
        ),
      });
      const effects: AnimationEffect[] = [];
      if ("tilt" in patch || "rotation" in patch) effects.push("tilt");
      if ("scale" in patch) effects.push("zoom");
      if ("shadow" in patch) effects.push("shadow");
      if ("xPct" in patch || "yPct" in patch) effects.push("position");
      if ("border" in patch) effects.push("border");
      if ("borderRadius" in patch) effects.push("borderRadius");
      if ("padding" in patch) effects.push("padding");
      if ("lighting" in patch) effects.push("lighting");
      if (effects.length === 0) {
        commitCanvas(apply, `screenshot-tile-${id}`);
      } else {
        commitCanvasEffect(apply, `screenshot-tile-${id}`, effects);
      }
    },

    setSlotImage: (id, src) => {
      if (src === null) {
        commitCanvas(
          (state) => ({
            slots: state.slots.map((slot) =>
              slot.id === id
                ? {
                    ...slot,
                    src,
                    originalSrc: null,
                    lastCropRegion: null,
                  }
                : slot,
            ),
          }),
          null,
        );
        return;
      }
      commitCanvas(
        (state) => ({
          slots: state.slots.map((slot) =>
            slot.id === id
              ? {
                  ...slot,
                  src,
                  originalSrc: src,
                  lastCropRegion: null,
                  objectFit: slot.objectFit ?? "contain",
                }
              : slot,
          ),
        }),
        null,
      );
    },

    applyCroppedSlot: (id, src, region) =>
      commitCanvas(
        (state) => ({
          slots: state.slots.map((slot) =>
            slot.id === id
              ? {
                  ...slot,
                  src,
                  originalSrc: slot.originalSrc ?? slot.src,
                  lastCropRegion: region,
                }
              : slot,
          ),
        }),
        `screenshot-tile-crop-${id}`,
      ),

    deleteSlot: (id) =>
      commitCanvas(
        (state) => ({
          slots: removeSlotFromRow(
            state.slots,
            id,
            state.deviceFrame,
            stateCanvasAspect(state),
          ),
        }),
        null,
      ),

    duplicateSlot: (id) => {
      const state = get().present;
      if (state.slots.length >= MAX_SCREENSHOT_TILES) return null;
      const copyId = makeId();
      let didCopy = false;
      commitCanvas((s) => {
        const src = s.slots.find((slot) => slot.id === id);
        if (!src) return { slots: s.slots };
        didCopy = true;
        const copy = {
          ...src,
          id: copyId,
          zIndex: computeNextLayerZ(s),
        } as Slot;
        return {
          slots: placeNewSlotInRow(
            s.slots,
            copy,
            s.deviceFrame,
            stateCanvasAspect(s),
          ),
        };
      }, null);
      return didCopy ? copyId : null;
    },

    setSlotGroupPosition: (position) =>
      commitCanvasEffect(
        (state) => {
          if (state.slots.length === 0)
            return { slots: state.slots };
          const bounds = state.slots.reduce(
            (acc, slot) => ({
              minX: Math.min(acc.minX, slot.xPct - slot.widthPct / 2),
              maxX: Math.max(acc.maxX, slot.xPct + slot.widthPct / 2),
              minY: Math.min(acc.minY, slot.yPct - slot.heightPct / 2),
              maxY: Math.max(acc.maxY, slot.yPct + slot.heightPct / 2),
            }),
            {
              minX: Number.POSITIVE_INFINITY,
              maxX: Number.NEGATIVE_INFINITY,
              minY: Number.POSITIVE_INFINITY,
              maxY: Number.NEGATIVE_INFINITY,
            },
          );
          const dx = position.xPct - (bounds.minX + bounds.maxX) / 2;
          const dy = position.yPct - (bounds.minY + bounds.maxY) / 2;
          return {
            slots: state.slots.map((slot) => ({
              ...slot,
              xPct: clampPct(slot.xPct + dx),
              yPct: clampPct(slot.yPct + dy),
            })),
          };
        },
        "screenshot-tile-group-position",
        "position",
      ),

    bringSlotToFront: (id) =>
      commitCanvas(
        (c) => moveLayerInStack(c, `slot:${id}`, "front"),
        `slot-layer-${id}`,
      ),

    sendSlotToBack: (id) =>
      commitCanvas(
        (c) => moveLayerInStack(c, `slot:${id}`, "back"),
        `slot-layer-${id}`,
      ),
  };
}
