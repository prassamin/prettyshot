"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label, Switch, toast } from "@heroui/react";
import {
  Check,
  Image,
  ImagePlus,
  RotateCcw,
  Star,
  UploadCloud,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FrameDropzone as Dropzone } from "../../frames/components/frame-dropzone";
import { getCloudinaryUploadSignature } from "@/app/actions/backgrounds";
import type { Background } from "@/app/actions/backgrounds";
import { MAX_FILE_SIZE } from "@/config";
import { Mesh } from "@/components/icons/mesh";

export function UploadForm({
  onUploaded,
}: {
  onUploaded?: (uploaded: Background) => void;
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<"mesh" | "image">("mesh");
  const [isFree, setIsFree] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  // Paste-to-upload anywhere in the form
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const f = items[i].getAsFile();
          if (f) {
            if (!f.type.startsWith("image/")) {
              toast.danger("Please select a valid image file");
              return;
            }
            if (f.size > MAX_FILE_SIZE) {
              toast.danger("File size must be less than 10MB");
              return;
            }
            setFile(f);
          }
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const resetForm = () => {
    setName("");
    setCategory("mesh");
    setIsFree(true);
    setFile(null);
    setDone(false);
  };

  const runUpload = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.danger("Asset name is required");
      return;
    }
    if (!file) {
      toast.danger("You must select an image file to upload");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.danger("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const uploadParams = await getCloudinaryUploadSignature({
        name: trimmed,
        category,
        isFree,
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", uploadParams.apiKey);
      formData.append("timestamp", uploadParams.timestamp.toString());
      formData.append("signature", uploadParams.signature);
      formData.append("folder", uploadParams.folder);
      if (uploadParams.context) {
        formData.append("context", uploadParams.context);
      }

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${uploadParams.cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(
          data.error?.message || `Upload failed with status ${res.status}`,
        );
      }

      setDone(true);
      toast.success("Background uploaded to Cloudinary CDN");
      router.refresh();

      // Optimistically hand the new asset up so the library can show it
      // immediately — Cloudinary's resources list is eventually consistent and
      // a refetch right after upload often misses the fresh asset.
      const thumbUrl = (data.secure_url as string).replace(
        "/image/upload/",
        "/image/upload/w_300,h_200,c_fill,f_auto,q_auto/",
      );
      onUploaded?.({
        id: data.public_id as string,
        name: trimmed,
        category,
        is_free: isFree,
        thumbnail: thumbUrl,
        url: data.secure_url as string,
      });
    } catch (err: any) {
      console.error("Background upload error:", err);
      toast.danger(err.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const ready = name.trim().length > 0 && !!file && !uploading;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface-muted/50 shadow-[0_8px_40px_color-mix(in_oklab,var(--overlay)_30%,transparent)]">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-24 right-0 size-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-primary/10 blur-3xl" />

      {/* Identity header */}
      <div className="relative border-b border-border/50 px-6 pt-6 pb-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Background identity
              </label>
            </div>
            <div className="mt-2 max-w-2xl">
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setDone(false);
                }}
                placeholder="Display name — e.g. Neon Horizon"
                className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sections grid */}
      <div className="relative grid gap-6 p-6 lg:grid-cols-[340px_1fr]">
        {/* Left rail */}
        <div className="space-y-5">
          {/* Category */}
          <div className="rounded-2xl border border-border/40 bg-background p-4 shadow-inner flex flex-col">
            <span className="text-[11px] font-semibold text-foreground">
              Category
            </span>

            <div className="mt-3 max-h-52 space-y-1 overflow-y-auto pr-1">
              {[
                ...([
                  { id: "mesh", label: "Mesh Background", icon: Mesh },
                  {
                    id: "image",
                    label: "Photographic / Image",
                    icon: Image,
                  },
                ] as const),
              ].map(({ icon: Icon, ...c }) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all",
                    category === c.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-transparent hover:bg-muted/30",
                  )}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted/40">
                    <Icon className="size-3.5 text-muted-foreground" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] font-medium text-foreground">
                      {c.label}
                    </span>
                  </span>
                  {category === c.id && (
                    <Check className="size-3.5 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration */}
          <div className="rounded-2xl border border-border/40 bg-background p-4 shadow-inner flex flex-col">
            <span className="text-[11px] font-semibold text-foreground">
              Configuration
            </span>

            <div
              className={cn(
                "rounded-xl flex border transition-colors px-3 py-2.5 mt-3",
                !isFree
                  ? "border-warning/30 bg-warning/5 hover:bg-warning/10"
                  : "border-border/40 bg-background/50 hover:bg-background",
              )}
            >
              <Switch
                isSelected={!isFree}
                onChange={(val) => setIsFree(!val)}
                className="w-full flex-row-reverse justify-between"
              >
                <Switch.Control
                  className={!isFree ? "bg-warning" : "bg-foreground/15"}
                >
                  <Switch.Thumb>
                    <Switch.Icon>
                      {!isFree ? (
                        <Star className="size-3 text-warning" />
                      ) : (
                        <Check className="size-3 text-success" />
                      )}
                    </Switch.Icon>
                  </Switch.Thumb>
                </Switch.Control>
                <Switch.Content className="flex flex-col gap-0.5 items-start">
                  <Label className="text-[12.5px] font-medium text-foreground cursor-pointer">
                    Premium Mode
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Requires a pro subscription
                  </span>
                </Switch.Content>
              </Switch>
            </div>
          </div>
        </div>

        {/* Main panel — source image */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImagePlus className="size-4 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Source image
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground/60">
              PNG / JPG / WebP · max 10MB
            </span>
          </div>

          <Dropzone
            label=""
            hint={
              file
                ? "Click to replace"
                : "Drop or click to upload — paste works too"
            }
            file={file}
            onFileChange={(f) => {
              setFile(f);
              setDone(false);
            }}
            aspect="aspect-[16/7]"
          />

          <p className="text-[10px] text-muted-foreground/60">
            Upload the high-res file. A compressed thumbnail is generated
            automatically.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="relative border-t border-border/50 px-6 py-4">
        <AnimatePresence>
          {uploading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Uploading to CDN…</span>
                <span>compressing &amp; optimizing</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-background">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-primary to-warning"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ) : done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="grid size-9 place-items-center rounded-full bg-success text-success-foreground"
                >
                  <Check className="size-4" />
                </motion.span>
                <div>
                  <p className="text-[12px] font-semibold text-foreground">
                    {name.trim() || "Background"} is live
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    in the {category} category · {isFree ? "free" : "premium"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border/60 px-4 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <UploadCloud className="size-3.5" />
                Upload another
              </button>
            </motion.div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  title="Clear the form to start a new upload"
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border/60 px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </button>
                <span className="hidden items-center gap-2 text-[10px] text-muted-foreground sm:flex">
                  <ImagePlus className="size-3.5" />
                  The background will be published to the editor instantly
                </span>
              </div>
              <button
                type="button"
                onClick={() => void runUpload()}
                disabled={!ready}
                className="group flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-primary to-warning px-6 py-2.5 text-[12px] font-semibold text-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
              >
                Upload
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
