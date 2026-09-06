"use client";

import * as React from "react";

import {
  PositionSlider,
  type PositionSliderPoint,
} from "@/editor/components/position-slider";
import { cn } from "@/lib/utils";

import { EffectSlider } from "../../components/effect-slider";
import { PaletteGrid } from "../../components/palette-grid";
import { LIGHT_TINT_PRESETS } from "./constants";
import { parseAngleTokenToPoint, formatPointToAngleToken } from "./utils";
import type { LightSourceConfig } from "./types";
import { AlignOptions } from "@/editor/lib/alignment";
import { Tooltip } from "@/components/tooltip";

interface LightingControlProps {
  activeLighting: LightSourceConfig;
  setLighting: (patch: Partial<LightSourceConfig>) => void;
  outerDisabled?: boolean;
}

export function LightingControl({
  activeLighting,
  setLighting,
  outerDisabled = false,
}: LightingControlProps) {
  const lightPresets = React.useMemo(
    () => LIGHT_TINT_PRESETS.map((p) => p.hex),
    [],
  );

  const isCustomColor = !LIGHT_TINT_PRESETS.some(
    (preset) =>
      preset.hex.trim().toLowerCase() ===
      activeLighting.color.trim().toLowerCase(),
  );

  const activePoint = React.useMemo(
    () => parseAngleTokenToPoint(activeLighting.direction),
    [activeLighting.direction],
  );

  const handleAlign = React.useCallback(
    (xTarget: number | null, yTarget: number | null) => {
      const nextPoint: PositionSliderPoint = {
        xPct: xTarget !== null ? xTarget : activePoint.xPct,
        yPct: yTarget !== null ? yTarget : activePoint.yPct,
      };
      setLighting({ direction: formatPointToAngleToken(nextPoint) });
    },
    [activePoint, setLighting],
  );

  const glowColor = activeLighting.color || "#FFFFFF";
  const glowX = activePoint.xPct;
  const glowY = activePoint.yPct;

  return (
      <div className="space-y-4">
        {/* 2D Position Manipulator & Align Bar */}
        <div className="space-y-1.5">
          {/* Quick Position Toolbar */}
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-surface-secondary/60 p-0.5 shadow-2xs">
            {AlignOptions.map(({ label, to, icon: Icon }, idx) => {
              return (
                <React.Fragment key={label}>
                <Tooltip noDelay content={label}>
                    <button
                      type="button"
                      onClick={() => handleAlign(to.xPct, to.yPct)}
                      className="flex size-6.5 cursor-pointer items-center justify-center rounded text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-2xs"
                    >
                      <Icon className="size-3.5" />
                    </button>
                </Tooltip>
                  {idx === 2 && (
                    <span className="mx-0.5 h-3.5 w-px bg-border/60" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
  
          {/* 2D Light Direction Pad */}
          <div className="overflow-hidden rounded-xl border border-border/50 bg-surface-secondary shadow-xs ring-1 ring-border/40">
            <PositionSlider
              ariaLabel="Light direction pad"
              value={activePoint}
              className="h-28 border-0 shadow-none bg-surface-secondary"
              onPreview={(point) => {
                setLighting({ direction: formatPointToAngleToken(point) });
              }}
              onChange={(point) => {
                setLighting({ direction: formatPointToAngleToken(point) });
              }}
            />
          </div>
        </div>
  
        {/* Target Plane Selection Cards */}
        <div className="space-y-1.5">
          <span className="block text-[10.5px] font-medium text-muted-foreground">
            Illumination Target
          </span>
          <div className="grid grid-cols-2 gap-2">
            {/* Inner (Screenshot Surface) */}
            <button
              type="button"
              onClick={() => setLighting({ target: "inner" })}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-xl border p-2 text-center transition-all select-none cursor-pointer",
                activeLighting.target === "inner"
                  ? "border-primary bg-primary/6 ring-2 ring-primary/40 shadow-sm"
                  : "border-border/60 bg-foreground/2 hover:border-border/80 hover:bg-foreground/4 hover:scale-[1.01]",
              )}
            >
              <div className="relative h-13 w-full overflow-hidden rounded-lg border border-border/50 bg-surface-secondary flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--foreground)_4%,transparent)_1px,transparent_1px)] bg-size-[6px_6px]"
                />
  
                <div
                  className="relative z-10 flex h-8.5 w-14 items-center justify-center rounded-md border border-foreground/20 transition-all"
                  style={{
                    background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${glowColor}90 0%, ${glowColor}30 50%, var(--surface-secondary) 95%)`,
                    boxShadow:
                      activeLighting.target === "inner"
                        ? `0 0 14px ${glowColor}40, inset 0 0 6px color-mix(in oklab, var(--foreground) 30%, transparent)`
                        : "0 2px 5px color-mix(in oklab, var(--overlay) 50%, transparent)",
                  }}
                >
                  <div className="size-3.5 rounded-xs border border-foreground/25 bg-foreground/10" />
                </div>
              </div>
  
              <div className="flex flex-col items-center leading-tight">
                <span className="text-[11px] font-semibold text-foreground tracking-tight">
                  Screenshot
                </span>
                <span className="text-[8.5px] text-muted-foreground">
                  Foreground
                </span>
              </div>
  
              {activeLighting.target === "inner" && (
                <span className="pointer-events-none absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                  <span className="size-1.5 rounded-full bg-primary-foreground" />
                </span>
              )}
            </button>
  
            {/* Outer (Backdrop Plane) */}
            <button
              type="button"
              onClick={() => setLighting({ target: "outer" })}
              disabled={outerDisabled}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-xl border p-2 text-center transition-all select-none cursor-pointer",
                activeLighting.target === "outer"
                  ? "border-primary bg-primary/6 ring-2 ring-primary/40 shadow-sm"
                  : "border-border/60 bg-foreground/2 hover:border-border/80 hover:bg-foreground/4 hover:scale-[1.01]",
                outerDisabled &&
                  "cursor-not-allowed opacity-40 hover:border-border/60 hover:bg-foreground/2 hover:scale-100",
              )}
            >
              <div className="relative h-13 w-full overflow-hidden rounded-lg border border-border/50 bg-surface-secondary flex items-center justify-center">
                <div
                  className="absolute inset-0 transition-all"
                  style={{
                    background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${glowColor}90 0%, ${glowColor}35 40%, ${glowColor}10 70%, transparent 95%)`,
                  }}
                />
  
                <div className="relative z-10 flex h-8.5 w-14 items-center justify-center rounded-md border border-foreground/20 bg-surface-secondary/90 shadow-md backdrop-blur-xs">
                  <div className="size-3.5 rounded-xs border border-foreground/25 bg-foreground/10" />
                </div>
              </div>
  
              <div className="flex flex-col items-center leading-tight">
                <span className="text-[11px] font-semibold text-foreground tracking-tight">
                  Backdrop
                </span>
                <span className="text-[8.5px] text-muted-foreground">
                  Background
                </span>
              </div>
  
              {activeLighting.target === "outer" && (
                <span className="pointer-events-none absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                  <span className="size-1.5 rounded-full bg-primary-foreground" />
                </span>
              )}
            </button>
          </div>
        </div>
  
        {/* Intensity Slider */}
        <EffectSlider
          label="Intensity"
          value={activeLighting.intensity}
          onChange={(intensity) => setLighting({ intensity })}
          suffix="%"
        />
  
        {/* Color Palette & Custom Picker with PaletteGrid */}
        <div className="space-y-1.5 pt-1.5">
          <span className="block text-[10.5px] font-medium text-muted-foreground">
            Light Color
          </span>
          <PaletteGrid
            presets={lightPresets}
            selected={isCustomColor ? null : activeLighting.color}
            onSelect={(hex) => setLighting({ color: hex })}
            customColor={activeLighting.color || "#FFFFFF"}
            onCustomColor={(hex) => setLighting({ color: hex })}
            isCustom={isCustomColor}
            customLabel="Custom light color"
            size="sm"
            shape="square"
            columnsClassName="grid-cols-7 gap-1.5"
          />
        </div>
      </div>
  );
}
