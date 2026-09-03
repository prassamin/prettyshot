import type { AnimationCapture } from "@/editor/lib/export";
import type { AnimationClip } from "../types";
import type { CanvasState } from "@/editor/lib/engine/types";
import type { ProgressReporter } from "./utils";

export type AnimationExportFormat = "webm" | "mp4";

export type AnimationExportPhase =
  | "preparing"
  | "capturing"
  | "encoding"
  | "finishing";

export type AnimationExportProgress = {
  phase: AnimationExportPhase;
  current: number;
  total: number;
  etaMs: number | null;
};

export type AnimationExportOptions = {
  format: AnimationExportFormat;
  fps?: number;
  targetWidth?: number;
  scale?: string;
  watermark?: boolean;
  onProgress?: (progress: AnimationExportProgress) => void;
  /** Live preview — called with a small downscaled frame image per rendered frame. */
  onFrame?: (frameDataUrl: string, index: number, total: number) => void;
  signal?: AbortSignal;
  asBlob?: boolean;
};

export type AnimationExportBlobResult = {
  blob: Blob;
  contentType: string;
  extension: string;
};

export type WatermarkAssets = {
  logo: HTMLImageElement | null;
  fontStack: string;
};

export type CaptureCtx = {
  capture: AnimationCapture;
  canvas: CanvasState;
  globalAspect: { id: string; w: number; h: number };
  clips: AnimationClip[];
  frameCount: number;
  frameDurationMs: number;
  fps: number;
  progress: ProgressReporter;
  signal?: AbortSignal;
  watermark: WatermarkAssets | null;
  /** Live preview — called with a small downscaled frame image per rendered frame. */
  onFrame?: (frameDataUrl: string, index: number, total: number) => void;
};
