import type {
  AnimationExportFormat,
  AnimationExportPhase,
  AnimationExportProgress,
} from "./types";
const triggerAnchorDownload = (url: string, name: string) => {
  const link = document.createElement("a");
  link.download = name;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
import { getCanvasRenderedDims } from "@/editor/lib/export";
import { resolveExportDownloadFilename } from "@/editor/lib/export";
import { CANVAS_ID } from "@/editor/lib/engine-core/initial-config";

export class AnimationExportAbortedError extends Error {
  constructor(message = "Export cancelled") {
    super(message);
    this.name = "AnimationExportAbortedError";
  }
}

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new AnimationExportAbortedError();
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  triggerAnchorDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function animationExportOutputDims(targetWidth: number): {
  width: number;
  height: number;
} {
  const rendered = getCanvasRenderedDims(CANVAS_ID);
  if (!rendered?.width || !rendered.height) {
    return { width: targetWidth, height: targetWidth };
  }
  const scale = targetWidth / rendered.width;
  return {
    width: Math.round(rendered.width * scale),
    height: Math.round(rendered.height * scale),
  };
}

export async function resolveAnimationDownloadFilename(opts: {
  scale: string;
  targetWidth: number;
  extension: string;
}): Promise<string> {
  const dims = animationExportOutputDims(opts.targetWidth);
  return resolveExportDownloadFilename({
    scale: opts.scale,
    width: dims.width,
    height: dims.height,
    extension: opts.extension,
  });
}

export function even(n: number) {
  const r = Math.max(2, Math.round(n));
  return r % 2 === 0 ? r : r + 1;
}

export function pickWebmMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return null;
}

export function animationMimeAndExt(format: AnimationExportFormat): {
  contentType: string;
  extension: string;
} {
  if (format === "mp4") return { contentType: "video/mp4", extension: "mp4" };
  return { contentType: "video/webm", extension: "webm" };
}

export function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * Returns an async function that yields to the event loop at most once per
 * `budgetMs` — frame rasterization is DOM work that can't leave the main
 * thread, so without this the Cancel click never dispatches and the progress
 * bar can't repaint.
 */
export function createUiYielder(budgetMs = 40): () => Promise<void> {
  let lastYieldAt = performance.now();
  return async () => {
    if (performance.now() - lastYieldAt < budgetMs) return;
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 0);
    });
    lastYieldAt = performance.now();
  };
}

export type ProgressReporter = {
  report: (phase: AnimationExportPhase, current: number, total: number) => void;
};

export function createProgressReporter(
  onProgress?: (p: AnimationExportProgress) => void,
): ProgressReporter {
  let phaseStartedAt = performance.now();
  let lastPhase: AnimationExportPhase | null = null;

  return {
    report(phase, current, total) {
      if (!onProgress) return;
      if (phase !== lastPhase) {
        lastPhase = phase;
        phaseStartedAt = performance.now();
      }
      let etaMs: number | null = null;
      if (current > 0 && current < total) {
        const elapsed = performance.now() - phaseStartedAt;
        etaMs = Math.max(
          0,
          Math.round((elapsed / current) * (total - current)),
        );
      } else if (current >= total && total > 0) {
        etaMs = 0;
      }
      onProgress({ phase, current, total, etaMs });
    },
  };
}
