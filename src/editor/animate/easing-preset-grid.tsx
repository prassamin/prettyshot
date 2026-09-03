"use client";

import * as React from "react";

import {
  CLIP_EASING_KINDS,
  CLIP_EASING_LABELS,
  type ClipEasingBezier,
  type ClipEasingKind,
} from "@/editor/lib/animation/clip-easing";
import { cn } from "@/lib/utils";

import { EasingCurve } from "./timeline/easing-tile";

type EasingPresetGridProps = {
  kind: ClipEasingKind;
  bezier: ClipEasingBezier;
  speed: number;
  onSelect: (kind: ClipEasingKind) => void;
  onSelectCustom: () => void;
};

const tileClass = (active: boolean) =>
  cn(
    "flex aspect-square w-full items-center justify-center rounded-lg border p-2 transition-all duration-150",
    active
      ? "border-primary/40 bg-primary/10 text-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_12%,transparent)]"
      : "border-border/40 bg-surface-tertiary/50 text-muted-foreground group-hover:border-border group-hover:bg-surface-tertiary/80 group-hover:text-foreground",
  );

const labelClass = (active: boolean) =>
  cn(
    "text-[11px] transition-colors",
    active
      ? "font-semibold text-primary"
      : "text-muted-foreground group-hover:text-foreground",
  );

function EasingTile({
  kind,
  active,
  bezier,
  speed,
  animate,
  onSelect,
}: {
  kind: ClipEasingKind;
  active: boolean;
  bezier?: ClipEasingBezier;
  speed: number;
  animate: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onPointerEnter={() => {}}
      className="group flex flex-col items-center gap-1 outline-none"
    >
      <span className={tileClass(active)}>
        <EasingCurve
          kind={kind}
          bezier={bezier}
          animate={animate}
          speed={speed}
          strokeClassName={
            active ? "stroke-primary" : "stroke-muted-foreground"
          }
          dotClassName={active ? "fill-primary" : "fill-muted-foreground"}
        />
      </span>
      <span className={labelClass(active)}>{CLIP_EASING_LABELS[kind]}</span>
    </button>
  );
}

/**
 * The 3×2 easing preset grid (five presets + Custom). Hovering animates the
 * curve preview; the active preset is highlighted.
 */
export function EasingPresetGrid({
  kind,
  bezier,
  speed,
  onSelect,
  onSelectCustom,
}: EasingPresetGridProps) {
  const [hovered, setHovered] = React.useState<ClipEasingKind | null>(null);

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {CLIP_EASING_KINDS.map((k) => (
        <div
          key={k}
          onPointerEnter={() => setHovered(k)}
          onPointerLeave={() => setHovered((h) => (h === k ? null : h))}
          onFocus={() => setHovered(k)}
          onBlur={() => setHovered((h) => (h === k ? null : h))}
        >
          <EasingTile
            kind={k}
            active={k === kind}
            speed={speed}
            animate={hovered === k}
            onSelect={() => onSelect(k)}
          />
        </div>
      ))}

      <div
        onPointerEnter={() => setHovered("custom")}
        onPointerLeave={() => setHovered((h) => (h === "custom" ? null : h))}
        onFocus={() => setHovered("custom")}
        onBlur={() => setHovered((h) => (h === "custom" ? null : h))}
      >
        <EasingTile
          kind="custom"
          bezier={bezier}
          active={kind === "custom"}
          speed={speed}
          animate={hovered === "custom"}
          onSelect={onSelectCustom}
        />
      </div>
    </div>
  );
}
