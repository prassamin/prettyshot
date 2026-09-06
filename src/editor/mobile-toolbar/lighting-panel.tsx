"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ban,
  BringToFront,
  Check,
  SendToBack,
  SlidersHorizontal,
} from "lucide-react";

import { useEditorStateField } from "@/editor/lib/engine";
import { useScreenshotStyleTarget } from "../property-panel/hooks/use-screenshot-style-target";
import { EffectSlider } from "../property-panel/components/effect-slider";
import { PaletteGrid } from "../property-panel/components/palette-grid";
import { PositionSlider } from "@/editor/components/position-slider";
import {
  DEFAULT_LIGHT_SOURCE,
  LIGHT_TINT_PRESETS,
} from "../property-panel/sections/backdrop/constants";
import {
  formatPointToAngleToken,
  parseAngleTokenToPoint,
} from "../property-panel/sections/backdrop/utils";
import type { LightSourceConfig } from "../property-panel/sections/backdrop/types";
import { cn } from "@/lib/utils";
import { FeatureLock } from "../components/feature-lock";

interface StudioPreset {
  id: string;
  name: string;
  tag: string;
  direction: string;
  color: string;
  target: "inner" | "outer";
  defaultIntensity: number;
}

const STUDIO_PRESETS: StudioPreset[] = [
  {
    id: "soft_daylight",
    name: "Soft Light",
    tag: "Top Left",
    direction: "0.00-0.00",
    color: "#FFFFFF",
    target: "inner",
    defaultIntensity: 55,
  },
  {
    id: "golden_hour",
    name: "Golden",
    tag: "Sunset",
    direction: "0.00-4.00",
    color: "#FBBF24",
    target: "inner",
    defaultIntensity: 65,
  },
  {
    id: "studio_key",
    name: "Studio",
    tag: "Center",
    direction: "center",
    color: "#FFFFFF",
    target: "inner",
    defaultIntensity: 50,
  },
  {
    id: "backdrop_halo",
    name: "Halo Glow",
    tag: "Backdrop",
    direction: "center",
    color: "#E0F2FE",
    target: "outer",
    defaultIntensity: 65,
  },
  {
    id: "sunset_flare",
    name: "Amber",
    tag: "Warm Glow",
    direction: "4.00-0.00",
    color: "#FB923C",
    target: "inner",
    defaultIntensity: 70,
  },
  {
    id: "cyber_neon",
    name: "Cyber",
    tag: "Electric",
    direction: "2.00-4.00",
    color: "#38BDF8",
    target: "inner",
    defaultIntensity: 60,
  },
  {
    id: "twilight",
    name: "Twilight",
    tag: "Violet",
    direction: "0.00-2.00",
    color: "#C084FC",
    target: "outer",
    defaultIntensity: 60,
  },
  {
    id: "spotlight",
    name: "Top Key",
    tag: "Dramatic",
    direction: "0.00-2.00",
    color: "#F8FAFC",
    target: "inner",
    defaultIntensity: 80,
  },
];

function LightPresetPreview({
  direction,
  color,
  target,
}: {
  direction: string;
  color: string;
  target: "inner" | "outer";
}) {
  const point = React.useMemo(
    () => parseAngleTokenToPoint(direction),
    [direction],
  );
  const glowX = point.xPct;
  const glowY = point.yPct;

  return (
    <div className="relative size-full overflow-hidden bg-card flex items-center justify-center select-none">
      {target === "outer" && (
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${color}90 0%, ${color}35 45%, transparent 75%)`,
          }}
        />
      )}

      <div
        className={cn(
          "relative flex h-7.5 w-11 items-center justify-center rounded-sm border transition-all",
          target === "inner"
            ? "border-foreground/30"
            : "border-border/60 bg-surface-tertiary shadow-xs",
        )}
        style={
          target === "inner"
            ? {
                background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${color}CC 0%, ${color}40 50%, var(--color-surface) 95%)`,
                boxShadow: `0 0 8px ${color}33`,
              }
            : undefined
        }
      >
        <div className="size-2 rounded-2xs border border-foreground/20 bg-foreground/10" />
      </div>
    </div>
  );
}

export function MobileLightingPanel() {
  const backdropState = useEditorStateField((canvas) => canvas.backdrop);
  const { applyStyle, selectedSlot } = useScreenshotStyleTarget();

  const { lighting } = backdropState;
  const currentLighting = selectedSlot?.lighting ?? lighting;

  const handleApplyLighting = React.useCallback(
    (nextLighting: LightSourceConfig) => applyStyle({ lighting: nextLighting }),
    [applyStyle],
  );

  const handlePatchLighting = React.useCallback(
    (patch: Partial<LightSourceConfig>) => {
      const updated = { ...currentLighting, ...patch };
      if (
        updated.intensity === 0 &&
        (patch.direction !== undefined ||
          patch.target !== undefined ||
          patch.color !== undefined)
      ) {
        updated.intensity = 50;
      }
      handleApplyLighting(updated);
    },
    [currentLighting, handleApplyLighting],
  );

  const isOff = currentLighting.intensity === 0;

  const initialPreset = React.useMemo(() => {
    if (currentLighting.intensity === 0) return "none";
    const found = STUDIO_PRESETS.find(
      (p) =>
        p.direction === currentLighting.direction &&
        p.color.toLowerCase() === currentLighting.color.toLowerCase(),
    );
    return found ? found.id : "custom";
  }, []);

  const [activePresetId, setActivePresetId] =
    React.useState<string>(initialPreset);

  const currentActiveId = isOff ? "none" : activePresetId;

  const lightPresets = React.useMemo(
    () => LIGHT_TINT_PRESETS.map((p) => p.hex),
    [],
  );

  const isCustomColor = !LIGHT_TINT_PRESETS.some(
    (preset) =>
      preset.hex.trim().toLowerCase() ===
      (currentLighting.color || "#FFFFFF").trim().toLowerCase(),
  );

  const activePoint = React.useMemo(
    () => parseAngleTokenToPoint(currentLighting.direction),
    [currentLighting.direction],
  );

  return (
    <div className="flex w-full flex-col gap-3 px-1 pt-1 pb-6 select-none text-foreground">
      {/* Studio Lighting Presets Horizontal Rail */}
      <div className="flex w-full items-center gap-3.5 overflow-x-auto pt-4 pb-2.5 px-0.5 -my-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* 1st Card: None / Off */}
        <button
          type="button"
          aria-pressed={isOff}
          onClick={() => {
            setActivePresetId("none");
            handleApplyLighting(DEFAULT_LIGHT_SOURCE);
          }}
          className="group flex min-w-16 w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5 outline-none transition-transform active:scale-95"
        >
          <div className="relative flex size-14 items-center justify-center">
            <div
              className={cn(
                "relative flex size-14 items-center justify-center overflow-hidden rounded-xl border bg-card transition-all duration-200 shadow-xs",
                isOff
                  ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                  : "border-border/70 hover:border-border hover:scale-102",
              )}
            >
              <Ban className="size-5 opacity-60 transition-transform group-hover:scale-110" />
              {isOff && (
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[0.5px] flex items-center justify-center">
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                    <Check className="size-3 stroke-3" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col items-center text-center">
            <span
              className={cn(
                "w-full truncate text-[11.5px] font-semibold leading-tight transition-colors duration-150",
                isOff
                  ? "text-primary font-bold"
                  : "text-foreground group-hover:text-foreground",
              )}
            >
              Off
            </span>
            <span className="w-full truncate text-[9px] font-medium leading-tight mt-0.5 text-muted-foreground/75">
              No Light
            </span>
          </div>
        </button>

        {/* 2nd Card: Custom (Full Studio Editor) */}
        <FeatureLock featureId="backdrop.lighting" overlay="badge" size="sm">
          <button
            type="button"
            aria-pressed={currentActiveId === "custom"}
            onClick={() => {
              setActivePresetId("custom");
              if (isOff) {
                handleApplyLighting({
                  ...DEFAULT_LIGHT_SOURCE,
                  intensity: 55,
                  direction: "0.00-0.00",
                  color: "#FFFFFF",
                  target: "inner",
                });
              }
            }}
            className="group flex min-w-16 w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5 outline-none transition-transform active:scale-95"
          >
            <div className="relative flex size-14 items-center justify-center">
              <div
                className={cn(
                  "relative flex size-14 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-card transition-all duration-200 shadow-xs",
                  currentActiveId === "custom"
                    ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                    : "border-border/70 hover:border-border hover:scale-102",
                )}
              >
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    background: `radial-gradient(circle at ${activePoint.xPct}% ${activePoint.yPct}%, ${currentLighting.color || "#FFFFFF"}88 0%, transparent 70%)`,
                  }}
                />
                <SlidersHorizontal className="size-5 text-foreground/80 transition-transform group-hover:scale-110" />
                {currentActiveId === "custom" && (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-[0.5px] flex items-center justify-center">
                    <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                      <Check className="size-3 stroke-3" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col items-center text-center">
              <span
                className={cn(
                  "w-full truncate text-[11.5px] font-semibold leading-tight transition-colors duration-150",
                  currentActiveId === "custom"
                    ? "text-primary font-bold"
                    : "text-foreground group-hover:text-foreground",
                )}
              >
                Custom
              </span>
              <span className="w-full truncate text-[9px] font-medium leading-tight mt-0.5 text-muted-foreground/75">
                Full Studio
              </span>
            </div>
          </button>
        </FeatureLock>

        {/* 3rd+ Cards: Locked Curated Studio Presets */}
        {STUDIO_PRESETS.map((preset) => {
          const isSelected = currentActiveId === preset.id;
          return (
            <FeatureLock
              featureId="backdrop.lighting"
              key={preset.id}
              overlay="badge"
              size="sm"
            >
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setActivePresetId(preset.id);
                  handleApplyLighting({
                    direction: preset.direction,
                    color: preset.color,
                    target: preset.target,
                    intensity:
                      currentLighting.intensity > 0
                        ? currentLighting.intensity
                        : preset.defaultIntensity,
                  });
                }}
                className="group flex min-w-16 w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5 outline-none transition-transform active:scale-95"
              >
                <div className="relative flex size-14 items-center justify-center">
                  <div
                    className={cn(
                      "relative size-14 overflow-hidden rounded-xl border transition-all duration-200 shadow-xs",
                      isSelected
                        ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                        : "border-border/70 hover:border-border hover:scale-102",
                    )}
                  >
                    <LightPresetPreview
                      direction={preset.direction}
                      color={preset.color}
                      target={preset.target}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[0.5px] flex items-center justify-center">
                        <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                          <Check className="size-3 stroke-3" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex w-full flex-col items-center text-center">
                  <span
                    className={cn(
                      "w-full truncate text-[11.5px] font-semibold leading-tight transition-colors duration-150",
                      isSelected
                        ? "text-primary font-bold"
                        : "text-foreground group-hover:text-foreground",
                    )}
                  >
                    {preset.name}
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

      {/* Adjustments Section */}
      <AnimatePresence initial={false}>
        {!isOff && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden space-y-3.5 pt-2 border-t border-border/50"
          >
            {/* Illumination Target Switcher (Available on all active presets) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                Illumination Target
              </span>

              <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-foreground/4 p-1 ring-1 ring-border/50">
                <button
                  type="button"
                  onClick={() => handlePatchLighting({ target: "inner" })}
                  className={cn(
                    "relative flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-[11px] font-medium transition-colors",
                    currentLighting.target === "inner"
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {currentLighting.target === "inner" && (
                    <motion.span
                      layoutId="light-mobile-target-pill"
                      className="absolute inset-0 rounded-lg bg-background shadow-xs ring-1 ring-border/60"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <BringToFront className="size-3.5" />
                    <span>On Screenshot</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePatchLighting({ target: "outer" })}
                  className={cn(
                    "relative flex h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-[11px] font-medium transition-colors",
                    currentLighting.target === "outer"
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {currentLighting.target === "outer" && (
                    <motion.span
                      layoutId="light-mobile-target-pill"
                      className="absolute inset-0 rounded-lg bg-background shadow-xs ring-1 ring-border/60"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <SendToBack className="size-3.5" />
                    <span>Behind (Backdrop)</span>
                  </span>
                </button>
              </div>
            </div>

            {/* If CUSTOM is active: show 2D position pad and full color picker */}
            {currentActiveId === "custom" && (
              <>
                {/* 2D Light Direction Pad */}
                <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
                  <PositionSlider
                    ariaLabel="Light direction pad"
                    value={activePoint}
                    className="h-28 border-0 shadow-none bg-card"
                    onPreview={(point) => {
                      handlePatchLighting({
                        direction: formatPointToAngleToken(point),
                      });
                    }}
                    onChange={(point) => {
                      handlePatchLighting({
                        direction: formatPointToAngleToken(point),
                      });
                    }}
                  />
                </div>

                {/* Color Palette & Custom Picker with PaletteGrid */}
                <div className="space-y-1.5 pt-1">
                  <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                    Light Color
                  </span>
                  <PaletteGrid
                    presets={lightPresets}
                    selected={isCustomColor ? null : currentLighting.color}
                    onSelect={(hex) => handlePatchLighting({ color: hex })}
                    customColor={currentLighting.color || "#FFFFFF"}
                    onCustomColor={(hex) => handlePatchLighting({ color: hex })}
                    isCustom={isCustomColor}
                    customLabel="Custom light color"
                    size="sm"
                    shape="square"
                    columnsClassName="grid-cols-7 gap-1.5"
                  />
                </div>
              </>
            )}

            {/* Intensity Slider (Available on all presets) */}
            <div className="pt-1">
              <EffectSlider
                label="Light Intensity"
                value={currentLighting.intensity}
                onChange={(intensity) => handlePatchLighting({ intensity })}
                suffix="%"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
