"use client";

import * as React from "react";

import type { PlacementDims } from "@/editor/screenshot/types";

export type { PlacementDims };

export interface StageMeasurementOptions {
  enabled: boolean;
  stageRef: React.RefObject<HTMLDivElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  layoutKey?: string | number;
}

const arePlacementDimsEqual = (a: PlacementDims, b: PlacementDims) =>
  a.stageW === b.stageW &&
  a.stageH === b.stageH &&
  a.imgW === b.imgW &&
  a.imgH === b.imgH;

/**
 * Accurately measures the rendered bounding dimensions of the stage and primary image.
 * Uses ResizeObserver and requestAnimationFrame to provide real-time dimensional feedback
 * for smart snap guides and screenshot position anchoring.
 */
export function useStageMeasurement({
  enabled,
  stageRef,
  imageRef,
  layoutKey,
}: StageMeasurementOptions) {
  const [measuredState, setMeasuredState] = React.useState<{
    key: string | number | undefined;
    dims: PlacementDims | null;
  }>({ key: layoutKey, dims: null });

  const placementDims =
    measuredState.key === layoutKey ? measuredState.dims : null;

  const measurePlacement = React.useCallback(() => {
    const stageElement = stageRef.current;
    const imageElement = imageRef.current;
    if (!stageElement || !imageElement) return;

    const nextDims: PlacementDims = {
      stageW:
        parseFloat(getComputedStyle(stageElement).width) ||
        stageElement.clientWidth,
      stageH:
        parseFloat(getComputedStyle(stageElement).height) ||
        stageElement.clientHeight,
      imgW: imageElement.offsetWidth,
      imgH: imageElement.offsetHeight,
    };

    if (
      !nextDims.stageW ||
      !nextDims.stageH ||
      !nextDims.imgW ||
      !nextDims.imgH
    ) {
      return;
    }

    setMeasuredState((prev) => {
      if (
        prev.key === layoutKey &&
        prev.dims &&
        arePlacementDimsEqual(prev.dims, nextDims)
      ) {
        return prev;
      }
      return { key: layoutKey, dims: nextDims };
    });
  }, [imageRef, layoutKey, stageRef]);

  // Keep probing until the image has a real rendered size. On a freshly
  // hydrated saved project the framed screenshot can paint a frame or two
  // after mount (cached decode, frame asset fetch, layout settling) — if we
  // give up after the first 0-size measure, placement stays null until some
  // unrelated interaction re-triggers measurement (e.g. re-selecting the
  // frame), which shows as "frame not loading until reselect".
  const probeRafRef = React.useRef<number | null>(null);
  const retryCountRef = React.useRef(0);
  const probeUntilSized = React.useCallback(() => {
    if (probeRafRef.current !== null) return;
    const stageElement = stageRef.current;
    const imageElement = imageRef.current;
    if (!stageElement || !imageElement) return;
    const sized =
      (parseFloat(getComputedStyle(stageElement).width) ||
        stageElement.clientWidth) &&
      imageElement.offsetWidth &&
      imageElement.offsetHeight;
    if (sized) {
      retryCountRef.current = 0;
      probeRafRef.current = null;
      measurePlacement();
      return;
    }
    if (retryCountRef.current >= 30) {
      retryCountRef.current = 0;
      probeRafRef.current = null;
      return;
    }
    retryCountRef.current += 1;
    probeRafRef.current = window.requestAnimationFrame(() => {
      probeRafRef.current = null;
      probeUntilSized();
    });
  }, [measurePlacement, stageRef, imageRef]);

  React.useLayoutEffect(() => {
    if (!enabled) return;

    const stageElement = stageRef.current;
    const imageElement = imageRef.current;
    if (!stageElement || !imageElement) return;

    measurePlacement();
    probeUntilSized();
    const frameId = window.requestAnimationFrame(measurePlacement);

    const resizeObserver = new ResizeObserver(measurePlacement);
    resizeObserver.observe(stageElement);
    resizeObserver.observe(imageElement);

    return () => {
      window.cancelAnimationFrame(frameId);
      if (probeRafRef.current !== null) {
        window.cancelAnimationFrame(probeRafRef.current);
        probeRafRef.current = null;
      }
      retryCountRef.current = 0;
      resizeObserver.disconnect();
    };
  }, [enabled, imageRef, layoutKey, measurePlacement, probeUntilSized, stageRef]);

  return { placementDims, measurePlacement };
}
