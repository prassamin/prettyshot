"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Link as LinkIcon, Monitor, LayoutTemplate } from "lucide-react";
import { Button } from "@heroui/react";
import { Instagram } from "@/components/icons/instagram";
import { Twitter } from "@/components/icons/twitter";
import { Youtube } from "@/components/icons/youtube";
import { Linkedin } from "@/components/icons/linkedin";
import { Facebook } from "@/components/icons/facebook";
import { useEditorStore } from "@/stores/editor-store";
import { useAppStore } from "@/stores/app-store";
import { useRouter } from "@/hooks/use-router";
import { PRO_ASPECT_RATIOS } from "@/lib/presets";

// Custom lock icon overlay
function LockOverlay({ onClick }: { onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="absolute inset-0 z-10 flex w-full h-full items-center justify-center rounded-xl bg-white/40 backdrop-blur-[2px] transition-all hover:bg-white/60 cursor-pointer"
    >
      <div className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-orange-500 to-rose-500 px-3 py-1 text-[10px] font-bold text-white shadow-lg transition-transform hover:scale-105">
        Unlock Pro
      </div>
    </button>
  );
}

export function AspectRatioDropdown() {
  const {
    aspectRatio,
    setAspectRatio,
    isCustomAspectRatio,
    setIsCustomAspectRatio,
    customAspectRatioWidth,
    customAspectRatioHeight,
    setCustomAspectRatioWidth,
    setCustomAspectRatioHeight,
  } = useEditorStore();

  const { user } = useAppStore();
  const isPro = user?.is_pro === true;
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleProAction = (action: () => void) => {
    if (!isPro) {
      router.push("/login", { auth: true, next: "/checkout" });
      setOpen(false);
      return;
    }
    action();
  };

  const currentLabel = isCustomAspectRatio
    ? `${customAspectRatioWidth}:${customAspectRatioHeight}`
    : aspectRatio === null
      ? "Auto"
      : aspectRatio === 16 / 9 ? "16:9"
      : aspectRatio === 4 / 3 ? "4:3"
      : aspectRatio === 1 ? "1:1"
      : aspectRatio === 9 / 16 ? "9:16"
      : "Custom";

  const getIconForCategory = (category: string) => {
    switch (category) {
      case "Standard": return <LayoutTemplate className="size-4" />;
      case "Instagram": return <Instagram className="size-4 grayscale opacity-80" />;
      case "Twitter": return <Twitter className="size-4 grayscale opacity-80" />;
      case "YouTube": return <Youtube className="size-4 grayscale opacity-80" />;
      case "LinkedIn": return <Linkedin className="size-4 grayscale opacity-80" />;
      case "Facebook": return <Facebook className="size-4 grayscale opacity-80" />;
      case "OpenGraph": return <LinkIcon className="size-4" />;
      default: return <Monitor className="size-4" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="flat"
        size="sm"
        onPress={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-zinc-100 text-xs font-semibold text-zinc-700 hover:bg-zinc-200"
      >
        <LayoutTemplate className="size-3.5" />
        <span className="min-w-[40px] text-left">{currentLabel}</span>
        <ChevronDown className={`size-3.5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-1/2 mt-2 w-[340px] -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1 shadow-2xl shadow-zinc-900/15"
            style={{ maxHeight: "70vh", overflowY: "auto" }}
          >
            <div className="p-3">
              {/* Custom Input */}
              <div className="relative mb-6 flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">W</span>
                <input
                  type="number"
                  value={customAspectRatioWidth}
                  onChange={(e) => {
                    handleProAction(() => {
                      const val = Math.max(1, Number(e.target.value));
                      setCustomAspectRatioWidth(val);
                      setAspectRatio(val / customAspectRatioHeight);
                      setIsCustomAspectRatio(true);
                    });
                  }}
                  className="w-20 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-semibold text-zinc-800 focus:border-orange-400 focus:outline-hidden"
                />
                <span className="text-xs font-bold text-zinc-400">×</span>
                <span className="text-xs font-bold text-zinc-500">H</span>
                <input
                  type="number"
                  value={customAspectRatioHeight}
                  onChange={(e) => {
                    handleProAction(() => {
                      const val = Math.max(1, Number(e.target.value));
                      setCustomAspectRatioHeight(val);
                      setAspectRatio(customAspectRatioWidth / val);
                      setIsCustomAspectRatio(true);
                    });
                  }}
                  className="w-20 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-semibold text-zinc-800 focus:border-orange-400 focus:outline-hidden"
                />
                <Button
                  size="sm"
                  onPress={() => {
                    handleProAction(() => {
                      setAspectRatio(customAspectRatioWidth / customAspectRatioHeight);
                      setIsCustomAspectRatio(true);
                      setOpen(false);
                    });
                  }}
                  className="ml-auto bg-zinc-100 text-xs font-bold text-zinc-700 hover:bg-zinc-200"
                >
                  Set
                </Button>
                
                {!isPro && <LockOverlay onClick={() => handleProAction(() => {})} />}
              </div>

              {/* Categories */}
              {Object.entries(PRO_ASPECT_RATIOS).map(([category, presets]) => (
                <div key={category} className="mb-6 last:mb-0 relative">
                  <div className="mb-3 flex items-center gap-2 px-1 text-zinc-500">
                    {getIconForCategory(category)}
                    <span className="text-sm font-bold">{category}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 relative">
                    {category === "Standard" && (
                      <button
                        onClick={() => {
                          setAspectRatio(null);
                          setIsCustomAspectRatio(false);
                          setOpen(false);
                        }}
                        className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all ${
                          !isCustomAspectRatio && aspectRatio === null
                            ? "border-orange-200 bg-orange-50 text-orange-600 shadow-sm"
                            : "border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                        }`}
                      >
                        <div className="flex h-10 w-full items-center justify-center">
                          <div className="flex size-7 items-center justify-center rounded-sm border-2 border-current opacity-60 transition-transform group-hover:scale-110">
                            <span className="text-[10px] font-bold">Auto</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-zinc-700">Auto</div>
                          <div className="text-[10px] font-medium opacity-70">Fit Content</div>
                        </div>
                      </button>
                    )}
                    {presets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          const isFree = category === "Standard";
                          if (!isFree) {
                            handleProAction(() => {
                              setIsCustomAspectRatio(true);
                              setCustomAspectRatioWidth(preset.width);
                              setCustomAspectRatioHeight(preset.height);
                              setAspectRatio(preset.width / preset.height);
                              setOpen(false);
                            });
                          } else {
                            setIsCustomAspectRatio(true);
                            setCustomAspectRatioWidth(preset.width);
                            setCustomAspectRatioHeight(preset.height);
                            setAspectRatio(preset.width / preset.height);
                            setOpen(false);
                          }
                        }}
                        className={`group flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all ${
                          isCustomAspectRatio && customAspectRatioWidth === preset.width && customAspectRatioHeight === preset.height
                            ? "border-orange-200 bg-orange-50 text-orange-600 shadow-sm"
                            : "border-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                        }`}
                      >
                        <div 
                          className="flex h-10 w-full items-center justify-center"
                        >
                          <div 
                            className="rounded-sm border-2 border-current opacity-60 transition-transform group-hover:scale-110"
                            style={{
                              width: preset.width >= preset.height ? 24 : 24 * (preset.width / preset.height),
                              height: preset.height >= preset.width ? 24 : 24 * (preset.height / preset.width),
                            }}
                          />
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-zinc-700">{preset.name}</div>
                          <div className="text-[10px] font-medium opacity-70">{preset.label}</div>
                        </div>
                      </button>
                    ))}
                    
                    {!isPro && category !== "Standard" && <LockOverlay onClick={() => handleProAction(() => {})} />}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
