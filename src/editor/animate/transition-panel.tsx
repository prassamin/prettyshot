"use client";

import { Switch } from "@heroui/react";

import {
  clipEasingBezier,
  clipEasingKind,
  clipReturnsToDefault,
  clipSpeed,
  DEFAULT_CUSTOM_BEZIER,
  effectiveActiveMs,
  MAX_CLIP_SPEED,
  MIN_CLIP_SPEED,
  PRESET_BEZIER_SEEDS,
  type ClipEasingBezier,
  type ClipEasingKind,
} from "@/editor/lib/animation/clip-easing";
import type { AnimationClip } from "@/editor/lib/animation/types";

import { Slider } from "@/components/slider";
import { EasingPresetGrid } from "./easing-preset-grid";
import { BezierCurveEditor } from "./timeline/curve-editor";

type TransitionPanelProps = {
  clip: AnimationClip;
  onUpdate: (patch: Partial<AnimationClip>) => void;
};

/**
 * The Transition popover body: easing preset grid, custom curve editor, speed
 * slider, and the "return to default" switch.
 */
export function TransitionPanel({ clip, onUpdate }: TransitionPanelProps) {
  const kind = clipEasingKind(clip);
  const speed = clipSpeed(clip);
  const bezier = clipEasingBezier(clip);
  const returns = clipReturnsToDefault(clip);

  // The slider is driven by the effective transition duration in ms, not the raw
  // speed multiplier: RIGHT (max) = the full clip window (speed 1), and dragging
  // LEFT shortens it (higher speed) — so "1200ms" reads as a full bar you reduce.
  const fullMs = Math.max(1, Math.round(clip.durationMs));
  const minMs = Math.max(1, Math.round(clip.durationMs / MAX_CLIP_SPEED));
  const maxMs = Math.max(minMs + 1, fullMs);
  const activeMs = Math.min(maxMs, Math.max(minMs, effectiveActiveMs(clip)));
  const onSpeedMs = (ms: number) => {
    const next = clip.durationMs / Math.max(1, ms);
    onUpdate({
      speed: Math.min(MAX_CLIP_SPEED, Math.max(MIN_CLIP_SPEED, next)),
    });
  };

  const selectPreset = (k: ClipEasingKind) => {
    onUpdate({ easing: k });
  };

  const selectCustom = () => {
    // Seed from the last custom edit, else from the active preset so the graph
    // starts near whatever tile they just had selected.
    let seed: ClipEasingBezier = DEFAULT_CUSTOM_BEZIER;
    if (clip.easingBezier) {
      seed = clip.easingBezier;
    } else if (kind !== "custom" && Object.hasOwn(PRESET_BEZIER_SEEDS, kind)) {
      seed = PRESET_BEZIER_SEEDS[kind];
    }
    onUpdate({ easing: "custom", easingBezier: seed });
  };

  const onBezierChange = (next: ClipEasingBezier) => {
    onUpdate({ easing: "custom", easingBezier: next });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold tracking-tight text-foreground">
          Transition
        </span>
      </div>

      <EasingPresetGrid
        kind={kind}
        bezier={bezier}
        speed={speed}
        onSelect={selectPreset}
        onSelectCustom={selectCustom}
      />

      {kind === "custom" && (
        <BezierCurveEditor value={bezier} onChange={onBezierChange} />
      )}

      <Slider
        label="Speed"
        value={activeMs}
        min={minMs}
        max={maxMs}
        step={1}
        aria-label="Transition speed"
        formatValue={(v: number) => `${Math.round(v)}ms`}
        onValueChange={onSpeedMs}
        className="pt-0.5"
      />

      <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-medium text-foreground">
            Return to default
          </span>
          <span className="text-[10px] text-muted-foreground">
            {returns
              ? `Unwinds over ${activeMs}ms after the clip`
              : "Holds its pose after the clip"}
          </span>
        </div>
        <Switch
          size="sm"
          isSelected={returns}
          onChange={(v: boolean) => onUpdate({ returnToDefault: v })}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>
    </div>
  );
}
