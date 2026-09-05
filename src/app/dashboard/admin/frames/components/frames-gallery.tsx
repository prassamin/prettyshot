"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FolderKanban,
  Image as ImageIcon,
  MonitorSmartphone,
  Pencil,
  Trash,
} from "lucide-react";
import { toast } from "@heroui/react";

import {
  deleteFrame,
  setFrameDefaultVariant,
  type FrameCategoryInfo,
} from "@/app/actions/frames";
import { ProgressiveImage } from "@/components/progressive-image";
import { useConfirm } from "@/components/confirm-provider";
import { cn } from "@/lib/utils";

export function FramesGallery({
  initialCatalog,
  onCatalogUpdate,
  onEdit,
}: {
  initialCatalog: FrameCategoryInfo[];
  onCatalogUpdate: (catalog: FrameCategoryInfo[]) => void;
  onEdit?: (categoryId: string, frame: FrameCategoryInfo["frames"][number]) => void;
}) {
  const [catalog, setCatalog] = React.useState(initialCatalog);
  const { confirm } = useConfirm();

  const removeFrame = async (categoryId: string, frameId: string) => {
    const frame = catalog
      .find((c) => c.id === categoryId)
      ?.frames.find((f) => f.id === frameId);
    if (!frame) return;

    await confirm({
      title: "Delete frame",
      description: `Are you sure you want to delete "${frame.name}" and all its ${frame.variants.length} variant(s)? This cannot be undone.`,
      isDanger: true,
      confirmLabel: "Delete",
      onConfirm: async () => {
        await deleteFrame(categoryId, frameId);
        toast.success("Frame deleted");

        const next = catalog.map((c) =>
          c.id === categoryId
            ? { ...c, frames: c.frames.filter((f) => f.id !== frameId) }
            : c,
        );
        setCatalog(next);
        onCatalogUpdate(next);
      },
    });
  };

  const markDefault = async (categoryId: string, frameId: string, variantId: string) => {
    try {
      await setFrameDefaultVariant(categoryId, frameId, variantId);
      const next = catalog.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              frames: c.frames.map((f) =>
                f.id === frameId ? { ...f, defaultVariant: variantId } : f,
              ),
            }
          : c,
      );
      setCatalog(next);
      onCatalogUpdate(next);
      toast.success("Default variant updated");
    } catch {
      toast.danger("Failed to set default variant");
    }
  };

  if (catalog.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border/50 bg-surface/50 px-6 py-16 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-muted/30">
          <MonitorSmartphone className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            No frames uploaded yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload your first frame using the wizard above.
          </p>
        </div>
      </div>
    );
  }
console.log(catalog);
  const totalFrames = catalog.reduce((acc, c) => acc + c.frames.length, 0);
  const totalVariants = catalog.reduce(
    (acc, c) => acc + c.frames.reduce((a, f) => a + f.variants.length, 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Categories",
            value: catalog.length,
            icon: FolderKanban,
            tint: "text-primary bg-primary/10",
          },
          {
            label: "Frames",
            value: totalFrames,
            icon: MonitorSmartphone,
            tint: "text-warning bg-warning/10",
          },
          {
            label: "Variants",
            value: totalVariants,
            icon: ImageIcon,
            tint: "text-success bg-success/10",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-surface-muted/50 p-3.5 transition-colors hover:border-border/80"
          >
            <div className="flex items-center gap-2">
              <span className={cn("grid size-7 place-items-center rounded-lg", s.tint)}>
                <s.icon className="size-3.5" />
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {s.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Categories */}
      <AnimatePresence>
        {catalog.map((category) => (
          <motion.section
            key={category.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Category header */}
            <div className="group flex items-center gap-3">
              <span className="grid size-9 place-items-center overflow-hidden rounded-xl border border-border/50 bg-linear-to-br from-primary/25 to-muted shadow-sm">
                {category.iconUrl ? (
                  <img src={category.iconUrl} alt="" className="size-5" />
                ) : (
                  <FolderKanban className="size-4 text-muted-foreground" />
                )}
              </span>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                {category.label}
              </h3>
              <div className="h-px flex-1 bg-border/40" />
              <span className="rounded-full border border-border/40 bg-muted/10 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {category.frames.length} frame{category.frames.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Frame cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence>
                {category.frames.map((frame, fi) => {
                  // Preview follows the default variant if set, else first variant
                  const previewVariant = frame.variants.find(
                    (v) => v.id === frame.defaultVariant,
                  ) ?? frame.variants[0];
                  const previewSrc =
                    previewVariant?.thumbUrl ?? previewVariant?.frameUrl ?? null;

                  return (
                  <motion.div
                    key={frame.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: fi * 0.04 }}
                    className="group relative overflow-hidden rounded-2xl border border-border/50 bg-surface-muted/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
                  >
                    {/* Preview stage */}
                    <div className="relative flex h-40 items-center justify-center overflow-hidden bg-background p-5 md:h-44">
                      {/* Subtle grid backdrop */}
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(color-mix(in oklab, var(--foreground) 4%, transparent) 1px, transparent 1px)] bg-size-[18px_18px]" />

                      {previewSrc ? (
                        <ProgressiveImage
                          key={previewSrc}
                          src={previewSrc}
                          alt={frame.name}
                          mode="shimmer"
                          className="relative z-10 max-h-full max-w-[75%] object-contain"
                        />
                      ) : (
                        <div className="relative z-10 grid place-items-center">
                          <MonitorSmartphone className="size-10 text-muted-foreground/30" />
                        </div>
                      )}

                      {/* Hover actions */}
                      <div className="absolute inset-0 z-20 flex items-start justify-end gap-1.5 bg-linear-to-b from-overlay/60 via-transparent to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() =>
                            onEdit?.(category.id, frame)
                          }
                          className="grid size-7 place-items-center rounded-lg border border-foreground/20 bg-overlay/70 text-foreground/80 backdrop-blur-sm transition-colors hover:bg-primary hover:text-foreground"
                          title="Edit frame"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFrame(category.id, frame.id)}
                          className="grid size-7 place-items-center rounded-lg border border-foreground/20 bg-overlay/70 text-foreground/80 backdrop-blur-sm transition-colors hover:bg-danger hover:text-foreground"
                          title="Delete frame"
                        >
                          <Trash className="size-3.5" />
                        </button>
                      </div>

                      {/* Badges */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1">
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[8px] font-bold tracking-wider backdrop-blur-sm",
                            frame.isFree
                              ? "bg-success/80 text-foreground"
                              : "bg-warning text-warning-foreground",
                          )}
                        >
                          {frame.isFree ? "FREE" : "PRO"}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-2 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-foreground">
                          {frame.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MonitorSmartphone className="size-3" />
                          {frame.id}
                        </p>
                      </div>
                    </div>

                    {/* Variant strip */}
                    {frame.variants.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 border-t border-border/40 px-3 py-2">
                        {frame.variants.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() =>
                              markDefault(category.id, frame.id, v.id)
                            }
                            title={
                              frame.defaultVariant === v.id
                                ? "Default variant (click to unset)"
                                : "Set as default variant"
                            }
                            className={cn(
                              "relative grid size-5 place-items-center rounded-full border-2 transition-all",
                              frame.defaultVariant === v.id
                                ? "border-warning shadow-[0_0_8px_color-mix(in_oklab,var(--warning)_50%,transparent)]"
                                : "border-border/40 hover:border-foreground/40",
                            )}
                          >
                            <span
                              className="size-3 rounded-full ring-1 ring-border/50"
                              style={{ backgroundColor: frame.colors?.[v.id] ?? "#6b7280" }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.section>
        ))}
      </AnimatePresence>
    </div>
  );
}