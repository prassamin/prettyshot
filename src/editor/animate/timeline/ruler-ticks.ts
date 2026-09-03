export const FRAMES_PER_SEC = 30;

/**
 * Calculates subdivision ticks (minor and mid-tier frame marks) for any major
 * frame step — the 3-tier ruler hierarchy.
 */
export function getRulerSubdivisions(majorFrames: number, pps: number) {  const pxPerFrame = pps / FRAMES_PER_SEC;

  if (majorFrames === 1) return { minorFrames: 1, midFrames: undefined };
  if (majorFrames === 2) return { minorFrames: 1, midFrames: undefined };
  if (majorFrames === 5) return { minorFrames: 1, midFrames: undefined };
  if (majorFrames === 6) return { minorFrames: 1, midFrames: 3 };
  if (majorFrames === 10) {
    return { minorFrames: pxPerFrame >= 4 ? 1 : 2, midFrames: 5 };
  }
  if (majorFrames === 15) {
    return { minorFrames: pxPerFrame >= 4 ? 1 : 3, midFrames: 5 };
  }
  if (majorFrames === 30) {
    // 1 second (30 frames)
    if (pxPerFrame >= 4) return { minorFrames: 1, midFrames: 15 };
    if (pxPerFrame >= 2) return { minorFrames: 3, midFrames: 15 };
    return { minorFrames: 6, midFrames: 15 };
  }
  if (majorFrames === 60) return { minorFrames: 6, midFrames: 30 };
  if (majorFrames === 150) return { minorFrames: 15, midFrames: 30 };
  if (majorFrames === 300) return { minorFrames: 30, midFrames: 150 };
  if (majorFrames === 450) return { minorFrames: 30, midFrames: 150 };
  if (majorFrames === 900) return { minorFrames: 150, midFrames: 450 };
  if (majorFrames === 1800) return { minorFrames: 300, midFrames: 900 };
  return {
    minorFrames: Math.max(30, Math.floor(majorFrames / 10)),
    midFrames: Math.floor(majorFrames / 2),
  };
}

/**
 * Formats a frame count into a ruler timecode:
 * - Whole seconds render as minutes:seconds (00:00, 00:01, 01:30…)
 * - Sub-second frames render with an `f` suffix (06f, 12f, 18f, 24f)
 */
export function formatRulerTimecode(frame: number, majorFrames: number): string {
  const totalSec = Math.floor(frame / FRAMES_PER_SEC);
  const frameInSec = frame % FRAMES_PER_SEC;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (frameInSec > 0 && majorFrames < 30) {
    return `${pad(frameInSec)}f`;
  }
  return `${pad(m)}:${pad(s)}`;
}
