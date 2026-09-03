import { clearAnimationFrameVars } from "@/editor/lib/animation/apply-frame";
import { captureClipPose, useEditorEngine } from "@/editor/lib/engine";
import { acquireAnimationCapture, suppressCloneTransitions } from "./capture";
import {
  type AnimationExportBlobResult,
  type AnimationExportOptions,
  type CaptureCtx,
} from "./types";
import {
  animationMimeAndExt,
  createProgressReporter,
  resolveAnimationDownloadFilename,
  throwIfAborted,
  triggerDownload,
} from "./utils";
import { encodeWebmMediaRecorder, tryEncodeWithMediabunny } from "./video";
import { loadWatermarkLogo, resolveWatermarkFontStack } from "./watermark";

export { AnimationExportAbortedError } from "./utils";
export { isWebmExportSupported } from "./video";
export type {
  AnimationExportBlobResult,
  AnimationExportFormat,
  AnimationExportOptions,
  AnimationExportPhase,
  AnimationExportProgress,
} from "./types";

export async function exportAnimation(
  options: AnimationExportOptions,
): Promise<void | AnimationExportBlobResult> {
  const result = await encodeAnimation(options);
  if (options.asBlob) return result;
  const targetWidth = options.targetWidth ?? 1080;
  const filename = await resolveAnimationDownloadFilename({
    scale: options.scale ?? String(targetWidth),
    targetWidth,
    extension: result.extension,
  });
  triggerDownload(result.blob, filename);
}

export async function exportAnimationBlob(
  options: Omit<AnimationExportOptions, "asBlob">,
): Promise<AnimationExportBlobResult> {
  return encodeAnimation({ ...options, asBlob: true });
}

async function encodeAnimation(
  options: AnimationExportOptions,
): Promise<AnimationExportBlobResult> {
  const { onProgress, signal } = options;
  const progress = createProgressReporter(onProgress);
  throwIfAborted(signal);
  progress.report("preparing", 0, 1);

  const state = useEditorEngine.getState();
  const canvas = state.present;
  const animation = canvas.animation;
  if (!animation) throw new Error("Nothing to export");

  const { durationMs } = animation;
  const clips =
    state.isAnimateMode && state.selectedAnimationClipId
      ? animation.clips.map((clip) =>
          clip.id === state.selectedAnimationClipId
            ? { ...clip, pose: captureClipPose(canvas) }
            : clip,
        )
      : animation.clips;
  if (!clips.length)
    throw new Error("Add at least one keyframe before sharing");

  const fps = Math.max(1, Math.min(60, options.fps ?? 30));
  const frameCount = Math.max(1, Math.round((durationMs / 1000) * fps));
  const frameDurationMs = 1000 / fps;
  const targetWidth = options.targetWidth ?? 1080;

  const watermark =
    options.watermark === false
      ? null
      : await (async () => {
          const [logo, fontStack] = await Promise.all([
            loadWatermarkLogo(),
            resolveWatermarkFontStack(),
          ]);
          return { logo, fontStack };
        })();

  throwIfAborted(signal);
  const capture = await acquireAnimationCapture(targetWidth);

  try {
    suppressCloneTransitions(capture.node);

    progress.report("preparing", 1, 1);

    const ctx: CaptureCtx = {
      capture,
      canvas,
      globalAspect: state.present.aspect,
      clips,
      frameCount,
      frameDurationMs,
      fps,
      progress,
      signal,
      watermark,
      onFrame: options.onFrame,
    };

    let blob: Blob;
    const encoded = await tryEncodeWithMediabunny(ctx, options.format);
    if (encoded) {
      blob = encoded;
    } else {
      if (options.format === "mp4") {
        throw new Error(
          "MP4 export needs WebCodecs (Chrome, Edge, or Safari 17+). Try WebM or update your browser.",
        );
      }

      blob = await encodeWebmMediaRecorder({
        ...ctx,
        durationMs,
      });
    }
    progress.report("finishing", 1, 1);
    const { contentType, extension } = animationMimeAndExt(options.format);

    return {
      blob,
      contentType: blob.type || contentType,
      extension,
    };
  } finally {
    clearAnimationFrameVars(capture.node, clips);
    capture.cleanup();
  }
}
