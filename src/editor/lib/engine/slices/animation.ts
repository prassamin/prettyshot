import { DEFAULT_CLIP_DURATION_MS } from "@/editor/lib/animation/motion";
import { clipPose, clipBaseline, clipAffectsMain, clipAffectsSlot, poseAtCut, clipSharesLayer } from "@/editor/lib/animation/playback";
import { resolveRippleDrop, MAX_DURATION_MS } from "@/editor/lib/animation/timeline";
import {
  captureClipPose, getCanvasAnimation, applyPoseToCanvas, buildRestingPose,
  resolveKeyframePose, resolveSelectionTarget, mainPositionPoint,
  mainPositionOffsetForPoint, overlaySlotPositions, 
} from "../pose";
import { insertClipCopy, clearClipEffectsInArray } from "@/editor/lib/animation/clip-helpers";
import { makeId } from "@/editor/lib";
import { CLEAR_SELECTION } from "../../engine-core/initial-config";
import type { AnimationClip, ClipBaseline } from "@/editor/lib/animation/types";
import type { EditorActions, EditorStore } from "../types";
import type { SliceContext } from "./canvas";

const MIN_ANIMATION_CLIP_MS = 200;

export function createAnimationActions(ctx: SliceContext): Partial<EditorActions> {
  const { set, get,  commitCanvas,  } = ctx;

  return {
    setIsAnimateMode: (a) => {
      const state = get().present;
      const animation = getCanvasAnimation(state);
      const sorted = [...animation.clips].sort((x, y) => x.startMs - y.startMs);
      const last = sorted[sorted.length - 1];
      if (a) {
        if (!last) {
          set({ isAnimateMode: true, selectedAnimationClipId: null, selectedAnimationClipIds: [] });
          return;
        }
        const pose = captureClipPose(state);
        const posClips = sorted.filter((c) => (c.effects ?? []).includes("position"));
        const hasPosition = posClips.length > 0;
        const lastPose = clipPose(last);
        const foldedPose: ClipBaseline =
          hasPosition && (last.effects ?? []).includes("position")
            ? { ...pose, screenshotOffset: lastPose.screenshotOffset, slots: overlaySlotPositions(pose.slots, lastPose.slots) }
            : pose;
        let nextClips = animation.clips.map((c) => (c.id === last.id ? { ...c, pose: foldedPose } : c));
        const firstMainPos = posClips.find((c) => clipAffectsMain(c));
        if (firstMainPos) {
          nextClips = nextClips.map((c) =>
            c.id === firstMainPos.id ? { ...c, baseline: { ...clipBaseline(c), screenshotOffset: pose.screenshotOffset } } : c,
          );
        }
        const canvasPatch = hasPosition ? applyPoseToCanvas(state, foldedPose) : {};
        const present = { ...state, ...canvasPatch, animation: { ...animation, clips: nextClips } };
        set({ present, isAnimateMode: true, selectedAnimationClipId: last.id, selectedAnimationClipIds: [last.id] });
        return;
      }

      const openId = get().selectedAnimationClipId;
      let nextClips = animation.clips;
      if (openId && nextClips.some((c) => c.id === openId)) {
        const pose = captureClipPose(state);
        nextClips = nextClips.map((c) => (c.id === openId ? { ...c, pose } : c));
      }
      const restingPose = buildRestingPose(nextClips);
      const canvasPatch = restingPose ? applyPoseToCanvas(state, restingPose) : {};
      const present = { ...state, ...canvasPatch, animation: { ...animation, clips: nextClips } };
      set({ present, isAnimateMode: false, selectedAnimationClipId: null, selectedAnimationClipIds: [] });
    },

    selectAnimationClip: (id) => {
      const state = get();
      if (id === state.selectedAnimationClipId) {
        const next = id ? [id] : [];
        if (state.selectedAnimationClipIds.length !== next.length || state.selectedAnimationClipIds[0] !== next[0]) {
          set({ selectedAnimationClipIds: next });
        }
        return;
      }
      const canvas = state.present;
      const animation = getCanvasAnimation(canvas);
      const openId = state.selectedAnimationClipId;
      let nextClips = animation.clips;
      if (openId && openId !== id && nextClips.some((c) => c.id === openId)) {
        const pose = captureClipPose(canvas);
        nextClips = nextClips.map((c) => (c.id === openId ? { ...c, pose } : c));
      }
      const opened = id ? nextClips.find((c) => c.id === id) : undefined;
      const canvasPatch = opened ? applyPoseToCanvas(canvas, resolveKeyframePose(canvas, nextClips, opened)) : {};
      const present = { ...state.present, ...canvasPatch, animation: { ...animation, clips: nextClips } };
      const targetSelection = (() => {
        const t = opened?.target ?? { scope: "all" as const };
        if (t.scope === "slot" && canvas.slots.some((s) => s.id === t.slotId)) {
          return { ...CLEAR_SELECTION, selectedSlotId: t.slotId };
        }
        if (t.scope === "main") return { ...CLEAR_SELECTION, isScreenshotSelected: true };
        return { ...CLEAR_SELECTION };
      })();
      set({
        present,
        selectedAnimationClipId: id,
        selectedAnimationClipIds: id ? [id] : [],
        ...(opened ? targetSelection : {}),
      });
    },

    setAnimationDuration: (ms) =>
      commitCanvas((canvas) => ({ animation: { ...getCanvasAnimation(canvas), durationMs: ms } }), "animation-duration"),

    addAnimationClip: (atMs) => {
      const id = makeId();
      const target = resolveSelectionTarget(
        get().present,
        get().selectedSlotId,
        get().isScreenshotSelected,
      );
      commitCanvas((canvas) => {
        const animation = getCanvasAnimation(canvas);
        const clipLen = Math.min(DEFAULT_CLIP_DURATION_MS, MAX_DURATION_MS);
        const sorted = [...animation.clips]
          .filter((c) => clipSharesLayer(c.target, target))
          .sort((a, b) => a.startMs - b.startMs);
        let startMs: number;
        if (atMs != null) {
          startMs = Math.max(0, Math.min(MAX_DURATION_MS - clipLen, atMs));
        } else {
          startMs = Math.min(sorted.reduce((max, clip) => Math.max(max, clip.startMs + clip.durationMs), 0), MAX_DURATION_MS - clipLen);
          startMs = Math.max(startMs, sorted.filter((c) => c.startMs <= startMs).reduce((max, c) => Math.max(max, c.startMs + c.durationMs), 0));
        }
        const nextStart = sorted.filter((c) => c.startMs >= startMs).reduce((min, c) => Math.min(min, c.startMs), MAX_DURATION_MS);
        const fittedDuration =
          atMs != null
            ? clipLen
            : Math.max(MIN_ANIMATION_CLIP_MS, Math.min(clipLen, nextStart - startMs));
        const snapshot = captureClipPose(canvas);
        const clip: AnimationClip = {
          id, startMs, durationMs: fittedDuration,
          target, pose: snapshot, baseline: snapshot, effects: [],
        };
        return { animation: { ...animation, clips: [...animation.clips, clip] } };
      }, null);
      return id;
    },

    updateAnimationClip: (id, patch) =>
      commitCanvas((canvas) => {
        const animation = getCanvasAnimation(canvas);
        return { animation: { ...animation, clips: animation.clips.map((clip) => clip.id === id ? { ...clip, ...patch } : clip) } };
      }, `animation-clip:${id}`),

    updateAnimationClips: (patches) =>
      commitCanvas((canvas) => {
        const animation = getCanvasAnimation(canvas);
        const patchMap = new Map(patches.map((p) => [p.id, p.patch]));
        return {
          animation: {
            ...animation,
            clips: animation.clips.map((clip) => {
              const p = patchMap.get(clip.id);
              return p ? { ...clip, ...p } : clip;
            }),
          },
        };
      }, "animation-clips-batch"),

    moveAnimationClip: (id, startMs) =>
      commitCanvas((canvas) => {
        const animation = getCanvasAnimation(canvas);
        const moving = animation.clips.find((clip) => clip.id === id);
        if (!moving) return {};
        const dur = moving.durationMs;
        const others = animation.clips.filter(
          (clip) => clip.id !== id && clipSharesLayer(clip.target, moving.target),
        );
        const { startMs: start, shiftAfterMs, shiftMs: shift } = resolveRippleDrop(startMs, dur, others, MAX_DURATION_MS);
        const clips = animation.clips.map((clip) => {
          if (clip.id === id) return { ...clip, startMs: start };
          if (!clipSharesLayer(clip.target, moving.target)) return clip;
          if (clip.startMs < shiftAfterMs) return clip;
          return { ...clip, startMs: Math.min(clip.startMs + shift, Math.max(0, MAX_DURATION_MS - clip.durationMs)) };
        });
        return { animation: { ...animation, clips } };
      }, `animation-clip:${id}`),

    setAnimationClipSelection: (ids) => {
      const unique = Array.from(new Set(ids));
      if (unique.length <= 1) {
        const act = get() as any;
        act.selectAnimationClip?.(unique[0] ?? null);
        return;
      }
      const state = get();
      const canvas = state.present;
      const animation = getCanvasAnimation(canvas);
      const openId = state.selectedAnimationClipId;
      let nextClips = animation.clips;
      if (openId && nextClips.some((c) => c.id === openId)) {
        const pose = captureClipPose(canvas);
        nextClips = nextClips.map((c) => (c.id === openId ? { ...c, pose } : c));
      }
      const present = { ...state.present, animation: { ...animation, clips: nextClips } };
      set({ present, selectedAnimationClipIds: unique, selectedAnimationClipId: null });
    },

    removeAnimationClips: (ids) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      commitCanvas((canvas) => {
        const animation = getCanvasAnimation(canvas);
        return { animation: { ...animation, clips: animation.clips.filter((clip) => !idSet.has(clip.id)) } };
      }, null);
      set((s: EditorStore) => ({
        selectedAnimationClipIds: s.selectedAnimationClipIds.filter((id) => !idSet.has(id)),
        selectedAnimationClipId: s.selectedAnimationClipId && idSet.has(s.selectedAnimationClipId) ? null : s.selectedAnimationClipId,
      }));
    },

    clearAnimationClipsEffects: (ids) => {
      if (ids.length === 0) return;
      commitCanvas((canvas) => {
        const animation = getCanvasAnimation(canvas);
        let nextClips = animation.clips;
        for (const id of ids) nextClips = clearClipEffectsInArray(nextClips, id);
        if (nextClips === animation.clips) return {};
        const openId = get().selectedAnimationClipId;
        const opened = openId && ids.includes(openId) ? nextClips.find((c) => c.id === openId) : undefined;
        const canvasPatch = opened ? applyPoseToCanvas(canvas, resolveKeyframePose(canvas, nextClips, opened)) : {};
        return { ...canvasPatch, animation: { ...animation, clips: nextClips } };
      }, null);
    },

    duplicateAnimationClips: (ids) => {
      if (ids.length === 0) return [];
      const state = get().present;
      const existing = getCanvasAnimation(state).clips;
      const sources = ids
        .map((id) => existing.find((c) => c.id === id))
        .filter((c): c is AnimationClip => Boolean(c))
        .sort((a, b) => a.startMs - b.startMs);
      if (sources.length === 0) return [];
      const newIds: string[] = [];
      commitCanvas((c) => {
        const animation = getCanvasAnimation(c);
        let clips = animation.clips;
        for (const source of sources) {
          const newId = makeId();
          newIds.push(newId);
          clips = insertClipCopy(clips, source.id, newId);
        }
        return { animation: { ...animation, clips } };
      }, null);
      return newIds;
    },

    splitAnimationClip: (id, atMs) => {
      const state = get().present;
      const source = getCanvasAnimation(state).clips.find((clip) => clip.id === id);
      if (!source) return null;
      const end = source.startMs + source.durationMs;
      if (source.durationMs < MIN_ANIMATION_CLIP_MS * 2) return null;
      atMs = Math.min(Math.max(atMs, source.startMs + MIN_ANIMATION_CLIP_MS), end - MIN_ANIMATION_CLIP_MS);
      const wasOpen = get().selectedAnimationClipId === id;
      const newId = makeId();
      commitCanvas((c) => {
        const animation = getCanvasAnimation(c);
        const src = animation.clips.find((clip) => clip.id === id);
        if (!src) return {};
        const srcEnd = src.startMs + src.durationMs;
        const toPose = wasOpen ? captureClipPose(c) : clipPose(src);
        const fromPose = resolveKeyframePose(c, animation.clips, { ...src, startMs: src.startMs - 1 });
        const affectedSlotIds = c.slots.filter((s) => clipAffectsSlot(src, s.id)).map((s) => s.id);
        const aspect = c.aspect;
        const positionAt = (easedP: number) => {
          const slots = c.slots;
          const fromPt = mainPositionPoint(aspect, c.deviceFrame, fromPose.screenshotOffset, slots);
          const toPt = mainPositionPoint(aspect, c.deviceFrame, toPose.screenshotOffset, slots);
          const midPt = { xPct: fromPt.xPct + (toPt.xPct - fromPt.xPct) * easedP, yPct: fromPt.yPct + (toPt.yPct - fromPt.yPct) * easedP };
          return { screenshotOffset: mainPositionOffsetForPoint(aspect, c.deviceFrame, slots, midPt) };
        };
        const midPose = poseAtCut(fromPose, toPose, (atMs - src.startMs) / src.durationMs, src.effects ?? [], clipAffectsMain(src), affectedSlotIds, positionAt);
        const clips = animation.clips.flatMap((clip) => {
          if (clip.id !== id) return [clip];
          return [
            { ...clip, durationMs: atMs - clip.startMs, pose: midPose },
            { ...clip, id: newId, startMs: atMs, durationMs: srcEnd - atMs, pose: toPose },
          ];
        });
        return { animation: { ...animation, clips } };
      }, null);
      if (wasOpen) set({ selectedAnimationClipId: newId });
      return newId;
    },
  };
}
