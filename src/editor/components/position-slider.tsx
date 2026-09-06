"use client";

import React from "react";
import { Target } from "lucide-react";

import { cn } from "@/lib/utils";
import { clamp, clampPointPercent } from "@/editor/lib/geometry";

export type PositionSliderPoint = { xPct: number; yPct: number };

/** Percent position of a pointer event inside the pad. */
function computeNormalizedPoint(
  event: React.PointerEvent<HTMLDivElement>,
): PositionSliderPoint {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    xPct: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
    yPct: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

const HANDLE_OFFSET = 14;
const GLOW_OFFSET = 54;

function updateHandlePosition(handleEl: HTMLDivElement, point: PositionSliderPoint) {
  handleEl.style.left = `calc(${point.xPct}% - ${HANDLE_OFFSET}px)`;
  handleEl.style.top = `calc(${point.yPct}% - ${HANDLE_OFFSET}px)`;
}

function updateGlowPosition(glowEl: HTMLDivElement, point: PositionSliderPoint) {
  glowEl.style.left = `calc(${point.xPct}% - ${GLOW_OFFSET}px)`;
  glowEl.style.top = `calc(${point.yPct}% - ${GLOW_OFFSET}px)`;
}

type DragSession = {
  active: boolean;
  pending: PositionSliderPoint;
};

export function PositionSlider({
  ariaLabel,
  className,
  disabled = false,
  value,
  onChange,
  onPreview,
}: {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  value: PositionSliderPoint | null;
  onChange: (point: PositionSliderPoint) => void;
  onPreview?: (point: PositionSliderPoint) => void;
}) {
  const normalized = clampPointPercent(value);
  const handleRef = React.useRef<HTMLDivElement | null>(null);
  const glowRef = React.useRef<HTMLDivElement | null>(null);
  const sessionRef = React.useRef<DragSession>({
    active: false,
    pending: normalized,
  });

  React.useLayoutEffect(() => {
    if (sessionRef.current.active) return;
    const handleEl = handleRef.current;
    const glowEl = glowRef.current;
    if (handleEl) updateHandlePosition(handleEl, normalized);
    if (glowEl) updateGlowPosition(glowEl, normalized);
  }, [normalized]);

  const dispatchMove = React.useCallback(
    (next: PositionSliderPoint) => {
      const safe = clampPointPercent(next);
      const handleEl = handleRef.current;
      const glowEl = glowRef.current;
      sessionRef.current.pending = safe;
      if (handleEl) updateHandlePosition(handleEl, safe);
      if (glowEl) updateGlowPosition(glowEl, safe);
      onPreview?.(safe);
    },
    [onPreview],
  );

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      sessionRef.current = { active: true, pending: normalized };
      dispatchMove(computeNormalizedPoint(event));
    },
    [disabled, dispatchMove, normalized],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !sessionRef.current.active || event.buttons !== 1) return;
      dispatchMove(computeNormalizedPoint(event));
    },
    [disabled, dispatchMove],
  );

  const commit = React.useCallback(
    (point: PositionSliderPoint) => {
      onChange(clampPointPercent(point));
    },
    [onChange],
  );

  const finalizeDrag = React.useCallback(
    (point: PositionSliderPoint) => {
      sessionRef.current.active = false;
      commit(point);
    },
    [commit],
  );

  const handlePointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || !sessionRef.current.active) return;
      const point = computeNormalizedPoint(event);
      finalizeDrag(point);
    },
    [disabled, finalizeDrag],
  );

  const handlePointerCancel = React.useCallback(() => {
    if (!sessionRef.current.active) return;
    finalizeDrag(sessionRef.current.pending);
  }, [finalizeDrag]);

  const handleLostPointerCapture = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!sessionRef.current.active || event.buttons === 1) return;
      finalizeDrag(sessionRef.current.pending);
    },
    [finalizeDrag],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const step = event.shiftKey ? 10 : 5;
      const next = { ...normalized };
      switch (event.key) {
        case "ArrowLeft":  next.xPct -= step; break;
        case "ArrowRight": next.xPct += step; break;
        case "ArrowUp":    next.yPct -= step; break;
        case "ArrowDown":  next.yPct += step; break;
        case "Home":       next.xPct = 50; next.yPct = 50; break;
        default: return;
      }
      event.preventDefault();
      commit(next);
    },
    [commit, disabled, normalized],
  );

  return (
    <div
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuenow={Math.round((normalized.xPct + normalized.yPct) / 2)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${Math.round(normalized.xPct)}% horizontal, ${Math.round(normalized.yPct)}% vertical`}
      aria-disabled={disabled}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onLostPointerCapture={handleLostPointerCapture}
      className={cn(
        "group relative h-33 w-full max-w-full touch-none overflow-hidden rounded-xl border border-border/80 bg-surface-secondary shadow-inner transition outline-none",
        disabled
          ? "cursor-not-allowed opacity-55"
          : "cursor-grab focus-visible:ring-2 focus-visible:ring-primary/50 active:cursor-grabbing",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,currentColor_1px,transparent_1.5px)] bg-size-[18px_18px] text-foreground/15" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,color-mix(in_oklab,var(--foreground)_8%,transparent),transparent_54%)]" />
      <div className="pointer-events-none absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-foreground/10" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-foreground/10" />
      <div
        ref={glowRef}
        className="pointer-events-none absolute size-27 rounded-full bg-primary/25 blur-2xl will-change-[left,top]"
        style={{
          left: `calc(${normalized.xPct}% - ${GLOW_OFFSET}px)`,
          top: `calc(${normalized.yPct}% - ${GLOW_OFFSET}px)`,
        }}
      />
      <div
        ref={handleRef}
        className="absolute z-10 flex size-7 items-center justify-center rounded-full border-[3px] border-white bg-primary text-primary-foreground shadow-[0_0_16px_4px_var(--color-primary)] transition-transform will-change-[left,top] group-active:scale-105"
        style={{
          left: `calc(${normalized.xPct}% - ${HANDLE_OFFSET}px)`,
          top: `calc(${normalized.yPct}% - ${HANDLE_OFFSET}px)`,
        }}
      >
        <Target className="size-3.5" />
      </div>
    </div>
  );
}
