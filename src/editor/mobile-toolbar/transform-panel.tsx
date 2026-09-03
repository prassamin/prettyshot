"use client";

import * as React from "react";
import { Check, RotateCcw } from "lucide-react";

import { useEditorStateField, useEditorEngine } from "@/editor/lib/engine";
import { useScreenshotStyleTarget } from "../property-panel/hooks/use-screenshot-style-target";
import { editorValueSchemas } from "@/editor/lib/value-schemas";
import { EDITOR_LIMITS } from "@/editor/lib/limits";
import { previewHosts, writeToken } from "@/editor/lib/preview-tokens";
import { TOKEN_CANVAS_CORNER_RADIUS } from "../property-panel/sections/backdrop/constants";
import { EffectSlider } from "../property-panel/components/effect-slider";
import { PADDING_PREVIEW_CSS_VAR } from "../property-panel/sections/transform/constants";
import type {
  Tilt,
  TransformAxis,
  TransformLiveTarget,
} from "../property-panel/sections/transform/types";
import {
  broadcastLiveTransform,
  clearAllLiveTransforms,
  executeNextFrame,
} from "../property-panel/sections/transform/utils";
import { cn } from "@/lib/utils";
import { FeatureLock } from "../components/feature-lock";
import { DEFAULT_STATE } from "../lib/engine-core/initial-config";

interface TiltPreset {
  id: string;
  label: string;
  tag: string;
  tilt: Tilt;
  rotationZ: number;
}

const TILT_PRESETS: TiltPreset[] = [
  {
    id: "flat",
    label: "Flat",
    tag: "0° Normal",
    tilt: { rx: 0, ry: 0, rz: 0 },
    rotationZ: 0,
  },
  {
    id: "isometric_right",
    label: "Isometric",
    tag: "Right Angle",
    tilt: { rx: 18, ry: -24, rz: 0 },
    rotationZ: 0,
  },
  {
    id: "isometric_left",
    label: "Perspective",
    tag: "Left Angle",
    tilt: { rx: 18, ry: 24, rz: 0 },
    rotationZ: 0,
  },
  {
    id: "top_down",
    label: "Top View",
    tag: "Forward Tilt",
    tilt: { rx: 28, ry: 0, rz: 0 },
    rotationZ: 0,
  },
  {
    id: "side_profile",
    label: "Side View",
    tag: "Yaw Angle",
    tilt: { rx: 0, ry: 32, rz: 0 },
    rotationZ: 0,
  },
  {
    id: "dynamic_3d",
    label: "Dynamic",
    tag: "Dramatic 3D",
    tilt: { rx: 22, ry: -28, rz: 0 },
    rotationZ: -6,
  },
  {
    id: "float_tilt",
    label: "Elevated",
    tag: "Subtle 3D",
    tilt: { rx: 10, ry: -14, rz: 0 },
    rotationZ: 0,
  },
];

function TiltPresetPreview({
  tilt,
  rotationZ,
}: {
  tilt: Tilt;
  rotationZ: number;
}) {
  return (
    <div className="relative size-full overflow-hidden bg-card flex items-center justify-center select-none perspective-normal">
      {/* Ambient dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-foreground)_1px,transparent_1px)] opacity-5 bg-size-[6px_6px]" />

      {/* Mini Window in 3D Perspective */}
      <div
        className={cn(
          "relative flex h-7.5 w-11 flex-col overflow-hidden rounded-sm border border-border/80 bg-surface-tertiary shadow-md transition-transform duration-200",
        )}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) rotateZ(${rotationZ || tilt.rz}deg)`,
          transformStyle: "preserve-3d",
        }}
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

export function MobileTransformPanel() {
  const canvasTilt = useEditorStateField((state) => state.tilt);
  const canvasScale = useEditorStateField((state) => state.scale);
  const canvasPadding = useEditorStateField((state) => state.padding);
  const canvasBorderRadius = useEditorStateField(
    (state) => state.canvasBorderRadius,
  );
  const setCanvasBorderRadius = useEditorEngine(
    (engine) => engine.setCanvasBorderRadius,
  );

  const { applyStyle, selectedSlot, target } = useScreenshotStyleTarget();

  const activeTilt = selectedSlot?.tilt ?? canvasTilt;
  const activeScale = selectedSlot?.scale ?? canvasScale;
  const activePadding = selectedSlot?.padding ?? canvasPadding;
  const activeRotationZ = selectedSlot ? selectedSlot.rotation : activeTilt.rz;
  const isAnimateMode = useEditorEngine((s) => s.isAnimateMode);
  const selectedSlotId = useEditorEngine((s) => s.selectedSlotId);
  const selectedTextId = useEditorEngine((s) => s.selectedTextId);
  const canvasRadiusDisabled =
    isAnimateMode && (selectedSlotId != null || selectedTextId != null);

  // Inset / Padding live preview
  const resolvePaddingPreviewElements = React.useCallback((): HTMLElement[] => {
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

  const updatePaddingLivePreview = React.useCallback(
    (nextPadding: number | null) => {
      const percentageValue =
        nextPadding === null
          ? null
          : `${Math.max(0, Math.min(240, nextPadding)) / 12}%`;

      writeToken(
        resolvePaddingPreviewElements(),
        PADDING_PREVIEW_CSS_VAR,
        percentageValue,
      );
    },
    [resolvePaddingPreviewElements],
  );

  const resetPaddingPreviewAfterPaint = React.useCallback(() => {
    executeNextFrame(() => updatePaddingLivePreview(null));
  }, [updatePaddingLivePreview]);

  const handleCommitInset = React.useCallback(
    (value: number) => {
      const validatedPadding = editorValueSchemas.padding.catch(0).parse(value);
      applyStyle({ padding: validatedPadding });
      resetPaddingPreviewAfterPaint();
    },
    [applyStyle, resetPaddingPreviewAfterPaint],
  );

  // 3D Transform live preview
  const resolveTransformTargetElements =
    React.useCallback((): TransformLiveTarget[] => {
      if (typeof document === "undefined") return [];

      if (selectedSlot) {
        const slotElement = document.querySelector<HTMLElement>(
          `[data-screenshot-id="${CSS.escape(selectedSlot.id)}"]`,
        );
        return slotElement ? [{ element: slotElement, scope: "slot" }] : [];
      }

      if (target !== "all") {
        const canvasElement =
          document.querySelector<HTMLElement>("[data-stage-id]");
        return canvasElement
          ? [{ element: canvasElement, scope: "canvas" }]
          : [];
      }

      const slotTargets: TransformLiveTarget[] = Array.from(
        document.querySelectorAll<HTMLElement>("[data-screenshot-id]"),
      ).map((el) => ({ element: el, scope: "slot" as const }));

      const canvasElement =
        document.querySelector<HTMLElement>("[data-stage-id]");
      return canvasElement
        ? [{ element: canvasElement, scope: "canvas" }, ...slotTargets]
        : slotTargets;
    }, [selectedSlot, target]);

  const previousTargetsRef = React.useRef<TransformLiveTarget[]>([]);
  React.useEffect(() => {
    clearAllLiveTransforms(previousTargetsRef.current);
    previousTargetsRef.current = resolveTransformTargetElements();
    return () => {
      clearAllLiveTransforms(previousTargetsRef.current);
    };
  }, [resolveTransformTargetElements]);

  const handlePreviewTilt = React.useCallback(
    (next: Tilt) => {
      for (const liveTarget of resolveTransformTargetElements()) {
        broadcastLiveTransform(liveTarget, "rx", `${next.rx}deg`);
        broadcastLiveTransform(liveTarget, "ry", `${next.ry}deg`);
        broadcastLiveTransform(liveTarget, "rz", `${next.rz}deg`);
      }
    },
    [resolveTransformTargetElements],
  );

  const handlePreviewScale = React.useCallback(
    (nextScale: number) => {
      for (const liveTarget of resolveTransformTargetElements()) {
        broadcastLiveTransform(liveTarget, "scale", String(nextScale / 100));
      }
    },
    [resolveTransformTargetElements],
  );

  const handlePreviewRotationZ = React.useCallback(
    (nextRot: number) => {
      for (const liveTarget of resolveTransformTargetElements()) {
        // Main canvas holds Z rotation in `tilt.rz` (→ --canvas-transform-rz);
        // slots hold it in their flat `rotation` (→ --slot-transform-rot).
        const axisKey: TransformAxis =
          liveTarget.scope === "slot" ? "rot" : "rz";
        broadcastLiveTransform(liveTarget, axisKey, `${nextRot}deg`);
      }
    },
    [resolveTransformTargetElements],
  );

  const clearTransformAxesAfterPaint = React.useCallback(
    (axes: TransformAxis[]) => {
      executeNextFrame(() => {
        for (const liveTarget of resolveTransformTargetElements()) {
          for (const axis of axes) {
            broadcastLiveTransform(liveTarget, axis, null);
          }
        }
      });
    },
    [resolveTransformTargetElements],
  );

  const handleCommitTilt = React.useCallback(
    (nextTilt: Tilt) => {
      const validatedTilt: Tilt = {
        rx: editorValueSchemas.degree.catch(0).parse(nextTilt.rx),
        ry: editorValueSchemas.degree.catch(0).parse(nextTilt.ry),
        rz: editorValueSchemas.degree.catch(0).parse(nextTilt.rz),
      };
      applyStyle({ tilt: validatedTilt });
      clearTransformAxesAfterPaint(["rx", "ry", "rz"]);
    },
    [applyStyle, clearTransformAxesAfterPaint],
  );

  const handleCommitScale = React.useCallback(
    (value: number) => {
      const validatedScale = editorValueSchemas.scale.catch(100).parse(value);
      applyStyle({ scale: validatedScale });
      clearTransformAxesAfterPaint(["scale"]);
    },
    [applyStyle, clearTransformAxesAfterPaint],
  );

  const handleCommitRotationZ = React.useCallback(
    (value: number) => {
      const validatedRot = editorValueSchemas.degree.catch(0).parse(value);
      if (selectedSlot) {
        applyStyle({ rotation: validatedRot });
      } else {
        handleCommitTilt({ ...activeTilt, rz: validatedRot });
      }
      clearTransformAxesAfterPaint(["rz", "rot"]);
    },
    [
      activeTilt,
      applyStyle,
      clearTransformAxesAfterPaint,
      handleCommitTilt,
      selectedSlot,
    ],
  );

  // Apply a whole preset in ONE commit. Two sequential commits would clobber
  // each other: the second reads `activeTilt` from the stale render closure
  // and would overwrite the preset's rx/ry with the previous values.
  const handleApplyPreset = React.useCallback(
    (preset: TiltPreset) => {
      const validatedTilt: Tilt = {
        rx: editorValueSchemas.degree.catch(0).parse(preset.tilt.rx),
        ry: editorValueSchemas.degree.catch(0).parse(preset.tilt.ry),
        rz: editorValueSchemas.degree.catch(0).parse(preset.tilt.rz),
      };
      const validatedRot = editorValueSchemas.degree
        .catch(0)
        .parse(preset.rotationZ);
      // The engine maps `rotation` → tilt.rz for the main canvas and keeps it
      // as a separate field for slots — one call handles both.
      applyStyle({ tilt: validatedTilt, rotation: validatedRot });
      clearTransformAxesAfterPaint(["rx", "ry", "rz", "rot"]);
    },
    [applyStyle, clearTransformAxesAfterPaint],
  );

  const handlePreviewCanvasRadius = React.useCallback((value: number) => {
    writeToken(previewHosts(), TOKEN_CANVAS_CORNER_RADIUS, `${value}px`);
  }, []);

  const handleCommitCanvasRadius = React.useCallback(
    (value: number) => {
      writeToken(previewHosts(), TOKEN_CANVAS_CORNER_RADIUS, null);
      setCanvasBorderRadius(value);
    },
    [setCanvasBorderRadius],
  );

  // Check matching preset
  const activePresetId = React.useMemo(() => {
    const found = TILT_PRESETS.find(
      (p) =>
        p.tilt.rx === activeTilt.rx &&
        p.tilt.ry === activeTilt.ry &&
        (p.rotationZ === activeRotationZ ||
          (p.id === "flat" && activeTilt.rx === 0 && activeTilt.ry === 0)),
    );
    return found ? found.id : null;
  }, [activeRotationZ, activeTilt.rx, activeTilt.ry]);

  const isTiltModified =
    activeTilt.rx !== 0 ||
    activeTilt.ry !== 0 ||
    activeTilt.rz !== 0 ||
    activeRotationZ !== 0;

  const isLayoutModified =
    activeScale !== DEFAULT_STATE.scale ||
    activePadding !== DEFAULT_STATE.padding ||
    canvasBorderRadius !== DEFAULT_STATE.canvasBorderRadius;

  const handleResetTilt = React.useCallback(() => {
    handleApplyPreset({ tilt: DEFAULT_STATE.tilt, rotationZ: 0 } as any);
  }, [handleApplyPreset]);

  const handleResetLayout = React.useCallback(() => {
    handleCommitScale(DEFAULT_STATE.scale);
    handleCommitInset(DEFAULT_STATE.padding);
    handleCommitCanvasRadius(DEFAULT_STATE.canvasBorderRadius);
  }, [handleCommitInset, handleCommitScale, handleCommitCanvasRadius]);

  return (
    <div className="flex w-full flex-col gap-3.5 px-1 pt-1 pb-6 select-none text-foreground">
      {/* 3D Perspective Preset Rail */}
      <div className="flex w-full items-center gap-3.5 overflow-x-auto py-2.5 px-2 -my-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TILT_PRESETS.map((preset) => {
          const isSelected = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleApplyPreset(preset)}
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
                  <TiltPresetPreview
                    tilt={preset.tilt}
                    rotationZ={preset.rotationZ}
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

      {/* Sliders Studio */}
      <div className="space-y-3.5 pt-1 border-t border-border/50">
        {/* Header with quick Reset */}
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            3D Orientation
          </span>
          <button
            type="button"
            onClick={handleResetTilt}
            className={cn(
              "flex items-center gap-1 rounded-md border border-border/60 bg-surface-tertiary p-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-all duration-200 opacity-0",
              isTiltModified && "opacity-100",
            )}
          >
            <RotateCcw className="size-3" />
          </button>
        </div>

        {/* 3D Rotation Sliders */}
        <FeatureLock featureId="transform.tilt" className="[&>div]:space-y-3.5">
          <EffectSlider
            label="Rotate X (Pitch)"
            value={activeTilt.rx}
            onChange={(rx) => handleCommitTilt({ ...activeTilt, rx })}
            onPreview={(rx) => handlePreviewTilt({ ...activeTilt, rx })}
            min={EDITOR_LIMITS.tiltDegree.min}
            max={EDITOR_LIMITS.tiltDegree.max}
            step={1}
            suffix="°"
          />

          <EffectSlider
            label="Rotate Y (Yaw)"
            value={activeTilt.ry}
            onChange={(ry) => handleCommitTilt({ ...activeTilt, ry })}
            onPreview={(ry) => handlePreviewTilt({ ...activeTilt, ry })}
            min={EDITOR_LIMITS.tiltDegree.min}
            max={EDITOR_LIMITS.tiltDegree.max}
            step={1}
            suffix="°"
          />

          <EffectSlider
            label="Rotate Z (Roll)"
            value={activeRotationZ}
            onChange={handleCommitRotationZ}
            onPreview={handlePreviewRotationZ}
            min={EDITOR_LIMITS.degree.min}
            max={EDITOR_LIMITS.degree.max}
            step={1}
            suffix="°"
          />
        </FeatureLock>
      </div>

      {/* Sliders Studio */}
      <div className="space-y-3.5 pt-1 border-t border-border/50">
        {/* Header with quick Reset */}
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Layout & Size
          </span>
          <button
            type="button"
            onClick={handleResetLayout}
            className={cn(
              "flex items-center gap-1 rounded-md border border-border/60 bg-surface-tertiary p-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-all duration-200 opacity-0",
              isLayoutModified && "opacity-100",
            )}
          >
            <RotateCcw className="size-3" />
          </button>
        </div>

        {/* Scale & Layout Sliders */}
        <FeatureLock
          featureId={"transform.layout"}
          className="[&>div]:space-y-3.5"
        >
          <EffectSlider
            label="Scale"
            value={activeScale}
            onChange={handleCommitScale}
            onPreview={handlePreviewScale}
            min={EDITOR_LIMITS.scale.min}
            max={EDITOR_LIMITS.scale.max}
            step={EDITOR_LIMITS.scale.step}
            suffix={EDITOR_LIMITS.scale.suffix}
          />

          <EffectSlider
            label="Inset"
            value={activePadding}
            onChange={handleCommitInset}
            onPreview={updatePaddingLivePreview}
            min={EDITOR_LIMITS.padding.min}
            max={EDITOR_LIMITS.padding.max}
            step={EDITOR_LIMITS.padding.step}
            suffix={EDITOR_LIMITS.padding.suffix}
          />

          <EffectSlider
            label="Canvas Radius"
            value={canvasBorderRadius ?? 0}
            onChange={handleCommitCanvasRadius}
            onPreview={handlePreviewCanvasRadius}
            disabled={canvasRadiusDisabled}
            min={EDITOR_LIMITS.borderRadius.min}
            max={EDITOR_LIMITS.borderRadius.max}
            step={EDITOR_LIMITS.borderRadius.step}
            suffix={EDITOR_LIMITS.borderRadius.suffix}
          />
        </FeatureLock>
      </div>
    </div>
  );
}
