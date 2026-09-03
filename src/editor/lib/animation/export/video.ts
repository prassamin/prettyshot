import { Muxer, ArrayBufferTarget } from "mp4-muxer";

import { captureStableFrame } from "./capture";
import type { AnimationExportFormat, CaptureCtx } from "./types";
import {
  createUiYielder,
  even,
  pickWebmMimeType,
  throwIfAborted,
} from "./utils";
import { drawWatermark } from "./watermark";
import { createVideoMuxSession } from "./workers/video-muxer-client";

export async function isWebmExportSupported(): Promise<boolean> {
  return pickWebmMimeType() != null;
}

function pickMp4MimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1",
    "video/mp4",
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return null;
}

/**
 * Rasterize each frame into `encodeCanvas` and hand it to `addFrame`.
 *
 * Shared by the worker and main-thread encoders — the capture half is identical
 * either way, since rasterizing a frame is DOM work that can't leave this
 * thread. Yields to the UI between frames so cancel/progress stay responsive.
 */
async function pumpFrames(
  ctx: CaptureCtx,
  encodeCanvas: HTMLCanvasElement,
  ectx: CanvasRenderingContext2D,
  addFrame: (timestampSec: number, durationSec: number) => Promise<void>,
) {
  const {
    capture,
    canvas,
    globalAspect,
    clips,
    frameCount,
    frameDurationMs,
    fps,
    progress,
    signal,
    watermark,
    onFrame,
  } = ctx;
  const { width, height } = encodeCanvas;
  const durationSec = 1 / fps;
  const yieldToUi = createUiYielder();

  // Reused preview canvas + downscaled frame emit (kept cheap for the UI).
  const previewW = Math.min(320, width);
  const previewH = Math.round((previewW / width) * height);
  let previewCanvas: HTMLCanvasElement | null = null;
  let previewCtx: CanvasRenderingContext2D | null = null;

  progress.report("capturing", 0, frameCount);
  for (let f = 0; f < frameCount; f++) {
    // Give the event loop a turn so cancel/progress stays responsive.
    await yieldToUi();
    throwIfAborted(signal);

    const timeMs = f * frameDurationMs;
    const frameCanvas = await captureStableFrame(
      capture,
      canvas,
      globalAspect,
      clips,
      timeMs,
    );
    ectx.fillStyle = "#000";
    ectx.fillRect(0, 0, width, height);
    ectx.drawImage(frameCanvas, 0, 0, width, height);
    if (watermark) drawWatermark(ectx, width, height, watermark);

    // Live preview: downscale the frame and emit it as a small data URL.
    if (onFrame) {
      if (!previewCanvas) {
        previewCanvas = document.createElement("canvas");
        previewCanvas.width = previewW;
        previewCanvas.height = previewH;
        previewCtx = previewCanvas.getContext("2d");
      }
      if (previewCtx) {
        previewCtx.clearRect(0, 0, previewW, previewH);
        previewCtx.drawImage(ectx.canvas, 0, 0, previewW, previewH);
        onFrame(previewCanvas.toDataURL("image/jpeg", 0.7), f, frameCount);
      }
    }

    await addFrame(f / fps, durationSec);
    progress.report("capturing", f + 1, frameCount);
  }
}


/**
 * Try the mux worker first: it owns the muxer and the encoder queue, leaving
 * this thread only the frame rasterization. Frames are transferred as
 * VideoFrames and pipelined (the next rasterizes while the worker encodes the
 * current one). Returns null when the worker can't be used, so the caller can
 * run the in-process encoder instead.
 */
async function tryEncodeInWorker(
  ctx: CaptureCtx,
  format: "webm" | "mp4",
  encodeCanvas: HTMLCanvasElement,
  ectx: CanvasRenderingContext2D,
): Promise<Blob | null> {
  const { fps, progress, signal } = ctx;

  const session = await createVideoMuxSession(
    {
      format,
      width: encodeCanvas.width,
      height: encodeCanvas.height,
      fps,
      keyFrameIntervalSec: 2,
    },
    signal,
  );
  if (!session) return null;

  try {
    await pumpFrames(ctx, encodeCanvas, ectx, (timestampSec, durationSec) =>
      session.addFrame(encodeCanvas, timestampSec, durationSec),
    );
    throwIfAborted(signal);
    progress.report("encoding", 0, 1);
    const buffer = await session.finalize();
    progress.report("encoding", 1, 1);
    return new Blob([buffer], {
      type: format === "mp4" ? "video/mp4" : "video/webm",
    });
  } finally {
    session.dispose();
  }
}

/** Try the worker encode; returns null if unavailable or unsupported. */
export async function tryEncodeWithMediabunny(
  ctx: CaptureCtx,
  format: AnimationExportFormat,
): Promise<Blob | null> {
  // WebCodecs paths (worker-first, then in-process) for MP4/WebM.
  if (typeof VideoEncoder !== "undefined") {
    const width = even(ctx.capture.width);
    const height = even(ctx.capture.height);

    const workerCanvas = document.createElement("canvas");
    workerCanvas.width = width;
    workerCanvas.height = height;
    const workerCtx = workerCanvas.getContext("2d");
    if (workerCtx) {
      try {
        const encoded = await tryEncodeInWorker(
          ctx,
          format as "webm" | "mp4",
          workerCanvas,
          workerCtx,
        );
        if (encoded) return encoded;
      } catch (err) {
        if (err instanceof Error && err.name === "AnimationExportAbortedError") {
          throw err;
        }
        // Fall through — the in-process encoder is a genuine second chance.
      }
    }

    try {
      const encoded = await encodeWithWebCodecsOnMainThread(
        ctx,
        format as "webm" | "mp4",
      );
      if (encoded) return encoded;
    } catch (err) {
      if (err instanceof Error && err.name === "AnimationExportAbortedError") {
        throw err;
      }
    }
  }

  // Last chance for MP4: MediaRecorder (Chromium 126+ muxes MP4 natively).
  // This catches browsers where WebCodecs is blocked (e.g. hardware
  // acceleration disabled) but MediaRecorder still works.
  if (format === "mp4") {
    const mp4Mime = pickMp4MimeType();
    if (mp4Mime) {
      try {
        return await encodeWithMediaRecorder(ctx, mp4Mime);
      } catch {
        return null;
      }
    }
  }

  return null;
}

/** In-process WebCodecs encoder — fallback when the worker path is unavailable. */
async function encodeWithWebCodecsOnMainThread(
  ctx: CaptureCtx,
  format: "webm" | "mp4",
): Promise<Blob | null> {
  const { capture, fps, progress, signal } = ctx;

  const width = even(capture.width);
  const height = even(capture.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ectx = canvas.getContext("2d");
  if (!ectx) return null;

  const codecCandidates: string[] =
    format === "mp4"
      ? [
          "avc1.42001f",
          "avc1.42E01E",
          "avc1.4d0028",
          "avc1.4d401f",
          "avc1.640028",
          "avc1.640033",
        ]
      : ["vp09.00.10.08", "vp8"];
  let codec: string | null = null;
  let encConfig: VideoEncoderConfig | null = null;
  for (const candidate of codecCandidates) {
    const configTry = {
      codec: candidate,
      width,
      height,
      bitrate: 8_000_000,
      framerate: fps,
    };
    try {
      const supported = await VideoEncoder.isConfigSupported(configTry);
      if (supported.supported) {
        codec = candidate;
        encConfig = configTry;
        break;
      }
    } catch {
      // keep trying
    }
  }
  if (!codec || !encConfig) return null;

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: format === "mp4" ? "avc" : "vp9",
      width,
      height,
    },
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      muxer.addVideoChunk(chunk, meta);
    },
    error: (e) => {
      throw new Error("VideoEncoder error: " + (e?.message ?? String(e)));
    },
  });
  encoder.configure(encConfig);

  const keyFrameEvery = Math.max(1, Math.round(fps * 2));
  try {
    let frameIdx = 0;
    await pumpFrames(ctx, canvas, ectx, async (timestampSec, durationSec) => {
      const videoFrame = new VideoFrame(canvas, {
        timestamp: Math.round(timestampSec * 1_000_000),
        duration: Math.round(durationSec * 1_000_000),
      });
      try {
        encoder.encode(videoFrame, { keyFrame: frameIdx % keyFrameEvery === 0 });
      } finally {
        videoFrame.close();
      }
      frameIdx++;
    });
    throwIfAborted(signal);
    progress.report("encoding", 0, 1);
    await encoder.flush();
    muxer.finalize();
    progress.report("encoding", 1, 1);
  } catch (err) {
    if (err instanceof Error && err.name === "AnimationExportAbortedError") {
      throw err;
    }
    return null;
  } finally {
    try {
      encoder.close();
    } catch {}
  }

  const bytes = target.buffer;
  return new Blob([bytes], { type: format === "mp4" ? "video/mp4" : "video/webm" });
}

/**
 * MediaRecorder fallback — the last resort for WebM (and for MP4 when neither
 * the worker nor in-process WebCodecs can encode). Real-time recording; used
 * only where WebCodecs is missing.
 */
async function encodeWithMediaRecorder(
  ctx: CaptureCtx,
  mimeType: string,
): Promise<Blob> {
  const { capture, frameCount, frameDurationMs, fps, progress, signal } = ctx;

  const canvas = document.createElement("canvas");
  canvas.width = even(capture.width);
  canvas.height = even(capture.height);
  const canvasCtx = canvas.getContext("2d");
  if (!canvasCtx) throw new Error("Could not create export canvas");

  const frames: HTMLCanvasElement[] = [];
  progress.report("capturing", 0, frameCount);
  const yieldToUi = createUiYielder();
  for (let f = 0; f < frameCount; f++) {
    await yieldToUi();
    throwIfAborted(signal);
    const timeMs = f * frameDurationMs;
    frames.push(
      await captureStableFrame(
        capture,
        ctx.canvas,
        ctx.globalAspect,
        ctx.clips,
        timeMs,
      ),
    );
    progress.report("capturing", f + 1, frameCount);
  }

  if (frames.length === 0) throw new Error("No frames captured for video export");
  throwIfAborted(signal);
  progress.report("encoding", 0, frames.length);

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const drawFrame = (idx: number) => {
    const frame = frames[Math.max(0, Math.min(frames.length - 1, idx))];
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    canvasCtx.drawImage(frame, 0, 0, canvas.width, canvas.height);
    if (ctx.watermark) drawWatermark(canvasCtx, canvas.width, canvas.height, ctx.watermark);
  };

  await new Promise<void>((resolve, reject) => {
    let rafId = 0;
    let finished = false;
    let lastReportedIdx = -1;

    const cleanupMedia = () => {
      stream.getTracks().forEach((t) => t.stop());
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(rafId);
      try {
        if (recorder.state !== "inactive") recorder.stop();
        else {
          cleanupMedia();
          resolve();
        }
      } catch (err) {
        cleanupMedia();
        reject(err instanceof Error ? err : new Error("Failed to stop MediaRecorder"));
      }
    };

    const onAbort = () => {
      finish();
      reject(new Error("Export canceled"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    recorder.onstop = () => {
      signal?.removeEventListener("abort", onAbort);
      cleanupMedia();
      resolve();
    };
    recorder.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      finish();
      reject(new Error("MediaRecorder failed during video export"));
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    try {
      recorder.start(100);
    } catch (err) {
      signal?.removeEventListener("abort", onAbort);
      reject(err instanceof Error ? err : new Error("Failed to start MediaRecorder"));
      return;
    }

    const start = performance.now();
    const safeDuration = Math.max(frameDurationMs, frameCount * frameDurationMs);
    const tick = (now: number) => {
      if (finished) return;
      if (signal?.aborted) {
        onAbort();
        return;
      }
      const elapsed = now - start;
      if (elapsed >= safeDuration) {
        drawFrame(frames.length - 1);
        progress.report("encoding", frames.length, frames.length);
        setTimeout(finish, Math.max(frameDurationMs, 50));
        return;
      }
      const idx = Math.min(
        frames.length - 1,
        Math.max(0, Math.floor((elapsed / 1000) * fps)),
      );
      drawFrame(idx);
      if (idx !== lastReportedIdx) {
        lastReportedIdx = idx;
        progress.report("encoding", idx + 1, frames.length);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  });

  throwIfAborted(signal);
  if (chunks.length === 0) throw new Error("Video export produced an empty file");

  const type = chunks[0]?.type || mimeType;
  return new Blob(chunks, { type });
}

export async function encodeWebmMediaRecorder(
  ctx: CaptureCtx & { durationMs: number },
): Promise<Blob> {
  const mime = pickWebmMimeType();
  if (!mime) throw new Error("WebM is not supported in this browser");
  return encodeWithMediaRecorder(ctx, mime);
}
