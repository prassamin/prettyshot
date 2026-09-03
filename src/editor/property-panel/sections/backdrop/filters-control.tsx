"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/tooltip";
import { ProgressiveImage } from "@/components/progressive-image";

import { BACKDROP_FILTER_PRESETS, SAMPLE_PREVIEW_PHOTO_URL } from "./constants";
import { buildColorFilterCss } from "./utils";
import type { BackdropFilterKind } from "./types";
import { FeatureLock } from "@/editor/components/feature-lock";

interface FilterSamplePreviewProps {
  filter: BackdropFilterKind;
}

function FilterSamplePreview({ filter }: FilterSamplePreviewProps) {
  const [loadFailed, setLoadFailed] = React.useState(false);
  const filterStyle = React.useMemo(
    () => ({ filter: buildColorFilterCss(filter) }),
    [filter],
  );

  if (loadFailed) {
    return (
      <div
        className="relative size-full overflow-hidden bg-linear-to-tr from-amber-400 via-rose-500 to-indigo-700"
        style={filterStyle}
      >
        <div className="absolute top-1 left-1.5 size-2.5 rounded-full bg-amber-100/90 shadow-2xs" />
        <div className="absolute -bottom-2 -right-1 h-5 w-8 rounded-full bg-cyan-400/50 blur-[1px]" />
      </div>
    );
  }

  return (
    <ProgressiveImage
      src={SAMPLE_PREVIEW_PHOTO_URL}
      alt=""
      onError={() => setLoadFailed(true)}
      className="size-full object-cover select-none pointer-events-none transition-transform duration-200 group-hover:scale-105"
      style={filterStyle}
    />
  );
}

interface FiltersControlProps {
  backdropFilter: BackdropFilterKind;
  setBackdropFilter: (filter: BackdropFilterKind) => void;
}

export function FiltersControl({
  backdropFilter,
  setBackdropFilter,
}: FiltersControlProps) {
  return (
    <div className="grid grid-cols-4 gap-2 px-0.5 py-0.5">
      {BACKDROP_FILTER_PRESETS.map((preset) => {
        const isSelected = backdropFilter === preset.id;
        return (
          <Tooltip key={preset.id} content={preset.desc || preset.label}>
            <FeatureLock
              featureId={preset.id === "none" ? undefined : "backdrop.filters"}
              overlay="badge"
              size="sm"
              icon={false}
            >
              <button
                type="button"
                onClick={() => setBackdropFilter(preset.id)}
                className="group flex cursor-pointer w-full flex-col items-center gap-1 select-none"
              >
                {/* Photo Thumbnail */}
                <div
                  className={cn(
                    "relative aspect-square w-full overflow-hidden rounded-lg border bg-surface-secondary transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/40 ring-offset-1 ring-offset-background shadow-xs scale-105"
                      : "border-border/60 opacity-85 hover:opacity-100 hover:border-foreground/40 hover:scale-105",
                  )}
                >
                  <FilterSamplePreview filter={preset.id} />
                  {isSelected && (
                    <span className="pointer-events-none absolute top-1 right-1 z-10 grid size-3.5 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                      <Check className="size-2 stroke-3" />
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "w-full text-center text-[10px] truncate transition-colors leading-tight",
                    isSelected
                      ? "font-semibold text-primary"
                      : "font-medium text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {preset.label}
                </span>
              </button>
            </FeatureLock>
          </Tooltip>
        );
      })}
    </div>
  );
}
