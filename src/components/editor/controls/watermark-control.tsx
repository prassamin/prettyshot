"use client";

import { PenLine } from "lucide-react";
import { Button } from "@heroui/react";
import { useEditorStore } from "@/stores/editor-store";
import { useAppStore } from "@/stores/app-store";
import { useRouter } from "@/hooks/use-router";
import { cn, isPro } from "@/lib/utils";

export function WatermarkControl() {
  const {
    showWatermark,
    setShowWatermark,
    watermarkText,
    setWatermarkText,
    watermarkPosition,
    setWatermarkPosition,
    watermarkSize,
    setWatermarkSize,
  } = useEditorStore();

  const { user } = useAppStore();
  const pro = isPro(user);
  const router = useRouter();

  const handleProAction = (action: () => void) => {
    if (!pro.isActive) {
      router.push("/login", { auth: true, next: "/checkout" });
      return;
    }
    action();
  };

  return (
    <div className="relative">
      <div
        className={cn(
          `space-y-4`,
          !pro.isActive ? "pointer-events-none opacity-40 blur-[2px]" : "",
        )}
      >
        {/* Visibility Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500">
            Show Watermark
          </span>
          <button
            onClick={() =>
              handleProAction(() => setShowWatermark(!showWatermark))
            }
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              showWatermark ? "bg-orange-500" : "bg-zinc-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showWatermark ? "translate-x-2" : "-translate-x-2"
              }`}
            />
          </button>
        </div>

        {/* Custom Text Input */}
        <div className="relative">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Custom Text
          </div>
          <div className="relative flex items-center">
            <PenLine className="absolute left-3 size-3.5 text-zinc-400" />
            <input
              type="text"
              value={watermarkText}
              onChange={(e) => {
                if (pro.isActive) setWatermarkText(e.target.value);
              }}
              readOnly={!pro.isActive}
              placeholder="Your Brand"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm font-semibold text-zinc-800 focus:border-orange-400 focus:outline-hidden disabled:opacity-50"
            />
          </div>
        </div>

        {/* Position Selector */}
        <div className="relative pt-2">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Position
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: "top-left", label: "Top L" },
                { id: "top-right", label: "Top R" },
                { id: "bottom-left", label: "Bot L" },
                { id: "bottom-right", label: "Bot R" },
              ] as const
            ).map((pos) => (
              <button
                key={pos.id}
                onClick={() => {
                  if (pro.isActive) setWatermarkPosition(pos.id);
                  else handleProAction(() => {});
                }}
                className={`rounded-lg py-1.5 text-[10px] font-semibold transition-all ${
                  watermarkPosition === pos.id
                    ? "bg-zinc-800 text-white"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Size Slider */}
        <div className="relative pt-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Size
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {watermarkSize}%
            </span>
          </div>
          <input
            type="range"
            min={50}
            max={200}
            value={watermarkSize}
            onChange={(e) => {
              if (pro.isActive) setWatermarkSize(Number(e.target.value));
            }}
            className="w-full accent-orange-400"
          />
        </div>
      </div>

      {/* Upgrade Prompt */}
      {!pro.isActive && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-2">
          <div className="rounded-xl border border-rose-200/50 bg-white/90 p-4 shadow-xl backdrop-blur-md text-center">
            <h4 className="text-sm font-bold text-rose-900">
              Custom Watermarks
            </h4>
            <p className="mt-1 text-xs font-medium text-rose-700/80 leading-relaxed">
              Upgrade to Pro to remove the PrettyShot watermark or customize it
              with your own brand name.
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
