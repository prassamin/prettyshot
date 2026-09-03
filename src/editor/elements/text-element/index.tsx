/**
 * TextElementView — root component for a text element on the canvas.
 *
 * ── Layout ──
 * Position is driven by CSS custom properties set by the live‑preview system
 * (see live‑preview‑vars.ts) so the element can be animated across frames
 * without touching React state.
 *
 * ── States ──
 * - Default: static text, shows selection chrome on click
 * - Selected: resize handles, rotation handle, floating toolbar
 * - Editing: contentEditable div, no selection chrome, commits on blur
 *
 * ── Styling ──
 * Supports auto‑width (widthPx = null, width = max-content), manual width,
 * borders, text stroke, text shadow, opacity, and blend modes.
 */
"use client";

import { elementPositionTokens } from "@/editor/lib/preview-tokens";
import { cn } from "@/lib/utils";

import { TextElementToolbar } from "./toolbar";
import { EditableTextContent, StaticTextContent } from "./text-content";
import type { TextElementViewProps } from "./types";
import { useTextElementInteractions } from "./use-text-element-interactions";
import { SelectionChrome } from "../shared/selection-chrome";

export function TextElementView({
  text,
  canvasRef,
  onCenterGuideChange,
  previewMode,
}: TextElementViewProps) {
  const {
    commitContent,
    editTextElement,
    editorRef,
    elRef,
    endDrag,
    endResize,
    endRotate,
    toolbarHidden,
    isDragging,
    isEditing,
    isRotateSnapped,
    isSelected,
    moveDrag,
    moveResize,
    moveRotate,
    startDrag,
    startResize,
    startRotate,
    animateEntry,
    selectTextElement,
    textViewRef,
    toolbarRect,
  } = useTextElementInteractions({ text, canvasRef, onCenterGuideChange });

  const positionVars = elementPositionTokens(text.id);
  const showBorder = text.borderColor && text.borderWidth > 0;
  const borderColor = text.borderColor ? text.borderColor : "transparent";
  const borderWidth = text.borderColor ? text.borderWidth : 0;
  const borderStyle = text.borderColor ? text.borderStyle || "solid" : "dashed";
  const counterRotate = `rotate(${-text.rotation}deg)`;

  const isAutoWidth = text.widthPx == null;
  const outerWidth = isAutoWidth ? "max-content" : `${text.widthPx}px`;
  const outerHeight = text.heightPx != null ? `${text.heightPx}px` : undefined;
  const isXInside = text.xPct >= 0 && text.xPct <= 100;
  const outerMaxWidth =
    isAutoWidth && isXInside
      ? `${2 * Math.min(text.xPct, 100 - text.xPct)}%`
      : undefined;

  return (
    <>
      <div
        ref={elRef}
        className={cn(
          "nodrag nopan absolute select-none",
          isEditing
            ? "cursor-text"
            : isDragging
              ? "cursor-grabbing"
              : "cursor-grab",
          !isEditing && "touch-none",
        )}
        style={{
          // Position driven by CSS vars so live‑preview can tween without React
          left: `var(${positionVars.x}, var(--stage-el-x, ${text.xPct}%))`,
          top: `var(${positionVars.y}, var(--stage-el-y, ${text.yPct}%))`,
          transform: `translate(-50%, -50%) rotate(${text.rotation}deg)`,
          transition:
            !isDragging && animateEntry
              ? "left 300ms ease-out, top 300ms ease-out"
              : "none",
          zIndex: 60 + text.zIndex,
          width: outerWidth,
          height: outerHeight,
          maxWidth: outerMaxWidth,
          opacity: (text.opacity ?? 100) / 100,
          display: text.hidden ? "none" : undefined,
        }}
        onPointerDown={isEditing ? undefined : startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        data-text-element-id={text.id}
        data-export-stack="foreground"
        onClick={(e) => {
          e.stopPropagation();
          selectTextElement();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          editTextElement();
        }}
        tabIndex={isSelected && !isEditing ? 0 : undefined}
      >
        {isSelected && !isEditing && !previewMode ? (
          <SelectionChrome
            counterRotate={counterRotate}
            isRotateSnapped={isRotateSnapped}
            startRotate={startRotate}
            moveRotate={moveRotate}
            endRotate={endRotate}
            startResize={startResize}
            moveResize={moveResize}
            endResize={endResize}
            mobileTouchTargets
          />
        ) : null}

        {isEditing ? (
          <EditableTextContent
            text={text}
            editorRef={editorRef}
            showBorder={showBorder}
            borderStyle={borderStyle}
            borderWidth={borderWidth}
            borderColor={borderColor}
            commitContent={commitContent}
          />
        ) : (
          <StaticTextContent
            text={text}
            textViewRef={textViewRef}
            showBorder={showBorder}
            borderStyle={borderStyle}
            borderWidth={borderWidth}
            borderColor={borderColor}
            isSelected={isSelected}
          />
        )}
      </div>
      {!previewMode &&
      isSelected &&
      !text.hidden &&
      !toolbarHidden &&
      toolbarRect ? (
        <TextElementToolbar text={text} toolbarRect={toolbarRect} />
      ) : null}
    </>
  );
}
