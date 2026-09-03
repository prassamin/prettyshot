/**
 * Video mux worker. Owns the VideoEncoder + mp4-muxer for an MP4/WebM export:
 * codec negotiation, the muxer and its growing buffer. The main thread keeps
 * only what needs the DOM — rasterizing each styled frame — and hands the
 * pixels over as a transferred `VideoFrame`, so the encode, the mux and the
 * file assembly never block the UI.
 */

import { Muxer, ArrayBufferTarget } from "mp4-muxer";

import type {
  VideoMuxerConfig,
  VideoMuxerRequest,
  VideoMuxerResponse,
} from "./video-muxer-protocol";

type Session = {
  encoder: VideoEncoder;
  muxer: Muxer<ArrayBufferTarget>;
  target: ArrayBufferTarget;
  frameCount: number;
  keyFrameEvery: number;
};

let session: Session | null = null;

// Handlers are async, but `onmessage` fires again as soon as one returns — so
// without this chain frame N+1 could be encoded before frame N finished, and
// the muxer rejects out-of-order timestamps.
let queue: Promise<void> = Promise.resolve();

function reply(message: VideoMuxerResponse, transfer: Transferable[] = []) {
  (self as unknown as Worker).postMessage(message, transfer);
}

function teardown() {
  session?.encoder.close();
  session = null;
}

function sessionError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

async function init(id: number, config: VideoMuxerConfig) {
  const { format, width, height, fps, keyFrameIntervalSec } = config;

  if (typeof VideoEncoder === "undefined") {
    reply({ id, ok: true, type: "init", supported: false });
    return;
  }

  // Try progressively: baseline → main → high AVC levels (some GPUs/browsers
  // reject higher levels at 4K), and a VP9 fallback for WebM.
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
  if (!codec || !encConfig) {
    reply({ id, ok: true, type: "init", supported: false });
    return;
  }

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

  session = {
    encoder,
    muxer,
    target,
    frameCount: 0,
    keyFrameEvery: Math.max(1, Math.round(fps * keyFrameIntervalSec)),
  };
  reply({ id, ok: true, type: "init", supported: true });
}

async function handle(request: VideoMuxerRequest) {
  try {
    switch (request.type) {
      case "init": {
        await init(request.id, request.config);
        return;
      }
      case "frame": {
        if (!session) throw new Error("Video mux worker was not initialized");
        const isKeyFrame = session.frameCount % session.keyFrameEvery === 0;
        session.frameCount++;
        try {
          session.encoder.encode(request.frame, { keyFrame: isKeyFrame });
        } finally {
          // The transferred frame is owned by the worker from here on; close
          // it so its backing memory is released (it was detached from the
          // main thread by the transfer).
          request.frame.close();
        }
        reply({ id: request.id, ok: true, type: "frame" });
        return;
      }
      case "finalize": {
        if (!session) throw new Error("Video mux worker was not initialized");
        await session.encoder.flush();
        session.muxer.finalize();
        const buffer = session.target.buffer;
        teardown();
        if (!buffer || buffer.byteLength === 0) {
          throw new Error("Video encode produced an empty file");
        }
        reply({ id: request.id, ok: true, type: "finalize", buffer }, [buffer]);
        return;
      }
      case "cancel": {
        teardown();
        reply({ id: request.id, ok: true, type: "cancel" });
        return;
      }
      default: {
        const unknown: never = request;
        throw new Error(
          `Unknown mux worker request: ${(unknown as { type?: string }).type}`,
        );
      }
    }
  } catch (err) {
    if (request.type === "frame") request.frame.close();
    teardown();
    reply({
      id: request.id,
      ok: false,
      error: sessionError(err).message,
      aborted: false,
    });
  }
}

self.onmessage = (event: MessageEvent<VideoMuxerRequest>) => {
  const request = event.data;
  queue = queue.then(() => handle(request));
};
