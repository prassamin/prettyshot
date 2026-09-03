"use client";

import * as React from "react";
import { Slider } from "@/components/slider";
import { EDITOR_LIMITS } from "@/editor/lib/limits";
import type {
  OrientationSliderRowProps,
  TransformOrientationProps,
} from "./types";
import { FeatureLock } from "@/editor/components/feature-lock";

export function OrientationSliderRow({
  label,
  value,
  min = EDITOR_LIMITS.tiltDegree.min,
  max = EDITOR_LIMITS.tiltDegree.max,
  onPreview,
  onCommit,
}: OrientationSliderRowProps) {
  const [draftValue, setDraftValue] = React.useState<number | null>(null);
  const activeValue = draftValue ?? value;

  return (
    <Slider
      label={label}
      value={activeValue}
      onValueChange={(val) => {
        setDraftValue(val);
        onPreview(val);
      }}
      onValueCommit={(val) => {
        setDraftValue(null);
        onCommit(val);
      }}
      min={min}
      max={max}
      step={1}
      formatValue={(val) => `${Math.round(val)}°`}
    />
  );
}

export function OrientationControl({
  tilt,
  rotationZ,
  onPreviewTilt,
  onCommitTilt,
  onPreviewRotationZ,
  onCommitRotationZ,
}: TransformOrientationProps) {
  return (
    <div className="space-y-1">
      <span className="mb-2 block text-[11px] font-medium text-muted-foreground">
        3D Orientation
      </span>

      <FeatureLock featureId="transform.tilt" className="[&>div]:space-y-3">
        <OrientationSliderRow
          label="Rotate X"
          value={tilt.ry}
          onPreview={(ry) => onPreviewTilt({ ...tilt, ry })}
          onCommit={(ry) => onCommitTilt({ ...tilt, ry })}
        />

        <OrientationSliderRow
          label="Rotate Y"
          value={tilt.rx}
          onPreview={(rx) => onPreviewTilt({ ...tilt, rx })}
          onCommit={(rx) => onCommitTilt({ ...tilt, rx })}
        />

        <OrientationSliderRow
          label="Rotate Z"
          value={rotationZ}
          min={-180}
          max={180}
          onPreview={onPreviewRotationZ}
          onCommit={onCommitRotationZ}
        />
      </FeatureLock>
    </div>
  );
}
