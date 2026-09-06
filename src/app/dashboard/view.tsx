"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useAppStore } from "@/stores/app-store";
import { useEditorEngine } from "@/editor/lib/engine";
import { activateFreeTrial } from "@/app/actions/activate-trial";
import { useRouter } from "@/hooks/use-router";
import { createClient } from "@/lib/supabase/client";
import { isPro } from "@/lib/utils";
import { getDesignSnapshot } from "@/lib/snapshots";
import Link from "next/link";
import {
  Plus,
  Crown,
  Timer,
  Loader2,
  Trash2,
  ExternalLink,
  Edit2,
  Check,
  X,
  UploadCloud,
  FolderClosed,
  MoreVertical,
  ArrowRight,
  Clock3,
  Layers,
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
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

export default function DashboardOverview({
  initialDesigns,
}: {
  initialDesigns: DesignItem[];
}) {
  const { user } = useAppStore();
  const router = useRouter();
  const pro = useMemo(() => isPro(user), [user]);

  // State
  const [designs, setDesigns] = useState<DesignItem[]>(initialDesigns);
  const [activatingTrial, setActivatingTrial] = useState(false);

  // Inline rename state (no modal — the card title turns into an editor)
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [deletingDesign, setDeletingDesign] = useState<DesignItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput =
        tag === "input" ||
        tag === "textarea" ||
        (e.target as HTMLElement)?.isContentEditable;

      if (isInput) {
        if (e.key === "Escape") {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleLaunchNew();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    // Focus after the input mounts
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

  // Filtered designs
  if (!user) return null;

  const firstName =
    user.user_metadata?.full_name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="relative pb-16">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-10"
      >
        {/* ─── Hero header ─────────────────────────────────────── */}
        <motion.div variants={fadeUp} className="relative">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {greeting},{" "}
                <span className="bg-linear-to-r from-primary via-danger to-primary bg-clip-text font-bold text-transparent">
                  {firstName}
                </span>
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Drop a screenshot, frame it beautifully, and ship it. Your
                creative workspace is ready.
              </p>
            </div>

            {/* New design */}
            <Button
              onPress={handleLaunchNew}
              className="group/cta relative h-11 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-linear-to-r from-primary to-danger px-5 text-sm font-bold text-foreground shadow-lg shadow-danger/25 transition-all hover:shadow-xl hover:shadow-danger/30 active:scale-[0.98]"
            >
              <Plus className="mr-1.5 size-4 transition-transform duration-200 group-hover/cta:rotate-90" />
              New Design
            </Button>
          </div>
        </motion.div>

        {/* ─── Trial banner ───────────────────────────────────── */}
        {!pro.isActive && !user.trial_ends_at && (
          <motion.div variants={fadeUp}>
            <div className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-r from-primary/12 via-danger/10 to-surface p-px">
              <div className="relative flex flex-col gap-4 rounded-[15px] bg-surface/40 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-primary/15 blur-3xl transition-opacity group-hover:opacity-150"
                />
                <div className="relative flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-warning/25 bg-warning/10 text-warning shadow-[0_0_24px_color-mix(in_oklab,var(--warning)_15%,transparent)]">
                    <Timer className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground sm:text-base">
                      Try PrettyShot Pro — free for 24 hours
                    </h3>
                    <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
                      Cloud sync, live snapshot API endpoints, premium device
                      frames, and 4K exports — everything unlocked.
                    </p>
                  </div>
                </div>
                <Button
                  isPending={activatingTrial}
                  onPress={async () => {
                    setActivatingTrial(true);
                    const res = await activateFreeTrial();
                    if (res.success) {
                      window.location.reload();
                    } else {
                      alert(res.error);
                      setActivatingTrial(false);
                    }
                  }}
                  className="relative h-10 shrink-0 cursor-pointer rounded-xl bg-linear-to-r from-primary to-danger px-5 text-xs font-bold text-foreground shadow-md shadow-danger-soft-hover transition-all hover:shadow-lg hover:shadow-danger/30 active:scale-[0.98]"
                >
                  {activatingTrial && (
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                  )}
                  Activate Free Trial
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Stat cards ─────────────────────────────────────── */}
        <motion.section variants={fadeUp}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Total designs */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-surface-tertiary/50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-lg">
              <div
                aria-hidden
                className="absolute -right-6 -top-8 size-24 rounded-full bg-primary/8 blur-2xl transition-all duration-300 group-hover:bg-primary/12"
              />
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-muted-foreground">
                  Designs
                </span>
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <FolderClosed className="size-4" />
                </span>
              </div>
              <div className="relative mt-3 flex items-end gap-1.5">
                <span className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                  {designs.length}
                </span>
                <span className="pb-1 text-[11px] text-muted-foreground">
                  {designs.length === 1 ? "design" : "designs"}
                </span>
              </div>
              <p className="relative mt-1 text-[11px] text-muted-foreground/80">
                {pro.isActive
                  ? "Saved & synced to cloud"
                  : "Local session only"}
              </p>
            </div>

            {/* Plan Tier */}
            <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-surface-tertiary/50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-lg">
              <div
                aria-hidden
                className="absolute -right-6 -top-8 size-24 rounded-full bg-warning/8 blur-2xl transition-all duration-300 group-hover:bg-warning/12"
              />
              <div className="relative flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-muted-foreground">
                  Plan Tier
                </span>
                <span className="flex size-8 items-center justify-center rounded-lg bg-warning/10 text-warning transition-transform duration-300 group-hover:scale-110">
                  <Crown className="size-4" />
                </span>
              </div>
              <div className="relative mt-3 flex items-center gap-2">
                <span className="text-3xl font-bold tracking-tight text-foreground">
                  {pro.type === "pro"
                    ? "Pro"
                    : pro.type === "trial"
                      ? "Trial"
                      : "Free"}
                </span>
              </div>
              <p className="relative mt-1 text-[11px] text-muted-foreground/80">
                {pro.type === "pro"
                  ? "Lifetime license"
                  : pro.type === "trial"
                    ? "Trial in progress"
                    : "Upgrade anytime"}
              </p>
            </div>
          </div>
        </motion.section>

        {/* ─── Recent designs ─────────────────────────────────── */}
        <motion.section variants={fadeUp}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              Recent designs
            </h2>

            {designs.length > 0 && (
              <Link
                href="/dashboard/designs"
                className="group flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
              >
                View all
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>

          {!pro.isActive ? (
            /* Free state */
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/80 bg-surface/40 px-6 py-16 text-center">
              <div
                aria-hidden
                className="absolute -left-16 -top-20 size-56 rounded-full bg-primary/8 blur-3xl"
              />
              <div
                aria-hidden
                className="absolute -bottom-20 -right-16 size-56 rounded-full bg-danger/8 blur-3xl"
              />
              <div className="relative flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-surface text-warning shadow-lg">
                <UploadCloud className="size-6" />
              </div>
              <h3 className="relative mt-4 text-base font-bold text-foreground">
                Cloud sync is a Pro feature
              </h3>
              <p className="relative mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Upgrade once to save designs to the cloud and generate live,
                shareable snapshot links from anywhere.
              </p>
              <Button
                onPress={() => router.push("/checkout", { external: true })}
                className="relative mt-5 h-9 cursor-pointer rounded-xl bg-linear-to-r from-primary to-danger px-4 text-xs font-bold text-foreground shadow-md shadow-danger-soft-hover transition-all hover:shadow-lg active:scale-[0.98]"
              >
                <Crown className="mr-1.5 size-3.5" />
                Upgrade to Pro
              </Button>
            </div>
          ) : designs.length > 0 ? (
            /* Grid */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {designs.slice(0, 6).map((design, i) => {
                const snapshotUrl = getDesignSnapshot(design.id);
                return (
                  <motion.div
                    key={design.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.05 * i,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    onClick={() => {
                      // Don't navigate away while the inline rename is open
                      if (renamingId === design.id) return;
                      router.push(`/editor/${design.id}`);
                    }}
                    className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface-tertiary/50 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-xl"
                  >
                    {/* Preview stage */}
                    <div className="relative aspect-16/10 w-full overflow-hidden">
                      <img
                        src={snapshotUrl}
                        alt={design.name}
                        loading="lazy"
                        className="relative z-10 max-h-full max-w-full object-contain drop-shadow-md transition-all duration-500 group-hover:scale-[1.03]"
                      />

                      {/* hover sheen */}
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
                                // Save on blur only if not clicking the save btn
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
                                <ExternalLink className="size-3.5" /> Open in
                                Editor
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
            </div>
          ) : (
            /* Empty */
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/80 bg-surface/40 px-6 py-16 text-center">
              <div
                aria-hidden
                className="absolute -left-16 -top-20 size-56 rounded-full bg-primary/8 blur-3xl"
              />
              <div
                aria-hidden
                className="absolute -bottom-20 -right-16 size-56 rounded-full bg-danger/8 blur-3xl"
              />
              <div className="relative flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-surface text-muted-foreground shadow-lg">
                <Layers className="size-6" />
              </div>
              <h3 className="relative mt-4 text-base font-bold text-foreground">
                Start your first design
              </h3>
              <p className="relative mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Drop a screenshot above or open a blank canvas to begin.
              </p>
              <Button
                onPress={handleLaunchNew}
                className="relative mt-5 h-9 cursor-pointer rounded-xl bg-linear-to-r from-primary to-danger px-4 text-xs font-bold text-foreground shadow-md shadow-danger-soft-hover transition-all hover:shadow-lg active:scale-[0.98]"
              >
                <Plus className="mr-1.5 size-3.5" />
                Create design
              </Button>
            </div>
          )}
        </motion.section>
      </motion.div>

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
    </div>
  );
}
