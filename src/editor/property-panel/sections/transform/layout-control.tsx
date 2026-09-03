"use client";

import * as React from "react";
import { Slider } from "@/components/slider";
import { EDITOR_LIMITS } from "@/editor/lib/limits";
import type { TransformLayoutProps } from "./types";
import { FeatureLock } from "@/editor/components/feature-lock";

export function LayoutControl({
  inset,
  scale,
  borderRadius,
  canvasRadiusDisabled = false,
  onPreviewInset,
  onCommitInset,
  onPreviewScale,
  onCommitScale,
  onPreviewCanvasRadius,
  onCommitCanvasRadius,
}: TransformLayoutProps) {
  const [draftInset, setDraftInset] = React.useState<number | null>(null);
  const [draftScale, setDraftScale] = React.useState<number | null>(null);
  const [draftCanvasRadius, setDraftCanvasRadius] = React.useState<
    number | null
  >(null);

  const activeInset = draftInset ?? inset;
  const activeScale = draftScale ?? scale;
  const activeCanvasRadius = draftCanvasRadius ?? borderRadius ?? 0;

  return (
    <div className="space-y-3">
      <span className="block text-[11px] font-medium text-muted-foreground">
        Layout & Size
      </span>

      <FeatureLock featureId="transform.layout" className="[&>div]:space-y-3">
        <Slider
          label="Inset"
          value={activeInset}
          onValueChange={(val) => {
            setDraftInset(val);
            onPreviewInset(val);
          }}
          onValueCommit={(val) => {
            setDraftInset(null);
            onCommitInset(val);
          }}
          min={EDITOR_LIMITS.padding.min}
          max={EDITOR_LIMITS.padding.max}
          step={EDITOR_LIMITS.padding.step}
          formatValue={(val) =>
            `${Math.round(val)}${EDITOR_LIMITS.padding.suffix}`
          }
        />

        {borderRadius !== undefined && onCommitCanvasRadius && (
          <Slider
            label="Canvas Radius"
            value={activeCanvasRadius}
            disabled={canvasRadiusDisabled}
            onValueChange={(val) => {
              setDraftCanvasRadius(val);
              onPreviewCanvasRadius?.(val);
            }}
            onValueCommit={(val) => {
              setDraftCanvasRadius(null);
              onCommitCanvasRadius?.(val);
            }}
            min={EDITOR_LIMITS.borderRadius.min}
            max={EDITOR_LIMITS.borderRadius.max}
            step={EDITOR_LIMITS.borderRadius.step}
            formatValue={(val) =>
              `${Math.round(val)}${EDITOR_LIMITS.borderRadius.suffix}`
            }
          />
        )}

        <Slider
          label="Scale"
          value={activeScale}
          onValueChange={(val) => {
            setDraftScale(val);
            onPreviewScale(val);
          }}
          onValueCommit={(val) => {
            setDraftScale(null);
            onCommitScale(val);
          }}
          min={EDITOR_LIMITS.scale.min}
          max={EDITOR_LIMITS.scale.max}
          step={EDITOR_LIMITS.scale.step}
          formatValue={(val) => `${Math.round(val)}%`}
        />
      </FeatureLock>
    </div>
  );
}
