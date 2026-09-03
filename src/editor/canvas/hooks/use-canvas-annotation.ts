"use client";

import * as React from "react";

import type {
  Annotation,
  AnnotationPoint,
  AnnotationShape,
  AnnotationShapeKind,
  AnnotationStroke,
  AssetElement,
  TextElement,
} from "@/editor/elements/types";
import type { EditorToolBarTool } from "@/editor/screenshot/types";
import type { CenterGuidesState } from "@/editor/elements/shared/center-guides";
import { clamp } from "@/editor/lib/canvas-helpers";

export type CanvasElementHit = {
  type: "asset" | "text" | "annotation-shape";
  id: string | null;
};

type ElementMoveSession = {
  pointerId: number;
  type: "asset" | "text" | "annotation-shape";
  id: string;
  startClientX: number;
  startClientY: number;
  startXPct: number;
  startYPct: number;
  canvasW: number;
  canvasH: number;
  nextXPct: number;
  nextYPct: number;
  moved: boolean;
};

type ShapeDrawSession = {
  pointerId: number;
  shapeId: string;
  kind: AnnotationShapeKind;
  strokeWidth: number;
  startXPct: number;
  startYPct: number;
  nextXPct: number;
  nextYPct: number;
  nextWidthPct: number;
  nextHeightPct: number;
  nextRotation: number;
  moved: boolean;
};

type StrokeDrawSession = {
  pointerId: number;
  strokeId: string;
  points: AnnotationPoint[];
};

export interface CanvasAnnotationOptions {
  activeTool: EditorToolBarTool;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  annotationLayerRef: React.RefObject<SVGSVGElement | null>;
  annotation: Annotation;
  annotationShapes: AnnotationShape[];
  texts: TextElement[];
  assets: AssetElement[];
  addAnnotationStroke: (
    stroke: Omit<AnnotationStroke, "id" | "zIndex">,
  ) => string;
  updateAnnotationStroke: (id: string, points: AnnotationPoint[]) => void;
  addAnnotationShape: (
    shape: Omit<AnnotationShape, "id" | "zIndex">,
  ) => string;
  updateAnnotationShape: (
    id: string,
    updates: Partial<AnnotationShape>,
  ) => void;
  deleteAnnotationShape: (id: string) => void;
  updateText: (id: string, updates: Partial<TextElement>) => void;
  updateAsset: (id: string, updates: Partial<AssetElement>) => void;
  setSelectedTextId: (id: string | null) => void;
  setSelectedAssetId: (id: string | null) => void;
  setSelectedAnnotationShapeId: (id: string | null) => void;
  setSelectedAnnotationStrokeId: (id: string | null) => void;
  setIsScreenshotSelected: (selected: boolean) => void;
  updateTextCenterGuides: (guides: CenterGuidesState) => void;
}

/**
 * Manages drawing interactions, vector stroke smoothing, geometric shapes,
 * and element repositioning inside the annotation canvas overlay.
 */
export function useCanvasAnnotation({
  activeTool,
  canvasRef,
  annotation,
  annotationShapes,
  texts,
  assets,
  addAnnotationStroke,
  updateAnnotationStroke,
  addAnnotationShape,
  updateAnnotationShape,
  deleteAnnotationShape,
  updateText,
  updateAsset,
}: CanvasAnnotationOptions) {
  const isAnnotating = activeTool === "draw";
  const [strokeSession, setStrokeSession] =
    React.useState<StrokeDrawSession | null>(null);
  const [shapeSession, setShapeSession] =
    React.useState<ShapeDrawSession | null>(null);
  const [moveSession, setMoveSession] =
    React.useState<ElementMoveSession | null>(null);

  const getCanvasCoordinates = React.useCallback(
    (clientX: number, clientY: number): AnnotationPoint | null => {
      const element = canvasRef.current;
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      };
    },
    [canvasRef],
  );

  const getEditorElementAtPoint = React.useCallback(
    (clientX: number, clientY: number): CanvasElementHit | null => {
      if (typeof document === "undefined") return null;
      const target = document.elementFromPoint(clientX, clientY);
      if (!target) return null;

      const elementContainer = target.closest<HTMLElement>(
        "[data-editor-element-type]",
      );
      if (elementContainer) {
        const type = elementContainer.dataset.editorElementType as
          | "asset"
          | "text";
        const id = elementContainer.dataset.editorElementId ?? null;
        if (type && id) return { type, id };
      }

      const shapeContainer = target.closest<SVGElement>(
        "[data-annotation-shape-id]",
      );
      if (shapeContainer) {
        const id = shapeContainer.dataset.annotationShapeId ?? null;
        if (id) return { type: "annotation-shape", id };
      }

      return null;
    },
    [],
  );

  const startAnnotation = React.useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isAnnotating || e.button !== 0) return;

      const canvasPoint = getCanvasCoordinates(e.clientX, e.clientY);
      if (!canvasPoint) return;

      // Handle element translation mode
      if (annotation.mode === "move") {
        const hit = getEditorElementAtPoint(e.clientX, e.clientY);
        if (hit && hit.id) {
          const element = canvasRef.current;
          const rect = element?.getBoundingClientRect();
          if (!rect) return;

          let startX = 50;
          let startY = 50;
          if (hit.type === "text") {
            const foundText = texts.find((item) => item.id === hit.id);
            if (foundText) {
              startX = foundText.xPct;
              startY = foundText.yPct;
            }
          } else if (hit.type === "asset") {
            const foundAsset = assets.find((item) => item.id === hit.id);
            if (foundAsset) {
              startX = foundAsset.xPct;
              startY = foundAsset.yPct;
            }
          } else if (hit.type === "annotation-shape") {
            const foundShape = annotationShapes.find(
              (item) => item.id === hit.id,
            );
            if (foundShape) {
              startX = foundShape.xPct;
              startY = foundShape.yPct;
            }
          }

          setMoveSession({
            pointerId: e.pointerId,
            type: hit.type,
            id: hit.id,
            startClientX: e.clientX,
            startClientY: e.clientY,
            startXPct: startX,
            startYPct: startY,
            canvasW: rect.width,
            canvasH: rect.height,
            nextXPct: startX,
            nextYPct: startY,
            moved: false,
          });
          e.currentTarget.setPointerCapture(e.pointerId);
          return;
        }
      }

      // Handle vector shape drawing (arrow, rect, ellipse)
      if (
        annotation.mode === "arrow" ||
        annotation.mode === "rect" ||
        annotation.mode === "ellipse"
      ) {
        const createdShapeId = addAnnotationShape({
          kind: annotation.mode,
          color: annotation.color,
          strokeWidth: annotation.strokeWidth,
          lineStyle: annotation.lineStyle,
          xPct: canvasPoint.x,
          yPct: canvasPoint.y,
          widthPct: 0,
          heightPct: 0,
          rotation: 0,
        });

        setShapeSession({
          pointerId: e.pointerId,
          shapeId: createdShapeId,
          kind: annotation.mode,
          strokeWidth: annotation.strokeWidth,
          startXPct: canvasPoint.x,
          startYPct: canvasPoint.y,
          nextXPct: canvasPoint.x,
          nextYPct: canvasPoint.y,
          nextWidthPct: 0,
          nextHeightPct: 0,
          nextRotation: 0,
          moved: false,
        });
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }

      // Handle freehand stroke drawing (pen, highlight, eraser)
      if (
        annotation.mode === "pen" ||
        annotation.mode === "highlight" ||
        annotation.mode === "eraser"
      ) {
        const initialPoints = [canvasPoint];
        const createdStrokeId = addAnnotationStroke({
          mode: annotation.mode,
          color: annotation.color,
          strokeWidth: annotation.strokeWidth,
          points: initialPoints,
        });

        setStrokeSession({
          pointerId: e.pointerId,
          strokeId: createdStrokeId,
          points: initialPoints,
        });
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    [
      isAnnotating,
      getCanvasCoordinates,
      annotation.mode,
      annotation.color,
      annotation.strokeWidth,
      annotation.lineStyle,
      getEditorElementAtPoint,
      canvasRef,
      texts,
      assets,
      annotationShapes,
      addAnnotationShape,
      addAnnotationStroke,
    ],
  );

  const moveAnnotation = React.useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      // Move element
      if (moveSession && moveSession.pointerId === e.pointerId) {
        const deltaX =
          ((e.clientX - moveSession.startClientX) / moveSession.canvasW) * 100;
        const deltaY =
          ((e.clientY - moveSession.startClientY) / moveSession.canvasH) * 100;
        const nextX = clamp(moveSession.startXPct + deltaX, 0, 100);
        const nextY = clamp(moveSession.startYPct + deltaY, 0, 100);

        if (moveSession.type === "text") {
          updateText(moveSession.id, { xPct: nextX, yPct: nextY });
        } else if (moveSession.type === "asset") {
          updateAsset(moveSession.id, { xPct: nextX, yPct: nextY });
        } else if (moveSession.type === "annotation-shape") {
          updateAnnotationShape(moveSession.id, {
            xPct: nextX,
            yPct: nextY,
          });
        }

        setMoveSession((prev) =>
          prev
            ? { ...prev, nextXPct: nextX, nextYPct: nextY, moved: true }
            : null,
        );
        return;
      }

      // Drag & scale shape
      if (shapeSession && shapeSession.pointerId === e.pointerId) {
        const canvasPoint = getCanvasCoordinates(e.clientX, e.clientY);
        if (!canvasPoint) return;

        const canvasEl = canvasRef.current;
        const canvasW = canvasEl?.offsetWidth ?? 1;
        const canvasH = canvasEl?.offsetHeight ?? 1;

        let nextX: number;
        let nextY: number;
        let nextW: number;
        let nextH: number;
        let rotation = 0;

        if (shapeSession.kind === "arrow") {
          // Arrow = true drag distance + rotation + constant lateral size.
          // With the width along the rotated axis, the tail lands exactly
          // on the pointer-down point (matches the reference impl):
          // center − rotate(width/2 along θ) ≡ start.
          const dxPx =
            ((canvasPoint.x - shapeSession.startXPct) / 100) * canvasW;
          const dyPx =
            ((canvasPoint.y - shapeSession.startYPct) / 100) * canvasH;
          const distancePx = Math.hypot(dxPx, dyPx);
          const minArrowWidthPx = Math.max(56, shapeSession.strokeWidth * 12);
          const minArrowHeightPx = Math.max(56, shapeSession.strokeWidth * 14);
          nextW = (Math.max(minArrowWidthPx, distancePx) / canvasW) * 100;
          nextH = (minArrowHeightPx / canvasH) * 100;
          rotation =
            distancePx > 0.5
              ? (Math.atan2(dyPx, dxPx) * 180) / Math.PI
              : 0;
          nextX = (canvasPoint.x + shapeSession.startXPct) / 2;
          nextY = (canvasPoint.y + shapeSession.startYPct) / 2;
        } else {
          nextW = Math.max(
            0.05,
            Math.abs(canvasPoint.x - shapeSession.startXPct),
          );
          nextH = Math.max(
            0.05,
            Math.abs(canvasPoint.y - shapeSession.startYPct),
          );
          const minX = Math.min(canvasPoint.x, shapeSession.startXPct);
          const minY = Math.min(canvasPoint.y, shapeSession.startYPct);
          nextX = minX + nextW / 2;
          nextY = minY + nextH / 2;
        }

        updateAnnotationShape(shapeSession.shapeId, {
          xPct: nextX,
          yPct: nextY,
          widthPct: nextW,
          heightPct: nextH,
          rotation,
        });

        setShapeSession((prev) =>
          prev
            ? {
                ...prev,
                nextXPct: nextX,
                nextYPct: nextY,
                nextWidthPct: nextW,
                nextHeightPct: nextH,
                nextRotation: rotation,
                moved: true,
              }
            : null,
        );
        return;
      }

      // Freehand stroke point appending
      if (strokeSession && strokeSession.pointerId === e.pointerId) {
        const canvasPoint = getCanvasCoordinates(e.clientX, e.clientY);
        if (!canvasPoint) return;
        const nextPoints = [...strokeSession.points, canvasPoint];
        updateAnnotationStroke(strokeSession.strokeId, nextPoints);
        setStrokeSession((prev) =>
          prev ? { ...prev, points: nextPoints } : null,
        );
      }
    },
    [
      moveSession,
      shapeSession,
      strokeSession,
      getCanvasCoordinates,
      updateText,
      updateAsset,
      updateAnnotationShape,
      updateAnnotationStroke,
    ],
  );

  const stopAnnotation = React.useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (moveSession && moveSession.pointerId === e.pointerId) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
        setMoveSession(null);
        return;
      }

      if (shapeSession && shapeSession.pointerId === e.pointerId) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
        if (
          !shapeSession.moved ||
          (shapeSession.nextWidthPct < 1 && shapeSession.nextHeightPct < 1)
        ) {
          deleteAnnotationShape(shapeSession.shapeId);
        }
        setShapeSession(null);
        return;
      }

      if (strokeSession && strokeSession.pointerId === e.pointerId) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
        setStrokeSession(null);
      }
    },
    [moveSession, shapeSession, strokeSession, deleteAnnotationShape],
  );

  const annotationCursor = React.useMemo(() => {
    if (!isAnnotating) return "cursor-default";
    if (annotation.mode === "eraser") return "cursor-crosshair";
    if (annotation.mode === "move") return "cursor-move";
    return "cursor-crosshair";
  }, [isAnnotating, annotation.mode]);

  return {
    isAnnotating,
    annotationCursor,
    getEditorElementAtPoint,
    startAnnotation,
    moveAnnotation,
    stopAnnotation,
  };
}
