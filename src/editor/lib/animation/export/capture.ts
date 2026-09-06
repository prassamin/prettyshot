import {
  applyAnimationFrameAtTime,
  measureBareStageDims,
} from "@/editor/lib/animation/apply-frame";
import {
  prepareAnimationCapture,
  prepareFastAnimationCapture,
  type AnimationCapture,
} from "@/editor/lib/export";
import type { AnimationClip } from "../types";
import type { CanvasState } from "@/editor/lib/engine/types";
import { blankFrame, isDrawImageSource, snapshotFrame } from "./draw";
import { waitForPaint } from "./utils";
import { CANVAS_ID } from "@/editor/lib/engine-core/initial-config";

export async function acquireAnimationCapture(
  targetWidth: number,
): Promise<AnimationCapture> {
  try {
    return await prepareFastAnimationCapture(CANVAS_ID, targetWidth);
  } catch {
    return prepareAnimationCapture(CANVAS_ID, targetWidth);
  }
}

export function suppressCloneTransitions(node: HTMLElement) {
  const targets = Array.from(
    node.querySelectorAll<HTMLElement>(
      "[data-editor-shadow-filter-target], [data-editor-shadow-box-target], [data-screenshot-tile-id], [data-editor-shadow-preview-scope]",
    ),
  );
  for (const el of [node, ...targets]) {
    el.style.transition = "none";
  }
}

function applyExportFrame(
  node: HTMLElement,
  canvas: CanvasState,
  globalAspect: { id: string; w: number; h: number },
  clips: AnimationClip[],
  timeMs: number,
) {
  applyAnimationFrameAtTime({
    canvasEl: node,
    canvas,
    globalAspect,
    clips,
    timeMs,
    selectedClipId: null,
    screenshotPositionDragging: false,
    bareDims: measureBareStageDims(node),
  });
}

const lastCompleteCaptureFrame = new WeakMap<
  AnimationCapture,
  HTMLCanvasElement
>();

function hasMissingCaptureLayer(deviceFrame: HTMLCanvasElement) {
  const sample = document.createElement("canvas");
  sample.width = Math.min(64, deviceFrame.width);
  sample.height = Math.min(40, deviceFrame.height);
  const ctx = sample.getContext("2d", { willReadFrequently: true });
  if (!ctx || !sample.width || !sample.height) return false;
  ctx.drawImage(deviceFrame, 0, 0, sample.width, sample.height);
  const pixels = ctx.getImageData(0, 0, sample.width, sample.height).data;
  let transparent = 0;
  let alphaTotal = 0;
  for (let i = 3; i < pixels.length; i += 4) {
    const alpha = pixels[i];
    alphaTotal += alpha;
    if (alpha === 0) transparent++;
  }
  const pixelCount = pixels.length / 4;
  return transparent / pixelCount >= 0.04 && alphaTotal / pixelCount < 250;
}

export async function captureStableFrame(
  capture: AnimationCapture,
  canvas: CanvasState,
  globalAspect: { id: string; w: number; h: number },
  clips: AnimationClip[],
  timeMs: number,
): Promise<HTMLCanvasElement> {
  applyExportFrame(capture.node, canvas, globalAspect, clips, timeMs);

  if (capture.needsPaint) await waitForPaint();

  let raw: unknown;
  try {
    raw = await capture.captureFrame();
  } catch {
    return blankFrame(capture.width, capture.height);
  }

  if (!isDrawImageSource(raw)) {
    if (capture.needsPaint) await waitForPaint();
    try {
      raw = await capture.captureFrame();
    } catch {
      return blankFrame(capture.width, capture.height);
    }
  }
  let frame = snapshotFrame(raw, capture.width, capture.height);

  let incompleteCapture = false;
  let incompleteRetries = 0;
  while (incompleteCapture && incompleteRetries < 2) {
    incompleteRetries++;
    await waitForPaint();
    try {
      const retryRaw = await capture.captureFrame();
      if (!isDrawImageSource(retryRaw)) continue;
      const retryFrame = snapshotFrame(retryRaw, capture.width, capture.height);
      frame = retryFrame;
      incompleteCapture = hasMissingCaptureLayer(frame);
    } catch {}
  }

  if (incompleteCapture) {
    const previous = lastCompleteCaptureFrame.get(capture);
    if (previous) {
      frame = snapshotFrame(previous, capture.width, capture.height);
    }
  }

  if (!incompleteCapture) {
    lastCompleteCaptureFrame.set(
      capture,
      snapshotFrame(frame, frame.width, frame.height),
    );
  }

  return frame;
}
