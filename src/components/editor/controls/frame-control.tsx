"use client";

import { useEditorStore } from "@/stores/editor-store";
import { useAppStore } from "@/stores/app-store";
import { useRouter } from "@/hooks/use-router";
import { Laptop, Monitor, AppWindow, Square } from "lucide-react";
import { Button } from "@heroui/react";

export function FrameControl() {
  const { deviceFrame, setDeviceFrame } = useEditorStore();
  const { user } = useAppStore();
  const isPro = user?.is_pro === true;
  const router = useRouter();

  const handleSetFrame = (frame: "none" | "macos" | "windows" | "glass") => {
    if (!isPro && frame !== "none") {
      router.push("/login", { auth: true, next: "/checkout" });
      return;
    }
    setDeviceFrame(frame);
  };

  const frames = [
    { id: "none", label: "None", icon: <Square className="size-4" /> },
    { id: "macos", label: "macOS", icon: <Laptop className="size-4" /> },
    { id: "windows", label: "Windows", icon: <Monitor className="size-4" /> },
    { id: "glass", label: "Glass", icon: <AppWindow className="size-4" /> },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {frames.map((frame) => {
          const isSelected = deviceFrame === frame.id;
          const isLocked = !isPro && frame.id !== "none";

          return (
            <button
              key={frame.id}
              onClick={() => handleSetFrame(frame.id)}
              className={`group relative flex flex-col size-20 justify-center items-center gap-2 rounded-xl border p-3 transition-all ${
                isSelected
                  ? "border-orange-500 bg-orange-50/50 text-orange-600 shadow-sm"
                  : "border-transparent bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              {frame.icon}
              <span className="text-[10px] font-bold">{frame.label}</span>

              {isLocked && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-white/60 backdrop-blur-[1px] transition-all hover:bg-white/80">
                  <div className="rounded-full bg-linear-to-r from-orange-500 to-rose-500 px-2 py-0.5 text-[8px] font-bold text-white shadow-sm transition-transform group-hover:scale-105">
                    PRO
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {!isPro && (
        <div className="rounded-xl border border-rose-200/50 bg-linear-to-br from-orange-50 to-rose-50 p-4">
          <h4 className="text-sm font-bold text-rose-900">Premium Mockups</h4>
          <p className="mt-1 text-xs font-medium text-rose-700/80">
            Wrap your screenshots in beautiful device frames. Perfect for landing pages and social media.
          </p>
          <Button
            onPress={() => router.push("/login", { auth: true, next: "/checkout" })}
            className="mt-3 w-full bg-linear-to-r from-orange-500 to-rose-500 font-bold text-white shadow-md shadow-rose-500/20 transition-transform hover:scale-[1.02]"
            size="sm"
          >
            Upgrade to Unlock
          </Button>
        </div>
      )}
    </div>
  );
}
