"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Grid2x2,
  Image as ImageIcon,
  Layers,
  Pencil,
  ShieldAlert,
  Trash,
} from "lucide-react";
import { toast } from "@heroui/react";
import { useConfirm } from "@/components/confirm-provider";
import { cn } from "@/lib/utils";

import { type Background, deleteBackground } from "@/app/actions/backgrounds";
import { EditBackgroundModal } from "./edit-background-modal";

export function BackgroundsList({
  initialBackgrounds,
  onBackgroundsUpdate,
}: {
  initialBackgrounds: Background[];
  onBackgroundsUpdate?: (backgrounds: Background[]) => void;
}) {
  const [backgrounds, setBackgrounds] = React.useState(initialBackgrounds);
  const [editing, setEditing] = React.useState<Background | null>(null);
  const { confirm } = useConfirm();

  const commit = React.useCallback(
    (next: Background[]) => {
      setBackgrounds(next);
      onBackgroundsUpdate?.(next);
    },
    [onBackgroundsUpdate],
  );

  const handleSaved = (updated: Background) => {
    commit(backgrounds.map((b) => (b.id === updated.id ? updated : b)));
  };

  const handleDelete = (bg: Background) => {
    void confirm({
      title: "Delete background",
      description: `Are you sure you want to delete "${bg.name}"? This cannot be undone.`,
      isDanger: true,
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await deleteBackground(bg.id);
          commit(backgrounds.filter((b) => b.id !== bg.id));
          toast.success("Background deleted");
        } catch (e: any) {
          toast.danger(e.message || "Failed to delete background");
        }
      },
    });
  };

  const meshCount = backgrounds.filter((b) => b.category === "mesh").length;
  const imageCount = backgrounds.filter((b) => b.category === "image").length;
  const premiumCount = backgrounds.filter((b) => !b.is_free).length;

  if (backgrounds.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border/50 bg-surface/50 px-6 py-16 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-muted/30">
          <ImageIcon className="size-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            No backgrounds uploaded yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload your first background using the form above.
          </p>
        </div>
      </div>
    );
  }

  const categories: { id: Background["category"]; label: string }[] = [
    { id: "mesh", label: "Mesh" },
    { id: "image", label: "Image" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {
            label: "Total",
            value: backgrounds.length,
            icon: Layers,
            tint: "text-primary bg-primary/10",
          },
          {
            label: "Mesh",
            value: meshCount,
            icon: Grid2x2,
            tint: "text-warning bg-warning/10",
          },
          {
            label: "Images",
            value: imageCount,
            icon: ImageIcon,
            tint: "text-success bg-success/10",
          },
          {
            label: "Premium",
            value: premiumCount,
            icon: ShieldAlert,
            tint: "text-danger bg-danger/10",
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
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-lg",
                  s.tint,
                )}
              >
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

      {/* Category groups */}
      {categories.map((category) => {
        const items = backgrounds.filter((b) => b.category === category.id);
        if (items.length === 0) return null;

        return (
          <motion.section
            key={category.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Category header */}
            <div className="group flex items-center gap-3">
              <span className="grid size-9 place-items-center overflow-hidden rounded-xl border border-border/50 bg-linear-to-br from-primary/25 to-muted shadow-sm">
                <Layers className="size-4 text-muted-foreground" />
              </span>
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                {category.label}
              </h3>
              <div className="h-px flex-1 bg-border/40" />
              <span className="rounded-full border border-border/40 bg-muted/10 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {items.length} {items.length === 1 ? "asset" : "assets"}
              </span>
            </div>

            {/* Asset cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {items.map((bg, fi) => (
                <motion.div
                  key={bg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: fi * 0.04 }}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-surface-muted/50 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]"
                >
                  {/* Preview stage */}
                  <div className="relative flex items-center justify-center overflow-hidden bg-background">
                    {/* Subtle grid backdrop */}
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(color-mix(in_oklab,var(--foreground)_4%,transparent)_1px,transparent_1px)] bg-size-[18px_18px]" />

                    {bg.thumbnail ? (
                      <img
                        key={bg.thumbnail}
                        src={bg.thumbnail}
                        alt={bg.name}
                        loading="lazy"
                        className="relative z-10 max-h-full object-contain shadow-sm"
                      />
                    ) : (
                      <div className="relative z-10 grid place-items-center">
                        <ImageIcon className="size-10 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Premium badge */}
                    {!bg.is_free && (
                      <span className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-danger/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-foreground backdrop-blur-sm">
                        <ShieldAlert className="size-2.5" />
                        Pro
                      </span>
                    )}

                    {/* Hover actions */}
                    <div className="absolute inset-0 z-20 flex items-start justify-end gap-1.5 bg-linear-to-b from-overlay/60 via-transparent to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => setEditing(bg)}
                        className="grid size-7 cursor-pointer place-items-center rounded-lg border border-foreground/20 bg-overlay/70 text-foreground/80 backdrop-blur-sm transition-colors hover:bg-primary hover:text-foreground"
                        title="Edit background"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(bg)}
                        className="grid size-7 cursor-pointer place-items-center rounded-lg border border-foreground/20 bg-overlay/70 text-foreground/80 backdrop-blur-sm transition-colors hover:bg-danger hover:text-foreground"
                        title="Delete background"
                      >
                        <Trash className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="flex items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                        {bg.name}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );
      })}

      {/* Edit modal */}
      <EditBackgroundModal
        background={editing}
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}
