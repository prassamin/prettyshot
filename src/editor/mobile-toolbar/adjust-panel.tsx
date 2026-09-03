"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";

import { useEditorEngine, useEditorStateField } from "@/editor/lib/engine";
import { previewHosts, writeToken } from "@/editor/lib/preview-tokens";

import { AdjustmentsControl } from "../property-panel/sections/backdrop/adjustments-control";
import {
  TOKEN_BACKDROP_FX_PREVIEW,
  TOKEN_BACKDROP_NOISE_PREVIEW,
  DEFAULT_ADJUSTMENTS,
} from "../property-panel/sections/backdrop/constants";
import {
  buildAdjustmentsFilterCss,
  checkAdjustmentsDirty,
} from "../property-panel/sections/backdrop/utils";

export function MobileAdjustPanel() {
  const backdropState = useEditorStateField((canvas) => canvas.backdrop);
  const setBackdropAdjustments = useEditorEngine(
    (engine) => engine.setBackdropAdjustments,
  );

  const { effects } = backdropState;

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

  const isAdjustmentsDirty = checkAdjustmentsDirty(effects);

  return (
    <div className="flex w-full flex-col gap-3 px-1 pt-1 pb-5 select-none text-foreground">
      {isAdjustmentsDirty && (
        <div className="flex items-center justify-end px-0.5">
          <button
            type="button"
            onClick={() => setBackdropAdjustments(DEFAULT_ADJUSTMENTS)}
            className="flex items-center gap-1 rounded-full border border-border/70 bg-surface-tertiary/80 px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface-secondary transition-colors shadow-2xs"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </button>
        </div>
      )}

      <AdjustmentsControl
        effects={effects}
        commitEffects={handleCommitAdjustments}
        previewEffects={handlePreviewAdjustments}
      />
    </div>
  );
}
