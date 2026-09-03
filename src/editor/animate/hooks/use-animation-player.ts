"use client";

import React, {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useEditorEngine } from "@/editor/lib/engine";

type PlayerContextValue = {
  playheadMs: number;
  durationMs: number;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  reset: () => void;
  seek: (ms: number) => void;
};

const AnimationPlayerContext = createContext<PlayerContextValue | null>(null);

export function AnimationPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const durationMs = useEditorEngine(
    (s) => s.present.animation?.durationMs ?? 5000,
  );

  const [playheadMs, setPlayheadMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef({ ts: 0, from: 0 });
  const durationRef = useRef(durationMs);
  useEffect(() => {
    durationRef.current = durationMs;
  }, [durationMs]);

  const stopRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    stopRaf();
    setIsPlaying(false);
  }, [stopRaf]);

  const play = useCallback(() => {
    const total = durationRef.current;

    const from = playheadMs >= total ? 0 : playheadMs;
    startRef.current = { ts: performance.now(), from };
    setIsPlaying(true);

    const tick = (now: number) => {
      const elapsed = now - startRef.current.ts;
      const next = startRef.current.from + elapsed;
      if (next >= total) {
        setPlayheadMs(total);
        stopRaf();
        setIsPlaying(false);
        return;
      }
      setPlayheadMs(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [playheadMs, stopRaf]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const seek = useCallback(
    (ms: number) => {
      const clamped = Math.max(0, Math.min(ms, durationRef.current));
      setPlayheadMs(clamped);
      if (isPlaying)
        startRef.current = { ts: performance.now(), from: clamped };
    },
    [isPlaying],
  );

  const reset = useCallback(() => {
    pause();
    setPlayheadMs(0);
  }, [pause]);

  useEffect(() => stopRaf, [stopRaf]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      playheadMs,
      durationMs,
      isPlaying,
      play,
      pause,
      toggle,
      reset,
      seek,
    }),
    [playheadMs, durationMs, isPlaying, play, pause, toggle, reset, seek],
  );

  return createElement(AnimationPlayerContext.Provider, { value }, children);
}

export function useAnimationPlayer(): PlayerContextValue {
  const ctx = useContext(AnimationPlayerContext);
  if (!ctx) {
    throw new Error(
      "useAnimationPlayer must be used within an AnimationPlayerProvider",
    );
  }
  return ctx;
}

export function useAnimationPlayerOptional(): PlayerContextValue | null {
  return useContext(AnimationPlayerContext);
}
