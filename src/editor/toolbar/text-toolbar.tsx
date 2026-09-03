"use client";

import * as React from "react";
import { BringToFront, SendToBack } from "lucide-react";

import { ColorPicker } from "@/editor/color-picker";
import {
  ActionButton,
  DeleteAction,
  Divider,
  DuplicateAction,
  ActionPopover,
  ToolPanel,
} from "@/editor/toolbar/controls";

import {
  TextAlignStart,
  TextAlignCenter,
  TextAlignEnd,
  Plus,
  Minus,
  SquareOff,
} from "lucide-react";
import { Slider } from "@/components/slider";
import { useEditor } from "@/editor/lib/engine";
import type {
  BorderStyle,
  TextAlign,
  TextElement,
} from "@/editor/elements/types";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/tooltip";

const ALIGN_ORDER: TextAlign[] = ["left", "center", "right"];
const ALIGN_ICONS: Record<
  TextAlign,
  React.ComponentType<{ className?: string }>
> = {
  left: TextAlignStart,
  center: TextAlignCenter,
  right: TextAlignEnd,
};

export function TextToolbar({ text }: { text: TextElement }) {
  const {
    updateText,
    deleteText,
    duplicateText,
    bringTextToFront,
    sendTextToBack,
    setSelectedTextId,
  } = useEditor();

  const [fontSizeInput, setFontSizeInput] = React.useState(
    String(text.fontSize),
  );
  const fontSizePointerHandledRef = React.useRef(false);

  const setSize = React.useCallback(
    (n: number) =>
      updateText(text.id, { fontSize: Math.max(8, Math.min(200, n)) }),
    [text.id, updateText],
  );

  const changeFontSize = React.useCallback(
    (delta: number) => setSize(text.fontSize + delta),
    [setSize, text.fontSize],
  );

  const onFontSizePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLButtonElement>, delta: number) => {
      fontSizePointerHandledRef.current = true;
      e.preventDefault();
      e.stopPropagation();
      changeFontSize(delta);
    },
    [changeFontSize],
  );

  const onFontSizeClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, delta: number) => {
      e.preventDefault();
      e.stopPropagation();
      if (fontSizePointerHandledRef.current) {
        fontSizePointerHandledRef.current = false;
        return;
      }
      changeFontSize(delta);
    },
    [changeFontSize],
  );

  React.useEffect(() => {
    setFontSizeInput(String(text.fontSize));
  }, [text.fontSize]);

  const commitFontSize = React.useCallback(() => {
    const next = Number(fontSizeInput);
    if (!Number.isFinite(next) || next <= 0) {
      setFontSizeInput(String(text.fontSize));
      return;
    }
    setSize(next);
  }, [fontSizeInput, text.fontSize, setSize]);

  const AlignIcon = ALIGN_ICONS[text.align];

  const cycleAlign = () => {
    const idx = ALIGN_ORDER.indexOf(text.align);
    const next = ALIGN_ORDER[(idx + 1) % ALIGN_ORDER.length];
    updateText(text.id, { align: next });
  };
  return (
    <ToolPanel>
      {/* Font Size Group */}
      <div className="flex items-center">
        <Tooltip content="Decrease">
          <button
            type="button"
            aria-label="Decrease"
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10/5 hover:text-foreground active:scale-95"
            onPointerDown={(e) => onFontSizePointerDown(e, -1)}
            onClick={(e) => onFontSizeClick(e, -1)}
          >
            <Minus className="size-4.5" />
          </button>
        </Tooltip>
        <Tooltip content="Font size">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={fontSizeInput}
            onChange={(e) => {
              const next = e.target.value;
              setFontSizeInput(next);
              if (next === "") return;
              const parsed = Number(next);
              if (Number.isFinite(parsed) && parsed > 0) setSize(parsed);
            }}
            onBlur={commitFontSize}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitFontSize();
              }
            }}
            aria-label="Font size"
            className="w-8 bg-transparent text-center font-mono text-[14px] font-medium text-foreground focus:outline-none focus:ring-0"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          />
        </Tooltip>
        <Tooltip content="Increase">
          <button
            type="button"
            aria-label="Increase"
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10/5 hover:text-foreground active:scale-95"
            onPointerDown={(e) => onFontSizePointerDown(e, 1)}
            onClick={(e) => onFontSizeClick(e, 1)}
          >
            <Plus className="size-4.5" />
          </button>
        </Tooltip>
      </div>

      <Divider />

      <ActionButton
        aria-label={`Alignment: ${text.align}`}
        tooltip={<span className="capitalize">Align {text.align}</span>}
        onClick={cycleAlign}
      >
        <AlignIcon className="size-4.5" />
      </ActionButton>

      <ColorPicker
        value={text.color}
        placement="top"
        onChange={(hex) =>
          updateText(text.id, { color: hex, autoColor: false })
        }
      >
        <ActionButton aria-label="Text color" tooltip="Text color">
          <span
            className="size-4.5 rounded-full border border-foreground/20 shadow-inner transition-transform active:scale-95"
            style={{ backgroundColor: text.color }}
          />
        </ActionButton>
      </ColorPicker>

      <ActionPopover
        tooltip="Border"
        contentClassName="w-64 p-3"
        trigger={({ open }) => (
          <ActionButton
            aria-label="Text border"
            className={cn(open && "bg-foreground/10 text-foreground")}
          >
            {text.borderWidth > 0 ? (
              <span
                className="size-4.5 rounded-md border-2"
                style={{
                  borderColor: text.borderColor || "#ffffff",
                  borderStyle: text.borderStyle || "solid",
                }}
              />
            ) : (
              <SquareOff className="size-4.5" />
            )}
          </ActionButton>
        )}
      >
        <TextBorderSettings text={text} updateText={updateText} />
      </ActionPopover>

      <Divider />

      <ActionButton
        aria-label="Bring to front"
        tooltip="Bring to front"
        onClick={() => bringTextToFront(text.id)}
      >
        <BringToFront className="size-4.5" />
      </ActionButton>

      <ActionButton
        aria-label="Send to back"
        tooltip="Send to back"
        onClick={() => sendTextToBack(text.id)}
      >
        <SendToBack className="size-4.5" />
      </ActionButton>

      <DuplicateAction
        ariaLabel="Duplicate text"
        onDuplicate={() => {
          const id = duplicateText(text.id);
          if (id) setSelectedTextId(id);
        }}
      />

      <DeleteAction
        ariaLabel="Delete text"
        onDelete={() => {
          deleteText(text.id);
          setSelectedTextId(null);
        }}
      />
    </ToolPanel>
  );
}

const TEXT_BORDER_PRESETS = [
  "#ffffff",
  "#18181b",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
];

const TEXT_BORDER_STYLES: { id: BorderStyle; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "dashed", label: "Dashed" },
  { id: "dotted", label: "Dotted" },
  { id: "double", label: "Double" },
  { id: "groove", label: "Groove" },
  { id: "ridge", label: "Ridge" },
];

function TextBorderSettings({
  text,
  updateText,
}: {
  text: TextElement;
  updateText: (id: string, patch: Partial<TextElement>) => void;
}) {
  const isWidthZero = text.borderWidth === 0;
  const enabled = !isWidthZero;
  const currentColor = text.borderColor || "#ffffff";
  const currentStyle = text.borderStyle || "solid";
  const isCustomColor =
    enabled &&
    !TEXT_BORDER_PRESETS.some(
      (c) => c.toLowerCase() === currentColor.toLowerCase(),
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/80">
          Border
        </span>
      </div>

      {/* Preset Colors */}
      <div
        className={cn(
          "flex flex-col gap-3 transition-opacity duration-300",
          isWidthZero && "pointer-events-none opacity-50 grayscale-30",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground">
            Color
          </span>
        </div>
        <div className="flex items-center gap-2">
          {TEXT_BORDER_PRESETS.map((c) => {
            const active =
              enabled && currentColor.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                onClick={() => updateText(text.id, { borderColor: c })}
                className={cn(
                  "size-6.5 cursor-pointer rounded-full transition-all shrink-0 relative",
                  active
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                    : "ring-1 ring-border/50 hover:scale-110",
                )}
                style={{ background: c }}
              />
            );
          })}
          {/* Custom Color Picker Button */}
          <ColorPicker
            value={isCustomColor ? currentColor : "#ffffff"}
            onChange={(hex) => updateText(text.id, { borderColor: hex })}
            placement="top"
          >
            <div
              role="button"
              className={cn(
                "size-6.5 cursor-pointer rounded-full transition-all shrink-0",
                isCustomColor
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                  : "ring-1 ring-border/50 hover:scale-110",
              )}
              style={{
                background: isCustomColor
                  ? currentColor
                  : "linear-gradient(135deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa)",
              }}
              aria-label="Custom border color"
            />
          </ColorPicker>
        </div>
      </div>

      {/* Width Slider */}
      <div className="border-t border-border/40 pt-4">
        <Slider
          label="Thickness"
          min={0}
          max={20}
          step={1}
          value={text.borderWidth}
          formatValue={(v) => `${Math.round(v)}`}
          onValueChange={(v) =>
            updateText(text.id, {
              borderWidth: v,
              borderColor: v === 0 ? null : text.borderColor || "#ffffff",
            })
          }
        />
      </div>

      {/* Style Selection */}
      <div
        className={cn(
          "flex flex-col gap-3 border-t border-border/40 pt-4 transition-opacity duration-300",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground">
            Style
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TEXT_BORDER_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                updateText(text.id, {
                  borderStyle: s.id,
                  borderColor: text.borderColor || "#ffffff",
                  borderWidth: text.borderWidth || 1,
                });
              }}
              className={cn(
                "group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border p-2.5 transition-all duration-200",
                currentStyle === s.id
                  ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_-3px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                  : "border-border/40 bg-foreground/2 text-muted-foreground hover:border-border/70 hover:bg-foreground/5 hover:text-foreground",
              )}
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-overlay/40 p-1.5 shadow-[inset_0_2px_4px_color-mix(in_oklab,var(--overlay)_60%,transparent),] transition-colors group-hover:bg-black/40">
                <div
                  className="size-full rounded-lg border-[2.5px] opacity-90"
                  style={{ borderStyle: s.id, borderColor: "currentColor" }}
                />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-90">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
