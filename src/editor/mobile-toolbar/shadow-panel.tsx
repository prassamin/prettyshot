"use client";

import * as React from "react";
import { Ban, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useEditorStateField } from "@/editor/lib/engine";
import { useScreenshotStyleTarget } from "../property-panel/hooks/use-screenshot-style-target";
import { EffectSlider } from "../property-panel/components/effect-slider";
import { PaletteGrid } from "../property-panel/components/palette-grid";
import {
  PositionSlider,
  type PositionSliderPoint,
} from "@/editor/components/position-slider";
import { previewHosts, writeToken } from "@/editor/lib/preview-tokens";
import {
  SHADOW_COLOR_PRESETS,
  SHADOW_FILTER_PREVIEW_VAR,
  SHADOW_PREVIEW_VAR,
} from "../property-panel/sections/shadow/constants";
import type {
  Shadow,
  ShadowType,
} from "../property-panel/sections/shadow/types";
import {
  formatLightCoordinate,
  parseLightCoordinate,
  shadowCss,
  shadowDropFilterCss,
} from "../property-panel/sections/shadow/utils";
import { cn } from "@/lib/utils";
import { FeatureLock } from "../components/feature-lock";

interface ShadowPreset {
  id: ShadowType;
  label: string;
  tag: string;
}

const SHADOW_STYLE_PRESETS: ShadowPreset[] = [
  { id: "none", label: "Off", tag: "No Shadow" },
  { id: "drop", label: "Drop", tag: "Natural" },
  { id: "soft", label: "Soft", tag: "Diffused" },
  { id: "hard", label: "Hard", tag: "Brutalist" },
  { id: "glow", label: "Glow", tag: "Ambient" },
  { id: "float", label: "Float", tag: "Elevated" },
  { id: "linear", label: "Linear", tag: "Layered" },
];

function ShadowPresetPreview({ type }: { type: ShadowType }) {
  if (type === "none") {
    return (
      <div className="relative size-full overflow-hidden bg-card flex items-center justify-center select-none">
        <Ban className="size-5 text-muted-foreground/60 transition-transform group-hover:scale-110" />
      </div>
    );
  }

  const getShadowStyle = () => {
    switch (type) {
      case "drop":
        return "shadow-[4px_4px_10px_0px_rgba(255,255,255,0.4),2px_2px_4px_0px_rgba(255,255,255,0.25)]";
      case "soft":
        return "shadow-[0_8px_18px_2px_rgba(255,255,255,0.32),0_2px_6px_0px_rgba(255,255,255,0.18)]";
      case "hard":
        return "shadow-[4px_4px_0px_0px_rgba(255,255,255,0.85)]";
      case "glow":
        return "shadow-[0_0_14px_3px_rgba(255,255,255,0.5),0_0_4px_1px_rgba(255,255,255,0.7)]";
      case "float":
        return "-translate-y-1 shadow-[0_3px_6px_0px_rgba(255,255,255,0.25),0_12px_22px_0px_rgba(255,255,255,0.28)]";
      case "linear":
      default:
        return "shadow-[0_2px_4px_rgba(255,255,255,0.25),0_6px_10px_rgba(255,255,255,0.18),0_12px_18px_rgba(255,255,255,0.12)]";
    }
  };

  return (
    <div className="relative size-full overflow-hidden bg-card flex items-center justify-center select-none">
      {/* Ambient dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-foreground)_1px,transparent_1px)] opacity-5 bg-size-[6px_6px]" />

      {/* Mini Window with Projected Shadow */}
      <div
        className={cn(
          "relative flex h-7.5 w-11 flex-col overflow-hidden rounded-sm border border-border/80 bg-surface-tertiary transition-all duration-200",
          getShadowStyle(),
        )}
      >
        {/* Title bar */}
        <div className="flex h-2 w-full items-center gap-0.5 border-b border-border/60 bg-surface-secondary px-1">
          <span className="size-1 rounded-full bg-danger/80" />
          <span className="size-1 rounded-full bg-warning/80" />
          <span className="size-1 rounded-full bg-success/80" />
        </div>
        {/* Body content */}
        <div className="flex flex-1 flex-col justify-center gap-0.5 p-1 bg-surface-tertiary">
          <div className="h-0.5 w-4 rounded-full bg-foreground/25" />
          <div className="h-0.5 w-6.5 rounded-full bg-foreground/15" />
        </div>
      </div>
    </div>
  );
}

export function MobileShadowPanel() {
  const canvasShadow = useEditorStateField((state) => state.shadow);
  const { applyStyle, selectedSlot, target } = useScreenshotStyleTarget();

  const activeShadow: Shadow = selectedSlot
    ? (selectedSlot.shadow ?? canvasShadow)
    : canvasShadow;

  const { type, intensity, lightSource, color = "#050505" } = activeShadow;

  const resolvePreviewScopeElements = React.useCallback((): HTMLElement[] => {
    const rootHosts = previewHosts();
    if (target === "all") return rootHosts;

    const scopeId = target === "slot" ? selectedSlot?.id : "canvas";
    if (!scopeId) return rootHosts;

    return rootHosts.map(
      (root) =>
        root.querySelector<HTMLElement>(
          `[data-editor-shadow-preview-scope="${CSS.escape(scopeId)}"]`,
        ) ?? root,
    );
  }, [selectedSlot?.id, target]);

  const setShadowLiveToken = React.useCallback(
    (tokenName: string, value: string | null) => {
      writeToken(resolvePreviewScopeElements(), tokenName, value);
    },
    [resolvePreviewScopeElements],
  );

  const clearLiveTokensAfterPaint = React.useCallback(() => {
    if (typeof requestAnimationFrame === "undefined") return;
    requestAnimationFrame(() => {
      setShadowLiveToken(SHADOW_PREVIEW_VAR, null);
      setShadowLiveToken(SHADOW_FILTER_PREVIEW_VAR, null);
    });
  }, [setShadowLiveToken]);

  const handlePreviewShadow = React.useCallback(
    (nextShadow: Shadow) => {
      setShadowLiveToken(SHADOW_PREVIEW_VAR, shadowCss(nextShadow) ?? null);
      setShadowLiveToken(
        SHADOW_FILTER_PREVIEW_VAR,
        shadowDropFilterCss(nextShadow) ?? null,
      );
    },
    [setShadowLiveToken],
  );

  const handleCommitShadow = React.useCallback(
    (nextShadow: Shadow) => {
      applyStyle({ shadow: nextShadow });
      clearLiveTokensAfterPaint();
    },
    [applyStyle, clearLiveTokensAfterPaint],
  );

  const isShadowEnabled = type !== "none";
  const isDirectionalEnabled =
    isShadowEnabled && type !== "glow" && type !== "float";

  const isCustomColor = !SHADOW_COLOR_PRESETS.some(
    (preset) => preset.toLowerCase() === color.toLowerCase(),
  );

  const handleTypeChange = React.useCallback(
    (nextType: ShadowType) => {
      if (nextType === "hard") {
        handleCommitShadow({
          ...activeShadow,
          type: nextType,
          intensity: 100,
          lightSource: "2-0",
        });
        return;
      }
      handleCommitShadow({ ...activeShadow, type: nextType });
    },
    [activeShadow, handleCommitShadow],
  );

  const coord = parseLightCoordinate(lightSource);
  const activePoint: PositionSliderPoint = React.useMemo(
    () => ({
      xPct: (coord.col / 4) * 100,
      yPct: (coord.row / 4) * 100,
    }),
    [coord.col, coord.row],
  );

  const pointToToken = React.useCallback(
    (point: PositionSliderPoint): string => {
      const col = (point.xPct / 100) * 4;
      const row = (point.yPct / 100) * 4;
      return formatLightCoordinate(row, col);
    },
    [],
  );

  const shadowPaletteList = React.useMemo(
    () => Array.from(SHADOW_COLOR_PRESETS),
    [],
  );

  return (
    <div className="flex w-full flex-col gap-3.5 px-1 pt-1 pb-6 select-none text-foreground">
      {/* Shadow Style Rail */}
      <div className="flex w-full items-center gap-3.5 overflow-x-auto py-2.5 px-2 -my-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SHADOW_STYLE_PRESETS.map((preset) => {
          const isSelected = type === preset.id;
          return (
            <FeatureLock
              key={preset.id}
              featureId={preset.id === "none" ? undefined : "shadow"}
              overlay={"badge"}
              size="sm"
              className="w-max"
            >
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleTypeChange(preset.id)}
                className="group flex min-w-16 w-16 shrink-0 cursor-pointer flex-col items-center gap-1.5 outline-none transition-transform active:scale-95"
              >
                <div className="relative flex size-14 items-center justify-center">
                  <div
                    className={cn(
                      "relative flex size-14 items-center justify-center overflow-hidden rounded-xl border bg-card transition-all duration-200 shadow-xs",
                      isSelected
                        ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                        : "border-border/70 hover:border-border hover:scale-102",
                    )}
                  >
                    <ShadowPresetPreview type={preset.id} />
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

      {/* Adjustments Section (Shown only when shadow is active) */}
      <AnimatePresence initial={false}>
        {isShadowEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden space-y-3.5 pt-2 border-t border-border/50"
          >
            {/* Intensity Slider */}
            <EffectSlider
              label="Shadow Intensity"
              value={intensity}
              onChange={(next) =>
                handleCommitShadow({ ...activeShadow, intensity: next })
              }
              onPreview={(next) =>
                handlePreviewShadow({ ...activeShadow, intensity: next })
              }
              min={0}
              max={100}
              step={1}
              suffix="%"
            />

            {/* 2D Direction Pad (For directional shadows) */}
            {isDirectionalEnabled && (
              <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs">
                <PositionSlider
                  ariaLabel="Shadow direction pad"
                  value={activePoint}
                  className="h-28 border-0 shadow-none bg-card"
                  onPreview={(point) => {
                    handlePreviewShadow({
                      ...activeShadow,
                      lightSource: pointToToken(point),
                    });
                  }}
                  onChange={(point) => {
                    handleCommitShadow({
                      ...activeShadow,
                      lightSource: pointToToken(point),
                    });
                  }}
                />
              </div>
            )}

            {/* Shadow Tint Color Palette */}
            <div className="space-y-1.5 pt-1">
              <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                Shadow Tint
              </span>
              <PaletteGrid
                presets={shadowPaletteList}
                selected={isCustomColor ? null : color}
                onSelect={(hex) =>
                  handleCommitShadow({ ...activeShadow, color: hex })
                }
                customColor={isCustomColor ? color : SHADOW_COLOR_PRESETS[0]}
                onCustomColor={(hex) =>
                  handleCommitShadow({ ...activeShadow, color: hex })
                }
                isCustom={isCustomColor}
                size="sm"
                shape="square"
                columnsClassName="grid-cols-7 gap-1.5"
                customLabel="Custom shadow tint"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
