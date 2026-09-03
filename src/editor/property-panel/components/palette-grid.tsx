"use client";

import * as React from "react";
import { Check, Pipette } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { ColorPicker } from "@/editor/color-picker";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/tooltip";
import { FeatureLock } from "@/editor/components/feature-lock";
import { FeatureId } from "@/config/features";

export type PaletteGridShape = "rect" | "square" | "circle";
export type PaletteGridSize = "sm" | "default" | "lg";

export interface PaletteGridProps {
  presets: string[];
  selected: string | null;
  onSelect: (color: string) => void;
  customColor: string;
  onCustomColor: (hex: string) => void;
  isCustom: boolean;
  featureId?: FeatureId;
  colorPickerId?: FeatureId;
  size?: PaletteGridSize;
  shape?: PaletteGridShape;
  customLabel?: string;
  showCustom?: boolean;
  disabled?: boolean;
  columnsClassName?: string;
}

export function PaletteGrid({
  presets,
  selected,
  onSelect,
  customColor,
  onCustomColor,
  featureId,
  colorPickerId,
  isCustom,
  size = "default",
  shape = "rect",
  customLabel = "Custom color",
  showCustom = true,
  disabled = false,
  columnsClassName,
}: PaletteGridProps) {
  // Deduplicate and normalize presets
  const uniqueSwatches = React.useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const raw of presets) {
      const normalized =
        raw.startsWith("url(") ||
        raw.startsWith("linear-") ||
        raw.startsWith("radial-")
          ? raw
          : raw.toLowerCase().trim();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        list.push(raw);
      }
    }
    return list;
  }, [presets]);

  const isSwatchSelected = React.useCallback(
    (swatch: string) => {
      if (!selected) return false;
      if (selected === swatch) return true;
      if (
        !swatch.startsWith("url(") &&
        !swatch.startsWith("linear-") &&
        !swatch.startsWith("radial-")
      ) {
        return selected.toLowerCase().trim() === swatch.toLowerCase().trim();
      }
      return false;
    },
    [selected],
  );

  // Fixed tile dimensions based on shape and size
  const tileDimensionClass =
    shape === "circle"
      ? size === "sm"
        ? "size-8"
        : size === "lg"
          ? "size-12"
          : "size-10"
      : shape === "square"
        ? size === "sm"
          ? "size-8"
          : size === "lg"
            ? "size-18"
            : "size-14"
        : size === "sm"
          ? "w-12 h-9"
          : size === "lg"
            ? "w-24 h-18"
            : "w-[76px] h-[57px]";

  // Radius helper for outer button container
  const outerRadiusClass =
    shape === "circle"
      ? "rounded-full"
      : size === "sm"
        ? "rounded-lg"
        : "rounded-xl";

  // Radius helper for inner color fill
  const innerRadiusClass =
    shape === "circle"
      ? "rounded-full"
      : size === "sm"
        ? "rounded-md"
        : "rounded-lg";

  // Dynamic padding based on size and active state
  const getPaddingClass = (isActive: boolean) => {
    if (size === "sm") {
      return isActive ? "p-0.5" : "p-0";
    }
    if (size === "lg") {
      return "p-1.5";
    }
    return "p-1";
  };

  // Checkmark icon size
  const checkIconSizeClass =
    size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-4";

  // Pipette icon size
  const pipetteIconSizeClass =
    size === "sm" ? "size-3" : size === "lg" ? "size-4" : "size-3.5";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center px-1 py-1",
        size === "sm" ? "gap-2" : size === "lg" ? "gap-3" : "gap-2.5",
        disabled && "opacity-50 pointer-events-none select-none",
        columnsClassName,
      )}
    >
      {uniqueSwatches.map((swatch) => {
        const isActive = isSwatchSelected(swatch);
        return (
          <FeatureLock
            featureId={featureId}
            overlay="badge"
            size="sm"
            key={swatch}
          >
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(swatch)}
              className={cn(
                "group relative flex shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden border-2 transition-all duration-200 select-none",
                tileDimensionClass,
                outerRadiusClass,
                getPaddingClass(isActive),
                isActive
                  ? "border-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                  : "border-transparent bg-muted/30 hover:border-foreground/20 hover:shadow-md",
              )}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    suppressHydrationWarning
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={cn(
                      "absolute inset-0 z-20 flex items-center justify-center bg-primary/20 backdrop-blur-[1px]",
                      outerRadiusClass,
                    )}
                  >
                    <Check
                      className={cn(
                        "text-primary-foreground drop-shadow-md stroke-[2.5]",
                        checkIconSizeClass,
                      )}
                    />
                  </motion.span>
                )}
              </AnimatePresence>
              <span
                className={cn(
                  "block size-full ring-1 ring-inset ring-border/50 transition-transform duration-300 group-hover:scale-105",
                  size === "sm" && !isActive
                    ? outerRadiusClass
                    : innerRadiusClass,
                )}
                style={{ background: swatch }}
              />
            </button>
          </FeatureLock>
        );
      })}

      {showCustom && (
        <FeatureLock
          featureId={colorPickerId}
          overlay="badge"
          size="sm"
        >
          <ColorPicker value={selected ?? customColor} onChange={onCustomColor}>
            <Tooltip content={customLabel}>
              <button
                type="button"
                disabled={disabled}
                className={cn(
                  "group relative flex shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden border-2 transition-all duration-200 select-none",
                  tileDimensionClass,
                  outerRadiusClass,
                  getPaddingClass(isCustom),
                  isCustom
                    ? "border-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                    : "border-transparent bg-muted/30 hover:border-foreground/20 hover:shadow-md",
                )}
                aria-label={customLabel}
              >
                <AnimatePresence>
                  {isCustom && (
                    <motion.span
                      suppressHydrationWarning
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className={cn(
                        "absolute inset-0 z-20 flex items-center justify-center bg-primary/20 backdrop-blur-[1px]",
                        outerRadiusClass,
                      )}
                    >
                      <Check
                        className={cn(
                          "text-primary-foreground drop-shadow-md stroke-[2.5]",
                          checkIconSizeClass,
                        )}
                      />
                    </motion.span>
                  )}
                </AnimatePresence>
                <span
                  className={cn(
                    "block size-full",
                    size === "sm" && !isCustom
                      ? outerRadiusClass
                      : innerRadiusClass,
                  )}
                  style={{
                    backgroundColor: isCustom ? customColor : "transparent",
                    backgroundImage: isCustom
                      ? "none"
                      : "conic-gradient(from 180deg at 50% 50%, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa, #f472b6, #f87171)",
                  }}
                />
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-overlay/50 text-foreground transition-opacity group-hover:bg-overlay/40",
                    outerRadiusClass,
                  )}
                >
                  <Pipette className={pipetteIconSizeClass} />
                </span>
              </button>
            </Tooltip>
          </ColorPicker>
        </FeatureLock>
      )}
    </div>
  );
}
