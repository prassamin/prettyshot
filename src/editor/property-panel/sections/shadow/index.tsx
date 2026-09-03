"use client";

import * as React from "react";

import { EffectSlider } from "../../components/effect-slider";
import { PaletteGrid } from "../../components/palette-grid";
import { previewHosts, writeToken } from "@/editor/lib/preview-tokens";
import { useScreenshotStyleTarget } from "../../hooks/use-screenshot-style-target";
import { useEditorStateField } from "@/editor/lib/engine";
import { cn } from "@/lib/utils";

import {
  SHADOW_COLOR_PRESETS,
  SHADOW_FILTER_PREVIEW_VAR,
  SHADOW_PREVIEW_VAR,
} from "./constants";
import type { Shadow, ShadowType } from "./types";
import { shadowCss, shadowDropFilterCss } from "./utils";
import { TypeGrid } from "./type-grid";
import { DirectionField } from "./direction-field";
import { FeatureLock } from "@/editor/components/feature-lock";

export function ShadowSection() {
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
  const isDirectionalDisabled =
    !isShadowEnabled || type === "glow" || type === "float";

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

  const handlePreviewIntensity = React.useCallback(
    (nextIntensity: number) => {
      handlePreviewShadow({ ...activeShadow, intensity: nextIntensity });
    },
    [activeShadow, handlePreviewShadow],
  );

  const handleCommitIntensity = React.useCallback(
    (nextIntensity: number) => {
      handleCommitShadow({ ...activeShadow, intensity: nextIntensity });
    },
    [activeShadow, handleCommitShadow],
  );

  const handlePreviewLightSource = React.useCallback(
    (nextLightSource: string) => {
      handlePreviewShadow({ ...activeShadow, lightSource: nextLightSource });
    },
    [activeShadow, handlePreviewShadow],
  );

  const handleCommitLightSource = React.useCallback(
    (nextLightSource: string) => {
      handleCommitShadow({ ...activeShadow, lightSource: nextLightSource });
    },
    [activeShadow, handleCommitShadow],
  );

  const handleColorChange = React.useCallback(
    (nextColor: string) => {
      handleCommitShadow({ ...activeShadow, color: nextColor });
    },
    [activeShadow, handleCommitShadow],
  );

  const shadowPaletteList = React.useMemo(
    () => Array.from(SHADOW_COLOR_PRESETS),
    [],
  );

  return (
    <div className="min-w-0 space-y-4">
      {/* Shadow Projection Style Selector */}
      <FeatureLock featureId="shadow">
        <TypeGrid value={type} onChange={handleTypeChange} />

        {/* Intensity Slider */}
        <div
          className={cn(!isShadowEnabled && "opacity-50 pointer-events-none")}
        >
          <EffectSlider
            label="Shadow Intensity"
            value={intensity}
            onPreview={handlePreviewIntensity}
            onChange={handleCommitIntensity}
            max={100}
            suffix="%"
            disabled={!isShadowEnabled}
          />
        </div>

        {/* Shadow Color Palette Grid */}
        <div
          className={cn(
            "space-y-1.5",
            !isShadowEnabled && "opacity-50 pointer-events-none",
          )}
        >
          <span className="block text-[11px] font-medium text-muted-foreground">
            Shadow Tint
          </span>
          <PaletteGrid
            presets={shadowPaletteList}
            selected={isCustomColor ? null : color}
            onSelect={handleColorChange}
            customColor={color || "#000000"}
            onCustomColor={handleColorChange}
            isCustom={isCustomColor}
            customLabel="Custom shadow color"
            size="sm"
            shape="square"
            columnsClassName="grid-cols-6 gap-1.5"
            disabled={!isShadowEnabled}
          />
        </div>

        {/* 2D Light Direction Pad & Position Panel */}
        <div
          className={cn(
            isDirectionalDisabled && "pointer-events-none opacity-50",
          )}
        >
          <DirectionField
            color={color}
            disabled={isDirectionalDisabled}
            lightSource={lightSource}
            onPreview={handlePreviewLightSource}
            onChange={handleCommitLightSource}
          />
        </div>
      </FeatureLock>
    </div>
  );
}
