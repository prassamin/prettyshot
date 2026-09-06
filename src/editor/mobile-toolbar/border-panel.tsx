"use client";

import * as React from "react";
import { Ban, Check, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useEditorStateField } from "@/editor/lib/engine";
import { editorValueSchemas } from "@/editor/lib/value-schemas";
import { EDITOR_LIMITS } from "@/editor/lib/limits";
import { EffectSlider } from "../property-panel/components/effect-slider";
import { PaletteGrid } from "../property-panel/components/palette-grid";
import { useScreenshotStyleTarget } from "../property-panel/hooks/use-screenshot-style-target";
import { BORDER_COLOR_PRESETS } from "../property-panel/sections/border/constants";
import { deriveDynamicPalette } from "../property-panel/sections/border/utils";
import type { BorderStyle } from "../property-panel/sections/border/types";
import { cn } from "@/lib/utils";

interface BorderPreset {
  id: BorderStyle;
  label: string;
  tag: string;
}

const BORDER_STYLE_PRESETS: BorderPreset[] = [
  { id: "none", label: "Off", tag: "No Border" },
  { id: "solid", label: "Solid", tag: "Clean" },
  { id: "dashed", label: "Dashed", tag: "Outline" },
  { id: "dotted", label: "Dotted", tag: "Stipple" },
  { id: "double", label: "Double", tag: "Framed" },
  { id: "groove", label: "Groove", tag: "Carved" },
  { id: "ridge", label: "Ridge", tag: "Beveled" },
];

function BorderPresetPreview({ style }: { style: BorderStyle }) {
  if (style === "none") {
    return (
      <div className="relative size-full overflow-hidden bg-card flex items-center justify-center select-none">
        <Ban className="size-5 text-muted-foreground/60 transition-transform group-hover:scale-110" />
      </div>
    );
  }

  const getBorderClass = () => {
    switch (style) {
      case "dashed":
        return "border-[2px] border-dashed border-muted-foreground/65";
      case "dotted":
        return "border-[2px] border-dotted border-muted-foreground/65";
      case "double":
        return "border-[3.5px] border-double border-muted-foreground/65";
      case "groove":
        return "border-[3px] border-groove border-muted-foreground/55";
      case "ridge":
        return "border-[3px] border-ridge border-muted-foreground/55";
      case "solid":
      default:
        return "border-[2px] border-solid border-muted-foreground/65";
    }
  };

  return (
    <div className="relative size-full overflow-hidden bg-card flex items-center justify-center select-none">
      {/* Subtle ambient grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-foreground)_1px,transparent_1px)] opacity-5 bg-size-[6px_6px]" />

      {/* Mini Screenshot Window with Styled Border */}
      <div
        className={cn(
          "relative flex h-7.5 w-11 items-center justify-center rounded-sm bg-surface-tertiary shadow-md transition-all",
          getBorderClass(),
        )}
      >
        <div className="size-2 rounded-2xs bg-muted-foreground/30" />
      </div>
    </div>
  );
}

export function MobileBorderPanel() {
  const canvasBorder = useEditorStateField((c) => c.border);
  let borderRadius = useEditorStateField((c) => c.borderRadius);
  const canvasFrame = useEditorStateField((c) => c.deviceFrame);
  const background = useEditorStateField((c) => c.background);
  const canvasScreenshot = useEditorStateField((c) => c.screenshot);

  const { applyStyle, selectedSlot } = useScreenshotStyleTarget();

  const border = selectedSlot?.border ?? canvasBorder;
  borderRadius = selectedSlot?.borderRadius ?? borderRadius;
  const frame = selectedSlot?.deviceFrame ?? canvasFrame;
  const screenshot = selectedSlot?.src ?? canvasScreenshot;

  const isFrameActive = Boolean(frame && frame.id !== "none");

  const [swatchPresets, setSwatchPresets] = React.useState<string[]>([]);

  React.useEffect(() => {
    let isSubscribed = true;
    deriveDynamicPalette(
      background.type,
      background.value,
      background.thumbUrl,
      screenshot,
    ).then((palette) => {
      if (isSubscribed) setSwatchPresets(palette);
    });
    return () => {
      isSubscribed = false;
    };
  }, [background.thumbUrl, background.type, background.value, screenshot]);

  const handleApplyBorder = React.useCallback(
    (nextBorder: typeof border) => {
      if (isFrameActive) return;
      applyStyle({
        border: {
          ...nextBorder,
          width: editorValueSchemas.borderWidth
            .catch(0)
            .parse(nextBorder.width),
          padding: editorValueSchemas.borderInnerPadding
            .catch(0)
            .parse(nextBorder.padding),
        },
      });
    },
    [applyStyle, isFrameActive],
  );

  const handleApplyBorderRadius = React.useCallback(
    (nextRadius: number) => {
      if (isFrameActive) return;
      applyStyle({
        borderRadius: editorValueSchemas.borderRadius
          .catch(0)
          .parse(nextRadius),
      });
    },
    [applyStyle, isFrameActive],
  );

  const handleChangeStyle = React.useCallback(
    (nextStyle: BorderStyle) => {
      if (isFrameActive) return;
      if (nextStyle === "none") {
        handleApplyBorder({
          ...border,
          style: "none",
          width: 0,
        });
      } else {
        handleApplyBorder({
          ...border,
          style: nextStyle,
          width: border.width === 0 ? 2 : border.width,
          color: border.color || "#ffffff",
        });
      }
    },
    [border, handleApplyBorder, isFrameActive],
  );

  const effectiveStyle: BorderStyle =
    border.width === 0 || border.style === "none"
      ? "none"
      : border.style || "solid";

  const isBorderActive = effectiveStyle !== "none";
  const activeColor = border.color || BORDER_COLOR_PRESETS[0];

  const isCustomColor =
    isBorderActive &&
    !swatchPresets.some((c) => c.toLowerCase() === activeColor.toLowerCase());

  return (
    <div className="flex w-full flex-col gap-3.5 px-1 pt-1 pb-6 select-none text-foreground">
      {/* Frame Active Notice */}
      {isFrameActive && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-[11px] leading-snug text-amber-600 dark:text-amber-400">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>Borders cannot be applied to device or browser frames.</span>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-3.5 transition-opacity duration-200",
          isFrameActive && "opacity-40 pointer-events-none select-none",
        )}
      >
        {/* Style Selector Rail */}
        <div className="flex w-full items-center gap-3.5 overflow-x-auto py-2.5 px-2 -my-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {BORDER_STYLE_PRESETS.map((preset) => {
            const isSelected = effectiveStyle === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleChangeStyle(preset.id)}
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
                    <BorderPresetPreview style={preset.id} />
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
            );
          })}
        </div>

        {/* Corner Radius (Always available for rounding screenshot corners) */}
        <div className="pt-1 border-t border-border/50">
          <EffectSlider
            label="Corner Radius"
            value={borderRadius}
            onChange={handleApplyBorderRadius}
            disabled={isFrameActive}
            min={EDITOR_LIMITS.borderRadius.min}
            max={EDITOR_LIMITS.borderRadius.max}
            step={EDITOR_LIMITS.borderRadius.step}
            suffix={EDITOR_LIMITS.borderRadius.suffix}
          />
        </div>

        {/* Adjustments Section (Shown only when a border style is active) */}
        <AnimatePresence initial={false}>
          {isBorderActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden space-y-3"
            >
              <EffectSlider
                label="Border Width"
                value={border.width}
                onChange={(width) => handleApplyBorder({ ...border, width })}
                disabled={isFrameActive}
                min={EDITOR_LIMITS.borderWidth.min}
                max={EDITOR_LIMITS.borderWidth.max}
                step={EDITOR_LIMITS.borderWidth.step}
                suffix={EDITOR_LIMITS.borderWidth.suffix}
              />

              <EffectSlider
                label="Inner Padding"
                value={border.padding}
                onChange={(padding) =>
                  handleApplyBorder({ ...border, padding })
                }
                disabled={isFrameActive}
                min={EDITOR_LIMITS.borderPadding.min}
                max={EDITOR_LIMITS.borderPadding.max}
                step={EDITOR_LIMITS.borderPadding.step}
                suffix={EDITOR_LIMITS.borderPadding.suffix}
              />

              {/* Border Color Palette */}
              <div className="space-y-1.5 pt-1">
                <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
                  Border Color
                </span>
                <PaletteGrid
                  presets={swatchPresets}
                  disabled={isFrameActive}
                  selected={isBorderActive ? activeColor : null}
                  onSelect={(hex) =>
                    handleApplyBorder({ ...border, color: hex })
                  }
                  customColor={
                    isCustomColor ? activeColor : BORDER_COLOR_PRESETS[0]
                  }
                  onCustomColor={(hex) =>
                    handleApplyBorder({ ...border, color: hex })
                  }
                  isCustom={isCustomColor}
                  size="sm"
                  shape="square"
                  columnsClassName="grid-cols-7 gap-1.5"
                  customLabel="Custom border color"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
