export type VideoMuxerConfig = {
  format: "mp4" | "webm"
  width: number
  height: number
  fps: number
  keyFrameIntervalSec: number
}

export type VideoMuxerRequest =
  | { id: number; type: "init"; config: VideoMuxerConfig }
  | {
      id: number
      type: "frame"
      frame: VideoFrame
      timestampSec: number
      durationSec: number
    }
  | { id: number; type: "finalize" }
  | { id: number; type: "cancel" }

export type VideoMuxerResponse =
  | { id: number; ok: true; type: "init"; supported: boolean }
  | { id: number; ok: true; type: "frame" }
  | { id: number; ok: true; type: "finalize"; buffer: ArrayBuffer }
  | { id: number; ok: true; type: "cancel" }
  | { id: number; ok: false; error: string; aborted?: boolean }
