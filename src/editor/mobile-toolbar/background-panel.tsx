"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Blend,
  Check,
  Image as ImageIcon,
  Palette,
  Upload,
  Wand,
} from "lucide-react";

import {
  getUserUploadSignature,
  type Background,
} from "@/app/actions/backgrounds";
import {
  fetchSharedBackgrounds,
  getCachedBackgroundsSync,
  fetchSharedUserBackgrounds,
  getCachedUserBackgroundsSync,
  addUserBackgroundImage,
} from "@/editor/lib/background-cache";
import { toast } from "@heroui/react";
import { ProgressiveImage } from "@/components/progressive-image";
import { Slider } from "@/components/slider";
import { TransparencyIcon } from "@/components/icons/transparency";
import { Mesh } from "@/components/icons/mesh";
import { useEditorEngine, useEditorStateField } from "@/editor/lib/engine";
import { useActionErrorHandler } from "@/lib/handle-action-error";
import { cn, isPro } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

import { PaletteGrid } from "../property-panel/components";
import {
  AUTO_PLACEHOLDER_GRADIENT,
  GRADIENT_PRESETS,
  SOLID_PRESETS,
} from "../property-panel/sections/background/presets";
import type { BgType } from "../property-panel/sections/background/types";
import { useAutoGradients } from "../property-panel/sections/background/use-auto-gradients";
import { useFeatureGate } from "@/hooks/use-feature-gate";
import { FeatureLock } from "../components/feature-lock";
import { Spinner } from "@heroui/react";
import { MAX_FILE_SIZE } from "@/config";

const BG_CATEGORIES: {
  id: BgType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "none", label: "Transparent", icon: TransparencyIcon },
  { id: "auto", label: "Auto", icon: Wand },
  { id: "solid", label: "Solid", icon: Palette },
  { id: "gradient", label: "Gradient", icon: Blend },
  { id: "mesh", label: "Mesh", icon: Mesh },
  { id: "image", label: "Image", icon: ImageIcon },
];

export function MobileBackgroundPanel() {
  const { isLocked } = useFeatureGate();
  const background = useEditorStateField((c) => c.background);
  const screenshot = useEditorStateField((c) => c.screenshot);
  const backdrop = useEditorStateField((c) => c.backdrop);
  const setBackground = useEditorEngine((s) => s.setBackground);
  const setBackdropAdjustments = useEditorEngine(
    (s) => s.setBackdropAdjustments,
  );
  const handleActionError = useActionErrorHandler();
  const { user } = useAppStore();

  const [dbBackgrounds, setDbBackgrounds] = React.useState<Background[]>(
    () => getCachedBackgroundsSync() || [],
  );
  const [isDbLoading, setIsDbLoading] = React.useState(
    () => !getCachedBackgroundsSync(),
  );
  const [userImages, setUserImages] = React.useState<
    Array<Omit<Background, "name" | "is_free" | "category">>
  >(() => getCachedUserBackgroundsSync(user?.id) || []);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isUserImageLoading, setUserImageLoading] = React.useState(
    () => !!user?.id && !getCachedUserBackgroundsSync(user?.id),
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetchSharedBackgrounds()
      .then((data) => {
        setDbBackgrounds(data);
      })
      .catch((e) => handleActionError(e))
      .finally(() => setIsDbLoading(false));
  }, [handleActionError]);

  React.useEffect(() => {
    if (!user?.id) return;
    const cached = getCachedUserBackgroundsSync(user.id);
    if (cached) {
      setUserImages(cached);
      setUserImageLoading(false);
      return;
    }
    setUserImageLoading(true);
    fetchSharedUserBackgrounds(user.id)
      .then((data) => {
        setUserImages(data);
      })
      .catch(() => {})
      .finally(() => setUserImageLoading(false));
  }, [user?.id]);

  const handleUpload = async (file: File) => {
    if (!user?.id) return;
    if (!file.type.startsWith("image/")) {
      toast.danger("File must be an image");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.danger("Image size must be less than 10MB");
      return;
    }
    setIsUploading(true);

    try {
      const clientTimestamp = Math.floor(Date.now() / 1000);
      const uploadParams = await getUserUploadSignature(clientTimestamp);

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("api_key", uploadParams.apiKey);
      uploadFormData.append("timestamp", clientTimestamp.toString());
      uploadFormData.append("signature", uploadParams.signature);
      uploadFormData.append("folder", uploadParams.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${uploadParams.cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadFormData,
        },
      );

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Cloudinary upload failed");
      }

      const url = data.secure_url;
      const newImage = {
        id: data.public_id,
        url: data.secure_url,
        thumbnail: data.secure_url.replace(
          "/image/upload/",
          "/image/upload/w_300,h_200,c_fill,f_auto,q_auto/",
        ),
      };
      if (user?.id) {
        addUserBackgroundImage(user.id, newImage);
      }
      setUserImages((prev) => [newImage, ...prev]);
      setBackground({ type: "image", value: url });
    } catch (err: any) {
      handleActionError(err);
    } finally {
      setIsUploading(false);
    }
  };

  const { autoGradients, autoStatus } = useAutoGradients(screenshot);

  const customSolid =
    background.type === "solid" && !SOLID_PRESETS.includes(background.value)
      ? background.value
      : null;

  const setType = (type: BgType) => {
    const backgroundLocked = isLocked("backgrounds");
    if (!["image", "mesh"].includes(type) && backgroundLocked)
      return setBackground({ type, value: "" });

    switch (type) {
      case "none":
        setBackground({ type: "none", value: "" });
        break;
      case "auto":
        setBackground({
          type: "auto",
          value:
            background.type === "auto"
              ? background.value
              : (autoGradients[0] ?? AUTO_PLACEHOLDER_GRADIENT),
        });
        break;
      case "solid":
        setBackground({
          type: "solid",
          value:
            background.type === "solid" ? background.value : SOLID_PRESETS[0],
        });
        break;
      case "gradient":
        setBackground({
          type: "gradient",
          value:
            background.type === "gradient"
              ? background.value
              : GRADIENT_PRESETS[0],
        });
        break;
      case "mesh": {
        const firstMesh = dbBackgrounds.find((b) => b.category === "mesh");
        if (!firstMesh?.is_free)
          return setBackground({ type: "mesh", value: "" });

        setBackground({
          type: "mesh",
          value:
            background.type === "mesh"
              ? background.value
              : firstMesh?.url
                ? `url('${firstMesh.url}') center / cover no-repeat`
                : "",
        });
        break;
      }
      case "image": {
        const firstImage = dbBackgrounds.find((b) => b.category === "image");
        if (!firstImage?.is_free)
          return setBackground({ type: "image", value: "" });

        setBackground({
          type: "image",
          value:
            background.type === "image"
              ? background.value
              : firstImage?.url || "",
        });
        break;
      }
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 pb-4 select-none text-foreground">
      {/* Native Mobile Chip Rail */}
      <div className="flex w-full items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none">
        {BG_CATEGORIES.map((cat) => {
          const isSelected = background.type === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setType(cat.id)}
              className={cn(
                "flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[12px] font-medium transition-all active:scale-95 shadow-xs",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "border border-border/80 bg-surface-tertiary/70 text-muted-foreground hover:bg-surface-secondary hover:text-foreground",
              )}
            >
              <cat.icon
                className={cn(
                  "size-3.5",
                  isSelected
                    ? "text-primary-foreground"
                    : "text-muted-foreground",
                )}
              />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Content Panels */}
      <div className="w-full">
        {background.type === "none" && (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-[11px] text-muted-foreground">
            Transparent background
          </p>
        )}

        {background.type === "auto" &&
          (!screenshot ? (
            <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-[11px] text-muted-foreground">
              Drop a screenshot to generate matching gradients
            </p>
          ) : autoStatus === "loading" ? (
            <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-[11px] text-muted-foreground">
              Sampling colours from your screenshot…
            </p>
          ) : autoStatus === "error" || autoGradients.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-[11px] text-muted-foreground">
              Couldn&apos;t read colours from this image
            </p>
          ) : (
            <PaletteGrid
              featureId="backgrounds"
              colorPickerId="backgrounds.colorpicker"
              presets={autoGradients}
              selected={background.type === "auto" ? background.value : null}
              onSelect={(c) => setBackground({ type: "auto", value: c })}
              customColor=""
              columnsClassName="justify-center"
              onCustomColor={() => {}}
              isCustom={false}
              showCustom={false}
            />
          ))}

        {background.type === "solid" && (
          <PaletteGrid
            featureId="backgrounds"
            colorPickerId="backgrounds.colorpicker"
            presets={SOLID_PRESETS}
            selected={
              background.type === "solid" && !customSolid
                ? background.value
                : null
            }
            columnsClassName="justify-center"
            onSelect={(c) => setBackground({ type: "solid", value: c })}
            customColor={customSolid || "#000000"}
            onCustomColor={(hex) =>
              setBackground({ type: "solid", value: hex })
            }
            isCustom={!!customSolid}
            showCustom={true}
          />
        )}

        {background.type === "gradient" && (
          <PaletteGrid
            featureId="backgrounds"
            colorPickerId="backgrounds.colorpicker"
            presets={GRADIENT_PRESETS}
            selected={background.type === "gradient" ? background.value : null}
            onSelect={(c) => setBackground({ type: "gradient", value: c })}
            customColor=""
            columnsClassName="justify-center"
            onCustomColor={() => {}}
            isCustom={false}
            showCustom={false}
          />
        )}

        {background.type === "mesh" && (
          <MobileDbAssetGrid
            items={dbBackgrounds.filter((b) => b.category === "mesh")}
            activeValue={background.type === "mesh" ? background.value : null}
            isLoading={isDbLoading}
            onSelect={(bg) => {
              if (bg.url) {
                setBackground({
                  type: "mesh",
                  value: `url('${bg.url}') center / cover no-repeat`,
                });
              }
            }}
          />
        )}

        {background.type === "image" && (
          <div className="flex flex-col gap-3">
            <MobileDbAssetGrid
              items={dbBackgrounds.filter((b) => b.category === "image")}
              activeValue={
                background.type === "image" ? background.value : null
              }
              isLoading={isDbLoading}
              onSelect={(bg) => {
                if (bg.url) {
                  setBackground({
                    type: "image",
                    value: bg.url,
                  });
                }
              }}
            />

            <div className="border-t border-border/60 pt-3">
              <span className="mb-2 block text-[11px] font-semibold text-muted-foreground">
                My Images
              </span>

              <FeatureLock featureId="backgrounds.upload">
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={cn(
                    "group relative mb-3 flex cursor-pointer flex-col items-center gap-1.5 overflow-hidden rounded-2xl border border-border/80 bg-surface-tertiary/70 p-4 transition-all duration-200 hover:border-primary/40 active:scale-[0.99]",
                    isUploading && "pointer-events-none opacity-60",
                  )}
                >
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {isUploading ? (
                      <Spinner className="size-4.5" />
                    ) : (
                      <Upload className="size-4.5" />
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-foreground/90">
                    {isUploading ? "Uploading..." : "Upload background image"}
                  </p>
                  <p className="text-[9.5px] text-muted-foreground">
                    PNG, JPG, WebP up to 10MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = "";
                  }}
                />

                {isUserImageLoading ? (
                  <div className="flex flex-wrap gap-2.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={`skeleton-${i}`}
                        className="w-19 h-14.25 shrink-0 overflow-hidden rounded-xl image-shimmer"
                      />
                    ))}
                  </div>
                ) : userImages.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {userImages.map((image) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() =>
                          setBackground({ type: "image", value: image.url! })
                        }
                        className={cn(
                          "group/img relative w-19 h-14.25 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200",
                          background.type === "image" &&
                            background.value === image.url
                            ? "border-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                            : "border-transparent bg-muted/30 hover:border-foreground/20 hover:shadow-md",
                        )}
                      >
                        <ProgressiveImage
                          src={image.thumbnail}
                          alt="My background"
                          className="size-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                        />
                        <AnimatePresence>
                          {background.type === "image" &&
                            background.value === image.url && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{
                                  duration: 0.2,
                                  ease: "easeOut",
                                }}
                                className="absolute inset-0 z-20 flex items-center justify-center bg-primary/20 backdrop-blur-[1px]"
                              >
                                <Check className="size-4 text-primary-foreground drop-shadow-md" />
                              </motion.span>
                            )}
                        </AnimatePresence>
                      </button>
                    ))}
                  </div>
                ) : null}
              </FeatureLock>
            </div>
          </div>
        )}

        {/* Noise Adjustment Slider */}
        {background.type !== "none" && (
          <div className="mt-4 pt-1">
            <FeatureLock featureId="backgrounds.noise">
              <Slider
                label="Noise Texture"
                value={backdrop?.effects?.noise ?? 0}
                onValueChange={(v) =>
                  setBackdropAdjustments({ ...backdrop?.effects, noise: v })
                }
                min={0}
                max={100}
                step={1}
                formatValue={(v) => `${Math.round(v)}%`}
              />
            </FeatureLock>
          </div>
        )}
      </div>
    </div>
  );
}

function MobileDbAssetGrid({
  items,
  activeValue,
  isLoading,
  onSelect,
}: {
  items: Background[];
  activeValue: string | null;
  isLoading: boolean;
  onSelect: (bg: Background) => void;
}) {
  const{user}= useAppStore()
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2.5 px-1 py-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="w-19 h-14.25 shrink-0 overflow-hidden rounded-xl image-shimmer"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-[11px] text-muted-foreground">
        No backgrounds found.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5 px-1 py-1">
      {items.map((bg) => {
        const isActive =
          activeValue &&
          (activeValue.includes(bg.id) ||
            (bg.url && activeValue.includes(bg.url)));
        const isLocked = !bg.is_free && !isPro(user).isActive;

        return (
          <div key={bg.id} className="relative w-19 h-14.25 shrink-0">
            <FeatureLock isLocked={isLocked} overlay="badge" size="sm">
              <button
                type="button"
                onClick={() => onSelect(bg)}
                className={cn(
                  "group relative flex size-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 p-1 transition-all duration-200 select-none",
                  isActive
                    ? "border-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
                    : "border-transparent bg-muted/30 hover:border-foreground/20 hover:shadow-md",
                )}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute inset-0 z-20 flex items-center justify-center bg-primary/20 backdrop-blur-[1px]"
                    >
                      <Check className="size-4 text-primary-foreground drop-shadow-md" />
                    </motion.span>
                  )}
                </AnimatePresence>
                <ProgressiveImage
                  src={bg.thumbnail}
                  alt={bg.name}
                  className="block size-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {!bg.is_free && (
                  <span className="absolute bottom-1 right-1 z-10 rounded-md bg-overlay/70 px-1 py-0.5 text-[8px] font-bold tracking-wider text-yellow-400">
                    PRO
                  </span>
                )}
              </button>
            </FeatureLock>
          </div>
        );
      })}
    </div>
  );
}
