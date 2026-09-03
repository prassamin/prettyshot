"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useEditorEngine } from "@/editor/lib/engine";

import { CanvasView } from "./canvas-view";
import { BASE_CANVAS_WIDTH } from "./constants";

export function Canvas() {
  const aspect = useEditorEngine((s) => s.present.aspect);
  const canvasZoom = useEditorEngine((s) => s.present.canvasZoom);
  const isPreviewMode = useEditorEngine((s) => s.isPreviewMode);
  const isAnimateMode = useEditorEngine((s) => s.isAnimateMode);
  const setSelectedTextId = useEditorEngine((s) => s.setSelectedTextId);
  const setSelectedAssetId = useEditorEngine((s) => s.setSelectedAssetId);
  const setSelectedAnnotationShapeId = useEditorEngine(
    (s) => s.setSelectedAnnotationShapeId,
  );
  const setSelectedSlotId = useEditorEngine(
    (s) => s.setSelectedSlotId,
  );

  const aw = aspect.w || 16;
  const ah = aspect.h || 10;
  const widthPx = BASE_CANVAS_WIDTH;
  const heightPx = (BASE_CANVAS_WIDTH * ah) / aw;

  const zoomScale = isPreviewMode ? 1 : canvasZoom / 100;

  const sectionRef = useRef<HTMLElement | null>(null);
  const [autoFit, setAutoFit] = useState(0.6);
  const [layoutMetrics, setLayoutMetrics] = useState({
    topGutter: 24,
    bottomGutter: 96,
  });

  useLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const isMobile = window.innerWidth < 768;
      const topGutter = 32;
      const bottomGutter = isMobile
        ? rect.height * 0.42 + 64
        : isAnimateMode
          ? 208
          : 64;

      setLayoutMetrics({ topGutter, bottomGutter });

      const hGutter = 64;
      const fitW = Math.max(0, rect.width - hGutter) / widthPx;
      const fitH =
        Math.max(0, rect.height - topGutter - bottomGutter) / heightPx;
      setAutoFit(Math.max(0.05, Math.min(1, Math.min(fitW, fitH))));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [widthPx, heightPx, isPreviewMode, isAnimateMode]);

  const verticalOffset = isPreviewMode
    ? 0
    : (layoutMetrics.topGutter - layoutMetrics.bottomGutter) / 2;

  const effectiveScale = autoFit * zoomScale;

  const handleClearSelection = useCallback(() => {
    setSelectedTextId(null);
    setSelectedAssetId(null);
    setSelectedAnnotationShapeId(null);
    setSelectedSlotId(null);
  }, [
    setSelectedTextId,
    setSelectedAssetId,
    setSelectedAnnotationShapeId,
    setSelectedSlotId,
  ]);

  return (
    <section
      ref={sectionRef}
      data-editor-canvas-surface
      style={{
        containerType: "size",
        touchAction: "none",
        overscrollBehavior: "none",
      }}
      className={cn(
        "relative z-0 flex flex-1 touch-none overflow-hidden overscroll-none transition-all duration-300 select-none",
        isPreviewMode
          ? "items-center justify-center p-0 bg-surface-secondary"
          : "bg-overlay/70 border-b border-dashed border-border/70",
        isAnimateMode && !isPreviewMode && "pb-48",
      )}
      role="presentation"
      onClick={handleClearSelection}
      onKeyDown={(e) => {
        if (e.key === "Escape") handleClearSelection();
      }}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-300",
          isPreviewMode
            ? "opacity-30 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,color-mix(in_oklab,var(--foreground)_5%,transparent),transparent)]"
            : "opacity-100 bg-[radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] bg-size-[16px_16px] text-foreground/5",
        )}
      />

      <div
        className="absolute top-1/2 left-1/2 origin-center transition-transform duration-200 ease-out"
        style={{
          transform: `translate(-50%, calc(-50% + ${verticalOffset}px)) scale(${effectiveScale})`,
          ["--canvas-fit-scale" as string]: effectiveScale,
        }}
      >
        {/* Soft Ambient Glow in Preview Mode */}
        {isPreviewMode && (
          <div className="pointer-events-none absolute -inset-12 -z-10 rounded-3xl bg-primary/10 blur-3xl transition-all duration-500" />
        )}
        <CanvasView
          widthPx={widthPx}
          heightPx={heightPx}
          effectiveScale={effectiveScale}
        />
      </div>
    </section>
  );
}
