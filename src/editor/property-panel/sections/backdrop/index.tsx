"use client";

import * as React from "react";
import { Blend, Lightbulb, SlidersHorizontal, Sun } from "lucide-react";

import { useEditorStateField, useEditorEngine } from "@/editor/lib/engine";
import { previewHosts, writeToken } from "@/editor/lib/preview-tokens";
import { useScreenshotStyleTarget } from "../../hooks/use-screenshot-style-target";
import {
  TOKEN_BACKDROP_FX_PREVIEW,
  TOKEN_BACKDROP_NOISE_PREVIEW,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_OVERLAY,
  DEFAULT_LIGHT_SOURCE,
} from "./constants";
import { checkAdjustmentsDirty, buildAdjustmentsFilterCss } from "./utils";
import { AccordionCard } from "./accordion-card";
import { AdjustmentsControl } from "./adjustments-control";
import { FiltersControl } from "./filters-control";
import { LightingControl } from "./lighting-control";
import { OverlayControl } from "./overlay-control";
import { FeatureLock } from "@/editor/components/feature-lock";

export function BackdropSection() {
  const backdropState = useEditorStateField((canvas) => canvas.backdrop);
  const overlayState = useEditorStateField((canvas) => canvas.overlay);
  const { applyStyle, selectedSlot } = useScreenshotStyleTarget();
  const isAnimateMode = useEditorEngine((s) => s.isAnimateMode);
  const selectedSlotId = useEditorEngine((s) => s.selectedSlotId);
  const selectedTextId = useEditorEngine((s) => s.selectedTextId);
  // Overlay / Adjustments / Color Filters are canvas-level — only animate on
  // the whole group or Main. Lighting stays editable (it's canvas + per-slot).
  const canvasLocked =
    isAnimateMode && (selectedSlotId != null || selectedTextId != null);

  const setBackdropAdjustments = useEditorEngine(
    (engine) => engine.setBackdropAdjustments,
  );
  const setBackdropFilter = useEditorEngine(
    (engine) => engine.setBackdropFilter,
  );
  const setOverlay = useEditorEngine((engine) => engine.setOverlay);

  const { effects, lighting, filter: activeFilter = "none" } = backdropState;
  const currentLighting = selectedSlot?.lighting ?? lighting;

  // Live CSS token dispatcher
  const updateLiveToken = React.useCallback(
    (tokenKey: string, tokenVal: string | null) => {
      writeToken(previewHosts(), tokenKey, tokenVal);
    },
    [],
  );

  const flushTokenAfterPaint = React.useCallback(
    (tokenKey: string) => {
      if (typeof requestAnimationFrame === "undefined") return;
      requestAnimationFrame(() => updateLiveToken(tokenKey, null));
    },
    [updateLiveToken],
  );

  // Adjustments preview & commit handlers
  const handleCommitAdjustments = React.useCallback(
    (patch: Partial<typeof effects>) => {
      setBackdropAdjustments({ ...effects, ...patch });
      flushTokenAfterPaint(TOKEN_BACKDROP_FX_PREVIEW);
      flushTokenAfterPaint(TOKEN_BACKDROP_NOISE_PREVIEW);
    },
    [effects, flushTokenAfterPaint, setBackdropAdjustments],
  );

  const handlePreviewAdjustments = React.useCallback(
    (patch: Partial<typeof effects>) => {
      const mergedEffects = { ...effects, ...patch };
      updateLiveToken(
        TOKEN_BACKDROP_FX_PREVIEW,
        buildAdjustmentsFilterCss(mergedEffects) ?? "brightness(1)",
      );
      if (patch.noise !== undefined) {
        updateLiveToken(
          TOKEN_BACKDROP_NOISE_PREVIEW,
          `${Math.max(0, Math.min(100, mergedEffects.noise)) / 100}`,
        );
      }
    },
    [effects, updateLiveToken],
  );

  // Lighting handlers
  const handleApplyLighting = React.useCallback(
    (nextLighting: typeof lighting) => applyStyle({ lighting: nextLighting }),
    [applyStyle],
  );

  const handlePatchLighting = React.useCallback(
    (patch: Partial<typeof lighting>) => {
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

  // Overlay state handlers
  const activeOverlayRef = React.useRef(overlayState);
  React.useEffect(() => {
    activeOverlayRef.current = overlayState;
  });

  const handlePatchOverlay = React.useCallback(
    (patch: Partial<typeof overlayState>) => {
      setOverlay({ ...activeOverlayRef.current, ...patch });
    },
    [setOverlay],
  );

  // Accordion open/close toggle state
  const [panelOpenMap, setPanelOpenMap] = React.useState<
    Record<string, boolean>
  >({
    overlay: false,
    lighting: false,
    effects: false,
    filters: false,
  });

  const togglePanelSection = React.useCallback((sectionKey: string) => {
    setPanelOpenMap((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }, []);

  const isAdjustmentsActive = checkAdjustmentsDirty(effects);
  const isOverlayActive = overlayState.id !== null;
  const isLightingActive = currentLighting.intensity > 0;
  const isFilterActive = activeFilter !== "none";

  return (
    <div className="flex flex-col pb-6">
      {/* Stack of Figma-style Backdrop Accordion Panels */}
      <div className="flex flex-col">
        {/* Shadow Texture Overlay Panel */}
        <AccordionCard
          id="overlay"
          title="Shadow Overlay"
          icon={Sun}
          isOpen={panelOpenMap.overlay}
          onToggle={() => togglePanelSection("overlay")}
          isActive={isOverlayActive}
          disabled={canvasLocked}
          onReset={() => setOverlay(DEFAULT_OVERLAY)}
          resetTitle="Reset shadow texture"
        >
          <OverlayControl
            overlay={overlayState}
            setOverlayPatch={handlePatchOverlay}
            setPreviewVar={updateLiveToken}
            clearPreviewVarAfterPaint={flushTokenAfterPaint}
          />
        </AccordionCard>

        {/* Directional Lighting Panel */}
        <AccordionCard
          id="lighting"
          title="Lighting"
          icon={Lightbulb}
          isOpen={panelOpenMap.lighting}
          onToggle={() => togglePanelSection("lighting")}
          isActive={isLightingActive}
          onReset={() => handleApplyLighting(DEFAULT_LIGHT_SOURCE)}
          resetTitle="Reset lighting"
        >
          <FeatureLock featureId="backdrop.lighting">
            <LightingControl
              activeLighting={currentLighting}
              setLighting={handlePatchLighting}
              outerDisabled={canvasLocked}
            />
          </FeatureLock>
        </AccordionCard>

        {/* Image & Color Adjustments Panel */}
        <AccordionCard
          id="effects"
          title="Adjustments"
          icon={SlidersHorizontal}
          isOpen={panelOpenMap.effects}
          onToggle={() => togglePanelSection("effects")}
          isActive={isAdjustmentsActive}
          disabled={canvasLocked}
          onReset={() => setBackdropAdjustments(DEFAULT_ADJUSTMENTS)}
          resetTitle="Reset adjustments"
        >
            <AdjustmentsControl
              effects={effects}
              commitEffects={handleCommitAdjustments}
              previewEffects={handlePreviewAdjustments}
            />
        </AccordionCard>

        {/* Photo Filters Preset Gallery Panel */}
        <AccordionCard
          id="filters"
          title="Color Filters"
          icon={Blend}
          isOpen={panelOpenMap.filters}
          onToggle={() => togglePanelSection("filters")}
          isActive={isFilterActive}
          disabled={canvasLocked}
          onReset={() => setBackdropFilter("none")}
          resetTitle="Reset photo filter"
        >
          <FiltersControl
            backdropFilter={activeFilter}
            setBackdropFilter={setBackdropFilter}
          />
        </AccordionCard>
      </div>
    </div>
  );
}
