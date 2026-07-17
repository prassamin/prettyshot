"use client";

import { useRef, useCallback, useId, useState, useEffect } from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, Lock, Blend, PaletteIcon, ImageIcon, Sliders, ChevronDown } from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import { useAppStore } from "@/stores/app-store";
import { useRouter } from "@/hooks/use-router";
import { GRADIENT_PRESETS, SOLID_COLOR_PRESETS } from "@/lib/presets";
import { isPro } from "@/lib/utils";
import {
  getBackgrounds,
  getPremiumAsset,
  type Background,
} from "@/app/actions/backgrounds";
import { getPublicUrl } from "@/lib/image-utils";
import { Mesh } from "@/components/icons/mesh";

const BG_TYPES = [
  { id: "gradient", label: "Linear Gradients", icon: <Blend className="size-4" /> },
  { id: "mesh", label: "Meshe Gradients", icon: <Mesh className="size-4" /> },
  { id: "solid", label: "Solid Colors", icon: <PaletteIcon className="size-4" /> },
  { id: "image", label: "Images", icon: <ImageIcon className="size-4" /> },
  { id: "custom", label: "Custom Image", icon: <Sliders className="size-4" /> },
] as const;

export function BackgroundControl() {
  const uid = useId();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);
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

  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loadingBgId, setLoadingBgId] = useState<string | null>(null);

  // Cache fetched premium assets to avoid repeated server action calls
  const assetCache = useRef<
    Record<string, { url?: string; expiresAt?: number }>
  >({});

  useEffect(() => {
    getBackgrounds().then(setBackgrounds).catch(console.error);
  }, []);

  const handlePremiumClick = async (bg: Background) => {
    if (!pro.isActive && !bg.is_free) {
      router.push("/login", { auth: true, next: "/checkout" });
      return;
    }

    // Free assets are public, so we don't need a Server Action to get a signed URL!
    // We can just construct the URL instantly and save a server round-trip.
    if (bg.is_free && bg.storage_path) {
      const publicUrl = getPublicUrl(bg.storage_path);
      if (bg.category === "mesh") setBgMesh(publicUrl);
      else if (bg.category === "image") {
        setBgImage(publicUrl);
        setBgType("image");
      }
      return;
    }

    const now = Date.now();
    const cached = assetCache.current[bg.id];

    // If we have a cached URL and it hasn't expired yet (adding a 5s safety buffer)
    if (cached && cached.expiresAt && cached.expiresAt > now) {
      if (cached.url) {
        if (bg.category === "mesh") setBgMesh(cached.url);
        else if (bg.category === "image") {
          setBgImage(cached.url);
          setBgType("image");
        }
      }
      return;
    }

    setLoadingBgId(bg.id);
    try {
      const asset = await getPremiumAsset(bg.id);
      if (asset && asset.url) {
        // Cache the URL and set expiry for 55 seconds from now (5s safety buffer before 60s expires)
        assetCache.current[bg.id] = {
          url: asset.url,
          expiresAt: Date.now() + 55 * 1000,
        };
        if (bg.category === "mesh") setBgMesh(asset.url);
        else if (bg.category === "image") {
          setBgImage(asset.url);
          setBgType("image");
        }
      }
    } catch (error) {
      console.error(error);
      router.push("/login", { auth: true, next: "/checkout" });
    } finally {
      setLoadingBgId(null);
    }
  };

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
      {/* Background Type Dropdown */}
      <div className="relative z-20" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-200/80 bg-zinc-50 px-3 py-2.5 transition-all hover:bg-zinc-100/80 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-white text-zinc-600 shadow-sm ring-1 ring-zinc-200/50">
              {BG_TYPES.find((t) => t.id === bgType)?.icon}
            </div>
            <span className="text-sm font-bold text-zinc-700">
              {BG_TYPES.find((t) => t.id === bgType)?.label}
            </span>
          </div>
          <ChevronDown
            className={`size-4 text-zinc-400 transition-transform duration-300 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute left-0 right-0 top-full mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl"
            >
              <LayoutGroup id={`bg-type-dropdown-${uid}`}>
                {BG_TYPES.map((type) => {
                  const isActive = bgType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setBgType(type.id as any);
                        setIsDropdownOpen(false);
                      }}
                      className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
                        isActive
                          ? "text-orange-700"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="bg-dropdown-indicator"
                          className="absolute inset-0 rounded-lg bg-orange-50"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <div className="relative z-10 flex items-center justify-center">
                        {type.icon}
                      </div>
                      <span className="relative z-10 text-xs font-semibold">
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </LayoutGroup>
            </motion.div>
          )}
        </AnimatePresence>
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
                className={`relative size-14 rounded-lg bg-linear-to-br ${preset.className} ring-1 ring-black/5 transition-transform group-hover:scale-105`}
              />
            </button>
          ))}
        </div>
      )}

      {/* Mesh gradient swatches */}
      {bgType === "mesh" && (
        <div className="flex flex-wrap gap-2">
          {/* DB Meshes */}
          {backgrounds
            .filter((bg) => bg.category === "mesh")
            .map((bg) => (
              <button
                key={bg.id}
                onClick={() => handlePremiumClick(bg)}
                disabled={loadingBgId === bg.id}
                className="group relative shrink-0"
                title={bg.name}
              >
                {(bg.is_free
                  ? bgMesh === bg.storage_path ||
                    bgMesh.endsWith(bg?.storage_path || "")
                  : bgMesh === assetCache.current[bg.id]?.url) && (
                  <div className="absolute -inset-1 rounded-xl bg-linear-to-br from-orange-400 to-violet-500 opacity-60" />
                )}
                {loadingBgId === bg.id && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/50 backdrop-blur-xs">
                    <div className="size-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  </div>
                )}
                <img
                  src={bg.thumbnail_url!}
                  alt={bg.name}
                  className="relative size-14 rounded-lg object-cover ring-1 ring-black/5 transition-transform group-hover:scale-105"
                />
                {!bg.is_free && !pro.isActive && (
                  <div className="absolute -top-1 -right-1 z-10 flex size-4 items-center justify-center rounded-full bg-orange-100 ring-1 ring-orange-200">
                    <Lock className="size-2.5 text-orange-600" />
                  </div>
                )}
              </button>
            ))}
        </div>
      )}

      {/* DB Images */}
      {bgType === "image" && (
        <div className="flex flex-wrap gap-2">
          {backgrounds
            .filter((bg) => bg.category === "image")
            .map((bg) => (
              <button
                key={bg.id}
                onClick={() => handlePremiumClick(bg)}
                disabled={loadingBgId === bg.id}
                className="group relative shrink-0"
                title={bg.name}
              >
                {(bg.is_free
                  ? bgImage === bg.storage_path
                  : bgImage === assetCache.current[bg.id]?.url) && (
                  <div className="absolute -inset-1 rounded-xl bg-linear-to-br from-orange-400 to-violet-500 opacity-60" />
                )}
                {loadingBgId === bg.id && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-white/50 backdrop-blur-xs">
                    <div className="size-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  </div>
                )}
                <img
                  src={bg.thumbnail_url!}
                  alt={bg.name}
                  className="relative size-14 rounded-lg object-cover ring-1 ring-black/5 transition-transform group-hover:scale-105"
                />
                {!bg.is_free && !pro.isActive && (
                  <div className="absolute -top-1 -right-1 z-10 flex size-4 items-center justify-center rounded-full bg-orange-100 ring-1 ring-orange-200">
                    <Lock className="size-2.5 text-orange-600" />
                  </div>
                )}
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
                  className="relative size-14 rounded-md ring-1 ring-black/10 transition-transform group-hover:scale-110"
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

      {/* Custom upload */}
      {bgType === "custom" && (
        <div className="space-y-2">
          {!pro.isActive ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-6 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-violet-100 text-violet-600 shadow-sm">
                <Lock className="size-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-violet-900">
                  Pro Feature
                </h4>
                <p className="mt-0.5 text-xs font-medium text-violet-600/80">
                  Upgrade to use custom backgrounds.
                </p>
              </div>
              <button
                onClick={() =>
                  router.push("/login", { auth: true, next: "/checkout" })
                }
                className="mt-1 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-500/25 transition-transform hover:scale-105"
              >
                Upgrade to Pro
              </button>
            </div>
          ) : bgImage ? (
            <div className="relative overflow-hidden rounded-xl">
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
