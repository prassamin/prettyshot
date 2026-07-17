"use client";

import { motion, LayoutGroup } from "framer-motion";
import { useId } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { SHADOW_PRESETS } from "@/lib/presets";

const QUICK_COLORS = [
  "#000000",
  "#6b7280",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
];

export function ShadowControl() {
  const uid = useId();
  const { shadowPreset, setShadowPreset, shadowColor, setShadowColor } =
    useEditorStore();

  /** Resolve template for swatch preview */
  const resolveStyle = (template: string, color: string) =>
    template === "none" ? "none" : template.replace(/\{color\}/g, color);

  return (
    <div className="space-y-3">
      {/* Preset grid */}
      <LayoutGroup id={`shadow-presets-${uid}`}>
        <div className="grid grid-cols-3 gap-2">
          {SHADOW_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setShadowPreset(preset.name)}
              className="group relative flex flex-col items-center gap-2 rounded-xl px-1 py-3 transition-all hover:bg-zinc-50"
            >
              {shadowPreset === preset.name && (
                <motion.div
                  layoutId="shadow-preset-indicator"
                  className="absolute inset-0 rounded-xl bg-orange-50 ring-2 ring-orange-400"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className="relative flex size-10 items-center justify-center">
                <div
                  className="size-8 rounded-lg bg-muted/20 ring-1 ring-black/5"
                  style={{
                    boxShadow:
                      preset.style === "none"
                        ? undefined
                        : resolveStyle(preset.style, "#000000"),
                  }}
                />
              </div>
              <span className="relative text-[10px] font-semibold text-zinc-500">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      {/* Shadow color */}
      {shadowPreset !== "None" && (
        <div className="space-y-2 border-t border-zinc-100 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Shadow Color
          </p>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setShadowColor(color)}
                  className="group relative"
                >
                  {shadowColor === color && (
                    <div className="absolute -inset-0.5 rounded-md bg-linear-to-br from-orange-400 to-violet-500 opacity-70" />
                  )}
                  <div
                    className="relative size-6 rounded-md ring-1 ring-black/10 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={shadowColor}
              onChange={(e) => setShadowColor(e.target.value)}
              className="size-8 cursor-pointer rounded-lg border-0 bg-transparent"
            />
            <input
              type="text"
              value={shadowColor}
              onChange={(e) => setShadowColor(e.target.value)}
              className="flex-1 rounded-lg bg-zinc-100/80 px-3 py-1.5 font-mono text-xs text-zinc-600 outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>
      )}
    </div>
  );
}
