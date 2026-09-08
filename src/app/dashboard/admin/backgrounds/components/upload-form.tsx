"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Label, Switch, toast } from "@heroui/react";
import {
  Check,
  ChevronDown,
  Image,
  ImagePlus,
  Layers,
  Loader2,
  RotateCcw,
  Star,
  UploadCloud,
  Wand2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FrameDropzone as Dropzone } from "../../frames/components/frame-dropzone";
import { getCloudinaryUploadSignature } from "@/app/actions/backgrounds";
import type { Background } from "@/app/actions/backgrounds";
import { MAX_FILE_SIZE } from "@/config";
import { Mesh } from "@/components/icons/mesh";
import {
  AUTO_NAME_PRESETS,
  exampleForPreset,
  generateNameFromPreset,
  type AutoNamePreset,
} from "@/lib/name";

type CategoryId = "mesh" | "image";

/** Generate a small (160px) data-URL thumbnail so the slot list doesn't hold
 *  full-resolution object URLs — keeps scrolling smooth with many files. */
function makeThumbnail(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no ctx");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } catch (e) {
        // Fallback: keep the object URL (still better than nothing)
        resolve(url);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("thumb failed"));
    };
    img.src = url;
  });
}

export function UploadForm({
  onUploaded,
  onUploadingChange,
}: {
  onUploaded?: (uploaded: Background) => void;
  onUploadingChange?: (uploading: boolean) => void;
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
    onUploadingChange?.(true);
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
      onUploadingChange?.(false);
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

/* ────────────────────────────────────────────────────────────────────────
 * Bulk upload mode — add many backgrounds at once.
 * Shared category + free/premium applies to every file in the batch.
 * ──────────────────────────────────────────────────────────────────────── */

type BulkSlot = {
  id: string;
  file: File;
  name: string;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
};

/**
 * Fixed-position preset menu. Anchors to the trigger button, flips above it
 * when there isn't enough room below, and scrolls internally if the viewport
 * is short — never clipped by the upload card's overflow-hidden.
 */
function NamePresetMenu({
  anchorRef,
  active,
  onSelect,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  active: AutoNamePreset;
  onSelect: (preset: AutoNamePreset) => void;
  onClose: () => void;
}) {
  const [pos, setPos] = useState<{ left: number; top: number; up: boolean } | null>(null);

  useEffect(() => {
    const btn = anchorRef.current;
    if (!btn) return;
    const measure = () => {
      const r = btn.getBoundingClientRect();
      const menuH = 320;
      const spaceBelow = window.innerHeight - r.bottom - 8;
      const spaceAbove = r.top - 8;
      const up = spaceBelow < menuH && spaceAbove > spaceBelow;
      setPos({
        left: Math.max(8, Math.min(r.right - 224, window.innerWidth - 232)),
        top: up ? r.top - 8 : r.bottom + 8,
        up,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [anchorRef]);

  if (!pos) return null;

  return (
    <>
      {/* click-away backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-56 overflow-hidden rounded-xl border border-border/60 bg-surface-tertiary/95 shadow-2xl shadow-black/50 backdrop-blur-xl"
        style={{
          left: pos.left,
          ...(pos.up
            ? { bottom: window.innerHeight - pos.top, top: "auto" }
            : { top: pos.top, bottom: "auto" }),
        }}
      >
        <div className="max-h-80 overflow-y-auto overscroll-contain p-1">
          <p className="px-2.5 pt-1.5 pb-1 text-[9px] font-bold tracking-[0.12em] text-muted-foreground/60 uppercase">
            Auto-name preset
          </p>
          {AUTO_NAME_PRESETS.map((p) => {
            const isActive = active === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelect(p.id)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors",
                  isActive
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium">
                    {p.label}
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground/70">
                    {p.description} · e.g. {exampleForPreset(p.id)}
                  </span>
                </span>
                {isActive && (
                  <Check className="size-3.5 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function BulkUploadForm({
  onUploaded,
  onUploadingChange,
  existingNames,
}: {
  onUploaded?: (uploaded: Background) => void;
  onUploadingChange?: (uploading: boolean) => void;
  existingNames?: string[];
}) {
  const [category, setCategory] = useState<CategoryId>("mesh");
  const [isFree, setIsFree] = useState(true);
  const [slots, setSlots] = useState<BulkSlot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [namePreset, setNamePreset] = useState<AutoNamePreset>("filename");
  const [nameMenuOpen, setNameMenuOpen] = useState(false);
  const nameBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Existing library names (from the backgrounds list) — used so generated
  // names avoid collisions and "numbered" continues after the highest one.
  const existingNameSet = useMemo(
    () =>
      new Set(
        (existingNames ?? [])
          .map((n) => n.trim().toLowerCase())
          .filter(Boolean),
      ),
    [existingNames],
  );

  const addFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) {
      toast.danger("Please select image files");
      return;
    }
    const overSized = list.find((f) => f.size > MAX_FILE_SIZE);
    if (overSized) {
      toast.danger(`"${overSized.name}" exceeds the 10MB limit`);
      return;
    }
    setSlots((prev) => {
      const taken = new Set(
        prev.map((s) => s.name.trim().toLowerCase()).filter(Boolean),
      );
      const next = [...prev];
      let i = 0;
      for (const file of list) {
        next.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          name: generateNameFromPreset("filename", file.name, i, taken),
          preview: "",
          progress: 0,
          status: "pending",
        });
        i++;
      }
      return next;
    });
    // Generate small thumbs async so adding 16 files is instant — each slot
    // fills in as its 160px thumbnail is ready.
    for (const file of list) {
      void makeThumbnail(file)
        .then((thumb) => {
          setSlots((prev) =>
            prev.map((s) =>
              s.file === file && !s.preview ? { ...s, preview: thumb } : s,
            ),
          );
        })
        .catch(() => {
          /* keep empty preview; the slot shows a placeholder */
        });
    }
  }, []);

  // Revoke object URLs on unmount (slot previews)
  const previewsRef = useRef<string[]>([]);
  const trackPreviews = useCallback(() => {
    previewsRef.current = slots.map((s) => s.preview);
  }, [slots]);
  trackPreviews();
  useEffect(
    () => () => {
      previewsRef.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  const patchSlot = (id: string, patch: Partial<BulkSlot>) =>
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const removeSlot = (id: string) => {
    const slot = slots.find((s) => s.id === id);
    if (slot) URL.revokeObjectURL(slot.preview);
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const applyNamePreset = (preset: AutoNamePreset) => {
    setSlots((prev) => {
      // Generate SEQUENTIALLY so each new name sees the names generated for
      // earlier slots — a concurrent map would let two slots pick the same
      // collision-free candidate.
      const taken = new Set<string>();
      return prev.map((s, i) => ({
        ...s,
        name: generateNameFromPreset(
          preset,
          s.file.name,
          i,
          taken,
          existingNameSet,
        ),
      }));
    });
    const label =
      AUTO_NAME_PRESETS.find((p) => p.id === preset)?.label ?? "Preset";
    toast.success(`Names generated (${label})`);
  };

  const uploadOne = async (slot: BulkSlot) => {
    patchSlot(slot.id, { status: "uploading", progress: 0 });
    const name =
      slot.name.trim() ||
      generateNameFromPreset(
        "filename",
        slot.file.name,
        0,
        new Set(),
        existingNameSet,
      );
    try {
      const params = await getCloudinaryUploadSignature({
        name,
        category,
        isFree,
      });

      // XHR with upload.onprogress — fetch can't report upload progress.
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`,
        );
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            patchSlot(slot.id, {
              progress: Math.round((e.loaded / e.total) * 100),
            });
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch {
              reject(new Error("Failed to parse Cloudinary response"));
            }
          } else {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error"));
        const form = new FormData();
        form.append("file", slot.file);
        form.append("api_key", params.apiKey);
        form.append("timestamp", params.timestamp.toString());
        form.append("signature", params.signature);
        form.append("folder", params.folder);
        if (params.context) form.append("context", params.context);
        xhr.send(form);
      });

      if (data.error) throw new Error(data.error?.message || "Upload failed");

      const thumbUrl = (data.secure_url as string).replace(
        "/image/upload/",
        "/image/upload/w_300,h_200,c_fill,f_auto,q_auto/",
      );
      patchSlot(slot.id, { status: "done", progress: 100 });
      onUploaded?.({
        id: data.public_id as string,
        name,
        category,
        is_free: isFree,
        thumbnail: thumbUrl,
        url: data.secure_url as string,
      });
    } catch (err: any) {
      console.error("Bulk upload error:", err);
      patchSlot(slot.id, { status: "error" });
      toast.danger(`${name}: ${err.message || "Upload failed"}`);
    }
  };

  const runAll = async () => {
    if (slots.length === 0) return;
    setUploading(true);
    onUploadingChange?.(true);
    // Sequential to avoid signature/signature-bucket races + clearer progress
    for (const slot of slots) {
      if (slot.status !== "done") await uploadOne(slot);
    }
    setUploading(false);
    onUploadingChange?.(false);
    toast.success(`Finished — ${slots.length} background(s) uploaded`);
  };

  const doneCount = slots.filter((s) => s.status === "done").length;
  const total = slots.length;
  const pendingCount = total - doneCount;
  const ready = slots.length > 0 && pendingCount > 0 && !uploading;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-surface-muted/50 shadow-[0_8px_40px_color-mix(in_oklab,var(--overlay)_30%,transparent)]">
      <div className="pointer-events-none absolute -top-24 right-0 size-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-primary/10 blur-3xl" />

      {/* Header */}
      <div className="relative border-b border-border/50 px-6 py-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <label className="text-[11px] font-semibold tracking-wider text-foreground uppercase">
                Bulk upload
              </label>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Add many backgrounds at once — same category &amp; pricing for
              the whole batch.
            </p>
          </div>
          <span className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-semibold text-foreground">
            {slots.length} file{slots.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="relative grid gap-6 p-6 lg:grid-cols-[300px_1fr]">
        {/* Left rail — shared settings */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border/40 bg-background p-4">
            <span className="text-[11px] font-semibold text-foreground">
              Category
            </span>
            <div className="mt-3 space-y-1">
              {(
                [
                  { id: "mesh", label: "Mesh Background", icon: Mesh },
                  { id: "image", label: "Photographic / Image", icon: Image },
                ] as const
              ).map(({ icon: Icon, ...c }) => (
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

          <div className="rounded-2xl border border-border/40 bg-background p-4">
            <span className="text-[11px] font-semibold text-foreground">
              Configuration
            </span>
            <div
              className={cn(
                "mt-3 flex rounded-xl border px-3 py-2.5 transition-colors",
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
                <Switch.Content className="flex flex-col items-start gap-0.5">
                  <Label className="cursor-pointer text-[12.5px] font-medium text-foreground">
                    Premium Mode
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Applies to every file in this batch
                  </span>
                </Switch.Content>
              </Switch>
            </div>
          </div>
        </div>

        {/* Right panel — multi dropzone + slots */}
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {/* Multi-file dropzone */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              addFiles(e.dataTransfer.files);
            }}
            className="group flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 bg-background/40 px-6 py-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <UploadCloud className="size-5" />
            </span>
            <span className="text-[13px] font-semibold text-foreground">
              Drop images here or click to browse
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              PNG / JPG / WebP · max 10MB each · multiple allowed
            </span>
          </button>

          {/* Auto-name bar + preset picker */}
          {slots.length > 0 && (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-background/50 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                {slots.filter((s) => !s.name.trim()).length} unnamed file
                {slots.filter((s) => !s.name.trim()).length === 1 ? "" : "s"}
                {namePreset !== "filename" && (
                  <span className="ml-1 text-primary/80">
                    · {AUTO_NAME_PRESETS.find((p) => p.id === namePreset)?.label}
                  </span>
                )}
              </span>

              {/* Auto-name button with preset menu */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  ref={nameBtnRef}
                  onClick={() => setNameMenuOpen((v) => !v)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  <Wand2 className="size-3.5" />
                  Auto-name
                  <ChevronDown
                    className={cn(
                      "size-3 transition-transform",
                      nameMenuOpen && "rotate-180",
                    )}
                  />
                </button>

                {nameMenuOpen && (
                  <NamePresetMenu
                    anchorRef={nameBtnRef}
                    active={namePreset}
                    onSelect={(preset) => {
                      applyNamePreset(preset);
                      setNamePreset(preset);
                      setNameMenuOpen(false);
                    }}
                    onClose={() => setNameMenuOpen(false)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Slots list */}
          {slots.length > 0 && (
            <div className="max-h-105 space-y-2 overflow-y-auto pr-1">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 p-2 [content-visibility:auto] [contain-intrinsic-size:auto_60px]"
                >
                  <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                    {slot.preview ? (
                      <img
                        src={slot.preview}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center">
                        <Image className="size-4 text-muted-foreground/40" />
                      </div>
                    )}
                    {slot.status === "uploading" && (
                      <div className="absolute inset-0 grid place-items-center bg-overlay/50">
                        <Loader2 className="size-4 animate-spin text-white" />
                      </div>
                    )}
                    {slot.status === "done" && (
                      <div className="absolute inset-0 grid place-items-center bg-success/50">
                        <Check className="size-4 text-white" />
                      </div>
                    )}
                    {slot.status === "error" && (
                      <div className="absolute inset-0 grid place-items-center bg-danger/50">
                        <X className="size-4 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <input
                      value={slot.name}
                      onChange={(e) =>
                        patchSlot(slot.id, { name: e.target.value })
                      }
                      disabled={uploading}
                      placeholder="Background name"
                      className="w-full rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none disabled:opacity-60"
                    />
                    <div className="mt-1 flex items-center gap-2">
                      <p className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground/60">
                        {slot.file.name} ·{" "}
                        {(slot.file.size / 1024 / 1024).toFixed(2)}MB
                      </p>
                      {slot.status === "uploading" && (
                        <span className="shrink-0 font-mono text-[9px] tabular-nums text-primary">
                          {slot.progress}%
                        </span>
                      )}
                    </div>
                    {slot.status === "uploading" && (
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-background">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-primary to-warning transition-all duration-150"
                          style={{ width: `${slot.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSlot(slot.id)}
                    disabled={uploading || slot.status === "uploading"}
                    className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
                    title="Remove"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative border-t border-border/50 px-6 py-4">
        <AnimatePresence mode="wait">
          {uploading ? (
            /* Frame-style uploading state */
            <motion.div
              key="up"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-3 animate-spin" />
                  Uploading {total} files…
                </span>
                <span>
                  {doneCount} / {total} done
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-background">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-primary to-warning"
                  animate={{
                    width: `${total > 0 ? (doneCount / total) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between gap-4"
            >
              <button
                type="button"
                onClick={() => {
                  slots.forEach((s) => URL.revokeObjectURL(s.preview));
                  setSlots([]);
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border/60 px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
              >
                <RotateCcw className="size-3.5" />
                Clear all
              </button>

              <button
                type="button"
                onClick={() => void runAll()}
                disabled={!ready}
                className="group flex cursor-pointer items-center gap-2 rounded-xl bg-linear-to-r from-primary to-warning px-6 py-2.5 text-[12px] font-semibold text-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <UploadCloud className="size-4" />
                Upload {pendingCount > 0 ? `${pendingCount} background${pendingCount === 1 ? "" : "s"}` : "batch"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function UploadFormWithMode({
  onUploaded,
  bulk,
  onBulkChange,
  onUploadingChange,
  existingNames,
}: {
  onUploaded?: (uploaded: Background) => void;
  bulk: boolean;
  onBulkChange: (bulk: boolean) => void;
  onUploadingChange?: (uploading: boolean) => void;
  existingNames?: string[];
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={bulk ? "bulk" : "single"}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
      >
        {bulk ? (
          <BulkUploadForm
            onUploaded={onUploaded}
            onUploadingChange={onUploadingChange}
            existingNames={existingNames}
          />
        ) : (
          <UploadForm
            onUploaded={onUploaded}
            onUploadingChange={onUploadingChange}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
