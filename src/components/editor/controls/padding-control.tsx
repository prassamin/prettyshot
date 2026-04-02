"use client";

import { useEditorStore } from "@/stores/editor-store";
import { ASPECT_RATIOS } from "@/lib/presets";

export function PaddingControl() {
  const {
    padding,
    setPadding,
    aspectRatio,
    setAspectRatio,
    isCustomAspectRatio,
    setIsCustomAspectRatio,
    customAspectRatioWidth,
    customAspectRatioHeight,
    setCustomAspectRatioWidth,
    setCustomAspectRatioHeight,
  } = useEditorStore();

  return (
    <div className="space-y-4">
      {/* Padding slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500">Padding</span>
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-mono font-semibold text-zinc-600">
            {padding}px
          </span>
        </div>
        <input
          type="range"
          min={16}
          max={128}
          value={padding}
          onChange={(e) => setPadding(Number(e.target.value))}
          className="w-full accent-orange-500"
        />
      </div>

      {/* Aspect ratio */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-zinc-500">
          Aspect Ratio
        </span>
        <div className="flex flex-wrap gap-1.5">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar.name}
              onClick={() => {
                setAspectRatio(ar.value);
                setIsCustomAspectRatio(false);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                !isCustomAspectRatio && aspectRatio === ar.value
                  ? "bg-linear-to-r from-orange-500 to-rose-500 text-white shadow-sm"
                  : "bg-zinc-100/80 text-zinc-500 hover:bg-zinc-200/80"
              }`}
            >
              {ar.name}
            </button>
          ))}
          <button
            onClick={() => {
              setIsCustomAspectRatio(true);
              setAspectRatio(customAspectRatioWidth / customAspectRatioHeight);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              isCustomAspectRatio
                ? "bg-linear-to-r from-orange-500 to-rose-500 text-white shadow-sm"
                : "bg-zinc-100/80 text-zinc-500 hover:bg-zinc-200/80"
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom aspect ratio inputs */}
        {isCustomAspectRatio && (
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">
                Width
              </span>
              <input
                type="number"
                value={customAspectRatioWidth}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value));
                  setCustomAspectRatioWidth(val);
                  setAspectRatio(val / customAspectRatioHeight);
                  // We stay in custom mode
                  setIsCustomAspectRatio(true);
                }}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 focus:border-orange-300 focus:outline-hidden"
              />
            </div>
            <div className="mt-5 text-zinc-300 font-bold">:</div>
            <div className="flex-1 space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase">
                Height
              </span>
              <input
                type="number"
                value={customAspectRatioHeight}
                onChange={(e) => {
                  const val = Math.max(1, Number(e.target.value));
                  setCustomAspectRatioHeight(val);
                  setAspectRatio(customAspectRatioWidth / val);
                  // We stay in custom mode
                  setIsCustomAspectRatio(true);
                }}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 focus:border-orange-300 focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
