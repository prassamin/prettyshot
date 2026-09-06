export const MIN_CLIP_MS = 200;
export const ADD_SLOT_MS = 1000;
export const PX_PER_SECOND = 80;
export const MIN_PX_PER_SECOND = 24;
export const MAX_PX_PER_SECOND = 400;
export const MIN_DURATION_MS = 1000;
export const MAX_DURATION_MS = 60 * 60 * 1000;
const DEFAULT_TIMELINE_MS = 60000;
const TIMELINE_HEADROOM_MS = 15000;

export function timelineEndFor(
  durationMs: number,
  lastClipEnd: number,
): number {
  const needed = Math.max(
    DEFAULT_TIMELINE_MS,
    durationMs + TIMELINE_HEADROOM_MS,
    lastClipEnd + TIMELINE_HEADROOM_MS,
  );
  return Math.min(MAX_DURATION_MS, needed);
}

export function formatTime(ms: number): string {
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

export function formatShort(ms: number): string {
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(m)}:${pad(s)}`;
}

export const RULER_FRAME_STEPS = [
  1, 2, 5, 6, 10, 15, 30, 60, 150, 300, 450, 900, 1800, 3600, 9000, 18000,
  36000, 54000, 108000,
];

export function computeTicks(
  rulerEndMs: number,
  pxPerSecond: number,
): number[] {
  const pps = Math.max(1, pxPerSecond);
  const pxPerFrame = pps / 30;
  const majorFrames = RULER_FRAME_STEPS.find((f) => f * pxPerFrame >= 56) ?? 30;
  const totalFrames = Math.ceil((rulerEndMs / 1000) * 30);
  const count = Math.floor(totalFrames / majorFrames);
  return Array.from(
    { length: count + 1 },
    (_, i) => Math.round(((i * majorFrames) / 30) * 1000) / 1000,
  );
}



type TimelineSegment = {
  startMs: number;
  durationMs: number;
};

export function resolveRippleDrop(
  dropped: number,
  durationMs: number,
  others: readonly TimelineSegment[],
  maxDurationMs: number,
) {
  const desired = Math.max(0, dropped);
  const prevEnd = others
    .filter((clip) => clip.startMs < desired)
    .reduce((max, clip) => Math.max(max, clip.startMs + clip.durationMs), 0);
  const startMs = Math.min(
    Math.max(desired, prevEnd),
    Math.max(0, maxDurationMs - durationMs),
  );
  const nextStart = others
    .filter((clip) => clip.startMs >= desired)
    .reduce((min, clip) => Math.min(min, clip.startMs), Infinity);
  return {
    startMs,
    shiftAfterMs: desired,
    shiftMs: Number.isFinite(nextStart)
      ? Math.max(0, startMs + durationMs - nextStart)
      : 0,
  };
}
