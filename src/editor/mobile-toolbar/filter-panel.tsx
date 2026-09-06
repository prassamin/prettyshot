"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { useEditorEngine, useEditorStateField } from "@/editor/lib/engine";
import { ProgressiveImage } from "@/components/progressive-image";
import { cn } from "@/lib/utils";
import {
  BACKDROP_FILTER_PRESETS,
  SAMPLE_PREVIEW_PHOTO_URL,
} from "../property-panel/sections/backdrop/constants";
import { buildColorFilterCss } from "../property-panel/sections/backdrop/utils";
import type { BackdropFilterKind } from "../property-panel/sections/backdrop/types";
import { FeatureLock } from "../components/feature-lock";

function FilterCardPreview({ filter }: { filter: BackdropFilterKind }) {
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

export function MobileFilterPanel() {
  const backdropState = useEditorStateField((canvas) => canvas.backdrop);
  const setBackdropFilter = useEditorEngine(
    (engine) => engine.setBackdropFilter,
  );

  const activeFilter = backdropState.filter ?? "none";

  return (
    <div
      data-overflow="hidden"
      className="flex w-full flex-col px-1 pt-1 pb-3 select-none text-foreground"
    >
      {/* Horizontal photo filter rail */}
      <div className="flex w-full items-center gap-3.5 overflow-x-auto py-2.5 px-3 -my-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {BACKDROP_FILTER_PRESETS.map((preset) => {
          const isSelected = activeFilter === preset.id;
          return (
            <FeatureLock
              key={preset.id}
              featureId={preset.id === "none" ? undefined : "backdrop.filters"}
              overlay={"badge"}
              size="sm"
            >
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => setBackdropFilter(preset.id)}
                className="group flex min-w-16 w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5 outline-none transition-transform active:scale-95"
              >
                {/* Filter Thumbnail */}
                <div className="relative flex size-14 items-center justify-center">
                  <div
                    className={cn(
                      "relative size-14 overflow-hidden rounded-xl border transition-all duration-200 shadow-xs",
                      isSelected
                        ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                        : "border-border/70 hover:border-border hover:scale-102",
                    )}
                  >
                    <FilterCardPreview filter={preset.id} />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[0.5px] flex items-center justify-center">
                        <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                          <Check className="size-3 stroke-3" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Filter Typography */}
                <div className="flex w-full flex-col items-center text-center">
                  <span
                    className={cn(
                      "w-full truncate text-[11.5px] font-semibold leading-tight transition-colors duration-150",
                      isSelected
                        ? "text-primary font-bold"
                        : "text-foreground group-hover:text-foreground",
                    )}
                  >
                    {preset.label}
                  </span>
                  <span
                    className={cn(
                      "w-full truncate text-[9px] font-medium leading-tight mt-0.5 transition-colors duration-150",
                      isSelected
                        ? "text-primary/90 font-semibold"
                        : "text-muted-foreground/75",
                    )}
                  >
                    {preset.tag}
                  </span>
                </div>
              </button>
            </FeatureLock>
          );
        })}
      </div>
    </div>
  );
}
