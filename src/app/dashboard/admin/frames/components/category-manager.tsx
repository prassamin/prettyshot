"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  FolderKanban,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Trash,
  X,
} from "lucide-react";
import { toast } from "@heroui/react";

import {
  createCategory,
  deleteCategory,
  renameCategory,
  updateCategoryIcon,
  type FrameCategoryInfo,
} from "@/app/actions/frames";
import { useConfirm } from "@/components/confirm-provider";
import { cn, slugify } from "@/lib/utils";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CategoryManager({
  categories,
  onCatalogUpdate,
}: {
  categories: FrameCategoryInfo[];
  onCatalogUpdate: (catalog: FrameCategoryInfo[]) => void;
}) {
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newIcon, setNewIcon] = React.useState<File | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editIcon, setEditIcon] = React.useState<File | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const { confirm } = useConfirm();
  const patchCatalog = (
    fn: (prev: FrameCategoryInfo[]) => FrameCategoryInfo[],
  ) => onCatalogUpdate(fn(categories));

  const handleCreate = async () => {
    if (!newName.trim() || saving) return;
    setSaving(true);
    try {
      await createCategory({ id: newName, label: newName.trim() });
      if (newIcon) {
        const dataUrl = await readFileAsDataUrl(newIcon);
        await updateCategoryIcon(slugify(newName), dataUrl);
      }
      setCreating(false);
      setNewName("");
      setNewIcon(null);
      toast.success("Category created");
      // Optimistically add to local catalog; server tag refresh will confirm
      patchCatalog((prev) => [
        ...prev,
        {
          id: slugify(newName),
          label: newName.trim(),
          iconUrl: null,
          frames: [],
        },
      ]);
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c: FrameCategoryInfo) => {
    setEditingId(c.id);
    setEditName(c.label);
    setEditIcon(null);
  };

  const handleRename = async (c: FrameCategoryInfo) => {
    if (!editName.trim() || busyId) return;
    setBusyId(c.id);
    try {
      const newId = slugify(editName);
      if (newId !== c.id) {
        await renameCategory(c.id, newId, editName.trim());
      } else if (editName !== c.label) {
        await renameCategory(c.id, c.id, editName.trim());
      }
      if (editIcon) {
        const dataUrl = await readFileAsDataUrl(editIcon);
        await updateCategoryIcon(newId === c.id ? c.id : newId, dataUrl);
      }
      setEditingId(null);
      toast.success("Category updated");
      patchCatalog((prev) =>
        prev.map((cc) =>
          cc.id === c.id
            ? {
                ...cc,
                id: slugify(editName) !== c.id ? slugify(editName) : cc.id,
                label: editName.trim(),
              }
            : cc,
        ),
      );
    } catch (e) {
      toast.danger(e instanceof Error ? e.message : "Failed to update category");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (c: FrameCategoryInfo) => {
    if (busyId) return;
    await confirm({
      title: "Delete category",
      description: `Are you sure you want to delete "${c.label}" and all its ${c.frames.length} frame(s)? This cannot be undone.`,
      isDanger: true,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setBusyId(c.id);
        try {
          await deleteCategory(c.id);
          setEditingId(null);
          toast.success("Category deleted");
          patchCatalog((prev) => prev.filter((cc) => cc.id !== c.id));
        } catch (e) {
          toast.danger(
            e instanceof Error ? e.message : "Failed to delete category",
          );
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Create new category */}
      <div className="rounded-2xl border border-border/40 bg-surface-muted/50 p-4 shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_3%,transparent)]">
        {!creating ? (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border bg-background/50 border-dashed border-border/75 px-4 py-5 text-[12px] font-medium text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/3 hover:text-primary"
          >
            <span className="grid size-6 place-items-center rounded-md bg-muted/40 transition-colors group-hover:bg-primary/15">
              <Plus className="size-3.5" />
            </span>
            New category
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground">
                Create category
              </span>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Category name — e.g. iPhone"
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none"
              />
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/50 bg-background/50 px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                {newIcon ? (
                  <img
                    src={URL.createObjectURL(newIcon)}
                    alt=""
                    className="size-5 rounded"
                  />
                ) : (
                  <ImagePlus className="size-4" />
                )}
                {newIcon ? "Icon ready" : "Add icon"}
                <input
                  type="file"
                  accept="image/svg+xml,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => setNewIcon(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-primary to-warning px-4 py-2 text-[12px] font-semibold text-foreground shadow-md shadow-primary/20 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Create category
            </button>
          </motion.div>
        )}
      </div>

      {/* Category list */}
      <div className="space-y-2">
        <AnimatePresence>
          {categories.map((c) =>
            editingId === c.id ? (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-[0_0_24px_color-mix(in_oklab,var(--primary)_8%,transparent)]"
              >
                <div className="flex items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/40 bg-linear-to-br from-primary/10 to-transparent">
                    <FolderKanban className="size-4 text-muted-foreground" />
                  </span>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Category name"
                    className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-[12px] font-medium text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/50 bg-background/50 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                    {editIcon ? (
                      <img
                        src={URL.createObjectURL(editIcon)}
                        alt=""
                        className="size-4 rounded"
                      />
                    ) : c.iconUrl ? (
                      <img src={c.iconUrl} alt="" className="size-4 rounded" />
                    ) : (
                      <ImagePlus className="size-3.5" />
                    )}
                    {editIcon ? "Changed" : "Replace icon"}
                    <input
                      type="file"
                      accept="image/svg+xml,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => setEditIcon(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <div className="ml-auto flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRename(c)}
                      disabled={busyId === c.id}
                      className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-primary to-warning px-3 py-1.5 text-[11px] font-semibold text-foreground transition-all hover:brightness-110 disabled:opacity-50"
                    >
                      {busyId === c.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Check className="size-3" />
                      )}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="group flex items-center gap-3 rounded-2xl border border-border/50 bg-surface-muted/50 p-3 transition-all duration-200 hover:border-primary/25 hover:bg-surface-muted/60 hover:shadow-[0_2px_12px_rgba(0,0,0,0.15)]"
              >
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-border/40 bg-linear-to-br from-primary/10 via-muted/20 to-muted/10 shadow-inner">
                  {c.iconUrl ? (
                    <img src={c.iconUrl} alt="" className="size-5" />
                  ) : (
                    <FolderKanban className="size-4 text-muted-foreground/70" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold tracking-tight text-foreground">
                    {c.label}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span
                      className={cn(
                        "rounded px-1 py-px text-[8px] font-bold uppercase tracking-wider",
                        c.frames.length > 0
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/40 text-muted-foreground/70",
                      )}
                    >
                      {c.frames.length} frame{c.frames.length === 1 ? "" : "s"}
                    </span>
                    <span className="font-mono text-[9px] text-muted-foreground/50">
                      {c.id}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                    title="Rename / change icon"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    disabled={busyId === c.id}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-all hover:bg-danger/10 hover:text-danger"
                    title="Delete category"
                  >
                    {busyId === c.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash className="size-3.5" />
                    )}
                  </button>
                </div>
              </motion.div>
            ),
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
