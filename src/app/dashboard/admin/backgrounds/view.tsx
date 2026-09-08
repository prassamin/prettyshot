"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Layers, PlusCircle } from "lucide-react";
import { Label, Switch } from "@heroui/react";
import { cn } from "@/lib/utils";

import { getBackgrounds, type Background } from "@/app/actions/backgrounds";
import { UploadFormWithMode } from "./components/upload-form";
import { BackgroundsList } from "./components/backgrounds-list";

type TabId = "upload" | "library";

const TABS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "upload", label: "Upload", icon: PlusCircle },
  { id: "library", label: "Library", icon: Layers },
];

export function BackgroundsView({
  initialBackgrounds,
}: {
  initialBackgrounds: Background[];
}) {
  const [backgrounds, setBackgrounds] = React.useState(initialBackgrounds);
  const [tab, setTab] = React.useState<TabId>("upload");
  const [bulk, setBulk] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const refreshBackgrounds = React.useCallback(async () => {
    try {
      const fresh = await getBackgrounds();
      if (fresh) {
        // Merge instead of replace: a just-uploaded asset may not appear in
        // Cloudinary's list yet (eventual consistency) — keep any local items
        // missing from the fresh fetch so the library never flashes stale.
        setBackgrounds((prev) => {
          const freshIds = new Set(fresh.map((b) => b.id));
          const localOnly = prev.filter((b) => !freshIds.has(b.id));
          return [...localOnly, ...fresh];
        });
      }
    } catch (err) {
      console.error("Failed to fetch fresh backgrounds:", err);
    }
  }, []);

  const handleUploaded = React.useCallback(
    (uploaded: Background) => {
      // Prepend the fresh asset so the library updates instantly — a full
      // Cloudinary refetch right after upload can lag behind (eventual
      // consistency) and look stale until a page reload.
      setBackgrounds((prev) => [
        uploaded,
        ...prev.filter((b) => b.id !== uploaded.id),
      ]);
      // Background refetch keeps ordering + thumbnail parity once Cloudinary
      // has indexed the upload.
      void refreshBackgrounds();
      // Only jump to the library after a SINGLE upload — in bulk mode the
      // user stays on the form while the batch continues.
      if (!bulk) setTab("library");
    },
    [refreshBackgrounds, bulk],
  );

  return (
    <div className="space-y-6">
      {/* Tabs + bulk mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex w-fit items-center gap-1 rounded-2xl border border-border/50 bg-surface-muted/50 p-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            const locked = uploading && t.id !== "upload";
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                disabled={locked}
                title={locked ? "Wait for the upload to finish first" : undefined}
                className={cn(
                  "relative flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground",
                  locked && "cursor-not-allowed opacity-40",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="backgrounds-admin-tab"
                    className="absolute inset-0 rounded-xl bg-muted/60 ring-1 ring-border/60"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon className="relative z-10 size-3.5" />
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bulk-mode switch — only relevant on the upload tab */}
        {tab === "upload" && (
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface-muted/40 px-3 py-2">
            <Layers
              className={cn(
                "size-3.5 transition-colors",
                bulk ? "text-primary" : "text-muted-foreground",
              )}
            />
            <Label className="cursor-pointer text-[12px] font-medium text-foreground">
              Bulk add
            </Label>
            <Switch
              size="sm"
              isSelected={bulk}
              isDisabled={uploading}
              onChange={(val) => setBulk(val)}
            >
              <Switch.Control className={bulk ? "bg-primary" : "bg-foreground/15"}>
                <Switch.Thumb>
                  <Switch.Icon>
                    {bulk ? (
                      <Check className="size-2.5 text-primary-foreground" />
                    ) : null}
                  </Switch.Icon>
                </Switch.Thumb>
              </Switch.Control>
            </Switch>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {tab === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <UploadFormWithMode
              onUploaded={handleUploaded}
              bulk={bulk}
              onBulkChange={setBulk}
              onUploadingChange={setUploading}
              existingNames={backgrounds.map((b) => b.name)}
            />
          </motion.div>
        )}

        {tab === "library" && (
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <BackgroundsList
              initialBackgrounds={backgrounds}
              onBackgroundsUpdate={setBackgrounds}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
