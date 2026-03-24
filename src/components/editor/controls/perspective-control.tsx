"use client";

import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";

interface TiltPreset {
  name: string;
  x: number;
  y: number;
  z: number;
}

const TILT_PRESETS: TiltPreset[] = [
  { name: "Flat", x: 0, y: 0, z: 0 },
  { name: "Left", x: 0, y: 12, z: 0 },
  { name: "Right", x: 0, y: -12, z: 0 },
  { name: "Top", x: 12, y: 0, z: 0 },
  { name: "Bottom", x: -12, y: 0, z: 0 },
  { name: "Tilt Left", x: 0, y: 0, z: 3 },
  { name: "Tilt Right", x: 0, y: 0, z: -3 },
  { name: "Hero Left", x: 8, y: 12, z: -2 },
  { name: "Hero Right", x: 8, y: -12, z: 2 },
];

function Slider({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-zinc-400">{label}</span>
        <span className="text-[10px] font-mono text-zinc-400">{value}°</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-orange-400"
      />
    </div>
  );
}

export function PerspectiveControl() {
  const rotateX = useEditorStore((s) => s.rotateX);
  const rotateY = useEditorStore((s) => s.rotateY);
  const rotateZ = useEditorStore((s) => s.rotateZ);
  const setRotateX = useEditorStore((s) => s.setRotateX);
  const setRotateY = useEditorStore((s) => s.setRotateY);
  const setRotateZ = useEditorStore((s) => s.setRotateZ);

  const isActive = (p: TiltPreset) =>
    p.x === rotateX && p.y === rotateY && p.z === rotateZ;

  const handleReset = () => {
    setRotateX(0);
    setRotateY(0);
    setRotateZ(0);
  };

  return (
    <div className="space-y-3">
      {/* Presets */}
      <div className="grid grid-cols-3 gap-2">
        {TILT_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => {
              setRotateX(preset.x);
              setRotateY(preset.y);
              setRotateZ(preset.z);
            }}
            className="group relative flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 transition-all"
          >
            {isActive(preset) && (
              <motion.div
                layoutId="tilt-active"
                className="absolute inset-0 rounded-xl bg-orange-50 ring-2 ring-orange-400"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <div
              className="relative flex size-9 items-center justify-center"
              style={{ perspective: "120px" }}
            >
              <div
                className="size-7 rounded-sm bg-zinc-200 ring-1 ring-black/10"
                style={{
                  transform: `rotateX(${preset.x}deg) rotateY(${preset.y}deg) rotateZ(${preset.z}deg)`,
                }}
              />
            </div>
            <span className="relative text-[9px] font-semibold text-zinc-500">
              {preset.name}
            </span>
          </button>
        ))}
      </div>

      {/* Custom sliders */}
      <div className="space-y-2 border-t border-zinc-100 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Custom
          </p>
          {(rotateX !== 0 || rotateY !== 0 || rotateZ !== 0) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] font-semibold text-orange-500 hover:text-orange-600"
            >
              <RotateCcw className="size-3" />
              Reset
            </button>
          )}
        </div>
        <Slider label="Tilt X" value={rotateX} onChange={setRotateX} min={-30} max={30} />
        <Slider label="Tilt Y" value={rotateY} onChange={setRotateY} min={-30} max={30} />
        <Slider label="Rotate" value={rotateZ} onChange={setRotateZ} min={-15} max={15} />
      </div>
    </div>
  );
}
