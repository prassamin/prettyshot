"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@heroui/react";
import { MAX_FILE_SIZE } from "@/config";

export type DropzoneFile = {
  file: File | null;
  preview: string | null;
};

export function FrameDropzone({
  label,
  hint,
  file,
  existingUrl,
  onFileChange,
  accept = "image/png,image/jpeg,image/webp",
  aspect = "aspect-[4/3]",
  compact = false,
}: {
  label: string;
  hint?: string;
  file: File | null;
  existingUrl?: string | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  aspect?: string;
  compact?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = React.useId();
  const [dragging, setDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  // Has content = either a newly picked file or an existing uploaded image
  const hasImage = !!file || !!existingUrl;
  const displaySrc = preview ?? existingUrl ?? null;

  const handleFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.danger("Please select a valid image file");
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.danger("File size must be less than 10MB");
      return;
    }
    onFileChange(f);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">
          {label}
        </span>
        {hasImage && (
          <button
            type="button"
            onClick={() => onFileChange(null)}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <X className="size-3" />
            Clear
          </button>
        )}
      </div>

      <label
        htmlFor={inputId}
        role="button"
        tabIndex={0}
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "group relative flex w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 select-none",
          aspect,
          compact && "min-h-0",
          hasImage
            ? dragging
              ? "border-primary/50 bg-primary/5"
              : "border-primary/20 bg-primary/3"
            : dragging
              ? "border-primary/60 bg-primary/5 shadow-[0_0_24px_color-mix(in_oklab,var(--primary)_12%,transparent)]"
              : "border-border/40 bg-muted/10 hover:border-primary/30 hover:bg-primary/3",
        )}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {displaySrc ? (
          <>
            <img
              src={displaySrc}
              alt={label}
              className="absolute inset-0 size-full object-cover"
            />
            <div className="absolute inset-0 bg-overlay/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 text-[10px] font-medium text-foreground"
            >
              <ImagePlus className="size-3.5" />
              {file ? "Replace" : "Tap to replace"}
            </motion.div>
            {file ? (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute top-1.5 right-1.5 z-10 grid size-5 place-items-center rounded-full border border-foreground/20 bg-overlay/70 text-foreground backdrop-blur-sm"
              >
                <Check className="size-3" />
              </motion.span>
            ) : (
              <span className="absolute top-1.5 right-1.5 z-10 rounded-full border border-foreground/20 bg-overlay/70 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wider text-foreground/80 backdrop-blur-sm">
                Present
              </span>
            )}
          </>
        ) : (
          <>
            <motion.div
              whileHover={{ scale: 1.08 }}
              className={cn(
                "grid size-8 place-items-center rounded-lg transition-colors",
                dragging
                  ? "bg-primary/15 text-primary"
                  : "bg-muted/40 text-muted-foreground",
              )}
            >
              <ImagePlus className="size-4" />
            </motion.div>
            <span className="text-[10px] font-medium text-muted-foreground">
              {hint ?? "Drop or click to upload"}
            </span>
          </>
        )}
      </label>
    </div>
  );
}

export function UploadingOverlay({ progress }: { progress: number | null }) {
  if (progress === null) return null;
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-overlay/70 backdrop-blur-sm">
      <Loader2 className="size-4 animate-spin text-foreground" />
      <span className="text-[10px] font-medium text-foreground">
        {Math.round(progress)}%
      </span>
    </div>
  );
}
