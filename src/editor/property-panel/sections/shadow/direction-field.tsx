"use client";

import * as React from "react";

import {
  PositionSlider,
  type PositionSliderPoint,
} from "@/editor/components/position-slider";
import type { DirectionFieldProps } from "./types";
import { formatLightCoordinate, parseLightCoordinate } from "./utils";
import { AlignOptions } from "@/editor/lib/alignment";
import { Tooltip } from "@/components/tooltip";

export function DirectionField({
  disabled,
  lightSource,
  onChange,
  onPreview,
}: DirectionFieldProps) {
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

  const handleAlign = React.useCallback(
    (targetXPct: number | null, targetYPct: number | null) => {
      if (disabled) return;
      const nextPoint: PositionSliderPoint = {
        xPct: targetXPct !== null ? targetXPct : activePoint.xPct,
        yPct: targetYPct !== null ? targetYPct : activePoint.yPct,
      };
      onChange(pointToToken(nextPoint));
    },
    [disabled, activePoint, onChange, pointToToken],
  );

  return (
    <div className="space-y-2">
      {/* Subheader */}
      <span className="block text-[11px] font-medium text-muted-foreground">
        Shadow Direction
      </span>

      {/* Alignment Bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-muted p-0.5 shadow-2xs">
        {AlignOptions.map(({ icon: Icon, label, to }, idx) => {
          return (
            <React.Fragment key={label}>
              <Tooltip content={label} noDelay>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleAlign(to.xPct, to.yPct)}
                  className="flex size-6.5 cursor-pointer items-center justify-center rounded text-muted-foreground transition-all hover:bg-surface-secondary hover:text-foreground hover:shadow-2xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon className="size-3.5" />
                </button>
              </Tooltip>
              {idx === 2 && <span className="mx-0.5 h-3.5 w-px bg-border" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* 2D Position Slider */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        <PositionSlider
          ariaLabel="Shadow direction pad"
          value={activePoint}
          disabled={disabled}
          className="h-28 border-0 bg-surface shadow-none"
          onPreview={(point) => onPreview(pointToToken(point))}
          onChange={(point) => onChange(pointToToken(point))}
        />
      </div>
    </div>
  );
}
