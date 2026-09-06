"use client";

import * as React from "react";
import { Ban, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShadowType, TypeGridProps } from "./types";

interface ProjectionPreset {
  id: ShadowType;
  label: string;
  renderPreview: () => React.ReactNode;
}

/** Miniature Window Component with Crisp Dark Theme and Light Silhouette Shadows */
function StudioWindow({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex h-6.5 w-10.5 flex-col overflow-hidden rounded-sm bg-surface-tertiary transition-all",
        className,
      )}
      style={style}
    >
      {/* Window Title Bar */}
      <div className="flex h-2 w-full items-center gap-0.5 border-b border-foreground/15 bg-surface-secondary px-1">
        <span className="size-1 rounded-full bg-danger/80" />
        <span className="size-1 rounded-full bg-warning/80" />
        <span className="size-1 rounded-full bg-success/80" />
      </div>
      {/* Window Body Canvas */}
      <div className="flex flex-1 flex-col justify-center gap-0.5 bg-surface-tertiary p-1">
        <div className="h-0.5 w-4.5 rounded-full bg-surface-secondary/30" />
        <div className="h-0.5 w-7 rounded-full bg-foreground/15" />
      </div>
      {children}
    </div>
  );
}

const PROJECTION_PRESETS: ProjectionPreset[] = [
  {
    id: "none",
    label: "None",
    renderPreview: () => (
      <div className="relative">
        <StudioWindow className="shadow-none border-dashed border-white/35 bg-surface-secondary/50 opacity-80" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Ban className="size-3.5 text-muted-foreground/90 drop-shadow-sm" />
        </div>
      </div>
    ),
  },
  {
    id: "drop",
    label: "Drop",
    renderPreview: () => (
      <StudioWindow className="shadow-[5px_5px_10px_0px_rgba(255,255,255,0.45),2px_2px_4px_0px_rgba(255,255,255,0.25)]" />
    ),
  },
  {
    id: "soft",
    label: "Soft",
    renderPreview: () => (
      <StudioWindow className="shadow-[0_8px_20px_2px_rgba(255,255,255,0.35),0_2px_6px_0px_rgba(255,255,255,0.2)]" />
    ),
  },
  {
    id: "hard",
    label: "Hard",
    renderPreview: () => (
      <StudioWindow className="shadow-[5px_5px_0px_0px_rgba(255,255,255,0.85)]" />
    ),
  },
  {
    id: "glow",
    label: "Glow",
    renderPreview: () => (
      <StudioWindow className="shadow-[0_0_16px_4px_rgba(255,255,255,0.5),0_0_6px_2px_rgba(255,255,255,0.7)]" />
    ),
  },
  {
    id: "float",
    label: "Float",
    renderPreview: () => (
      <StudioWindow className="-translate-y-1 shadow-[0_3px_6px_0px_rgba(255,255,255,0.3),0_12px_22px_0px_rgba(255,255,255,0.25)]" />
    ),
  },
  {
    id: "linear",
    label: "Linear",
    renderPreview: () => (
      <StudioWindow className="shadow-[0_2px_4px_rgba(255,255,255,0.25),0_6px_10px_rgba(255,255,255,0.18),0_12px_18px_rgba(255,255,255,0.12),0_22px_28px_rgba(255,255,255,0.06)]" />
    ),
  },
];

export function TypeGrid({ value, onChange, disabled = false }: TypeGridProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="block text-[11px] font-medium text-muted-foreground">
          Projection Style
        </span>
        <span className="text-[10px] font-medium text-muted-foreground/70 capitalize">
          {value}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PROJECTION_PRESETS.map((preset) => {
          const isSelected = value === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(preset.id)}
              className={cn(
                "group relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border p-1 text-center transition-all select-none",
                isSelected
                  ? "border-primary bg-primary/12 ring-2 ring-primary/50 shadow-sm scale-[1.02]"
                  : "border-border/50 bg-foreground/2 hover:border-border/90 hover:bg-surface-secondary hover:scale-[1.01]",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {/* Dark Stage Canvas */}
              <div className="relative h-13 w-full overflow-hidden rounded-lg border border-border bg-surface flex items-center justify-center">
                {/* Subtle Dot Texture */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-size-[6px_6px]" />
                <div className="flex size-full items-center justify-center p-2">
                  {preset.renderPreview()}
                </div>
              </div>

              {/* Preset Label */}
              <span
                className={cn(
                  "text-[10.5px] font-medium leading-tight transition-colors truncate w-full px-0.5",
                  isSelected
                    ? "text-primary font-semibold"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {preset.label}
              </span>

              {/* Selected Checkmark Badge */}
              {isSelected && (
                <span className="pointer-events-none absolute top-1 right-1 grid size-3.5 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                  <Check className="size-2.5 stroke-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
