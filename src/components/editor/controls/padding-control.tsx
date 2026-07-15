"use client";

import { useEditorStore } from "@/stores/editor-store";

export function PaddingControl() {
  const {
    padding,
    setPadding,
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
    </div>
  );
}
