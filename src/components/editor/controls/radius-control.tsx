"use client";

import { useEditorStore } from "@/stores/editor-store";

const QUICK_PRESETS = [0, 8, 16, 24, 48];

export function RadiusControl() {
  const borderRadius = useEditorStore((s) => s.borderRadius);
  const setBorderRadius = useEditorStore((s) => s.setBorderRadius);

  return (
    <div className="space-y-3">
      {/* Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500">Radius</span>
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-mono font-semibold text-zinc-600">
            {borderRadius}px
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={48}
          value={borderRadius}
          onChange={(e) => setBorderRadius(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
      </div>

      {/* Quick presets with visual preview */}
      <div className="flex gap-2">
        {QUICK_PRESETS.map((r) => (
          <button
            key={r}
            onClick={() => setBorderRadius(r)}
            className={`flex flex-col items-center gap-1.5 rounded-lg px-2 py-2 transition-all ${
              borderRadius === r
                ? "bg-violet-50 ring-2 ring-violet-400"
                : "hover:bg-zinc-50"
            }`}
          >
            <div
              className="size-8 bg-linear-to-br from-violet-300 to-purple-400"
              style={{ borderRadius: `${Math.min(r, 16)}px` }}
            />
            <span className="text-[10px] font-semibold text-zinc-500">{r}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
