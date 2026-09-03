"use client";

import * as React from "react";

import { useScreenshotStyleTarget } from "../../hooks/use-screenshot-style-target";
import { useEditorStateField, useEditorEngine } from "@/editor/lib/engine";
import { editorValueSchemas } from "@/editor/lib/value-schemas";
import { previewHosts, writeToken } from "@/editor/lib/preview-tokens";
import { TOKEN_CANVAS_CORNER_RADIUS } from "../backdrop/constants";

import { PADDING_PREVIEW_CSS_VAR } from "./constants";
import type { Tilt, TransformAxis, TransformLiveTarget } from "./types";
import {
  broadcastLiveTransform,
  clearAllLiveTransforms,
  executeNextFrame,
} from "./utils";
import { LayoutControl } from "./layout-control";
import { OrientationControl } from "./orientation-control";

export function TransformSection() {
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
  const isAnimateMode = useEditorEngine((s) => s.isAnimateMode);
  const selectedSlotId = useEditorEngine((s) => s.selectedSlotId);
  const selectedTextId = useEditorEngine((s) => s.selectedTextId);
  const canvasRadiusDisabled =
    isAnimateMode && (selectedSlotId != null || selectedTextId != null);

  const activeTilt = selectedSlot?.tilt ?? canvasTilt;
  const activeScale = selectedSlot?.scale ?? canvasScale;
  const activePadding = selectedSlot?.padding ?? canvasPadding;
  const activeRotationZ = selectedSlot ? selectedSlot.rotation : activeTilt.rz;

  // ── Canvas Inset Live Preview ───────────────────────────────────────
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

  // ── 3D Tilt & Scale Live Preview ─────────────────────────────────────
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
    (nextScale: number) => {
      const validatedScale = editorValueSchemas.scale
        .catch(100)
        .parse(nextScale);
      applyStyle({ scale: validatedScale });
      clearTransformAxesAfterPaint(["scale"]);
    },
    [applyStyle, clearTransformAxesAfterPaint],
  );

  const handlePreviewRotationZ = React.useCallback(
    (degrees: number) => {
      if (selectedSlot) {
        for (const liveTarget of resolveTransformTargetElements()) {
          broadcastLiveTransform(liveTarget, "rot", `${degrees}deg`);
        }
        return;
      }

      for (const liveTarget of resolveTransformTargetElements()) {
        const axisKey: TransformAxis =
          liveTarget.scope === "slot" ? "rot" : "rz";
        broadcastLiveTransform(liveTarget, axisKey, `${degrees}deg`);
      }
    },
    [resolveTransformTargetElements, selectedSlot],
  );

  const handleCommitRotationZ = React.useCallback(
    (degrees: number) => {
      const validatedRotation = editorValueSchemas.degree
        .catch(0)
        .parse(degrees);
      applyStyle({ rotation: validatedRotation });
      clearTransformAxesAfterPaint(["rx", "ry", "rz", "rot"]);
    },
    [applyStyle, clearTransformAxesAfterPaint],
  );

  const handlePreviewCanvasRadius = React.useCallback((radiusVal: number) => {
    writeToken(previewHosts(), TOKEN_CANVAS_CORNER_RADIUS, `${radiusVal}px`);
  }, []);

  const handleCommitCanvasRadius = React.useCallback(
    (radiusVal: number) => {
      setCanvasBorderRadius(radiusVal);
      executeNextFrame(() =>
        writeToken(previewHosts(), TOKEN_CANVAS_CORNER_RADIUS, null),
      );
    },
    [setCanvasBorderRadius],
  );

  return (
    <div className="space-y-4">
      {/* Layout & Inset Size Controls */}
      <LayoutControl
        inset={activePadding}
        scale={activeScale}
        borderRadius={canvasBorderRadius}
        canvasRadiusDisabled={canvasRadiusDisabled}
        onPreviewInset={updatePaddingLivePreview}
        onCommitInset={handleCommitInset}
        onPreviewScale={handlePreviewScale}
        onCommitScale={handleCommitScale}
        onPreviewCanvasRadius={handlePreviewCanvasRadius}
        onCommitCanvasRadius={handleCommitCanvasRadius}
      />

      <div className="h-px bg-border/40" />

      {/* 3D Space Orientation Controls */}
      <OrientationControl
        tilt={activeTilt}
        rotationZ={activeRotationZ}
        onPreviewTilt={handlePreviewTilt}
        onCommitTilt={handleCommitTilt}
        onPreviewRotationZ={handlePreviewRotationZ}
        onCommitRotationZ={handleCommitRotationZ}
      />
    </div>
  );
}
