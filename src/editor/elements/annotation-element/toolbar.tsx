/**
 * AnnotationStrokeToolbar — floating toolbar for a selected stroke.
 *
 * Renders inside a portal near the stroke (positioned by AnnotationStrokeView).
 * Provides: color + thickness (or just thickness for erasers), layer ordering,
 * duplicate, and delete.
 */
"use client";

import type { AnnotationStroke } from "./types";
import { useEditor } from "@/editor/lib/engine";
import { ColorPicker } from "@/editor/color-picker";
import {
  ActionButton,
  DeleteAction,
  Divider,
  DuplicateAction,
  ToolPanel,
} from "@/editor/toolbar/controls";
import { StrokeWidthControl } from "@/editor/elements/shared/stroke-width-control";
import { BringToFront, SendToBack } from "lucide-react";

export function AnnotationStrokeToolbar({
  stroke,
  onDelete,
}: {
  stroke: AnnotationStroke;
  onDelete: (id: string) => void;
}) {
  const {
    updateAnnotationStrokeLayer,
    duplicateAnnotationStroke,
    bringAnnotationStrokeToFront,
    sendAnnotationStrokeToBack,
    setSelectedAnnotationStrokeId,
  } = useEditor();

  return (
    <ToolPanel aria-label={`${stroke.mode} annotation controls`}>
      <ColorPicker
        value={stroke.color}
        placement="top"
        footer={
          <StrokeWidthControl
            value={stroke.strokeWidth}
            color={stroke.color}
            onChange={(strokeWidth) =>
              updateAnnotationStrokeLayer(stroke.id, { strokeWidth })
            }
          />
        }
        onChange={(color) => {
          updateAnnotationStrokeLayer(stroke.id, { color });
        }}
      >
        <ActionButton
          aria-label="Stroke color and thickness"
          tooltip="Color & Thickness"
        >
          <span
            className="block size-4.5 rounded-full border border-foreground/20 shadow-inner"
            style={{ background: stroke.color }}
          />
        </ActionButton>
      </ColorPicker>

      <Divider />

      <ActionButton
        aria-label="Bring to front"
        tooltip="Bring to front"
        onClick={() => bringAnnotationStrokeToFront(stroke.id)}
      >
        <BringToFront className="size-4.5" />
      </ActionButton>

      <ActionButton
        aria-label="Send to back"
        tooltip="Send to back"
        onClick={() => sendAnnotationStrokeToBack(stroke.id)}
      >
        <SendToBack className="size-4.5" />
      </ActionButton>

      <DuplicateAction
        ariaLabel="Duplicate stroke"
        onDuplicate={() => {
          const id = duplicateAnnotationStroke(stroke.id);
          if (id) setSelectedAnnotationStrokeId(id);
        }}
      />

      <DeleteAction
        ariaLabel="Delete stroke"
        onDelete={() => onDelete(stroke.id)}
      />
    </ToolPanel>
  );
}
