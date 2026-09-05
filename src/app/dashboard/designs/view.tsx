"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAppStore } from "@/stores/app-store";
import { useEditorEngine } from "@/editor/lib/engine";
import { useRouter } from "@/hooks/use-router";
import { createClient } from "@/lib/supabase/client";
import { isPro } from "@/lib/utils";
import { getDesignSnapshot } from "@/lib/snapshots";
import {
  Plus,
  Crown,
  Loader2,
  Trash2,
  ExternalLink,
  Edit2,
  Check,
  X,
  MoreVertical,
  Clock3,
  ImageIcon,
} from "lucide-react";
import { Button, Dropdown, Label, Modal } from "@heroui/react";
import { motion } from "framer-motion";

interface DesignItem {
  id: string;
  name: string;
  updated_at: string;
  config: Record<string, any>;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "recently";
  }
}

/* ─── Motion presets ──────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.06 },
  },
};

interface AllDesignsPageProps {
  designs: DesignItem[];
}

export default function AllDesignsPageView({
  designs: initialDesigns,
}: AllDesignsPageProps) {
  const { user } = useAppStore();
  const router = useRouter();
  const pro = useMemo(() => isPro(user), [user]);

  const [designs, setDesigns] = useState<DesignItem[]>(initialDesigns);

  // Inline rename state (no modal — the card title turns into an editor)
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [deletingDesign, setDeletingDesign] = useState<DesignItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Keep local list in sync if the server list changes (navigation, refresh)
  useEffect(() => {
    setDesigns(initialDesigns);
  }, [initialDesigns]);

  const handleLaunchNew = () => {
    const engine = useEditorEngine.getState();
    engine.reset();
    const newId = crypto.randomUUID();
    engine.setDesignId(newId);
    router.push(`/editor/${newId}`);
  };

  const startRename = (design: DesignItem) => {
    setRenamingId(design.id);
    setRenameInput(design.name || "Untitled Design");
    requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
  };

  const cancelRename = () => {
    if (isRenaming) return;
    setRenamingId(null);
    setRenameInput("");
  };

  const handleSaveRename = async () => {
    if (!renamingId || !renameInput.trim() || !user) return;
    setIsRenaming(true);
    try {
      const supabase = createClient();
      const updatedName = renameInput.trim();
      const { error } = await supabase
        .from("designs")
        .update({ name: updatedName, updated_at: new Date().toISOString() })
        .eq("id", renamingId);

      if (!error) {
        setDesigns((prev) =>
          prev.map((d) =>
            d.id === renamingId ? { ...d, name: updatedName } : d,
          ),
        );
        setRenamingId(null);
      }
    } catch (err) {
      console.error("Rename failed:", err);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDesign || !user) return;
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("designs")
        .delete()
        .eq("id", deletingDesign.id);

      if (!error) {
        setDesigns((prev) => prev.filter((d) => d.id !== deletingDesign.id));
        setDeletingDesign(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="relative pb-16"
    >
      {/* ─── Header ───────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-10 -top-16 size-48 rounded-full bg-primary/8 blur-3xl"
          />
          <h1 className="relative text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My designs
          </h1>
          <p className="relative mt-1 text-sm text-muted-foreground">
            {designs.length > 0
              ? `${designs.length} ${designs.length === 1 ? "design" : "designs"} saved to your workspace`
              : "All your saved designs in one place"}
          </p>
        </div>

        <Button
          onPress={handleLaunchNew}
          className="group/cta relative h-11 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-linear-to-r from-primary to-danger px-5 text-sm font-bold text-foreground shadow-lg shadow-danger/25 transition-all hover:shadow-xl hover:shadow-danger/30 active:scale-[0.98]"
        >
          <Plus className="mr-1.5 size-4 transition-transform duration-200 group-hover/cta:rotate-90" />
          New Design
        </Button>
      </motion.div>

      {/* ─── Body states ──────────────────────────────────────── */}
      {!pro.isActive ? (
        /* Free state */
        <motion.div
          variants={fadeUp}
          className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/80 bg-surface/40 px-6 py-20 text-center"
        >
          <div
            aria-hidden
            className="absolute -left-16 -top-20 size-56 rounded-full bg-primary/8 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -right-16 size-56 rounded-full bg-danger/8 blur-3xl"
          />
          <div className="relative flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-surface text-warning shadow-lg">
            <ImageIcon className="size-6" />
          </div>
          <h3 className="relative mt-4 text-base font-bold text-foreground">
            Cloud sync is a Pro feature
          </h3>
          <p className="relative mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
            Upgrade once to save designs to the cloud and access them seamlessly
            from any device.
          </p>
          <Button
            onPress={() => router.push("/checkout", { external: true })}
            className="relative mt-5 h-9 cursor-pointer rounded-xl bg-linear-to-r from-primary to-danger px-4 text-xs font-bold text-foreground shadow-md shadow-danger-soft-hover transition-all hover:shadow-lg active:scale-[0.98]"
          >
            <Crown className="mr-1.5 size-3.5" />
            Upgrade to Pro
          </Button>
        </motion.div>
      ) : designs.length > 0 ? (
        /* Grid */
        <motion.div
          variants={fadeUp}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {designs.map((design, i) => {
            const snapshotUrl = getDesignSnapshot(design.id);
            return (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: 0.04 * i,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onClick={() => {
                  if (renamingId === design.id) return;
                  router.push(`/editor/${design.id}`);
                }}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface-tertiary/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-xl"
              >
                {/* Preview stage */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,var(--surface-tertiary),var(--surface-secondary))]">
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                      backgroundImage:
                        "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
                      backgroundSize: "22px 22px",
                    }}
                  />
                  <img
                    src={snapshotUrl}
                    alt={design.name}
                    loading="lazy"
                    className="relative z-10 max-h-full max-w-full object-contain drop-shadow-md transition-all duration-500 group-hover:scale-[1.03]"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-overlay/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                </div>

                {/* Info footer */}
                <div className="flex items-center justify-between gap-2 p-3.5">
                  <div className="min-w-0 flex-1">
                    {renamingId === design.id ? (
                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={renameInput}
                          onChange={(e) => setRenameInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename();
                            if (e.key === "Escape") cancelRename();
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              if (renamingId === design.id) cancelRename();
                            }, 120);
                          }}
                          className="min-w-0 flex-1 rounded-md border border-primary/40 bg-surface px-1.5 py-0.5 text-xs font-bold text-foreground outline-none ring-1 ring-primary/20 focus:border-primary focus:ring-primary/30"
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleSaveRename}
                          disabled={isRenaming}
                          className="flex size-5.5 shrink-0 cursor-pointer items-center justify-center rounded-md bg-success-soft text-success transition-colors hover:bg-success/25 disabled:opacity-50"
                          aria-label="Save name"
                        >
                          {isRenaming ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Check className="size-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={cancelRename}
                          className="flex size-5.5 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-tertiary hover:text-foreground"
                          aria-label="Cancel rename"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="truncate text-xs font-bold text-foreground transition-colors group-hover:text-primary">
                        {design.name || "Untitled Design"}
                      </h3>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock3 className="size-3" />
                      Edited {formatRelativeTime(design.updated_at)}
                    </p>
                  </div>

                  <Dropdown>
                    <Button
                      isIconOnly
                      size="sm"
                      aria-label="Project actions"
                      variant="ghost"
                      className="size-7.5 shrink-0 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:bg-surface-tertiary hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                    <Dropdown.Popover>
                      <Dropdown.Menu
                        onAction={(key) => {
                          if (key === "open")
                            router.push(`/editor/${design.id}`);
                          if (key === "rename") startRename(design);
                          if (key === "delete") setDeletingDesign(design);
                        }}
                      >
                        <Dropdown.Item id="open" textValue="Open in Editor">
                          <Label className="flex items-center gap-2 text-xs">
                            <ExternalLink className="size-3.5" /> Open in Editor
                          </Label>
                        </Dropdown.Item>
                        <Dropdown.Item id="rename" textValue="Rename">
                          <Label className="flex items-center gap-2 text-xs">
                            <Edit2 className="size-3.5" /> Rename
                          </Label>
                        </Dropdown.Item>
                        <Dropdown.Item
                          id="delete"
                          textValue="Delete"
                          variant="danger"
                        >
                          <Label className="flex items-center gap-2 text-xs text-danger">
                            <Trash2 className="size-3.5" /> Delete
                          </Label>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* Empty state */
        <motion.div
          variants={fadeUp}
          className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/80 bg-surface/40 px-6 py-20 text-center"
        >
          <div
            aria-hidden
            className="absolute -left-16 -top-20 size-56 rounded-full bg-primary/8 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -right-16 size-56 rounded-full bg-danger/8 blur-3xl"
          />
          <div className="relative flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-surface text-muted-foreground shadow-lg">
            <ImageIcon className="size-6" />
          </div>
          <h3 className="relative mt-4 text-base font-bold text-foreground">
            It&apos;s pretty empty here
          </h3>
          <p className="relative mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
            You haven&apos;t created any designs yet. Drop a screenshot or open
            a blank canvas to get started.
          </p>
          <Button
            onPress={handleLaunchNew}
            className="relative mt-5 h-9 cursor-pointer rounded-xl bg-linear-to-r from-primary to-danger px-4 text-xs font-bold text-foreground shadow-md shadow-danger-soft-hover transition-all hover:shadow-lg active:scale-[0.98]"
          >
            <Plus className="mr-1.5 size-3.5" />
            Create design
          </Button>
        </motion.div>
      )}

      {/* ─── Delete Modal ────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(deletingDesign)}
        onOpenChange={(open) => !open && setDeletingDesign(null)}
      >
        <Modal.Backdrop variant="blur">
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-100 border border-border bg-surface shadow-2xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading className="text-sm font-semibold text-foreground">
                  Delete design?
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-foreground">
                    &quot;{deletingDesign?.name || "Untitled Design"}&quot;
                  </span>
                  ? This action cannot be undone.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => setDeletingDesign(null)}
                  className="cursor-pointer text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isPending={isDeleting}
                  onPress={handleConfirmDelete}
                  className="cursor-pointer text-xs font-bold"
                >
                  Delete
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </motion.div>
  );
}
