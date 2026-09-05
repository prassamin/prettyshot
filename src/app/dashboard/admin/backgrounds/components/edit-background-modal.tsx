"use client";

import * as React from "react";
import { Label, Modal, Switch, toast } from "@heroui/react";
import {
  Check,
  Image as ImageIcon,
  Loader2,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Background, updateBackground } from "@/app/actions/backgrounds";
import { Mesh } from "@/components/icons/mesh";

export function EditBackgroundModal({
  background,
  isOpen,
  onClose,
  onSaved,
}: {
  background: Background | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: Background) => void;
}) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<"mesh" | "image">("mesh");
  const [isFree, setIsFree] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Sync form state whenever a new background is opened
  React.useEffect(() => {
    if (background) {
      setName(background.name);
      setCategory(background.category);
      setIsFree(background.is_free);
    }
  }, [background]);

  const handleSave = async () => {
    if (!background) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.danger("Name is required");
      return;
    }
    setSaving(true);
    try {
      await updateBackground(background.id, {
        name: trimmed,
        category,
        is_free: isFree,
      });
      onSaved({ ...background, name: trimmed, category, is_free: isFree });
      toast.success("Background updated");
      onClose();
    } catch (e: any) {
      toast.danger(e.message || "Failed to update background");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="overflow-hidden rounded-2xl border border-border/80 bg-surface p-0 shadow-2xl sm:max-w-105">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-foreground">
                    Edit background
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Update metadata for this asset
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="grid size-7 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-tertiary hover:text-foreground disabled:opacity-40"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4 px-5 py-4">
              {/* Preview */}
              {background?.thumbnail && (
                <div className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-background">
                  {/* subtle grid */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(color-mix(in_oklab,var(--foreground)_4%,transparent)_1px,transparent_1px)] bg-size-[16px_16px]" />
                  <img
                    src={background.thumbnail}
                    alt={background.name}
                    className="relative z-10 size-full object-contain"
                  />
                  {!isFree && (
                    <span className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-md bg-danger/85 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-foreground backdrop-blur-sm">
                      <Star className="size-2.5 fill-foreground text-foreground" />
                      Premium
                    </span>
                  )}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSave();
                  }}
                  placeholder="Asset name"
                  autoFocus
                  className="w-full rounded-xl border border-border/60 bg-background px-3.5 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
                />
              </div>

              {/* Category tiles */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: "mesh", label: "Mesh Background", icon: Mesh },
                      { id: "image", label: "Image", icon: ImageIcon },
                    ] as const
                  ).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategory(c.id)}
                      className={cn(
                        "flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[12px] font-medium transition-all",
                        category === c.id
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border/50 bg-background text-muted-foreground hover:border-border/80 hover:text-foreground",
                      )}
                    >
                      <c.icon
                        className={cn(
                          "size-3.5",
                          category === c.id
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Free / premium */}
              <Switch
                isSelected={!isFree}
                onChange={(val) => setIsFree(!val)}
                className="w-full flex-row-reverse justify-between mt-2"
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

            {/* Actions */}
            <div className="flex items-center gap-2.5 border-t border-border/50 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 cursor-pointer rounded-xl border border-border/80 bg-surface-tertiary/70 py-2.5 text-[13px] font-medium text-foreground/80 transition-all hover:bg-surface-secondary hover:text-foreground active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving || !name.trim()}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-danger py-2.5 text-[13px] font-semibold text-foreground shadow-md shadow-primary/25 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <Loader2 className="size-3.5 animate-spin" />}
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
