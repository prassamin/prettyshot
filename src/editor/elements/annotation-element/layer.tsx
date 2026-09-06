/**
 * AnnotationStrokesLayer — canvas overlay that owns all annotation strokes.
 *
 * ── Layers ──
 * Individual stroke views (SVG paths + selection chrome) — interactable
 * Drawing surface SVG — captures pointer events ONLY while annotating
 *    (pen/highlight/eraser/shape tools); transparent otherwise so elements
 *    below stay clickable (move mode / pointer tool)
 * Eraser brush cursor — circular ring that follows the pointer while
 *    erasing
 */
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { AnnotationStrokeView } from "./index";
import type { AnnotationStrokesLayerProps } from "./types";

export function AnnotationStrokesLayer({
  strokes,
  selectedId,
  onSelect,
  onDelete,
  onCenterGuideChange,
  annotationMaskId,
  layerRef,
  isAnnotating,
  cursorClass,
  eraserBrushSize = null,
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
  onDoubleClick,
}: AnnotationStrokesLayerProps) {
  const [eraserPos, setEraserPos] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const showEraser =
    isAnnotating && eraserBrushSize != null && eraserBrushSize > 0;

  const eraserStrokes = React.useMemo(
    () => strokes.filter((s) => s.mode === "eraser"),
    [strokes],
  );

  const visibleStrokes = React.useMemo(
    () => strokes.filter((s) => s.mode !== "eraser" && !s.hidden),
    [strokes],
  );

  const updateEraserPos = React.useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!showEraser) {
        setEraserPos(null);
        return;
      }
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      setEraserPos({
        x: ((e.clientX - rect.left) / rect.width) * svg.clientWidth,
        y: ((e.clientY - rect.top) / rect.height) * svg.clientHeight,
      });
    },
    [showEraser],
  );

  return (
    <>
      {visibleStrokes.map((stroke) => (
        <AnnotationStrokeView
          key={stroke.id}
          stroke={stroke}
          allStrokes={strokes}
          isSelected={stroke.id === selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
          onCenterGuideChange={onCenterGuideChange}
          canvasRef={canvasRef}
          eraserStrokes={eraserStrokes}
          annotationMaskId={annotationMaskId}
        />
      ))}

      {/* Drawing / interaction surface */}
      <svg
        ref={layerRef}
        aria-label="Annotation layer"
        className={cn(
          "absolute inset-0 z-[9999] h-full w-full touch-none select-none",
          isAnnotating
            ? `pointer-events-auto ${cursorClass}`
            : "pointer-events-none",
        )}
        onPointerDown={(e) => {
          updateEraserPos(e);
          onPointerDown(e);
        }}
        onPointerMove={(e) => {
          updateEraserPos(e);
          onPointerMove(e);
        }}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={() => setEraserPos(null)}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      />

      {/* Eraser brush cursor */}
      {showEraser && eraserPos ? (
        <div
          aria-hidden
          data-export-hidden="true"
          data-annotation-eraser-brush="true"
          className="pointer-events-none absolute z-[10000] rounded-full border border-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--overlay)_75%,transparent)]"
          style={{
            left: eraserPos.x,
            top: eraserPos.y,
            width: eraserBrushSize,
            height: eraserBrushSize,
            transform: "translate(-50%, -50%)",
          }}
        />
      ) : null}
    </>
  );
}
