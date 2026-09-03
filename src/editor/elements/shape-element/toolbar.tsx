/**
 * ShapeToolbar — floating toolbar for a selected annotation shape.
 *
 * Renders inside a portal near the shape (positioned by ShapeElement).
 * Provides: color + thickness (single popover), line style, layer ordering,
 * duplicate, and delete. Moving is handled by the shared SelectionChrome,
 * so no drag handle is needed here.
 */
"use client";

import { ColorPicker } from "@/editor/color-picker";
import {
  ActionButton,
  DeleteAction,
  Divider,
  DuplicateAction,
  ToolPanel,
} from "@/editor/toolbar/controls";
import { useEditor } from "@/editor/lib/engine";
import { BringToFront, SendToBack } from "lucide-react";

import { LINE_STYLE_OPTIONS } from "./constants";
import { DashStyleIcon } from "@/editor/elements/shared/dash-style-icon";
import { StrokeWidthControl } from "@/editor/elements/shared/stroke-width-control";
import type { AnnotationShape } from "./types";

export function ShapeToolbar({ shape }: { shape: AnnotationShape }) {
  const {
    updateAnnotationShape,
    deleteAnnotationShape,
    duplicateAnnotationShape,
    bringAnnotationShapeToFront,
    sendAnnotationShapeToBack,
    setSelectedAnnotationShapeId,
  } = useEditor();

  return (
    <ToolPanel aria-label={`${shape.kind} annotation controls`}>
      <ColorPicker
        value={shape.color}
        placement="top"
        footer={
          <StrokeWidthControl
            value={shape.strokeWidth}
            color={shape.color}
            onChange={(strokeWidth) =>
              updateAnnotationShape(shape.id, { strokeWidth })
            }
          />
        }
        onChange={(color) => updateAnnotationShape(shape.id, { color })}
      >
        <ActionButton
          aria-label="Shape color and thickness"
          tooltip="Color & Thickness"
        >
          <span
            className="block size-4.5 rounded-full border border-foreground/20 shadow-inner"
            style={{ background: shape.color }}
          />
        </ActionButton>
      </ColorPicker>

      {/* Line style toggle (solid / dashed / dotted) */}
      {LINE_STYLE_OPTIONS.map((style) => (
        <ActionButton
          key={style.id}
          aria-label={`${style.label} line`}
          tooltip={style.label}
          active={shape.lineStyle === style.id}
          onClick={() =>
            updateAnnotationShape(shape.id, { lineStyle: style.id })
          }
        >
          <DashStyleIcon
            style={style.id}
            kind={shape.kind}
            active={shape.lineStyle === style.id}
          />
        </ActionButton>
      ))}

      <Divider />

      <ActionButton
        aria-label="Bring to front"
        tooltip="Bring to front"
        onClick={() => bringAnnotationShapeToFront(shape.id)}
      >
        <BringToFront className="size-4.5" />
      </ActionButton>

      <ActionButton
        aria-label="Send to back"
        tooltip="Send to back"
        onClick={() => sendAnnotationShapeToBack(shape.id)}
      >
        <SendToBack className="size-4.5" />
      </ActionButton>

      <DuplicateAction
        ariaLabel="Duplicate shape"
        onDuplicate={() => {
          const id = duplicateAnnotationShape(shape.id);
          if (id) setSelectedAnnotationShapeId(id);
        }}
      />

      <DeleteAction
        ariaLabel="Delete shape"
        onDelete={() => {
          deleteAnnotationShape(shape.id);
          setSelectedAnnotationShapeId(null);
        }}
      />
    </ToolPanel>
  );
}
