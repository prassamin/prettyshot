/**
 * StrokeWidthControl — shared brush/shape thickness picker.
 *
 * Two ways to set thickness:
 *   Preset swatch buttons (ANNOTATION_STROKES) — dot size previews the width
 *   A fine-grained slider (1–24px)
 *
 * Used by pen/highlight/eraser strokes and annotation shapes.
 */
"use client";

import { Slider } from "@/components/slider";
import { ANNOTATION_STROKES } from "../constants";
import { cn } from "@/lib/utils";

export function StrokeWidthControl({
  value,
  color,
  onChange,
}: {
  value: number;
  color: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Preset widths — dot diameter previews the actual stroke width */}
      <div className="flex items-center gap-1.5">
        {ANNOTATION_STROKES.map((strokeWidth) => {
          const isActive = value === strokeWidth;
          return (
            <button
              key={strokeWidth}
              aria-label={`${strokeWidth}px thickness`}
              onClick={() => onChange(strokeWidth)}
              className={cn(
                "grid size-8 cursor-pointer place-items-center rounded-md border border-transparent transition-colors hover:bg-accent",
                isActive && "border-border bg-accent",
              )}
            >
              <span
                className="block rounded-full"
                style={{
                  width: Math.min(24, strokeWidth * 2 + 6),
                  height: Math.min(24, strokeWidth * 2 + 6),
                  background: color,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Fine-grained control */}
      <Slider
        label="Thickness"
        value={value}
        min={1}
        max={24}
        step={1}
        formatValue={(v) => `${Math.round(v)}px`}
        onValueChange={onChange}
      />
    </div>
  );
}
