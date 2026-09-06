"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Eraser,
  Highlighter,
  MousePointer2,
  Pen,
  Trash,
} from "lucide-react";

import { Slider } from "@/components/slider";
import { ColorPicker } from "@/editor/color-picker";
import { Popover } from "@heroui/react";
import { ANNOTATION_STROKES } from "@/editor/elements/constants";
import { useEditor } from "@/editor/lib/engine";
import type {
  AnnotationMode,
  AnnotationShapeKind,
} from "@/editor/elements/types";
import { DashStyleIcon } from "@/editor/elements/shared/dash-style-icon";
import { LINE_STYLE_OPTIONS } from "../elements/shape-element/constants";
import { cn } from "@/lib/utils";

type ToolDef = {
  id: AnnotationMode;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
};

const TOOLS: ToolDef[] = [
  { id: "move", label: "Select", icon: MousePointer2 },
  { id: "pen", label: "Pen", icon: Pen },
  { id: "highlight", label: "Highlighter", icon: Highlighter },
  { id: "eraser", label: "Eraser", icon: Eraser },
  { id: "arrow", label: "Arrow" },
  { id: "rect", label: "Rect" },
  { id: "ellipse", label: "Ellipse" },
];

export function MobileAnnotationBar({ onExit }: { onExit: () => void }) {
  const { annotation, setAnnotation, clearAnnotations } = useEditor();
  const instanceId = React.useId();

  const activeMode = annotation.mode;
  const activeLineStyle = annotation.lineStyle;
  const activeShapeKind = annotationModeToShapeKind(activeMode);
  const showColorControls =
    activeMode === "pen" ||
    activeMode === "highlight" ||
    Boolean(activeShapeKind);
  const showLineStyleControls =
    activeMode === "arrow" || activeMode === "rect" || activeMode === "ellipse";
  const previewShapeKind = activeShapeKind ?? "arrow";

  return (
    <div className="flex h-16 w-full items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Back Button */}
      <button
        type="button"
        aria-label="Back"
        onClick={onExit}
        className="group relative flex h-14 min-w-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 text-muted-foreground transition-colors hover:text-foreground active:scale-95"
      >
        <ChevronLeft className="size-5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
        <span className="truncate text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
          Back
        </span>
      </button>

      {/* Divider */}
      <div className="mx-1 flex h-8 items-center">
        <span className="h-5 w-px shrink-0 bg-border/80" />
      </div>

      {/* Annotation Tool Modes */}
      {TOOLS.map((t) => {
        const shapeKind = annotationModeToShapeKind(t.id);
        const isSelected = activeMode === t.id;
        const Icon = t.icon;

        return (
          <button
            key={t.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => setAnnotation({ mode: t.id })}
            className="group relative flex h-14 min-w-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 text-left outline-none transition-transform active:scale-95"
          >
            {/* Sliding Pill */}
            {isSelected && (
              <motion.div
                layoutId={`mobile-annotation-pill-${instanceId}`}
                className="absolute inset-0 rounded-xl border border-border bg-surface-secondary shadow-xs"
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 32,
                  mass: 0.7,
                }}
              />
            )}

            <div className="relative z-10 flex size-5 items-center justify-center">
              {shapeKind ? (
                <DashStyleIcon
                  style="solid"
                  kind={shapeKind}
                  active={isSelected}
                />
              ) : Icon ? (
                <Icon
                  className={cn(
                    "size-5 shrink-0 transition-colors duration-150",
                    isSelected
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
              ) : null}
            </div>

            <span
              className={cn(
                "relative z-10 truncate text-[11px] transition-colors duration-150",
                isSelected
                  ? "font-semibold text-foreground tracking-tight"
                  : "font-medium text-muted-foreground group-hover:text-foreground",
              )}
            >
              {t.label}
            </span>
          </button>
        );
      })}

      {/* Color & Thickness Trigger */}
      {showColorControls ? (
        <>
          <div className="mx-1 flex h-8 items-center">
            <span className="h-5 w-px shrink-0 bg-border/80" />
          </div>

          <ColorPicker
            value={annotation.color}
            placement="top"
            footer={
              <MobileShapeThicknessPanel
                value={annotation.strokeWidth}
                color={annotation.color}
                onChange={(strokeWidth) => setAnnotation({ strokeWidth })}
              />
            }
            onChange={(hex) => {
              setAnnotation({ color: hex });
            }}
          >
            <button
              type="button"
              aria-label="Color & thickness"
              className="group relative flex h-14 min-w-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 text-left outline-none transition-transform active:scale-95"
            >
              <div className="relative z-10 flex size-5 items-center justify-center">
                <span
                  className="size-4.5 rounded-full border border-foreground/30 shadow-inner"
                  style={{ background: annotation.color }}
                />
              </div>
              <span className="relative z-10 truncate text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                Style
              </span>
            </button>
          </ColorPicker>
        </>
      ) : null}

      {/* Eraser Thickness Trigger for Mobile */}
      {activeMode === "eraser" ? (
        <>
          <div className="mx-1 flex h-8 items-center">
            <span className="h-5 w-px shrink-0 bg-border/80" />
          </div>

          <Popover>
            <Popover.Trigger>
              <button
                type="button"
                aria-label="Eraser size"
                className="group relative flex h-14 min-w-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 text-left outline-none transition-transform active:scale-95"
              >
                <div className="relative z-10 flex size-5 items-center justify-center">
                  <span className="flex size-4.5 items-center justify-center rounded-full border border-foreground/30 bg-foreground/10 shadow-inner">
                    <span
                      className="rounded-full bg-foreground transition-all"
                      style={{
                        width: Math.max(
                          3,
                          Math.min(12, annotation.strokeWidth / 2),
                        ),
                        height: Math.max(
                          3,
                          Math.min(12, annotation.strokeWidth / 2),
                        ),
                      }}
                    />
                  </span>
                </div>
                <span className="relative z-10 truncate text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
                  Size
                </span>
              </button>
            </Popover.Trigger>
            <Popover.Content
              placement="top"
              className="w-64 overflow-hidden rounded-2xl bg-surface-secondary/95 backdrop-blur-xl border border-border shadow-2xl p-3 text-foreground focus-visible:outline-none z-50 *:select-none"
            >
              <MobileEraserThicknessPanel
                value={annotation.strokeWidth}
                onChange={(strokeWidth) => setAnnotation({ strokeWidth })}
              />
            </Popover.Content>
          </Popover>
        </>
      ) : null}

      {/* Line Styles for Shapes */}
      {showLineStyleControls ? (
        <>
          <div className="mx-1 flex h-8 items-center">
            <span className="h-5 w-px shrink-0 bg-border/80" />
          </div>

          {LINE_STYLE_OPTIONS.map((style) => {
            const isSelected = activeLineStyle === style.id;
            return (
              <button
                key={style.id}
                type="button"
                aria-label={`${style.label} line`}
                onClick={() => setAnnotation({ lineStyle: style.id })}
                className={cn(
                  "group relative flex h-14 min-w-13 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 text-left outline-none transition-transform active:scale-95",
                  isSelected && "bg-surface-secondary text-primary",
                )}
              >
                <div className="relative z-10 flex size-5 items-center justify-center">
                  <DashStyleIcon
                    style={style.id}
                    kind={previewShapeKind}
                    active={isSelected}
                  />
                </div>
                <span className="relative z-10 truncate text-[10.5px] font-medium text-muted-foreground">
                  {style.label}
                </span>
              </button>
            );
          })}
        </>
      ) : null}

      {/* Clear All Annotations */}
      <div className="mx-1 flex h-8 items-center">
        <span className="h-5 w-px shrink-0 bg-border/80" />
      </div>

      <button
        type="button"
        aria-label="Clear all annotations"
        onClick={() => clearAnnotations()}
        className="group relative flex h-14 min-w-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 text-left outline-none transition-transform active:scale-95 text-danger hover:bg-danger/10"
      >
        <Trash className="size-5 shrink-0" />
        <span className="relative z-10 truncate text-[11px] font-medium">
          Clear
        </span>
      </button>
    </div>
  );
}

function MobileShapeThicknessPanel({
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

function MobileEraserThicknessPanel({
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
                "grid size-8 cursor-pointer place-items-center rounded-lg border border-transparent transition-colors hover:bg-surface-tertiary",
                isActive && "border-border bg-surface-tertiary shadow-xs",
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

function annotationModeToShapeKind(
  mode: AnnotationMode,
): AnnotationShapeKind | null {
  if (mode === "arrow" || mode === "rect" || mode === "ellipse") {
    return mode;
  }
  return null;
}
