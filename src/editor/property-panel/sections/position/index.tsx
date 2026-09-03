"use client";

import * as React from "react";

import {
  PositionSlider,
  type PositionSliderPoint,
} from "@/editor/components/position-slider";
import {
  afterTokensCleared,
  resetPositionTokensAfterPaint,
  previewHosts,
  applyElementPositionPreview,
  applyMainBarePreviewPx,
  applyMainPositionPreview,
} from "@/editor/lib/preview-tokens";
import { EffectSlider } from "../../components/effect-slider";
import {
  allScreenshotGroupCenter,
  screenshotTileGroupCenter,
} from "@/editor/toolbar/geometry";
import { useEditor, useEditorEngine } from "@/editor/lib/engine";

import {
  bareScreenshotPositionPct,
  bareScreenshotTargetLeftTop,
  mainScreenshotOffsetForPoint,
  mainScreenshotPositionPct,
  resolveBareScreenshotPlacement,
  type StagePlacementDims,
} from "@/editor/lib/position-math";
import { clampPercent } from "@/editor/toolbar/geometry";

export function PositionSection() {
  const editor = useEditor();
  const setScale = useEditorEngine((s) => s.setScale);
  const setScreenshotScale = useEditorEngine((s) => s.setScreenshotScale);
  const setScreenshotPositionDragging = useEditorEngine(
    (s) => s.setScreenshotPositionDragging,
  );
  const updateSlot = useEditorEngine((s) => s.updateSlot);
  const setSlotGroupPosition = useEditorEngine((s) => s.setSlotGroupPosition);

  const CANVAS_SCALE_VAR = "--canvas-transform-scale";
  const SLOT_SCALE_VAR = "--slot-transform-scale";

  const selectedSlot = editor.selectedSlotId
    ? (editor.slots.find((slot) => slot.id === editor.selectedSlotId) ?? null)
    : null;
  const mainSelected = editor.isScreenshotSelected;
  const hasSlots = editor.slots.length > 0;
  const isAllTarget = hasSlots && !selectedSlot && !mainSelected;

  const hasDeviceFrame = editor.deviceFrame.id !== "none";
  const hasMainScreenshot = Boolean(editor.screenshot);
  const hasMainScreenshotBox = hasMainScreenshot || hasDeviceFrame || hasSlots;

  const isBareMainTarget =
    !selectedSlot &&
    !isAllTarget &&
    hasMainScreenshot &&
    !hasDeviceFrame &&
    editor.slots.length === 0;
  const scaleFactor = editor.scale / 100;

  const getActiveCanvasElement = React.useCallback(() => {
    if (typeof document === "undefined") return null;
    return document.querySelector<HTMLElement>(`[data-stage-id]`);
  }, []);

  const getSelectedSlotElement = React.useCallback(() => {
    if (!selectedSlot) return null;
    return (
      getActiveCanvasElement()?.querySelector<HTMLElement>(
        `[data-screenshot-id="${CSS.escape(selectedSlot.id)}"]`,
      ) ?? null
    );
  }, [getActiveCanvasElement, selectedSlot]);

  const querySlotElement = React.useCallback(
    (slotId: string) =>
      getActiveCanvasElement()?.querySelector<HTMLElement>(
        `[data-screenshot-id="${CSS.escape(slotId)}"]`,
      ) ?? null,
    [getActiveCanvasElement],
  );

  const measureMainStageDims =
    React.useCallback((): StagePlacementDims | null => {
      const image = getActiveCanvasElement()?.querySelector<HTMLElement>(
        "[data-editor-shadow-box-target]",
      );
      const stage = image?.parentElement;
      if (!image || !stage) return null;
      const computed = getComputedStyle(stage);
      const dims = {
        stageW: parseFloat(computed.width) || stage.clientWidth,
        stageH: parseFloat(computed.height) || stage.clientHeight,
        imgW: image.offsetWidth,
        imgH: image.offsetHeight,
      };
      if (!dims.stageW || !dims.stageH || !dims.imgW || !dims.imgH) return null;
      return dims;
    }, [getActiveCanvasElement]);

  const [mainStageDims, setMainStageDims] =
    React.useState<StagePlacementDims | null>(null);

  React.useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMainStageDims(isBareMainTarget ? measureMainStageDims() : null);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [
    isBareMainTarget,
    measureMainStageDims,
    editor.scale,
    editor.aspect,
    editor.screenshot,
  ]);

  const collectAllPreviewElements = React.useCallback(() => {
    const canvasElement = getActiveCanvasElement();
    if (!canvasElement) return [];

    const elements: Array<HTMLElement | null> = [...previewHosts()];
    for (const slot of editor.slots) {
      elements.push(
        canvasElement.querySelector<HTMLElement>(
          `[data-screenshot-id="${CSS.escape(slot.id)}"]`,
        ),
      );
    }
    return elements;
  }, [editor.slots, getActiveCanvasElement]);

  const currentPosition = React.useMemo<PositionSliderPoint | null>(() => {
    if (selectedSlot) {
      return {
        xPct: clampPercent(selectedSlot.xPct),
        yPct: clampPercent(selectedSlot.yPct),
      };
    }
    if (isAllTarget) {
      const center = allScreenshotGroupCenter({
        hasMainScreenshot: hasMainScreenshotBox,
        aspect: editor.aspect,
        deviceFrame: editor.deviceFrame,
        offset: editor.screenshotOffset,
        slots: editor.slots,
      });
      if (!center) return { xPct: 50, yPct: 50 };
      return {
        xPct: clampPercent(center.xPct),
        yPct: clampPercent(center.yPct),
      };
    }
    if (isBareMainTarget && mainStageDims) {
      return bareScreenshotPositionPct({
        dims: mainStageDims,
        scaleFactor,
        offset: editor.screenshotOffset,
      });
    }
    const point = mainScreenshotPositionPct({
      aspect: editor.aspect,
      deviceFrame: editor.deviceFrame,
      offset: editor.screenshotOffset,
      slots: editor.slots,
    });
    return { xPct: clampPercent(point.xPct), yPct: clampPercent(point.yPct) };
  }, [
    editor.aspect,
    editor.deviceFrame,
    editor.screenshotOffset,
    editor.slots,
    hasMainScreenshotBox,
    isAllTarget,
    isBareMainTarget,
    mainStageDims,
    scaleFactor,
    selectedSlot,
  ]);

  const previewMoveTo = React.useCallback(
    (point: PositionSliderPoint) => {
      const safePoint = {
        xPct: clampPercent(point.xPct),
        yPct: clampPercent(point.yPct),
      };

      const canvasElement = previewHosts();
      if (canvasElement.length === 0) return;

      if (selectedSlot) {
        applyElementPositionPreview(getSelectedSlotElement(), safePoint);
        return;
      }

      if (isAllTarget) {
        const currentGroupCenter = allScreenshotGroupCenter({
          hasMainScreenshot: hasMainScreenshotBox,
          aspect: editor.aspect,
          deviceFrame: editor.deviceFrame,
          offset: editor.screenshotOffset,
          slots: editor.slots,
        });
        if (!currentGroupCenter) return;

        const dx = safePoint.xPct - currentGroupCenter.xPct;
        const dy = safePoint.yPct - currentGroupCenter.yPct;

        if (hasMainScreenshotBox) {
          const mainCenter = mainScreenshotPositionPct({
            aspect: editor.aspect,
            deviceFrame: editor.deviceFrame,
            offset: editor.screenshotOffset,
            slots: editor.slots,
          });
          applyMainPositionPreview(canvasElement, {
            xPct: clampPercent(mainCenter.xPct + dx),
            yPct: clampPercent(mainCenter.yPct + dy),
          });
        }

        for (const slot of editor.slots) {
          applyElementPositionPreview(querySlotElement(slot.id), {
            xPct: clampPercent(slot.xPct + dx),
            yPct: clampPercent(slot.yPct + dy),
          });
        }
        return;
      }

      if (isBareMainTarget) {
        const dims = measureMainStageDims();
        if (dims) {
          const target = bareScreenshotTargetLeftTop(dims, safePoint);
          applyMainBarePreviewPx(canvasElement, target.left, target.top);
          return;
        }
      }
      applyMainPositionPreview(canvasElement, safePoint);
    },
    [
      editor.aspect,
      editor.deviceFrame,
      editor.screenshotOffset,
      editor.slots,
      getSelectedSlotElement,
      hasMainScreenshotBox,
      isAllTarget,
      isBareMainTarget,
      measureMainStageDims,
      querySlotElement,
      selectedSlot,
    ],
  );

  const moveTo = React.useCallback(
    (point: PositionSliderPoint) => {
      const safePoint = {
        xPct: clampPercent(point.xPct),
        yPct: clampPercent(point.yPct),
      };

      const roots = previewHosts();

      if (selectedSlot) {
        const slotElement = getSelectedSlotElement();
        try {
          updateSlot(selectedSlot.id, safePoint);
        } finally {
          resetPositionTokensAfterPaint([slotElement]);
        }
        return;
      }

      try {
        if (isAllTarget) {
          const currentGroupCenter = allScreenshotGroupCenter({
            hasMainScreenshot: hasMainScreenshotBox,
            aspect: editor.aspect,
            deviceFrame: editor.deviceFrame,
            offset: editor.screenshotOffset,
            slots: editor.slots,
          });
          if (!currentGroupCenter) return;

          const dx = safePoint.xPct - currentGroupCenter.xPct;
          const dy = safePoint.yPct - currentGroupCenter.yPct;

          if (hasMainScreenshotBox) {
            const mainCenter = mainScreenshotPositionPct({
              aspect: editor.aspect,
              deviceFrame: editor.deviceFrame,
              offset: editor.screenshotOffset,
              slots: editor.slots,
            });
            const nextMain = {
              xPct: mainCenter.xPct + dx,
              yPct: mainCenter.yPct + dy,
            };
            editor.setScreenshotPlacement(
              mainScreenshotOffsetForPoint({
                aspect: editor.aspect,
                deviceFrame: editor.deviceFrame,
                slots: editor.slots,
                point: nextMain,
              }),
            );
          }

          if (editor.slots.length > 0) {
            const slotCenter = screenshotTileGroupCenter(editor.slots);
            if (slotCenter) {
              setSlotGroupPosition({
                xPct: slotCenter.xPct + dx,
                yPct: slotCenter.yPct + dy,
              });
            }
          }
          return;
        }

        if (isBareMainTarget) {
          const dims = measureMainStageDims();
          if (dims) {
            const placement = resolveBareScreenshotPlacement({
              dims,
              scaleFactor,
              point: safePoint,
            });
            editor.setScreenshotPlacement(placement.offset);
            return;
          }
        }
        editor.setScreenshotPlacement(
          mainScreenshotOffsetForPoint({
            aspect: editor.aspect,
            deviceFrame: editor.deviceFrame,
            slots: editor.slots,
            point: safePoint,
          }),
        );
      } finally {
        resetPositionTokensAfterPaint(
          isAllTarget ? collectAllPreviewElements() : roots,
        );
      }
    },
    [
      collectAllPreviewElements,
      editor,
      getSelectedSlotElement,
      hasMainScreenshotBox,
      isAllTarget,
      isBareMainTarget,
      measureMainStageDims,
      scaleFactor,
      selectedSlot,
      setSlotGroupPosition,
      updateSlot,
    ],
  );

  const zoom = selectedSlot ? selectedSlot.scale : editor.scale;

  const getZoomTargets = React.useCallback((): Array<{
    el: HTMLElement;
    scaleVar: string;
  }> => {
    const roots = previewHosts();
    if (roots.length === 0) return [];

    const slotIn = (root: HTMLElement, slotId: string) =>
      root.querySelector<HTMLElement>(
        `[data-screenshot-id="${CSS.escape(slotId)}"]`,
      );

    if (selectedSlot) {
      return roots.flatMap((root) => {
        const el = slotIn(root, selectedSlot.id);
        return el ? [{ el, scaleVar: SLOT_SCALE_VAR }] : [];
      });
    }
    if (!isAllTarget)
      return roots.map((el) => ({ el, scaleVar: CANVAS_SCALE_VAR }));

    return roots.flatMap((root) => {
      const targets: Array<{ el: HTMLElement; scaleVar: string }> = [
        { el: root, scaleVar: CANVAS_SCALE_VAR },
      ];
      for (const slot of editor.slots) {
        const el = slotIn(root, slot.id);
        if (el) targets.push({ el, scaleVar: SLOT_SCALE_VAR });
      }
      return targets;
    });
  }, [editor.slots, isAllTarget, selectedSlot]);

  const previewScale = React.useCallback(
    (next: number) => {
      for (const { el, scaleVar } of getZoomTargets()) {
        el.style.setProperty(scaleVar, String(next / 100));
      }
    },
    [getZoomTargets],
  );

  const commitScale = React.useCallback(
    (next: number) => {
      const targets = getZoomTargets();

      if (selectedSlot) updateSlot(selectedSlot.id, { scale: next });
      else if (isAllTarget) setScreenshotScale(next);
      else setScale(next);

      if (targets.length === 0) return;
      const clear = () => {
        for (const { el, scaleVar } of targets) {
          el.style.removeProperty(scaleVar);
        }
      };
      if (typeof requestAnimationFrame === "undefined") {
        clear();
        return;
      }
      requestAnimationFrame(clear);
    },
    [
      getZoomTargets,
      isAllTarget,
      selectedSlot,
      setScale,
      setScreenshotScale,
      updateSlot,
    ],
  );

  return (
    <div className="space-y-3">
      <PositionSlider
        ariaLabel={
          isAllTarget
            ? "Position all screenshots"
            : selectedSlot
              ? "Position screenshot box"
              : "Position screenshot"
        }
        value={currentPosition}
        onPreview={(point) => {
          setScreenshotPositionDragging(true);
          previewMoveTo(point);
        }}
        onChange={(point) => {
          moveTo(point);

          afterTokensCleared(() => setScreenshotPositionDragging(false));
        }}
      />
      <EffectSlider
        label="Zoom"
        value={zoom}
        onChange={commitScale}
        onPreview={previewScale}
        min={10}
        max={300}
        suffix="%"
      />
    </div>
  );
}
