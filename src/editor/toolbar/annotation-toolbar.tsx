"use client";

import * as React from "react";
import { ChevronLeft, Pen, Trash, Eraser, Highlighter } from "lucide-react";
import { Slider } from "@/components/slider";
import { ColorPicker } from "@/editor/color-picker";
import { ActionButton, ActionPopover } from "@/editor/toolbar/controls";
import { ANNOTATION_STROKES } from "@/editor/elements/constants";
import { useEditor } from "@/editor/lib/engine";
import type {
  AnnotationMode,
  AnnotationShapeKind,
} from "@/editor/elements/types";
import { cn } from "@/lib/utils";
import { DashStyleIcon } from "@/editor/elements/shared/dash-style-icon";
import { LINE_STYLE_OPTIONS } from "../elements/shape-element/constants";

type ToolDef = {
  id: AnnotationMode;
  label: string;
  shortcut?: string;
  icon?: React.ComponentType<{ className?: string }>;
};

const BRUSHES: ToolDef[] = [
  { id: "pen", label: "Pen", shortcut: "P", icon: Pen },
  { id: "highlight", label: "Highlighter", shortcut: "H", icon: Highlighter },
  { id: "eraser", label: "Eraser", shortcut: "E", icon: Eraser },
];

const SHAPES: ToolDef[] = [
  { id: "arrow", label: "Arrow", shortcut: "A" },
  { id: "rect", label: "Rectangle", shortcut: "R" },
  {
    id: "ellipse",
    label: "Ellipse",
    shortcut: "O",
  },
];

export function AnnotationToolbar({ onExit }: { onExit: () => void }) {
  const { annotation, setAnnotation, clearAnnotations } = useEditor();
  const activeLineStyle = annotation.lineStyle;
  const activeShapeKind = annotationModeToShapeKind(annotation.mode);
  const showColorControls =
    annotation.mode === "pen" ||
    annotation.mode === "highlight" ||
    Boolean(activeShapeKind);
  const showLineStyleControls =
    annotation.mode === "arrow" ||
    annotation.mode === "rect" ||
    annotation.mode === "ellipse";
  const previewShapeKind =
    annotationModeToShapeKind(annotation.mode) ?? "arrow";

  return (
    <div className="flex min-w-0 items-center gap-1">
      {/* Exit Button */}
      <ActionButton
        aria-label="Exit annotate mode"
        tooltip="Exit annotate mode"
        onClick={() => {
          onExit();
          // setAnnotation({});
        }}
      >
        <ChevronLeft className="size-4.5" />
      </ActionButton>

      <span className="mx-0.5 h-5 w-px bg-foreground/10" />

      <div className="flex min-w-0 flex-1 [scrollbar-width:none] overflow-x-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1">
          {/* Brushes */}
          {BRUSHES.map((t) => (
            <ToolButton
              key={t.id}
              tool={t}
              active={annotation.mode === t.id}
              tint={annotation.color}
              onClick={() => setAnnotation({ mode: t.id })}
            />
          ))}

          <span className="mx-0.5 h-5 w-px bg-foreground/10" />

          {/* Shapes */}
          {SHAPES.map((t) => {
            const shapeKind = annotationModeToShapeKind(t.id);
            const isActive = annotation.mode === t.id;
            return (
              <ToolButton
                key={t.id}
                tool={t}
                active={isActive}
                tint={annotation.color}
                iconOverride={
                  shapeKind ? (
                    <DashStyleIcon
                      style="solid"
                      kind={shapeKind}
                      active={isActive}
                    />
                  ) : undefined
                }
                onClick={() => {
                  setAnnotation({
                    mode: t.id,
                  });
                }}
              />
            );
          })}

          {/* Color Picker */}
          {showColorControls ? (
            <>
              <span className="mx-0.5 h-5 w-px bg-foreground/10" />
              <div className="flex items-center">
                <ColorPicker
                  value={annotation.color}
                  placement="top"
                  footer={
                    <ShapeThicknessPanel
                      value={annotation.strokeWidth}
                      color={annotation.color}
                      onChange={(strokeWidth) => setAnnotation({ strokeWidth })}
                    />
                  }
                  onChange={(hex) => {
                    setAnnotation({ color: hex });
                  }}
                >
                  <ActionButton
                    aria-label="Annotation color"
                    tooltip="Color & Thickness"
                  >
                    <span
                      className="size-5 rounded-full border border-foreground/20 shadow-inner transition-transform active:scale-95"
                      style={{ background: annotation.color }}
                    />
                  </ActionButton>
                </ColorPicker>
              </div>
            </>
          ) : null}

          {/* Eraser Size */}
          {annotation.mode === "eraser" ? (
            <>
              <span className="mx-0.5 h-5 w-px bg-foreground/10" />
              <div className="flex items-center">
                <ActionPopover
                  tooltip="Eraser Size"
                  contentClassName="w-64 p-3"
                  trigger={({ open }) => (
                    <ActionButton
                      aria-label="Eraser size"
                      tooltip="Eraser Size"
                      className={cn(open && "bg-foreground/10 text-foreground")}
                    >
                      <span className="flex size-5 items-center justify-center rounded-full border border-foreground/20 bg-foreground/5 shadow-inner">
                        <span
                          className="rounded-full bg-foreground transition-all"
                          style={{
                            width: Math.max(
                              3,
                              Math.min(14, annotation.strokeWidth / 2),
                            ),
                            height: Math.max(
                              3,
                              Math.min(14, annotation.strokeWidth / 2),
                            ),
                          }}
                        />
                      </span>
                    </ActionButton>
                  )}
                >
                  <EraserThicknessPanel
                    value={annotation.strokeWidth}
                    onChange={(strokeWidth) => setAnnotation({ strokeWidth })}
                  />
                </ActionPopover>
              </div>
            </>
          ) : null}

          {/* Line Styles */}
          {showLineStyleControls ? (
            <>
              <span className="mx-0.5 h-5 w-px bg-foreground/10" />
              <div className="flex items-center gap-1">
                {LINE_STYLE_OPTIONS.map((style) => (
                  <ActionButton
                    key={style.id}
                    onClick={() => setAnnotation({ lineStyle: style.id })}
                    aria-label={`${style.label} line`}
                    tooltip={style.label}
                    className={cn(
                      activeLineStyle === style.id &&
                        "bg-foreground/10 text-foreground",
                    )}
                  >
                    <DashStyleIcon
                      style={style.id}
                      kind={previewShapeKind}
                      active={activeLineStyle === style.id}
                    />
                  </ActionButton>
                ))}
              </div>
            </>
          ) : null}

          <span className="mx-0.5 h-5 w-px bg-foreground/10" />

          {/* Clear All */}
          <ActionButton
            onClick={() => clearAnnotations()}
            aria-label="Clear all annotations"
            tooltip="Clear all"
            destructive
          >
            <Trash className="size-4.5" />
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

function ShapeThicknessPanel({
  value,
  color,
  onChange,
}: {
  value: number;
  color: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-3 border-t border-border/70 pt-3 *:select-none">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Thickness
        </span>
        <span className="font-mono text-xs text-foreground/80">{value}px</span>
      </div>
      <div className="mb-3 flex items-center gap-1.5">
        {ANNOTATION_STROKES.map((strokeWidth) => {
          const isActive = value === strokeWidth;
          return (
            <button
              key={strokeWidth}
              aria-label={`${strokeWidth}px thickness`}
              onClick={() => onChange(strokeWidth)}
              className={cn(
                "grid size-8 cursor-pointer place-items-center rounded-lg border border-transparent transition-colors hover:bg-surface-secondary",
                isActive && "border-border bg-surface-secondary shadow-xs",
              )}
            >
              <span
                className="block rounded-full"
                style={{
                  width: Math.min(24, strokeWidth * 2 + 6),
                  height: Math.min(24, strokeWidth * 2 + 6),
                  background: color,
                }}
              />
            </button>
          );
        })}
      </div>
      <Slider
        label="Intensity"
        value={value}
        min={1}
        max={32}
        step={1}
        formatValue={(v) => `${Math.round(v)}px`}
        className="[--elastic-slider-fill-active:var(--annotation-color)] [--elastic-slider-fill:var(--annotation-color)] [--elastic-slider-handle:var(--annotation-color)]"
        style={{ "--annotation-color": color } as React.CSSProperties}
        onValueChange={(next) => {
          if (typeof next === "number") onChange(next);
        }}
      />
    </div>
  );
}

function EraserThicknessPanel({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const PRESET_SIZES = [8, 16, 24, 32, 48];

  return (
    <div className="*:select-none">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Eraser Size
        </span>
        <span className="font-mono text-xs text-foreground/80">{value}px</span>
      </div>
      <div className="mb-3 flex items-center gap-1.5">
        {PRESET_SIZES.map((size) => {
          const isActive = value === size;
          return (
            <button
              key={size}
              type="button"
              aria-label={`${size}px eraser size`}
              onClick={() => onChange(size)}
              className={cn(
                "grid size-8 cursor-pointer place-items-center rounded-lg border border-transparent transition-colors hover:bg-surface-secondary",
                isActive && "border-border bg-surface-secondary shadow-xs",
              )}
            >
              <span
                className="block rounded-full bg-foreground"
                style={{
                  width: Math.min(22, Math.max(4, size / 2)),
                  height: Math.min(22, Math.max(4, size / 2)),
                }}
              />
            </button>
          );
        })}
      </div>
      <Slider
        label="Size"
        value={value}
        min={4}
        max={64}
        step={1}
        formatValue={(v) => `${Math.round(v)}px`}
        onValueChange={(next) => {
          if (typeof next === "number") onChange(next);
        }}
      />
    </div>
  );
}

function ToolButton({
  tool,
  active,
  tint,
  iconOverride,
  onClick,
}: {
  tool: ToolDef;
  active: boolean;
  tint: string;
  iconOverride?: React.ReactNode;
  onClick: () => void;
}) {
  const Icon = tool.icon;
  return (
    <ActionButton
      onClick={onClick}
      aria-label={tool.label}
      className={cn("relative", active && "bg-foreground/10 text-foreground")}
      tooltip={
        <div className="flex items-center gap-2">
          <span>{tool.label}</span>
          {tool.shortcut && (
            <kbd className="rounded bg-surface-tertiary px-1.5 font-mono text-sm text-muted-foreground">
              {tool.shortcut}
            </kbd>
          )}
        </div>
      }
    >
      {iconOverride ?? (Icon ? <Icon className="size-4.5" /> : null)}
      {active && (
        <span
          className="pointer-events-none absolute bottom-0.75 left-1/2 h-0.5 w-3.5 -translate-x-1/2 rounded-full"
          style={{ background: tint === "#ffffff" ? "#ccc" : tint }}
        />
      )}
    </ActionButton>
  );
}

function annotationModeToShapeKind(
  mode: AnnotationMode,
): AnnotationShapeKind | null {
  if (mode === "arrow" || mode === "rect" || mode === "ellipse") {
    return mode;
  }
  return null;
}
