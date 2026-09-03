"use client";

import * as React from "react";
import { ArrowLeftRight, Crop, Maximize2 } from "lucide-react";

import { ALL_OPTIONS } from "@/editor/aspect/presets";
import type { AspectState } from "@/editor/lib/engine";
import { cn } from "@/lib/utils";
import { FeatureLock } from "../components/feature-lock";

export function MobileAspectPanel({
  aspect,
  onChange,
  onClose,
}: {
  aspect: AspectState;
  onChange: (id: string, custom?: { w: number; h: number }) => void;
  onClose: () => void;
}) {
  const [showCustom, setShowCustom] = React.useState(aspect.id === "custom");
  const [customW, setCustomW] = React.useState(() =>
    aspect.w && aspect.w > 0 ? String(aspect.w) : "1920",
  );
  const [customH, setCustomH] = React.useState(() =>
    aspect.h && aspect.h > 0 ? String(aspect.h) : "1080",
  );

  // Sync state whenever aspect state changes
  React.useEffect(() => {
    if (aspect.w && aspect.h && aspect.w > 0 && aspect.h > 0) {
      setCustomW(String(aspect.w));
      setCustomH(String(aspect.h));
    }
    if (aspect.id === "custom") {
      setShowCustom(true);
    }
  }, [aspect.id, aspect.w, aspect.h]);

  const numW = Number(customW);
  const numH = Number(customH);
  const isCustomValid =
    Number.isFinite(numW) && Number.isFinite(numH) && numW > 0 && numH > 0;

  const handleApplyCustom = () => {
    if (!isCustomValid) return;
    onChange("custom", { w: Math.round(numW), h: Math.round(numH) });
    onClose();
  };

  const handleSwap = () => {
    const temp = customW;
    setCustomW(customH);
    setCustomH(temp);
  };

  return (
    <div
      data-overflow="hidden"
      className="flex w-full flex-col px-1 pt-1 pb-3 select-none text-foreground"
    >
      {/* Clean horizontal scrolling rail */}
      <div className="flex w-full items-center gap-4 overflow-x-auto py-2 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* 1st: Auto / Original */}
        {ALL_OPTIONS.slice(0, 1).map((item) => {
          const isActive = aspect.id === item.id && !showCustom;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                setShowCustom(false);
                onChange(item.id);
              }}
              className="group flex min-w-17 w-17 shrink-0 cursor-pointer flex-col items-center gap-1.5 outline-none transition-transform active:scale-90"
            >
              {/* Silhouette Shape */}
              <div className="flex h-11 w-full items-center justify-center">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-md border-[1.5px] transition-all duration-150",
                    isActive
                      ? "border-primary bg-primary/25 text-primary shadow-xs ring-1 ring-primary/30"
                      : "border-muted-foreground/50 bg-muted-foreground/10 group-hover:border-muted-foreground group-hover:bg-muted-foreground/20 shadow-xs",
                  )}
                >
                  <Maximize2 className="size-3.5" />
                </div>
              </div>

              {/* Typography */}
              <div className="flex w-full flex-col items-center text-center">
                <span
                  className={cn(
                    "w-full truncate text-[12px] font-bold leading-tight transition-colors duration-150",
                    isActive
                      ? "text-primary"
                      : "text-foreground group-hover:text-foreground",
                  )}
                >
                  Original
                </span>
                <span
                  className={cn(
                    "w-full truncate text-[9.5px] font-medium leading-tight mt-0.5 transition-colors duration-150",
                    isActive
                      ? "text-primary/90 font-semibold"
                      : "text-muted-foreground/80",
                  )}
                >
                  Auto
                </span>
              </div>
            </button>
          );
        })}

        {/* 2nd: Custom Aspect Item */}
        <FeatureLock featureId="aspect.custom" overlay="badge" size="sm">
          <button
            type="button"
            onClick={() => setShowCustom((prev) => !prev)}
            className="group flex min-w-17 w-17 shrink-0 cursor-pointer flex-col items-center gap-1.5 outline-none transition-transform active:scale-90"
          >
            <div className="flex h-11 w-full items-center justify-center">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-md border-[1.5px] border-dashed transition-all duration-150",
                  showCustom || aspect.id === "custom"
                    ? "border-primary bg-primary/25 text-primary shadow-xs ring-1 ring-primary/30"
                    : "border-muted-foreground/50 bg-muted-foreground/10 group-hover:border-muted-foreground group-hover:bg-muted-foreground/20 shadow-xs",
                )}
              >
                <Crop className="size-3.5" />
              </div>
            </div>

            <div className="flex w-full flex-col items-center text-center">
              <span
                className={cn(
                  "w-full truncate text-[12px] font-bold leading-tight transition-colors duration-150",
                  showCustom || aspect.id === "custom"
                    ? "text-primary"
                    : "text-foreground",
                )}
              >
                Custom
              </span>
              <span
                className={cn(
                  "w-full truncate font-mono text-[9.5px] font-medium leading-tight mt-0.5 transition-colors duration-150",
                  showCustom || aspect.id === "custom"
                    ? "text-primary/90 font-semibold"
                    : "text-muted-foreground/80",
                )}
              >
                {aspect.id === "custom" && aspect.w && aspect.h
                  ? `${aspect.w}×${aspect.h}`
                  : "Free"}
              </span>
            </div>
          </button>
        </FeatureLock>

        {/* 3rd onward: All Aspect Presets */}
        {ALL_OPTIONS.slice(1).map((item) => {
          const isActive = aspect.id === item.id && !showCustom;
          const isBasic = item.category === "basic";
          return (
            <FeatureLock
              featureId={isBasic ? "aspect.basic" : "aspect.presets"}
              key={item.id}
              overlay="badge"
              size="sm"
            >
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  setShowCustom(false);
                  onChange(item.id);
                }}
                className="group flex min-w-17 w-17 shrink-0 cursor-pointer flex-col items-center gap-1.5 outline-none transition-transform active:scale-90"
              >
                {/* Pure Proportional Shape */}
                <div className="flex h-11 w-full items-center justify-center">
                  <AspectShape ratio={item.ratio} active={isActive} />
                </div>

                {/* Bold Ratio Label + Clean Preset Name */}
                <div className="flex w-full flex-col items-center text-center">
                  <span
                    className={cn(
                      "w-full truncate text-[12px] font-bold leading-tight transition-colors duration-150",
                      isActive
                        ? "text-primary"
                        : "text-foreground group-hover:text-foreground",
                    )}
                  >
                    {item.ratio}
                  </span>
                  <span
                    className={cn(
                      "w-full truncate text-[9.5px] font-medium leading-tight mt-0.5 transition-colors duration-150",
                      isActive
                        ? "text-primary/90 font-semibold"
                        : "text-muted-foreground/80",
                    )}
                  >
                    {item.name}
                  </span>
                </div>
              </button>
            </FeatureLock>
          );
        })}
      </div>

      {/* Inline Custom Resolution Strip */}
      {showCustom && (
        <div className="mx-2 mt-2.5 flex items-center gap-2 rounded-2xl border border-border bg-surface-tertiary p-2 shadow-sm">
          {/* Width Input */}
          <div className="flex flex-1 items-center rounded-xl border border-border bg-surface-secondary px-3 py-1.5 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30">
            <span className="font-mono text-[11px] font-bold text-muted-foreground mr-1.5">
              W
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={customW}
              onChange={(e) => setCustomW(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCustom()}
              className="w-full bg-transparent font-mono text-[13px] font-semibold text-foreground outline-none"
            />
            <span className="font-mono text-[10px] text-muted-foreground/60">
              px
            </span>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            aria-label="Swap dimensions"
            onClick={handleSwap}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border/80 bg-surface-secondary text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-muted active:scale-95"
          >
            <ArrowLeftRight className="size-3.5" />
          </button>

          {/* Height Input */}
          <div className="flex flex-1 items-center rounded-xl border border-border bg-surface-secondary px-3 py-1.5 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30">
            <span className="font-mono text-[11px] font-bold text-muted-foreground mr-1.5">
              H
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={customH}
              onChange={(e) => setCustomH(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCustom()}
              className="w-full bg-transparent font-mono text-[13px] font-semibold text-foreground outline-none"
            />
            <span className="font-mono text-[10px] text-muted-foreground/60">
              px
            </span>
          </div>

          {/* Apply Button */}
          <button
            type="button"
            disabled={!isCustomValid}
            onClick={handleApplyCustom}
            className={cn(
              "h-8.5 shrink-0 cursor-pointer rounded-xl px-3.5 text-[12px] font-bold transition-all shadow-xs active:scale-95",
              isCustomValid
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-surface-muted text-muted-foreground/40",
            )}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

function AspectShape({ ratio, active }: { ratio: string; active: boolean }) {
  const [rw, rh] = ratio.split(":").map(Number);
  const safeRw = Number.isFinite(rw) && rw > 0 ? rw : 1;
  const safeRh = Number.isFinite(rh) && rh > 0 ? rh : 1;
  const aspect = safeRw / safeRh;

  let width: number;
  let height: number;

  if (Math.abs(aspect - 1) < 0.02) {
    // 1:1 Square
    width = 26;
    height = 26;
  } else if (aspect > 1) {
    // Landscape
    width = 38;
    height = Math.round(Math.max(16, Math.min(26, 38 / aspect)));
  } else {
    // Portrait
    height = 36;
    width = Math.round(Math.max(16, Math.min(26, 36 * aspect)));
  }

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
      className={cn(
        "rounded-md border-[1.5px] transition-all duration-150",
        active
          ? "border-primary bg-primary/25 shadow-xs ring-1 ring-primary/30"
          : "border-muted-foreground/50 bg-muted-foreground/10 group-hover:border-muted-foreground group-hover:bg-muted-foreground/20 shadow-xs",
      )}
    />
  );
}
