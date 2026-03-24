"use client";

import { useEditorStore } from "@/stores/editor-store";
import { ASPECT_RATIOS } from "@/lib/presets";

export function PaddingControl() {
  const padding = useEditorStore((s) => s.padding);
  const setPadding = useEditorStore((s) => s.setPadding);
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);

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
      <div className="space-y-2">
        <span className="text-xs font-semibold text-zinc-500">
          Aspect Ratio
        </span>
        <div className="flex flex-wrap gap-1.5">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar.name}
              onClick={() => setAspectRatio(ar.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                aspectRatio === ar.value
                  ? "bg-linear-to-r from-orange-500 to-rose-500 text-white shadow-sm"
                  : "bg-zinc-100/80 text-zinc-500 hover:bg-zinc-200/80"
              }`}
            >
              {ar.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
