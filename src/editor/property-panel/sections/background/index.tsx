/**
 * Background tool — background type switcher + panels.
 */

"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useEditorStateField, useEditorEngine } from "@/editor/lib/engine";
import { type BgType } from "./types";
import {
  AUTO_PLACEHOLDER_GRADIENT,
  GRADIENT_PRESETS,
  SOLID_PRESETS,
} from "./presets";

import { PaletteGrid } from "../../components";
import { BackgroundTypeTabs } from "./tabs";
import { useAutoGradients } from "./use-auto-gradients";
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
import { useActionErrorHandler } from "@/lib/handle-action-error";
import { cn, isPro } from "@/lib/utils";
import { Check, Upload } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Slider } from "@/components/slider";
import { toast } from "@heroui/react";
import { ProgressiveImage } from "@/components/progressive-image";
import { FeatureLock } from "@/editor/components/feature-lock";
import { useFeatureGate } from "@/hooks/use-feature-gate";
import { MAX_FILE_SIZE } from "@/config";

export function BackgroundSection() {
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
  }, []);

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
      // Generate client timestamp
      const clientTimestamp = Math.floor(Date.now() / 1000);

      // Get signed upload parameters matching client timestamp
      const uploadParams = await getUserUploadSignature(clientTimestamp);

      // Direct upload to Cloudinary CDN
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
    <div className={cn("flex flex-col gap-6 pt-3")}>
      <BackgroundTypeTabs value={background.type} onChange={setType} />

      {background.type === "none" && (
        <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-4 text-center text-[11px] text-muted-foreground">
          Transparent background
        </p>
      )}

      {background.type === "auto" &&
        (!screenshot ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-4 text-center text-[11px] text-muted-foreground">
            Drop a screenshot to generate matching gradients
          </p>
        ) : autoStatus === "loading" ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-4 text-center text-[11px] text-muted-foreground">
            Sampling colours from your screenshot…
          </p>
        ) : autoStatus === "error" || autoGradients.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-4 text-center text-[11px] text-muted-foreground">
            Couldn&apos;t read colours from this image
          </p>
        ) : (
          <PaletteGrid
            featureId="backgrounds"
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
          onCustomColor={(hex) => setBackground({ type: "solid", value: hex })}
          isCustom={!!customSolid}
          showCustom={true}
        />
      )}

      {background.type === "gradient" && (
        <PaletteGrid
          featureId="backgrounds"
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
        <DbAssetGrid
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
        <>
          <DbAssetGrid
            items={dbBackgrounds.filter((b) => b.category === "image")}
            activeValue={background.type === "image" ? background.value : null}
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

          <div className="mt-3 border-t border-border/40 pt-3">
            <span className="mb-2 block text-[11px] font-medium text-muted-foreground">
              My Images
            </span>

            <FeatureLock featureId="backgrounds.upload">
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.dataset.dragging = "true";
                }}
                onDragLeave={(e) => {
                  e.currentTarget.dataset.dragging = "false";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.dataset.dragging = "false";
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleUpload(file);
                }}
                data-dragging="false"
                className={cn(
                  "group relative mb-3 flex cursor-pointer flex-col items-center gap-2 overflow-hidden rounded-2xl border border-border/50 bg-linear-to-br from-muted/30 via-muted/10 to-muted/30 p-5 transition-all duration-300",
                  "hover:border-primary/40 hover:shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_8%,transparent)]",
                  "[ &[data-dragging=true] ]:border-primary/60 [ &[data-dragging=true] ]:bg-primary/5",
                  isUploading && "pointer-events-none opacity-60",
                )}
              >
                <div className="relative flex size-10 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
                  {isUploading ? (
                    <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <Upload className="size-5 text-primary/70 transition-colors group-hover:text-primary" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-semibold text-foreground/80">
                    {isUploading ? "Uploading..." : "Add background image"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                    PNG, JPG, WebP up to 10MB
                  </p>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-linear-to-t from-primary/3 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
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
                  {Array.from({ length: 6 }).map((_, i) => (
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
                      onClick={() =>
                        setBackground({ type: "image", value: image.url! })
                      }
                      className={cn(
                        "group/img relative w-19 h-14.25 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
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
              ) : (
                !isUploading && (
                  <p className="text-center text-[11px] text-muted-foreground/50">
                    Your uploaded images will appear here
                  </p>
                )
              )}
            </FeatureLock>
          </div>
        </>
      )}

      {background.type !== "none" && (
        <div className="mt-3 border-t border-border/40 pt-3">
          <FeatureLock featureId="backgrounds.noise">
            <Slider
              label="Noise"
              value={backdrop.effects.noise}
              onValueChange={(v) =>
                setBackdropAdjustments({ ...backdrop.effects, noise: v })
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
  );
}

function DbAssetGrid({
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
  const { user } = useAppStore();
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
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-4 text-center text-[11px] text-muted-foreground">
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
                onClick={() => onSelect(bg)}
                className={cn(
                  "size-full",
                  "group relative flex w-full flex-col items-center justify-center rounded-xl border-2 p-1 transition-all duration-200 ease-out cursor-pointer select-none overflow-hidden",
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
              </button>
            </FeatureLock>
          </div>
        );
      })}
    </div>
  );
}
