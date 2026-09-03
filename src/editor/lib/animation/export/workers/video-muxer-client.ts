/**
 * Main-thread handle on the video mux worker.
 *
 * `addFrame` snapshots the encode canvas into a `VideoFrame` and transfers it,
 * blocking only once more than {@link MAX_FRAMES_IN_FLIGHT} frames are
 * outstanding — so the next frame rasterizes while the worker encodes this one.
 */

import type {
  VideoMuxerConfig,
  VideoMuxerRequest,
  VideoMuxerResponse,
} from "./video-muxer-protocol";

/** Distribute `Omit` over the union so each message keeps its payload. */
type WithoutId<T> = T extends { id: number } ? Omit<T, "id"> : never;

const MAX_FRAMES_IN_FLIGHT = 2;

const INIT_TIMEOUT_MS = 30_000;

export type VideoMuxSession = {
  addFrame(
    canvas: HTMLCanvasElement,
    timestampSec: number,
    durationSec: number,
  ): Promise<void>;
  finalize(): Promise<ArrayBuffer>;
  cancel(): void;
  dispose(): void;
};

function canUseVideoMuxWorker(): boolean {
  return (
    typeof Worker !== "undefined" &&
    typeof VideoFrame !== "undefined" &&
    typeof VideoEncoder !== "undefined"
  );
}

export async function createVideoMuxSession(
  config: VideoMuxerConfig,
  signal?: AbortSignal,
): Promise<VideoMuxSession | null> {
  if (!canUseVideoMuxWorker()) return null;

  let worker: Worker;
  try {
    worker = new Worker(new URL("./video-muxer.worker.ts", import.meta.url), {
      type: "module",
    });
  } catch {
    return null;
  }

  let nextId = 1;
  let failure: Error | null = null;
  const pending = new Map<
    number,
    {
      resolve: (message: VideoMuxerResponse & { ok: true }) => void;
      reject: (err: Error) => void;
    }
  >();
  const inFlight: Promise<unknown>[] = [];

  const failAll = (err: Error) => {
    failure ??= err;
    for (const entry of pending.values()) entry.reject(err);
    pending.clear();
  };

  worker.onmessage = (event: MessageEvent<VideoMuxerResponse>) => {
    const message = event.data;
    const entry = pending.get(message.id);
    if (!entry) return;
    pending.delete(message.id);
    if (message.ok) entry.resolve(message);
    else entry.reject(new Error(message.error));
  };
  worker.onerror = () => failAll(new Error("Video mux worker failed"));
  worker.onmessageerror = () =>
    failAll(new Error("Video mux worker received an uncloneable message"));

  const send = (
    request: WithoutId<VideoMuxerRequest>,
    transfer: Transferable[] = [],
  ) => {
    if (failure) return Promise.reject(failure);
    const id = nextId++;
    return new Promise<VideoMuxerResponse & { ok: true }>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ ...request, id }, transfer);
    });
  };

  const track = (promise: Promise<unknown>) => {
    inFlight.push(
      promise.catch((err: Error) => {
        failure ??= err;
      }),
    );
  };

  const drain = async (keep: number) => {
    while (inFlight.length > keep) await inFlight.shift();
    if (failure) throw failure;
  };

  const dispose = () => {
    pending.clear();
    worker.terminate();
  };

  const onAbort = () => {
    void send({ type: "cancel" }).catch(() => {});
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  let ready: VideoMuxerResponse & { ok: true };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    ready = await Promise.race([
      send({ type: "init", config }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Video mux worker did not start")),
          INIT_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (err) {
    signal?.removeEventListener("abort", onAbort);
    dispose();
    if (signal?.aborted) throw err;
    return null;
  } finally {
    clearTimeout(timer);
  }

  if (ready.type !== "init" || !ready.supported) {
    signal?.removeEventListener("abort", onAbort);
    dispose();
    return null;
  }

  return {
    async addFrame(canvas, timestampSec, durationSec) {
      if (failure) throw failure;
      const frame = new VideoFrame(canvas, {
        timestamp: Math.round(timestampSec * 1_000_000),
        duration: Math.round(durationSec * 1_000_000),
      });
      try {
        track(
          send({ type: "frame", frame, timestampSec, durationSec }, [frame]),
        );
      } finally {
        frame.close();
      }
      await drain(MAX_FRAMES_IN_FLIGHT);
    },
    async finalize() {
      await drain(0);
      const done = await send({ type: "finalize" });
      if (done.type !== "finalize") {
        throw new Error("Video mux worker returned no data");
      }
      return done.buffer;
    },
    cancel() {
      onAbort();
    },
    dispose() {
      signal?.removeEventListener("abort", onAbort);
      dispose();
    },
  };
}
