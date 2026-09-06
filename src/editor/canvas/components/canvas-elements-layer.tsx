"use client";

import * as React from "react";
import { AnimatePresence } from "framer-motion";

import { AssetElementView } from "@/editor/elements/asset-element";
import { TextElementView } from "@/editor/elements/text-element";
import { ShapeElement } from "@/editor/elements/shape-element";
import { ScreenshotElementView } from "@/editor/elements/screenshot-element";
import { AnnotationStrokesLayer } from "@/editor/elements/annotation-element/layer";
import type {
  Annotation,
  AnnotationShape,
  AnnotationStroke,
  AssetElement,
  Slot,
  TextElement,
} from "@/editor/elements/types";
import type { CenterGuidesState } from "@/editor/elements/shared/center-guides";
import type { SlotCropRequest } from "./canvas-crop-modals";

type CanvasElementsLayerProps = {
  assets: AssetElement[];
  texts: TextElement[];
  sortedAnnotationShapes: AnnotationShape[];
  slots: Slot[];
  canvasRef: React.RefObject<HTMLDivElement | null>;
  canvasAspectRatio: number;
  slotRowLayoutById: Map<string, { widthPct: number; xPct: number }> | null;
  setSlotCropRequest: (req: SlotCropRequest) => void;
  updateCenterGuides: (guides: CenterGuidesState) => void;
  updateTextCenterGuides: (guides: CenterGuidesState) => void;
  isCanvasPreview: boolean;
  annotations: AnnotationStroke[];
  selectedAnnotationStrokeId: string | null;
  setSelectedAnnotationStrokeId: (id: string | null) => void;
  deleteAnnotationStroke: (id: string) => void;
  annotationMaskId: string;
  annotationLayerRef: React.RefObject<SVGSVGElement | null>;
  isAnnotating: boolean;
  annotationCursor: string;
  annotation: Annotation;
  startAnnotation: (e: React.PointerEvent<SVGSVGElement>) => void;
  moveAnnotation: (e: React.PointerEvent<SVGSVGElement>) => void;
  stopAnnotation: (e: React.PointerEvent<SVGSVGElement>) => void;
  getEditorElementAtPoint: (x: number, y: number) => { type: string; id: string | null } | null;
};

export const CanvasElementsLayer = React.memo(
  ({
    assets,
    texts,
    sortedAnnotationShapes,
    slots,
    canvasRef,
    canvasAspectRatio,
    slotRowLayoutById,
    setSlotCropRequest,
    updateCenterGuides,
    updateTextCenterGuides,
    isCanvasPreview,
    annotations,
    selectedAnnotationStrokeId,
    setSelectedAnnotationStrokeId,
    deleteAnnotationStroke,
    annotationMaskId,
    annotationLayerRef,
    isAnnotating,
    annotationCursor,
    annotation,
    startAnnotation,
    moveAnnotation,
    stopAnnotation,
    getEditorElementAtPoint,
  }: CanvasElementsLayerProps) => {
    return (
      <>
        {/* Asset Elements */}
        {assets.map((a) => (
          <AssetElementView
            key={a.id}
            asset={a}
            canvasRef={canvasRef}
            previewMode={isCanvasPreview}
          />
        ))}

        {/* Multi-slot Screenshot Tiles */}
        <AnimatePresence>
          {slots.map((slot) => (
            <ScreenshotElementView
              key={slot.id}
              slot={slot}
              canvasRef={canvasRef}
              canvasAspectRatio={canvasAspectRatio}
              rowLayout={slotRowLayoutById?.get(slot.id) ?? null}
              onCropRequest={setSlotCropRequest}
              onCenterGuideChange={updateCenterGuides}
              previewMode={isCanvasPreview}
            />
          ))}
        </AnimatePresence>

        {/* Text Elements */}
        {texts.map((t) => (
          <TextElementView
            key={t.id}
            text={t}
            canvasRef={canvasRef}
            onCenterGuideChange={updateTextCenterGuides}
            previewMode={isCanvasPreview}
          />
        ))}

        {/* Annotation Shapes */}
        {sortedAnnotationShapes.map((shape) => (
          <ShapeElement
            key={shape.id}
            shape={shape}
            canvasRef={canvasRef}
            previewMode={isCanvasPreview}
          />
        ))}

        {/* Hand-drawn Annotation Strokes Layer */}
        <AnnotationStrokesLayer
          strokes={annotations}
          selectedId={selectedAnnotationStrokeId}
          onSelect={setSelectedAnnotationStrokeId}
          onDelete={(id) => {
            deleteAnnotationStroke(id);
            setSelectedAnnotationStrokeId(null);
          }}
          onCenterGuideChange={updateCenterGuides}
          canvasRef={canvasRef}
          annotationMaskId={annotationMaskId}
          layerRef={annotationLayerRef}
          isAnnotating={isAnnotating}
          cursorClass={annotationCursor}
          eraserBrushSize={
            isAnnotating && annotation.mode === "eraser"
              ? annotation.strokeWidth
              : null
          }
onPointerDown={(e) => {
            // Any annotation tool except the eraser: pressing on an existing
            // annotation selects/moves it — the real pointer is retargeted to
            // that element's own handlers. New annotations only start on
            // empty space.
            if (isAnnotating && annotation.mode !== "eraser") {
              const retarget = (target: Element) => {
                target.dispatchEvent(
                  new PointerEvent("pointerdown", {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    pointerId: e.pointerId,
                    pointerType: e.pointerType,
                    isPrimary: e.isPrimary,
                    button: e.button,
                    buttons: e.buttons,
                    clientX: e.clientX,
                    clientY: e.clientY,
                  }),
                );
                e.stopPropagation();
              };
              const canvasEl = canvasRef.current;
              // 1) Strokes (rendered above shapes — check first)
              const strokeHits = Array.from(
                canvasEl?.querySelectorAll<SVGPathElement>(
                  "[data-annotation-hit-path]",
                ) ?? [],
              );
              for (let i = strokeHits.length - 1; i >= 0; i--) {
                const owner = strokeHits[i].ownerSVGElement;
                if (!owner) continue;
                const or = owner.getBoundingClientRect();
                const ow = owner.clientWidth || 1;
                const oh = owner.clientHeight || 1;
                // getBBox() is in layout px; the press is in (zoom-scaled)
                // viewport px — map the box into viewport space.
                const sx = or.width / ow;
                const sy = or.height / oh;
                const box = strokeHits[i].getBBox();
                // Inflate for the stroke's own hit-test width (a 0-height
                // stroke line is otherwise a razor-thin hit target).
                const pad =
                  parseFloat(
                    strokeHits[i].getAttribute("stroke-width") || "0",
                  ) / 2 || 6;
                if (
                  e.clientX >= or.left + (box.x - pad) * sx &&
                  e.clientX <= or.left + (box.x + box.width + pad) * sx &&
                  e.clientY >= or.top + (box.y - pad) * sy &&
                  e.clientY <= or.top + (box.y + box.height + pad) * sy
                ) {
                  retarget(strokeHits[i]);
                  return;
                }
              }
              // 2) Shapes
              const hosts = Array.from(
                canvasEl?.querySelectorAll<HTMLElement>(
                  "[data-shape-ref]",
                ) ?? [],
              );
              for (let i = hosts.length - 1; i >= 0; i--) {
                const rect = hosts[i].getBoundingClientRect();
                if (
                  e.clientX >= rect.left &&
                  e.clientX <= rect.right &&
                  e.clientY >= rect.top &&
                  e.clientY <= rect.bottom
                ) {
                  retarget(hosts[i]);
                  return;
                }
              }
            }
            startAnnotation(e);
          }}
          onPointerMove={moveAnnotation}
          onPointerUp={stopAnnotation}
          onClick={(e) => {
            if (!isAnnotating) return;
            const mode = annotation.mode;
            // Freehand brushes keep clicks for drawing; consuming the click
            // prevents underlying elements from being selected.
            const isFreehand =
              mode === "pen" ||
              mode === "highlight" ||
              mode === "eraser" ||
              mode == null;
            if (isFreehand) {
              e.stopPropagation();
              return;
            }
            // Shape tools: a click (no drag) selects whatever shape is under
            // the pointer — clicks select, drags draw a new shape.
            let shapeHit: HTMLElement | null = null;
            const hosts = Array.from(
              canvasRef.current?.querySelectorAll<HTMLElement>(
                "[data-shape-ref]",
              ) ?? [],
            );
            for (let i = hosts.length - 1; i >= 0; i--) {
              const rect = hosts[i].getBoundingClientRect();
              if (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
              ) {
                shapeHit = hosts[i];
                break;
              }
            }
            if (shapeHit) {
              shapeHit.dispatchEvent(
                new MouseEvent("click", { bubbles: true, cancelable: true }),
              );
            }
            e.stopPropagation();
          }}
          onDoubleClick={(e) => {
            if (!isAnnotating) return;
            const editorElementAtPoint = getEditorElementAtPoint(
              e.clientX,
              e.clientY,
            );
            if (
              editorElementAtPoint?.type !== "text" ||
              !editorElementAtPoint.id
            ) {
              return;
            }

            e.preventDefault();
            e.stopPropagation();
            window.dispatchEvent(
              new CustomEvent("ui:edit-text-element", {
                detail: { id: editorElementAtPoint.id },
              }),
            );
          }}
        />
      </>
    );
  },
);

CanvasElementsLayer.displayName = "CanvasElementsLayer";
