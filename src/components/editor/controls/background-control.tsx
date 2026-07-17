"use client";

import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, Sparkles, Lock } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import { useAppStore } from "@/stores/app-store";
import { useRouter } from "@/hooks/use-router";
import {
  GRADIENT_PRESETS,
  MESH_GRADIENT_PRESETS,
  SOLID_COLOR_PRESETS,
} from "@/lib/presets";
import { isPro } from "@/lib/utils";

/* ─── tab button ─── */

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? "text-zinc-800" : "text-zinc-400 hover:text-zinc-600"
      }`}
    >
      {active && (
        <motion.div
          layoutId="bg-tab"
          className="absolute inset-0 rounded-lg bg-white shadow-sm"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

/* ─── main ─── */

export function BackgroundControl() {
  const {
    bgType,
    bgGradient,
    bgMesh,
    bgSolid,
    bgImage,
    setBgType,
    setBgGradient,
    setBgMesh,
    setBgSolid,
    setBgImage,
    noiseOpacity,
    setNoiseOpacity,
  } = useEditorStore();

  const { user } = useAppStore();
  const pro = isPro(user);
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setBgImage(reader.result);
          setBgType("image");
        }
      };
      reader.readAsDataURL(file);
    },
    [setBgImage, setBgType],
  );

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-zinc-100/80 p-1">
        <TabButton
          active={bgType === "gradient"}
          label="Gradient"
          onClick={() => setBgType("gradient")}
        />
        <TabButton
          active={bgType === "mesh"}
          label="Mesh"
          onClick={() => setBgType("mesh")}
        />
        <TabButton
          active={bgType === "solid"}
          label="Solid"
          onClick={() => setBgType("solid")}
        />
        <TabButton
          active={bgType === "image"}
          label="Image"
          onClick={() => setBgType("image")}
        />
      </div>

      {/* Gradient swatches */}
      {bgType === "gradient" && (
        <div className="flex flex-wrap gap-2">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setBgGradient(preset.className)}
              className="group relative shrink-0"
              title={preset.name}
            >
              {bgGradient === preset.className && (
                <div className="absolute -inset-1 rounded-xl bg-linear-to-br from-orange-400 to-violet-500 opacity-60" />
              )}
              <div
                className={`relative size-10 rounded-lg bg-linear-to-br ${preset.className} ring-1 ring-black/5 transition-transform group-hover:scale-105`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Mesh gradient swatches */}
      {bgType === "mesh" && (
        <div className="flex flex-wrap gap-2">
          {MESH_GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.src}
              onClick={() => setBgMesh(preset.src)}
              className="group relative shrink-0"
              title={preset.name}
            >
              {bgMesh === preset.src && (
                <div className="absolute -inset-1 rounded-xl bg-linear-to-br from-orange-400 to-violet-500 opacity-60" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preset.src}
                alt={preset.name}
                className="relative size-10 rounded-lg object-cover ring-1 ring-black/5 transition-transform group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      )}

      {/* Solid color */}
      {bgType === "solid" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {SOLID_COLOR_PRESETS.map((color) => (
              <button
                key={color}
                onClick={() => setBgSolid(color)}
                className="group relative shrink-0"
              >
                {bgSolid === color && (
                  <div className="absolute -inset-0.5 rounded-lg bg-linear-to-br from-orange-400 to-violet-500 opacity-70" />
                )}
                <div
                  className="relative size-10 rounded-md ring-1 ring-black/10 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: color }}
                />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={bgSolid}
              onChange={(e) => setBgSolid(e.target.value)}
              className="size-8 cursor-pointer rounded-lg border-0 bg-transparent"
            />
            <input
              type="text"
              value={bgSolid}
              onChange={(e) => setBgSolid(e.target.value)}
              className="flex-1 rounded-lg bg-zinc-100/80 px-3 py-1.5 text-xs font-mono text-zinc-600 outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>
      )}

      {/* Image upload */}
      {bgType === "image" && (
        <div className="space-y-2">
          {!pro.isActive ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 shadow-sm">
                <Lock className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-violet-900">Pro Feature</h4>
                <p className="mt-0.5 text-xs font-medium text-violet-600/80">
                  Upgrade to use custom backgrounds.
                </p>
              </div>
              <button 
                onClick={() => router.push("/login", { auth: true, next: "/checkout" })}
                className="mt-1 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-500/25 transition-transform hover:scale-105"
              >
                Upgrade to Pro
              </button>
            </div>
          ) : bgImage ? (
            <div className="relative overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bgImage}
                alt="Background"
                className="h-24 w-full rounded-xl object-cover"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 text-xs font-semibold text-white opacity-0 transition-opacity hover:opacity-100"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 py-6 text-xs font-semibold text-zinc-400 transition-colors hover:border-orange-300 hover:text-orange-500"
            >
              <Upload className="size-4" />
              Upload Background Image
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      )}
      {/* Noise overlay */}
      <div className="space-y-2 border-t border-zinc-100 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-500">Noise</span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {noiseOpacity}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={noiseOpacity}
          onChange={(e) => setNoiseOpacity(Number(e.target.value))}
          className="w-full accent-orange-400"
        />
      </div>
    </div>
  );
}
