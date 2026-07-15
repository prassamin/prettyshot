"use client";

import { useEditorStore } from "@/stores/editor-store";

const RADIUS_PRESETS = [0, 8, 16, 24, 48];
const BORDER_PRESETS = [0, 1, 2, 4, 8];
const COLORS = [
  "#ffffff",
  "#000000",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
];

function parseColorParts(color: string) {
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16) || 0;
    const g = parseInt(color.slice(3, 5), 16) || 0;
    const b = parseInt(color.slice(5, 7), 16) || 0;
    return { r, g, b, a: 1 };
  }
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1,
    };
  }
  return { r: 255, g: 255, b: 255, a: 0.4 };
}

function rgbaToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, "0")).join("");
}

export function BorderControl() {
  const {
    borderRadius,
    setBorderRadius,
    borderWidth,
    setBorderWidth,
    borderColor,
    setBorderColor,
  } = useEditorStore();

  const currentParts = parseColorParts(borderColor);
  const currentHex = rgbaToHex(currentParts.r, currentParts.g, currentParts.b);
  const currentAlpha = currentParts.a;

  const handleColorChange = (hex: string) => {
    const rgb = parseColorParts(hex);
    setBorderColor(`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentAlpha})`);
  };

  const handleOpacityChange = (alpha: number) => {
    setBorderColor(
      `rgba(${currentParts.r}, ${currentParts.g}, ${currentParts.b}, ${alpha})`
    );
  };

  return (
    <div className="space-y-6">
      {/* Border Width */}
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">
              Border Width
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-mono font-semibold text-zinc-600">
              {borderWidth}px
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={24}
            value={borderWidth}
            onChange={(e) => setBorderWidth(Number(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>
        <div className="flex gap-2">
          {BORDER_PRESETS.map((w) => (
            <button
              key={w}
              onClick={() => setBorderWidth(w)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                borderWidth === w
                  ? "bg-violet-50 text-violet-600 ring-2 ring-violet-400"
                  : "bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Border Color & Opacity Card */}
      {borderWidth > 0 && (
        <div className="space-y-5 rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-200/60">
          <div className="space-y-3">
            <span className="text-xs font-semibold text-zinc-500">Color</span>
            <div className="flex flex-wrap items-center gap-2">
              {/* Custom Color Wheel */}
              <div
                className="relative flex size-7 items-center justify-center overflow-hidden rounded-full border border-white shadow-sm ring-1 ring-zinc-200 transition-all hover:scale-110"
                style={{
                  background:
                    "conic-gradient(from 90deg, red, yellow, lime, aqua, blue, magenta, red)",
                }}
                title="Custom Color"
              >
                <input
                  type="color"
                  value={currentHex}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="absolute -inset-2 size-12 cursor-pointer opacity-0"
                />
              </div>

              <div className="mx-1 h-5 w-px bg-zinc-200" />

              {/* Preset Swatches */}
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className={`relative size-7 rounded-full border border-white shadow-sm transition-all hover:scale-110 ${
                    currentHex === c ? "ring-2 ring-violet-500" : "ring-1 ring-zinc-200"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">
                Opacity
              </span>
              <span className="rounded-md bg-white px-2 py-0.5 text-xs font-mono font-semibold text-zinc-600 shadow-sm ring-1 ring-zinc-200/60">
                {Math.round(currentAlpha * 100)}%
              </span>
            </div>
            
            {/* Custom Alpha Slider */}
            <div 
              className="relative h-3 w-full rounded-full shadow-inner ring-1 ring-black/5"
              style={{
                backgroundColor: "#e4e4e7",
                backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"8\" height=\"8\" viewBox=\"0 0 8 8\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h4v4H0zm4 4h4v4H4z\" fill=\"%23cbd5e1\" fill-opacity=\"0.4\" fill-rule=\"evenodd\"/%3E%3C/svg%3E')",
              }}
            >
              <div 
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background: `linear-gradient(to right, transparent, ${currentHex})`,
                }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={currentAlpha * 100}
                onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
              {/* Slider Thumb */}
              <div 
                className="pointer-events-none absolute top-1/2 -mt-2 size-4 rounded-full border-2 border-white bg-violet-500 shadow-md transition-all duration-75"
                style={{ left: `calc(${currentAlpha * 100}% - 8px)` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Corners */}
      <div className="space-y-3 pt-3 border-t border-zinc-100">
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

        <div className="flex gap-2">
          {RADIUS_PRESETS.map((r) => (
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
              <span className="text-[10px] font-semibold text-zinc-500">
                {r}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
