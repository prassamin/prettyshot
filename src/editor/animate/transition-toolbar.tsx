"use client";

import * as React from "react";
import { Popover } from "@heroui/react";

import {
  clipEasingBezier,
  clipEasingKind,
  effectiveActiveMs,
} from "@/editor/lib/animation/clip-easing";
import type { AnimationClip } from "@/editor/lib/animation/types";
import { cn } from "@/lib/utils";

import { EasingCurve } from "./timeline/easing-tile";
import { TransitionPanel } from "./transition-panel";
import { Tooltip } from "@/components/tooltip";

type ClipTransitionButtonProps = {
  clip: AnimationClip;
  onUpdate: (patch: Partial<AnimationClip>) => void;
  /** While playing, keep the control visible but non-interactive. */
  disabled?: boolean;
  className?: string;
};

/**
 * The selected clip's transition control, shown inline in the animate controls
 * bar: a curve + duration button that opens the Transition popover (easing
 * curve + speed). Applies to every animation type — position, zoom,
 * background, and so on.
 */
export function ClipTransitionButton({
  clip,
  onUpdate,
  disabled = false,
  className,
}: ClipTransitionButtonProps) {
  const kind = clipEasingKind(clip);
  const bezier = kind === "custom" ? clipEasingBezier(clip) : undefined;
  const [open, setOpen] = React.useState(false);

  return (
    // Controlled so hitting play (which disables the trigger) also force-closes
    // an already-open popover instead of leaving it floating.
    <Popover
      isOpen={open && !disabled}
      onOpenChange={(next: boolean) => {
        if (!disabled) setOpen(next);
      }}
    >
      <Popover.Trigger>
        <Tooltip content="Transition">
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border/40 bg-surface-tertiary px-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-border/70 hover:bg-muted disabled:pointer-events-none disabled:opacity-50",
              className,
            )}
          >
            <span className="flex size-4 items-center justify-center">
              <EasingCurve
                kind={kind}
                bezier={bezier}
                strokeClassName="stroke-foreground/80"
              />
            </span>
            <span className="tabular-nums">{effectiveActiveMs(clip)}ms</span>
          </button>
        </Tooltip>
      </Popover.Trigger>
      <Popover.Content
        placement="top"
        offset={12}
        className="w-70 p-0 rounded-[20px] bg-popover/95 backdrop-blur-2xl border border-border/70 shadow-2xl overflow-hidden ring-1 ring-border/40"
      >
        <Popover.Dialog>
          <TransitionPanel clip={clip} onUpdate={onUpdate} />
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
