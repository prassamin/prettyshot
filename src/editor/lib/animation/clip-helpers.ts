import type { AnimationClip } from "@/editor/lib/animation/types";
import { DEFAULT_BASELINE, clipBaseline, clipSharesLayer } from "@/editor/lib/animation/playback";
import { MAX_DURATION_MS } from "@/editor/lib/animation/timeline";

export const insertClipCopy = (
  clips: AnimationClip[],
  sourceId: string,
  newId: string,
): AnimationClip[] => {
  const source = clips.find((c) => c.id === sourceId);
  if (!source) return clips;
  const dur = source.durationMs;
  const insertStart = Math.min(
    source.startMs + dur,
    Math.max(0, MAX_DURATION_MS - dur),
  );
  const nextStart = clips
    .filter(
      (clip) =>
        clip.id !== source.id &&
        clipSharesLayer(clip.target, source.target) &&
        clip.startMs >= insertStart,
    )
    .reduce((min, clip) => Math.min(min, clip.startMs), Infinity);
  const shift = Number.isFinite(nextStart)
    ? Math.max(0, insertStart + dur - nextStart)
    : 0;
  const shifted = clips.map((clip) =>
    clip.id !== source.id &&
    clipSharesLayer(clip.target, source.target) &&
    clip.startMs >= insertStart
      ? {
          ...clip,
          startMs: Math.min(
            clip.startMs + shift,
            Math.max(0, MAX_DURATION_MS - clip.durationMs),
          ),
        }
      : clip,
  );
  const copy: AnimationClip = { ...source, id: newId, startMs: insertStart };
  const sourceIndex = shifted.findIndex((cl) => cl.id === source.id);
  return [
    ...shifted.slice(0, sourceIndex + 1),
    copy,
    ...shifted.slice(sourceIndex + 1),
  ];
};

export const clearClipEffectsInArray = (
  clips: AnimationClip[],
  id: string,
): AnimationClip[] => {
  const clip = clips.find((c) => c.id === id);
  if (!clip || (clip.effects ?? []).length === 0) return clips;
  const cleared: AnimationClip = {
    ...clip,
    effects: [],
    pose: { ...DEFAULT_BASELINE, ...clipBaseline(clip) },
  };
  return clips.map((c) => (c.id === id ? cleared : c));
};
