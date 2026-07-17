"use client";

import { motion, LayoutGroup } from "framer-motion";
import { useId } from "react";
import { RotateCcw } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import { useAppStore } from "@/stores/app-store";
import { useRouter } from "@/hooks/use-router";
import { Button } from "@heroui/react";
import { cn, isPro } from "@/lib/utils";

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
  { name: "Iso Left", x: 30, y: 30, z: 0 },
  { name: "Iso Right", x: 30, y: -30, z: 0 },
  { name: "Extreme", x: 45, y: 0, z: 15 },
  { name: "Showcase", x: 20, y: -20, z: 10 },
  { name: "Sweep", x: -15, y: 30, z: -5 },
  { name: "Laying", x: 45, y: 0, z: 0 },
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
  isPro: boolean;
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
        onChange={(e) => {
          if (!isPro) return;
          onChange(Number(e.target.value));
        }}
        className="w-full accent-orange-400"
      />
    </div>
  );
}

export function PerspectiveControl() {
  const uid = useId();
  const { rotateX, rotateY, rotateZ, setRotateX, setRotateY, setRotateZ } =
    useEditorStore();

  const { user } = useAppStore();
  const pro = isPro(user);
  const router = useRouter();

  const isActive = (p: TiltPreset) =>
    p.x === rotateX && p.y === rotateY && p.z === rotateZ;

  const handleReset = () => {
    if (!pro.isActive) return;
    setRotateX(0);
    setRotateY(0);
    setRotateZ(0);
  };

  return (
    <div className="relative">
      <div
        className={cn(
          `space-y-3`,
          !pro.isActive ? "pointer-events-none opacity-40 blur-[2px]" : "",
        )}
      >
        {/* Presets */}
        <LayoutGroup id={`perspective-presets-${uid}`}>
          <div className="grid grid-cols-3 gap-2">
            {TILT_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  if (!pro.isActive) return;
                  setRotateX(preset.x);
                  setRotateY(preset.y);
                  setRotateZ(preset.z);
                }}
                className="group relative flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 transition-all hover:bg-zinc-50"
              >
                {isActive(preset) && (
                  <motion.div
                    layoutId="tilt-preset-indicator"
                    className="absolute inset-0 rounded-xl bg-orange-50 ring-2 ring-orange-400"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div
                  className="relative flex size-9 items-center justify-center"
                  style={{ perspective: "120px" }}
                >
                  <div
                    className="size-7 rounded-sm bg-zinc-200 ring-1 ring-black/10 transition-transform duration-300 group-hover:scale-110"
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
        </LayoutGroup>

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
          <Slider
            label="Tilt X"
            value={rotateX}
            onChange={setRotateX}
            min={-60}
            max={60}
            isPro={pro.isActive}
          />
          <Slider
            label="Tilt Y"
            value={rotateY}
            onChange={setRotateY}
            min={-60}
            max={60}
            isPro={pro.isActive}
          />
          <Slider
            label="Rotate"
            value={rotateZ}
            onChange={setRotateZ}
            min={-45}
            max={45}
            isPro={pro.isActive}
          />
        </div>
      </div>

      {!pro.isActive && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-2">
          <div className="rounded-xl border border-rose-200/50 bg-white/90 p-4 shadow-xl backdrop-blur-md text-center">
            <h4 className="text-sm font-bold text-rose-900">3D Perspective</h4>
            <p className="mt-1 text-xs font-medium text-rose-700/80 leading-relaxed">
              Unlock stunning 3D rotations and isometric presets to make your
              screenshots pop.
            </p>
            <Button
              onPress={() =>
                router.push("/login", { auth: true, next: "/checkout" })
              }
              className="mt-3 w-full bg-linear-to-r from-orange-500 to-rose-500 font-bold text-white shadow-md shadow-rose-500/20 transition-transform hover:scale-[1.02]"
              size="sm"
            >
              Upgrade to Unlock
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
