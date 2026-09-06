"use client";

import * as React from "react";
import { Focus, Group } from "lucide-react";

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
} from "@/editor/toolbar/geometry";
import { useEditor, useEditorEngine } from "@/editor/lib/engine";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/tooltip";
import { AlignOptions } from "../lib/alignment";

export function MobileMovePanel() {
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

  const setActiveTool = useEditorEngine((s) => s.setActiveTool);
  const setScreenshotPositionDragging = useEditorEngine(
    (s) => s.setScreenshotPositionDragging,
  );
  const selectedSlotId = useEditorEngine((s) => s.selectedSlotId);
  const isScreenshotSelected = useEditorEngine((s) => s.isScreenshotSelected);

  React.useEffect(() => {
    setActiveTool("position");
    return () => setActiveTool("pointer");
  }, [setActiveTool]);

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

  const selectedText = selectedTextId
    ? texts.find((t) => t.id === selectedTextId)
    : null;
  const selectedAsset = selectedAssetId
    ? assets.find((a) => a.id === selectedAssetId)
    : null;
  const selectedAnnotation = selectedAnnotationShapeId
    ? annotationShapes.find((s) => s.id === selectedAnnotationShapeId)
    : null;
  const selectedSlot = selectedSlotId
    ? slots.find((slot) => slot.id === selectedSlotId)
    : null;

  const activeFrame = deviceFrame;
  const hasDeviceFrame = activeFrame.id !== "none";
  const hasMainScreenshot = Boolean(screenshot) || hasDeviceFrame;
  const hasAnyScreenshotContent =
    Boolean(screenshot) || hasDeviceFrame || slots.length > 0;
  const hasMainScreenshotTarget =
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

  const targetLabel =
    positionTarget === "text"
      ? "Text"
      : positionTarget === "asset"
        ? "Image"
        : positionTarget === "annotation"
          ? "Annotation"
          : positionTarget === "slot"
            ? "Screenshot Box"
            : positionTarget === "allScreenshots"
              ? "All Screenshots"
              : positionTarget === "slotGroup"
                ? "Screenshot Boxes"
                : positionTarget === "screenshot"
                  ? hasDeviceFrame
                    ? "Device Frame"
                    : "Screenshot"
                  : "Target";

  const getActiveCanvasElement = React.useCallback(() => {
    if (typeof document === "undefined") return null;
    return document.querySelector<HTMLElement>(`[data-stage-id]`);
  }, []);

  const measureMainStageDims =
    React.useCallback((): StagePlacementDims | null => {
      const canvasElement = getActiveCanvasElement();
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
    }, [getActiveCanvasElement]);

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
    aspect,
    deviceFrame,
    hasMainScreenshotBox,
    isBareMainTarget,
    mainStageDims,
    positionTarget,
    scaleFactor,
    screenshotOffset,
    slots,
    selectedAnnotation,
    selectedAsset,
    selectedSlot,
    selectedText,
  ]);

  const previewPositionPoint = React.useCallback(
    (point: PositionSliderPoint) => {
      const canvasElement = getActiveCanvasElement();
      if (!canvasElement) return;

      const safePoint = {
        xPct: clampPercent(point.xPct),
        yPct: clampPercent(point.yPct),
      };

      const latest = useEditorEngine.getState();
      const latestSlotId = latest.selectedSlotId;
      const latestSelectedSlot = latestSlotId
        ? (latest.present.slots.find((s) => s.id === latestSlotId) ?? null)
        : null;

      if (positionTarget === "text" && selectedTextId) {
        applyElementPositionPreview(
          canvasElement.querySelector<HTMLElement>(
            `[data-text-element-id="${CSS.escape(selectedTextId)}"]`,
          ),
          safePoint,
        );
        return;
      }

      if (positionTarget === "asset" && selectedAssetId) {
        applyElementPositionPreview(
          canvasElement.querySelector<HTMLElement>(
            `[data-asset-ref="${CSS.escape(selectedAssetId)}"]`,
          ),
          safePoint,
        );
        return;
      }

      if (positionTarget === "annotation" && selectedAnnotationShapeId) {
        applyElementPositionPreview(
          canvasElement.querySelector<HTMLElement>(
            `[data-shape-ref="${CSS.escape(selectedAnnotationShapeId)}"]`,
          ),
          safePoint,
        );
        return;
      }

      if (positionTarget === "slot" && latestSelectedSlot) {
        applyElementPositionPreview(
          canvasElement.querySelector<HTMLElement>(
            `[data-screenshot-id="${CSS.escape(latestSelectedSlot.id)}"]`,
          ),
          safePoint,
        );
        return;
      }

      const mainRoots = previewHosts();

      if (positionTarget === "screenshot") {
        if (isBareMainTarget) {
          const dims = measureMainStageDims();
          if (dims) {
            const target = bareScreenshotTargetLeftTop(dims, safePoint);
            applyMainBarePreviewPx(mainRoots, target.left, target.top);
            return;
          }
        }
        applyMainPositionPreview(mainRoots, safePoint);
        return;
      }

      if (positionTarget === "slotGroup") {
        const center = screenshotTileGroupCenter(slots);
        if (!center) return;
        const dx = safePoint.xPct - center.xPct;
        const dy = safePoint.yPct - center.yPct;
        for (const slot of slots) {
          applyElementPositionPreview(
            canvasElement.querySelector<HTMLElement>(
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
          applyMainPositionPreview(mainRoots, {
            xPct: clampPercent(mainCenter.xPct + dx),
            yPct: clampPercent(mainCenter.yPct + dy),
          });
        }

        if (slots.length > 0) {
          for (const slot of slots) {
            applyElementPositionPreview(
              canvasElement.querySelector<HTMLElement>(
                `[data-screenshot-id="${CSS.escape(slot.id)}"]`,
              ),
              {
                xPct: clampPercent(slot.xPct + dx),
                yPct: clampPercent(slot.yPct + dy),
              },
            );
          }
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
      screenshotOffset,
      slots,
      selectedAnnotationShapeId,
      selectedAssetId,
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

      const latest = useEditorEngine.getState();
      const latestSlotId = latest.selectedSlotId;
      const latestSelectedSlot = latestSlotId
        ? (latest.present.slots.find((s) => s.id === latestSlotId) ?? null)
        : null;

      if (positionTarget === "text" && selectedTextId) {
        updateText(selectedTextId, safePoint);
      } else if (positionTarget === "asset" && selectedAssetId) {
        updateAsset(selectedAssetId, safePoint);
      } else if (positionTarget === "annotation" && selectedAnnotationShapeId) {
        updateAnnotationShape(selectedAnnotationShapeId, safePoint);
      } else if (positionTarget === "slot" && latestSelectedSlot) {
        updateSlot(latestSelectedSlot.id, safePoint);
      } else if (positionTarget === "slotGroup" && !latestSelectedSlot) {
        setSlotGroupPosition(safePoint);
      } else if (positionTarget === "screenshot") {
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

  const curX = Math.round(currentPositionPoint?.xPct ?? 50);
  const curY = Math.round(currentPositionPoint?.yPct ?? 50);

  return (
    <div className="flex w-full flex-col gap-2 px-1 pb-1 select-none text-foreground">
      {/* Side-by-Side Studio Layout */}
      <div className="flex w-full items-stretch gap-2.5">
        {/* Left Column: 2D Interactive Trackpad */}
        <div className="flex flex-1 flex-col justify-between rounded-2xl border border-border/80 bg-surface-tertiary/70 p-2 shadow-xs">
          <div className="mb-1.5 flex items-center justify-between px-0.5">
            <span className="text-[11px] font-semibold text-muted-foreground truncate">
              {targetLabel}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
              <strong className="text-foreground">{curX}%</strong>,{" "}
              <strong className="text-foreground">{curY}%</strong>
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/70 shadow-xs">
            <PositionSlider
              ariaLabel={targetLabel}
              disabled={positionTarget === null}
              value={currentPositionPoint}
              className="h-28 border-0 shadow-none bg-surface-secondary"
              onPreview={(point) => {
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

        {/* Right Column: Alignments + Precision Nudge D-Pad */}
        <div className="flex w-36 shrink-0 flex-col justify-between gap-1.5">
          {/* Horizontal Alignments */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-tertiary/70 p-0.5 shadow-xs">
              {AlignOptions.filter(({ to }) => to.xPct !== null).map(
                ({ label, to, icon: Icon }) => (
                  <Tooltip content={label} key={label} noDelay>
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleAlign(to.xPct, to.yPct)}
                      className={cn(
                        "flex size-7.5 flex-1 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-90",
                        Math.abs(curX - (to.xPct ?? to.yPct)) < 2
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-surface-secondary hover:text-foreground",
                      )}
                    >
                      {<Icon />}
                    </button>
                  </Tooltip>
                ),
              )}
            </div>
          </div>

          {/* Vertical Alignments */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface-tertiary/70 p-0.5 shadow-xs">
              {AlignOptions.filter(({ to }) => to.yPct !== null).map(
                ({ label, to, icon: Icon }) => (
                  <Tooltip content={label} key={label} noDelay>
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleAlign(to.xPct, to.yPct)}
                      className={cn(
                        "flex size-7.5 flex-1 cursor-pointer items-center justify-center rounded-lg transition-all active:scale-90",
                        Math.abs(curY - (to.xPct ?? to.yPct)) < 2
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-surface-secondary hover:text-foreground",
                      )}
                    >
                      {<Icon />}
                    </button>
                  </Tooltip>
                ),
              )}
            </div>
          </div>

          {/* Quick Center Both Button */}
          <button
            type="button"
            onClick={() => handleAlign(50, 50)}
            className="flex h-7.5 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-surface-tertiary px-2 text-[11px] font-semibold text-foreground transition-all hover:bg-surface-secondary active:scale-95 shadow-xs"
          >
            <Focus className="size-3.5 text-primary" />
            <span>Center (50, 50)</span>
          </button>
        </div>
      </div>

      {/* Multi-slot Grouping Pill */}
      {canGroupAllScreenshots && hasIndividualSelection && (
        <button
          type="button"
          onClick={() => setGroupAllScreenshots((v) => !v)}
          className={cn(
            "flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-1.5 text-[11px] font-medium transition-all shadow-xs",
            groupAllScreenshots
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-border/80 bg-surface-tertiary/70 text-muted-foreground hover:text-foreground",
          )}
        >
          <span className="flex items-center gap-1.5">
            <Group className="size-3.5" />
            <span>Group all screenshots</span>
          </span>
          <span
            className={cn(
              "inline-flex h-3.5 w-6 items-center rounded-full p-0.5 transition-colors",
              groupAllScreenshots ? "bg-primary" : "bg-muted-foreground/30",
            )}
          >
            <span
              className={cn(
                "block size-2.5 rounded-full bg-white transition-transform",
                groupAllScreenshots && "translate-x-2.5",
              )}
            />
          </span>
        </button>
      )}
    </div>
  );
}
