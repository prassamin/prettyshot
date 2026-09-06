"use client";

import { create } from "zustand";
import { DEFAULT_STATE, GROUP_MERGE_MS, HISTORY_LIMIT } from "../engine-core/initial-config";
import { moveLayerInStack } from "../engine-core/layer-manager";
import { captureClipPose, getCanvasAnimation, resolveKeyframePose, mergeEffectsIntoPose, resolveSelectionTarget } from "./pose";
import type { AnimationEffect } from "@/editor/lib/animation/types";
import type { EditorState, EditorStore } from "./types";
import { createCanvasActions } from "./slices/canvas";
import { createAnimationActions } from "./slices/animation";
import { createElementActions } from "./slices/elements";
import { createUiActions } from "./slices/ui";

const SLOT_ANIMATABLE_EFFECTS: AnimationEffect[] = [
  "tilt", "zoom", "shadow", "position", "border", "borderRadius", "padding", "lighting",
];

// Canvas-level effects — only animate on the whole group or the Main layer.
const CANVAS_ONLY_EFFECTS: AnimationEffect[] = [
  "background", "backdrop", "filter", "overlay", "crop",
];

type SetPatch = Partial<EditorState> | ((state: EditorState) => Partial<EditorState>);

export const useEditorEngine = create<EditorStore>((set, get) => {
  const commit = (patch: SetPatch, group: string | null) => {
    const state = get();
    const resolvedPatch = typeof patch === "function" ? patch(state.present) : patch;
    const present = { ...state.present, ...resolvedPatch };
    const now = Date.now();
    const canMerge = group !== null && group === state._lastGroup && now - state._lastTs < GROUP_MERGE_MS;
    if (canMerge) {
      set({ present, future: [], _lastTs: now });
      return;
    }
    const past = [...state.past, state.present];
    if (past.length > HISTORY_LIMIT) past.shift();
    set({ past, present, future: [], _lastGroup: group, _lastTs: now });
  };

  const commitCanvas = (
    patch: SetPatch,
    group: string | null,
  ) => {
    commit(patch, group);
  };

  const commitCanvasEffect = (
    patch: SetPatch,
    group: string | null,
    effects: AnimationEffect | AnimationEffect[],
  ) => {
    const list = Array.isArray(effects) ? effects : [effects];
    commitCanvas(((state: EditorState) => {
      const base = typeof patch === "function" ? patch(state) : patch;
      const full = get();
      if (!full.isAnimateMode) return base;
      const anim = getCanvasAnimation(state);
      const selId = full.selectedAnimationClipId;
      const multiIds = full.selectedAnimationClipIds;

      if (!selId && multiIds.length > 1) {
        const idSet = new Set(multiIds);
        if (!anim.clips.some((c) => idSet.has(c.id))) return base;
        const beforePose = captureClipPose(state);
        const editedPose = captureClipPose({ ...state, ...base } as EditorState);
        return {
          ...base,
          animation: {
            ...anim,
            clips: anim.clips.map((c) => {
              if (!idSet.has(c.id)) return c;
              const owned = c.effects ?? [];
              const allowed =
                c.target?.scope === "slot"
                  ? list.filter((e) => !CANVAS_ONLY_EFFECTS.includes(e))
                  : list;
              const merged = Array.from(new Set([...owned, ...allowed]));
              const basePose = c.pose ?? resolveKeyframePose(state, anim.clips, c);
              return { ...c, effects: merged, pose: mergeEffectsIntoPose(basePose, beforePose, editedPose, allowed) };
            }),
          },
        };
      }

      if (!selId) return base;
      const clip = anim.clips.find((c) => c.id === selId);
      if (!clip) return base;
      const owned = clip.effects ?? [];
      const allowed =
        clip.target?.scope === "slot"
          ? list.filter((e) => !CANVAS_ONLY_EFFECTS.includes(e))
          : list;
      if (allowed.length === 0) return base;
      const merged = Array.from(new Set([...owned, ...allowed]));
      const currentTarget = clip.target ?? { scope: "all" as const };
      const nextTarget = resolveSelectionTarget(state, full.selectedSlotId, full.isScreenshotSelected);
      const retarget = currentTarget.scope === "all" && nextTarget.scope === "slot" && allowed.every((e) => SLOT_ANIMATABLE_EFFECTS.includes(e));
      if (allowed.every((e) => owned.includes(e)) && !retarget) return base;
      // Keep the open clip's pose in sync with the committed canvas: fold the
      // edited values into its pose (baseline stays the pre-clip state) so
      // playback/export interpolate baseline -> pose instead of rendering a
      // constant frame.
      const beforePose = captureClipPose(state);
      const editedPose = captureClipPose({ ...state, ...base } as EditorState);
      const basePose = clip.pose ?? resolveKeyframePose(state, anim.clips, clip);
      return {
        ...base,
        animation: {
          ...anim,
          clips: anim.clips.map((c) =>
            c.id === selId
              ? {
                  ...c,
                  effects: merged,
                  pose: mergeEffectsIntoPose(basePose, beforePose, editedPose, allowed),
                  ...(retarget ? { target: nextTarget } : {}),
                }
              : c,
          ),
        },
      };
    }) as SetPatch, group);
  };

  const makeLayerOps = (prefix: string, getGroup?: (id: string) => string | null) => ({
    toFront: (id: string) =>
      commitCanvas((state) => moveLayerInStack(state, `${prefix}:${id}`, "front"), getGroup?.(id) ?? null),
    toBack: (id: string) =>
      commitCanvas((state) => moveLayerInStack(state, `${prefix}:${id}`, "back"), getGroup?.(id) ?? null),
  });

  const ctx = { set, get, commit, commitCanvas, commitCanvasEffect, makeLayerOps };

  return {
    past: [],
    present: DEFAULT_STATE,
    future: [],
    _lastGroup: null,
    _lastTs: 0,
    designId: null,
    isAnimateMode: false,
    isPreviewMode: false,
    screenshotPositionDragging: false,
    selectedTextId: null,
    selectedAssetId: null,
    selectedAnnotationShapeId: null,
    selectedAnnotationStrokeId: null,
    selectedSlotId: null,
    isScreenshotSelected: false,
    selectedAnimationClipId: null,
    selectedAnimationClipIds: [] as string[],
    saveStatus: "saved" as const,
    saveError: null,
    lastSavedAt: null,
    _saveTrigger: null,

    ...createCanvasActions(ctx),
    ...createAnimationActions(ctx),
    ...createElementActions(ctx),
    ...createUiActions(ctx),
  } as unknown as EditorStore;
});

