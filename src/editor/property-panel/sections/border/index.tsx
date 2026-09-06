"use client";

import * as React from "react";
import { Info } from "lucide-react";

import { useEditorStateField } from "@/editor/lib/engine";
import { editorValueSchemas } from "@/editor/lib/value-schemas";
import { EDITOR_LIMITS } from "@/editor/lib/limits";
import { EffectSlider } from "../../components";

import { StyleControl } from "./style-control";
import { ColorControl } from "./color-control";
import type { BorderSectionProps, BorderStyle } from "./types";
import { useScreenshotStyleTarget } from "../../hooks/use-screenshot-style-target";
import { cn } from "@/lib/utils";
import { FeatureLock } from "@/editor/components/feature-lock";

export function BorderSection({ className }: BorderSectionProps) {
  const canvasBorder = useEditorStateField((c) => c.border);
  const canvasRadius = useEditorStateField((c) => c.borderRadius);
  const deviceFrame = useEditorStateField((c) => c.deviceFrame);
  const { applyStyle, selectedSlot } = useScreenshotStyleTarget();

  const border = selectedSlot?.border ?? canvasBorder;
  const borderRadius = selectedSlot?.borderRadius ?? canvasRadius;
  const frame = selectedSlot?.deviceFrame ?? deviceFrame;
  const background = useEditorStateField((c) => c.background);
  const canvasScreenshot = useEditorStateField((c) => c.screenshot);
  const screenshot = selectedSlot?.src ?? canvasScreenshot;

  // Frame check: borders cannot be applied to deviceFrame/browser frames
  const isFrameActive = Boolean(frame && frame.id && deviceFrame.id !== "none");

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

  // When width is changed
  const handleChangeWidth = React.useCallback(
    (nextWidth: number) => {
      if (isFrameActive) return;
      if (nextWidth === 0) {
        handleApplyBorder({
          ...border,
          width: 0,
          style: "none",
        });
      } else {
        const currentStyle =
          border.style === "none" || !border.style ? "solid" : border.style;
        handleApplyBorder({
          ...border,
          width: nextWidth,
          style: currentStyle,
          color: border.color || "#ffffff",
        });
      }
    },
    [border, handleApplyBorder, isFrameActive],
  );

  // When style is changed
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
          width: border.width === 0 ? 1 : border.width,
          color: border.color || "#ffffff",
        });
      }
    },
    [border, handleApplyBorder, isFrameActive],
  );

  // Effective style to show in UI
  const effectiveStyle: BorderStyle =
    border.width === 0 || border.style === "none"
      ? "none"
      : border.style || "solid";

  return (
    <FeatureLock featureId="border">
      <div className={cn("space-y-4", className)}>
        {/* Frame Active Notice */}
        {isFrameActive && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-[11px] leading-snug text-amber-600 dark:text-amber-400">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>Borders cannot be applied to device or browser frames.</span>
          </div>
        )}

        <div
          className={cn(
            "space-y-4 transition-opacity duration-200",
            isFrameActive && "opacity-40 pointer-events-none select-none",
          )}
        >
          {/* Corner Radius */}
          <EffectSlider
            label="Radius"
            value={borderRadius}
            onChange={handleApplyBorderRadius}
            disabled={isFrameActive}
            min={EDITOR_LIMITS.borderRadius.min}
            max={EDITOR_LIMITS.borderRadius.max}
            step={EDITOR_LIMITS.borderRadius.step}
            suffix={EDITOR_LIMITS.borderRadius.suffix}
          />

          <div className="h-px bg-border/40" />

          {/* Border Width */}
          <EffectSlider
            label="Width"
            value={border.width}
            onChange={handleChangeWidth}
            disabled={isFrameActive}
            min={EDITOR_LIMITS.borderWidth.min}
            max={EDITOR_LIMITS.borderWidth.max}
            step={EDITOR_LIMITS.borderWidth.step}
            suffix={EDITOR_LIMITS.borderWidth.suffix}
          />

          {/* Inner Padding */}
          <EffectSlider
            label="Inner Padding"
            value={border.padding}
            onChange={(v) => handleApplyBorder({ ...border, padding: v })}
            disabled={isFrameActive}
            min={EDITOR_LIMITS.borderPadding.min}
            max={EDITOR_LIMITS.borderPadding.max}
            step={EDITOR_LIMITS.borderPadding.step}
            suffix={EDITOR_LIMITS.borderPadding.suffix}
          />

          {/* Line Style Pattern */}
          <div>
            <span className="mb-2 block text-[11px] font-medium text-muted-foreground">
              Style
            </span>
            <StyleControl
              style={effectiveStyle}
              disabled={isFrameActive}
              onChangeStyle={handleChangeStyle}
            />
          </div>

          {/* Color Palette & Pipette */}
          <div>
            <span className="mb-2 block text-[11px] font-medium text-muted-foreground">
              Color
            </span>
            <ColorControl
              border={border}
              disabled={isFrameActive}
              onApplyBorder={handleApplyBorder}
              background={background}
              screenshotSrc={screenshot}
            />
          </div>
        </div>
      </div>
    </FeatureLock>
  );
}
