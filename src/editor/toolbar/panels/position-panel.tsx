import { useEditor, useEditorEngine } from "@/editor/lib/engine";
import { cn } from "@/lib/utils";

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
import {
  bareScreenshotPositionPct,
  bareScreenshotTargetLeftTop,
  resolveBareScreenshotPlacement,
  type StagePlacementDims,
} from "@/editor/lib/position-math";

import {
  allScreenshotGroupCenter,
  clampPercent,
  mainScreenshotOffsetForPoint,
  mainScreenshotPositionPct,
  screenshotTileGroupCenter,
} from "../geometry";
import React from "react";
import { Group } from "lucide-react";
import { AlignOptions } from "@/editor/lib/alignment";
import { Tooltip } from "@/components/tooltip";

type PositionPanelProps = {
  targetLabel: string;
  showHeader?: boolean;
};

const PositionPanel = ({
  targetLabel,
  showHeader = true,
}: PositionPanelProps) => {
  const {
    aspect,
    screenshotOffset,
    setScreenshotPlacement,
    screenshot,
    deviceFrame,
    scale,
    selectedTextId,
    selectedAssetId,
    selectedAnnotationShapeId,
    texts,
    assets,
    annotationShapes,
    updateText,
    updateAsset,
    updateAnnotationShape,
    slots,
    updateSlot,
    setSlotGroupPosition,
  } = useEditor();

  const selectedText = selectedTextId
    ? texts.find((t) => t.id === selectedTextId)
    : null;
  const selectedAsset = selectedAssetId
    ? assets.find((a) => a.id === selectedAssetId)
    : null;
  const selectedAnnotation = selectedAnnotationShapeId
    ? annotationShapes.find((s) => s.id === selectedAnnotationShapeId)
    : null;
  const selectedSlotId = useEditorEngine((s) => s.selectedSlotId);
  const selectedSlot = selectedSlotId
    ? slots.find((slot) => slot.id === selectedSlotId)
    : null;

  const setScreenshotPositionDragging = useEditorEngine(
    (s) => s.setScreenshotPositionDragging,
  );

  const isScreenshotSelected = useEditorEngine((s) => s.isScreenshotSelected);

  const [groupAllScreenshots, setGroupAllScreenshots] = React.useState(false);

  type PositionTarget =
    | "text"
    | "asset"
    | "annotation"
    | "slot"
    | "slotGroup"
    | "screenshot"
    | "allScreenshots"
    | null;

  const activeFrame = deviceFrame;
  const hasDeviceFrame = activeFrame.id !== "none";
  const hasMainScreenshotTarget =
    Boolean(screenshot) || hasDeviceFrame || slots.length > 0;
  const hasMainScreenshot = Boolean(screenshot) || hasDeviceFrame;
  const hasAnyScreenshotContent =
    Boolean(screenshot) || hasDeviceFrame || slots.length > 0;

  const hasMainScreenshotBox = hasMainScreenshot || slots.length > 0;
  const screenshotBoxCount = (hasMainScreenshotBox ? 1 : 0) + slots.length;
  const canGroupAllScreenshots = screenshotBoxCount > 1;
  const hasIndividualSelection =
    Boolean(selectedText) ||
    Boolean(selectedAsset) ||
    Boolean(selectedAnnotation) ||
    Boolean(selectedSlot) ||
    (isScreenshotSelected && hasMainScreenshotTarget);
  const positionTarget: PositionTarget =
    groupAllScreenshots && canGroupAllScreenshots && hasAnyScreenshotContent
      ? "allScreenshots"
      : selectedText
        ? "text"
        : selectedAsset
          ? "asset"
          : selectedAnnotation
            ? "annotation"
            : selectedSlot
              ? "slot"
              : isScreenshotSelected && hasMainScreenshotTarget
                ? "screenshot"
                : canGroupAllScreenshots && hasAnyScreenshotContent
                  ? "allScreenshots"
                  : slots.length > 0
                    ? "slotGroup"
                    : screenshot || hasDeviceFrame
                      ? "screenshot"
                      : null;

  const isBareMainTarget =
    positionTarget === "screenshot" &&
    !hasDeviceFrame &&
    slots.length === 0 &&
    Boolean(screenshot);
  const scaleFactor = scale / 100;

  const measureMainStageDims =
    React.useCallback((): StagePlacementDims | null => {
      if (typeof document === "undefined") return null;
      const canvasElement =
        document.querySelector<HTMLElement>(`[data-stage-id]`);
      const image = canvasElement?.querySelector<HTMLElement>(
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
    }, []);

  const [mainStageDims, setMainStageDims] =
    React.useState<StagePlacementDims | null>(null);

  React.useLayoutEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setMainStageDims(isBareMainTarget ? measureMainStageDims() : null);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isBareMainTarget, measureMainStageDims, scale, aspect, screenshot]);

  const currentPositionPoint = React.useMemo<PositionSliderPoint | null>(() => {
    let xPct: number;
    let yPct: number;
    if (positionTarget === "text" && selectedText) {
      xPct = selectedText.xPct;
      yPct = selectedText.yPct;
    } else if (positionTarget === "asset" && selectedAsset) {
      xPct = selectedAsset.xPct;
      yPct = selectedAsset.yPct;
    } else if (positionTarget === "annotation" && selectedAnnotation) {
      xPct = selectedAnnotation.xPct;
      yPct = selectedAnnotation.yPct;
    } else if (positionTarget === "slot" && selectedSlot) {
      xPct = selectedSlot.xPct;
      yPct = selectedSlot.yPct;
    } else if (positionTarget === "slotGroup") {
      if (slots.length === 0) return null;
      const bounds = slots.reduce(
        (acc, slot) => ({
          minX: Math.min(acc.minX, slot.xPct - slot.widthPct / 2),
          maxX: Math.max(acc.maxX, slot.xPct + slot.widthPct / 2),
          minY: Math.min(acc.minY, slot.yPct - slot.heightPct / 2),
          maxY: Math.max(acc.maxY, slot.yPct + slot.heightPct / 2),
        }),
        {
          minX: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY,
        },
      );
      xPct = (bounds.minX + bounds.maxX) / 2;
      yPct = (bounds.minY + bounds.maxY) / 2;
    } else if (positionTarget === "allScreenshots") {
      const center = allScreenshotGroupCenter({
        hasMainScreenshot: hasMainScreenshotBox,
        aspect,
        deviceFrame,
        offset: screenshotOffset,
        slots: slots,
      });
      if (!center) return null;
      return {
        xPct: clampPercent(center.xPct),
        yPct: clampPercent(center.yPct),
      };
    } else if (positionTarget === "screenshot") {
      if (isBareMainTarget && mainStageDims) {
        return bareScreenshotPositionPct({
          dims: mainStageDims,
          scaleFactor,
          offset: screenshotOffset,
        });
      }
      const point = mainScreenshotPositionPct({
        aspect,
        deviceFrame,
        offset: screenshotOffset,
        slots: slots,
      });
      return { xPct: clampPercent(point.xPct), yPct: clampPercent(point.yPct) };
    } else {
      return null;
    }
    return { xPct: clampPercent(xPct), yPct: clampPercent(yPct) };
  }, [
    positionTarget,
    selectedText,
    selectedAsset,
    selectedAnnotation,
    selectedSlot,
    slots,
    aspect,
    deviceFrame,
    screenshotOffset,
    hasMainScreenshotBox,
    isBareMainTarget,
    mainStageDims,
    scaleFactor,
  ]);

  const getActiveCanvasElement = React.useCallback(() => {
    if (typeof document === "undefined") return null;
    return document.querySelector<HTMLElement>(`[data-stage-id]`);
  }, []);

  const queryActiveCanvasElement = React.useCallback(
    (selector: string) =>
      getActiveCanvasElement()?.querySelector<HTMLElement>(selector) ?? null,
    [getActiveCanvasElement],
  );

  const previewPositionPoint = React.useCallback(
    (point: PositionSliderPoint) => {
      const safePoint = {
        xPct: clampPercent(point.xPct),
        yPct: clampPercent(point.yPct),
      };
      const canvasElement = getActiveCanvasElement();
      if (!canvasElement) return;
      const mainPreviewRoots = previewHosts();

      if (positionTarget === "text" && selectedTextId) {
        applyElementPositionPreview(
          queryActiveCanvasElement(
            `[data-text-element-id="${CSS.escape(selectedTextId)}"]`,
          ),
          safePoint,
        );
        return;
      }
      if (positionTarget === "asset" && selectedAssetId) {
        applyElementPositionPreview(
          queryActiveCanvasElement(
            `[data-asset-ref="${CSS.escape(selectedAssetId)}"]`,
          ),
          safePoint,
        );
        return;
      }
      if (positionTarget === "annotation" && selectedAnnotationShapeId) {
        applyElementPositionPreview(
          queryActiveCanvasElement(
            `[data-shape-ref="${CSS.escape(selectedAnnotationShapeId)}"]`,
          ),
          safePoint,
        );
        return;
      }
      if (positionTarget === "slot" && selectedSlot) {
        applyElementPositionPreview(
          queryActiveCanvasElement(
            `[data-screenshot-id="${CSS.escape(selectedSlot.id)}"]`,
          ),
          safePoint,
        );
        return;
      }
      if (positionTarget === "slotGroup") {
        const center = screenshotTileGroupCenter(slots);
        if (!center) return;
        const dx = safePoint.xPct - center.xPct;
        const dy = safePoint.yPct - center.yPct;
        for (const slot of slots) {
          applyElementPositionPreview(
            queryActiveCanvasElement(
              `[data-screenshot-id="${CSS.escape(slot.id)}"]`,
            ),
            {
              xPct: clampPercent(slot.xPct + dx),
              yPct: clampPercent(slot.yPct + dy),
            },
          );
        }
        return;
      }
      if (positionTarget === "screenshot") {
        if (isBareMainTarget) {
          const dims = measureMainStageDims();
          if (dims) {
            const target = bareScreenshotTargetLeftTop(dims, safePoint);
            applyMainBarePreviewPx(mainPreviewRoots, target.left, target.top);
            return;
          }
        }
        applyMainPositionPreview(mainPreviewRoots, safePoint);
        return;
      }
      if (positionTarget === "allScreenshots") {
        const currentGroupCenter = allScreenshotGroupCenter({
          hasMainScreenshot: hasMainScreenshotBox,
          aspect,
          deviceFrame,
          offset: screenshotOffset,
          slots: slots,
        });
        if (!currentGroupCenter) return;

        const dx = safePoint.xPct - currentGroupCenter.xPct;
        const dy = safePoint.yPct - currentGroupCenter.yPct;

        if (hasMainScreenshotBox) {
          const mainCenter = mainScreenshotPositionPct({
            aspect,
            deviceFrame,
            offset: screenshotOffset,
            slots: slots,
          });
          applyMainPositionPreview(mainPreviewRoots, {
            xPct: clampPercent(mainCenter.xPct + dx),
            yPct: clampPercent(mainCenter.yPct + dy),
          });
        }

        for (const slot of slots) {
          applyElementPositionPreview(
            queryActiveCanvasElement(
              `[data-screenshot-id="${CSS.escape(slot.id)}"]`,
            ),
            {
              xPct: clampPercent(slot.xPct + dx),
              yPct: clampPercent(slot.yPct + dy),
            },
          );
        }
      }
    },
    [
      aspect,
      deviceFrame,
      getActiveCanvasElement,
      hasMainScreenshotBox,
      isBareMainTarget,
      measureMainStageDims,
      positionTarget,
      queryActiveCanvasElement,
      screenshotOffset,
      slots,
      selectedAnnotationShapeId,
      selectedAssetId,
      selectedSlot,
      selectedTextId,
    ],
  );

  const collectPositionPreviewElements = React.useCallback(() => {
    const canvasElement = getActiveCanvasElement();
    if (!canvasElement) return [];

    const elements: Array<HTMLElement | null> = [...previewHosts()];
    if (selectedTextId) {
      elements.push(
        canvasElement.querySelector<HTMLElement>(
          `[data-text-element-id="${CSS.escape(selectedTextId)}"]`,
        ),
      );
    }
    if (selectedAssetId) {
      elements.push(
        canvasElement.querySelector<HTMLElement>(
          `[data-asset-ref="${CSS.escape(selectedAssetId)}"]`,
        ),
      );
    }
    if (selectedAnnotationShapeId) {
      elements.push(
        canvasElement.querySelector<HTMLElement>(
          `[data-shape-ref="${CSS.escape(selectedAnnotationShapeId)}"]`,
        ),
      );
    }
    for (const slot of slots) {
      elements.push(
        canvasElement.querySelector<HTMLElement>(
          `[data-screenshot-id="${CSS.escape(slot.id)}"]`,
        ),
      );
    }
    return elements;
  }, [
    getActiveCanvasElement,
    slots,
    selectedAnnotationShapeId,
    selectedAssetId,
    selectedTextId,
  ]);

  const applyPositionPoint = React.useCallback(
    (point: PositionSliderPoint) => {
      const safePoint = {
        xPct: clampPercent(point.xPct),
        yPct: clampPercent(point.yPct),
      };

      const emitHideFloatingToolbar = (
        kind: "text" | "asset" | "annotation" | "slot" | "screenshot",
        id: string,
      ) => {
        window.dispatchEvent(
          new CustomEvent("@editor/hide-element-toolbar", {
            detail: { kind, id, durationMs: 320 },
          }),
        );
      };
      const latest = useEditorEngine.getState();
      const latestSlotId = latest.selectedSlotId;
      const latestSelectedSlot = latestSlotId
        ? (latest.present.slots.find((s) => s.id === latestSlotId) ?? null)
        : null;
      if (positionTarget === "text" && selectedTextId) {
        emitHideFloatingToolbar("text", selectedTextId);
        updateText(selectedTextId, safePoint);
      } else if (positionTarget === "asset" && selectedAssetId) {
        emitHideFloatingToolbar("asset", selectedAssetId);
        updateAsset(selectedAssetId, safePoint);
      } else if (positionTarget === "annotation" && selectedAnnotationShapeId) {
        emitHideFloatingToolbar("annotation", selectedAnnotationShapeId);
        updateAnnotationShape(selectedAnnotationShapeId, safePoint);
      } else if (positionTarget === "slot" && latestSelectedSlot) {
        emitHideFloatingToolbar("slot", latestSelectedSlot.id);
        updateSlot(latestSelectedSlot.id, safePoint);
      } else if (positionTarget === "slotGroup" && !latestSelectedSlot) {
        setSlotGroupPosition(safePoint);
      } else if (positionTarget === "screenshot") {
        emitHideFloatingToolbar("screenshot", "");
        const dims = isBareMainTarget ? measureMainStageDims() : null;
        if (dims) {
          const placement = resolveBareScreenshotPlacement({
            dims,
            scaleFactor,
            point: safePoint,
          });
          setScreenshotPlacement(placement.offset);
        } else {
          setScreenshotPlacement(
            mainScreenshotOffsetForPoint({
              aspect,
              deviceFrame,
              slots: slots,
              point: safePoint,
            }),
          );
        }
      } else if (positionTarget === "allScreenshots") {
        const currentGroupCenter = allScreenshotGroupCenter({
          hasMainScreenshot: hasMainScreenshotBox,
          aspect,
          deviceFrame,
          offset: screenshotOffset,
          slots: slots,
        });
        if (!currentGroupCenter) return;

        const dx = safePoint.xPct - currentGroupCenter.xPct;
        const dy = safePoint.yPct - currentGroupCenter.yPct;

        if (hasMainScreenshotBox) {
          const mainCenter = mainScreenshotPositionPct({
            aspect,
            deviceFrame,
            offset: screenshotOffset,
            slots: slots,
          });
          setScreenshotPlacement(
            mainScreenshotOffsetForPoint({
              aspect,
              deviceFrame,
              slots: slots,
              point: {
                xPct: mainCenter.xPct + dx,
                yPct: mainCenter.yPct + dy,
              },
            }),
          );
        }

        if (slots.length > 0) {
          const slotCenter = screenshotTileGroupCenter(slots);
          if (slotCenter) {
            setSlotGroupPosition({
              xPct: slotCenter.xPct + dx,
              yPct: slotCenter.yPct + dy,
            });
          }
        }
      }
      resetPositionTokensAfterPaint(collectPositionPreviewElements());
    },
    [
      aspect,
      collectPositionPreviewElements,
      deviceFrame,
      hasMainScreenshotBox,
      isBareMainTarget,
      measureMainStageDims,
      positionTarget,
      scaleFactor,
      screenshotOffset,
      slots,
      selectedAnnotationShapeId,
      selectedAssetId,
      selectedTextId,
      setScreenshotPlacement,
      setSlotGroupPosition,
      updateAnnotationShape,
      updateAsset,
      updateSlot,
      updateText,
    ],
  );

  const handleAlign = (xPct: number | null, yPct: number | null) => {
    if (!currentPositionPoint) return;
    const nextPoint = {
      xPct: xPct !== null ? xPct : currentPositionPoint.xPct,
      yPct: yPct !== null ? yPct : currentPositionPoint.yPct,
    };
    applyPositionPoint(nextPoint);
    afterTokensCleared(() => setScreenshotPositionDragging(false));
  };
  return (
    <div className="flex w-full flex-col gap-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {targetLabel}
          </span>
          {currentPositionPoint && (
            <div className="flex gap-2 text-[10px] font-medium text-muted-foreground tabular-nums">
              <span id="position-panel-x-readout">
                X: {Math.round(currentPositionPoint.xPct)}%
              </span>
              <span id="position-panel-y-readout">
                Y: {Math.round(currentPositionPoint.yPct)}%
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-border/40 bg-overlay/40 p-1 shadow-inner">
        {AlignOptions.map(({ icon: Icon, label, to }, i) => {
          return (
            <React.Fragment key={label}>
              <Tooltip content={label} noDelay>
                <button
                  type="button"
                  onClick={() => handleAlign(to.xPct, to.yPct)}
                  className="flex size-7 items-center justify-center rounded-md text-foreground/70 transition-all hover:bg-foreground/10 hover:text-foreground"
                >
                  <Icon className="size-4" />
                </button>
              </Tooltip>
              {i === 2 && <span className="mx-1 h-4 w-px bg-foreground/10" />}
            </React.Fragment>
          );
        })}
      </div>

      {canGroupAllScreenshots && hasIndividualSelection ? (
        <button
          type="button"
          onClick={() => setGroupAllScreenshots((v) => !v)}
          className={cn(
            "flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-[11px] transition-all",
            groupAllScreenshots
              ? "border-primary/40 bg-primary/15 text-primary ring-1 ring-primary/30 shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_20%,transparent)]"
              : "border-foreground/15 bg-overlay/40 text-muted-foreground hover:border-foreground/20 hover:text-foreground",
          )}
          aria-pressed={groupAllScreenshots}
        >
          <span className="flex items-center gap-2">
            <Group className="size-3.5" />
            Group all screenshots
          </span>
          <span
            className={cn(
              "inline-flex h-3.5 w-6 items-center rounded-full p-0.5 transition-colors",
              groupAllScreenshots ? "bg-primary" : "bg-foreground/20",
            )}
          >
            <span
              className={cn(
                "block size-2.5 rounded-full bg-surface-secondary transition-transform",
                groupAllScreenshots && "translate-x-2.5",
              )}
            />
          </span>
        </button>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-foreground/15 shadow-lg">
        <PositionSlider
          ariaLabel={targetLabel}
          disabled={positionTarget === null}
          value={currentPositionPoint}
          className="border-0 shadow-none bg-overlay/60"
          onPreview={(point) => {
            const xEl = document.getElementById("position-panel-x-readout");
            const yEl = document.getElementById("position-panel-y-readout");
            if (xEl) xEl.textContent = `X: ${Math.round(point.xPct)}%`;
            if (yEl) yEl.textContent = `Y: ${Math.round(point.yPct)}%`;
            setScreenshotPositionDragging(true);
            try {
              previewPositionPoint(point);
            } catch (e) {
              console.error("Preview Point Error", e);
            }
          }}
          onChange={(point) => {
            applyPositionPoint(point);
            afterTokensCleared(() => setScreenshotPositionDragging(false));
          }}
        />
      </div>
    </div>
  );
};

export default PositionPanel;
