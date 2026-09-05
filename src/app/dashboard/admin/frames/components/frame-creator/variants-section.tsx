"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Layers, MonitorSmartphone, Plus, Star, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { FrameDropzone } from "../frame-dropzone";
import type { FrameCreatorState } from "./use-frame-creator";

export function VariantsSection({ ctx }: { ctx: FrameCreatorState }) {
  const {
    variants,
    addVariant,
    patchVariant,
    removeVariant,
    defaultVariantId,
    setDefaultVariantId,
    isEditing,
  } = ctx;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Variants
          </span>
          <span className="rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {variants.length}
          </span>
        </div>
      </div>

      {variants.length === 0 && (
        <button
          type="button"
          onClick={addVariant}
          className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border/40 bg-muted/5 px-4 py-12 text-center transition-all hover:border-primary/30 hover:bg-primary/2"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="grid size-12 place-items-center rounded-2xl bg-primary/10"
          >
            <MonitorSmartphone className="size-6 text-primary" />
          </motion.div>
          <div>
            <p className="text-[13px] font-semibold text-foreground">
              Start with a variant
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Each variant is a color / finish of this frame
            </p>
          </div>
        </button>
      )}

      <AnimatePresence>
        {variants.map((v, i) => (
          <motion.div
            key={v.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className={cn(
              "rounded-2xl border p-3.5 transition-colors",
              defaultVariantId === v.id
                ? "border-primary/40 bg-primary/4"
                : "border-border/50 bg-muted/10",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-full bg-muted/40 text-[10px] font-bold text-muted-foreground">
                {i + 1}
              </span>
              <input
                value={v.name}
                onChange={(e) => patchVariant(v.id, { name: e.target.value })}
                placeholder="Variant name — e.g. black"
                className="flex-1 rounded-lg border-b border-transparent bg-transparent px-1 py-0.5 text-[12px] font-medium text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none"
              />
              <label
                title="Variant color"
                className="group/color relative grid size-7 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-lg ring-1 ring-border/60 transition-all hover:ring-2 hover:ring-primary/40"
                style={{ backgroundColor: v.color }}
              >
                <input
                  type="color"
                  value={v.color}
                  onChange={(e) =>
                    patchVariant(v.id, { color: e.target.value })
                  }
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
                <span className="grid size-full place-items-center opacity-0 transition-opacity group-hover/color:opacity-100">
                  <span className="size-1.5 rounded-full bg-overlay/70" />
                </span>
              </label>
              <button
                type="button"
                onClick={() => setDefaultVariantId(v.id)}
                title="Mark as default variant"
                className={cn(
                  "grid size-7 place-items-center rounded-lg transition-all",
                  defaultVariantId === v.id
                    ? "bg-warning-soft text-warning"
                    : "text-muted-foreground hover:bg-muted/30",
                )}
              >
                <Star
                  className={cn(
                    "size-3.5",
                    defaultVariantId === v.id && "fill-warning",
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => removeVariant(v.id)}
                className="grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <Trash className="size-3.5" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <FrameDropzone
                label={isEditing ? "Frame" : "Frame image"}
                hint={
                  isEditing ? "Drop to replace existing" : "Drop .png / .webp"
                }
                file={v.frame}
                existingUrl={v.existingFrameUrl}
                onFileChange={(f) => patchVariant(v.id, { frame: f })}
                compact
              />
              <FrameDropzone
                label={isEditing ? "Thumb" : "Thumbnail"}
                hint={
                  isEditing ? "Drop to replace existing" : "Drop .png / .webp"
                }
                file={v.thumb}
                existingUrl={v.existingThumbUrl}
                onFileChange={(f) => patchVariant(v.id, { thumb: f })}
                compact
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {variants.length > 0 && (
        <button
          type="button"
          onClick={addVariant}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/50 bg-muted/5 px-4 py-3 text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/2 hover:text-primary"
        >
          <Plus className="size-4" />
          Add another variant
        </button>
      )}
    </div>
  );
}
