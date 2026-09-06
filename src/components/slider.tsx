"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/utils";

const DRAG_THRESHOLD = 3;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function stepDecimals(step: number): number {
  const s = String(step);
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

function snapRound(val: number, step: number): number {
  return parseFloat((Math.round(val / step) * step).toFixed(stepDecimals(step)));
}

export type SliderProps = {
  label: string;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  onValueCommit?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
};

export function Slider({
  label,
  value: controlledValue,
  defaultValue,
  onValueChange,
  onValueCommit,
  min = 0,
  max = 1,
  step = 0.01,
  formatValue,
  disabled = false,
  className,
  style,
  "aria-label": ariaLabel,
}: SliderProps) {
  const isControlled = controlledValue !== undefined;
  const [local, setLocal] = useState(defaultValue ?? min);
  const value = isControlled ? controlledValue : local;
  const commitRef = useRef(onValueCommit);
  commitRef.current = onValueCommit;
  const changeRef = useRef(onValueChange);
  changeRef.current = onValueChange;

  const dispatch = useCallback(
    (v: number) => {
      if (!isControlled) setLocal(v);
      changeRef.current?.(v);
    },
    [isControlled],
  );

  const reduceMotion = useReducedMotion();

  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  const [active, setActive] = useState(false);
  const [focusRing, setFocusRing] = useState(false);

  const startPos = useRef<{ x: number; y: number } | null>(null);
  const skipFocus = useRef(false);
  const wasClick = useRef(true);
  const springRef = useRef<ReturnType<typeof animate> | null>(null);
  const boxRef = useRef<DOMRect | null>(null);
  const scaleRef = useRef(1);
  const pendingRef = useRef(value);

  const pct = ((value - min) / (max - min)) * 100;
  const enabled = !disabled;
  const display = formatValue
    ? formatValue(value)
    : value.toFixed(stepDecimals(step));

  const fillPct = useMotionValue(pct);
  const fillW = useTransform(fillPct, (v) => `${v}%`);

  useEffect(() => {
    if (!active && !springRef.current) {
      fillPct.jump(pct);
    }
  }, [pct, active, fillPct]);

  useEffect(() => {
    pendingRef.current = value;
  }, [value]);

  const calcValue = useCallback(
    (cx: number) => {
      const b = boxRef.current;
      if (!b) return min;
      const sx = (cx - b.left) / scaleRef.current;
      const w = rootRef.current?.offsetWidth ?? b.width;
      return clamp(min + clamp(sx / w, 0, 1) * (max - min), min, max);
    },
    [min, max],
  );

  const toPct = useCallback((v: number) => ((v - min) / (max - min)) * 100, [min, max]);

  const springTo = useCallback(
    (target: number) => {
      springRef.current?.stop();
      if (reduceMotion) {
        fillPct.jump(target);
        springRef.current = null;
        return;
      }
      springRef.current = animate(fillPct, target, {
        type: "spring",
        stiffness: 320,
        damping: 28,
        mass: 0.7,
        onComplete: () => {
          springRef.current = null;
        },
      });
    },
    [fillPct, reduceMotion],
  );

  const onGrab = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startPos.current = { x: e.clientX, y: e.clientY };
      wasClick.current = true;
      pendingRef.current = value;
      setActive(true);
      skipFocus.current = true;
      setFocusRing(false);
      barRef.current?.focus({ preventScroll: true });
      requestAnimationFrame(() => {
        skipFocus.current = false;
      });
      const el = rootRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        boxRef.current = r;
        scaleRef.current = r.width / el.offsetWidth;
      }
    },
    [disabled, value],
  );

  const onDrag = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || !active || !startPos.current) return;
      const dx = e.clientX - startPos.current.x;
      const dy = e.clientY - startPos.current.y;
      if (wasClick.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        wasClick.current = false;
      }
      if (wasClick.current) return;
      const next = calcValue(e.clientX);
      const snapped = snapRound(next, step);
      springRef.current?.stop();
      springRef.current = null;
      fillPct.jump(toPct(next));
      pendingRef.current = snapped;
      dispatch(snapped);
    },
    [disabled, active, calcValue, toPct, dispatch, step, fillPct],
  );

  const onRelease = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || !active) return;
      let committed = pendingRef.current;
      if (wasClick.current) {
        const raw = calcValue(e.clientX);
        const snapped = snapRound(clamp(raw, min, max), step);
        springTo(toPct(snapped));
        pendingRef.current = snapped;
        dispatch(snapped);
        committed = snapped;
      }
      setActive(false);
      startPos.current = null;
      commitRef.current?.(committed);
    },
    [disabled, active, calcValue, min, max, step, springTo, toPct, dispatch],
  );

  const onKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      const stepSize = e.shiftKey ? step * 10 : step;
      let next: number | null = null;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          next = value + stepSize;
          break;
        case "ArrowLeft":
        case "ArrowDown":
          next = value - stepSize;
          break;
        case "Home":
          next = min;
          break;
        case "End":
          next = max;
          break;
        default:
          return;
      }
      e.preventDefault();
      setFocusRing(true);
      const snapped = snapRound(clamp(next, min, max), step);
      springTo(toPct(snapped));
      dispatch(snapped);
      commitRef.current?.(snapped);
    },
    [disabled, value, min, max, step, springTo, toPct, dispatch],
  );

  const onFocus = useCallback(() => {
    if (!skipFocus.current) setFocusRing(true);
  }, []);

  const onBlur = useCallback(() => {
    setFocusRing(false);
  }, []);

  return (
    <div
      ref={rootRef}
      data-disabled={disabled || undefined}
      style={style}
      className={cn(
        "relative h-10",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      <motion.div
        ref={barRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        data-active={enabled ? "true" : undefined}
        data-focus={focusRing ? "true" : undefined}
        data-disabled={disabled || undefined}
        aria-label={ariaLabel ?? label}
        aria-orientation="horizontal"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
        aria-disabled={disabled || undefined}
        className={cn(
          "group/track absolute inset-0 cursor-pointer touch-none overflow-hidden rounded-xl bg-[color-mix(in_oklab,var(--muted)_50%,var(--background))] outline-none select-none",
          "shadow-[inset_0_1px_2px_color-mix(in_oklab,var(--overlay)_60%,transparent),inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_6%,transparent)]",
          "transition-shadow duration-300",
          "data-[active=true]:hover:shadow-[inset_0_1px_2px_color-mix(in_oklab,var(--overlay)_60%,transparent),inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_18%,transparent)]",
          "data-[focus=true]:shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--ring)_65%,transparent),0_0_0_3px_color-mix(in_oklab,var(--ring)_18%,transparent)]",
          disabled && "cursor-not-allowed",
        )}
        onPointerDown={onGrab}
        onPointerMove={onDrag}
        onPointerUp={onRelease}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKey}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden bg-linear-to-r from-transparent to-primary/50"
          style={{ width: fillW }}
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-foreground/15 to-transparent" />
        </motion.div>

        <span
          ref={labelRef}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 inline-flex -translate-y-1/2 items-center text-sm/none font-medium tracking-tight text-muted-foreground transition-colors"
        >
          {label}
        </span>

        <span
          ref={badgeRef}
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md px-1.5 py-1 font-mono text-sm/none font-semibold tabular-nums transition-colors",
            "text-muted-foreground group-data-[active=true]/track:text-foreground",
          )}
        >
          {display}
        </span>
      </motion.div>
    </div>
  );
}
