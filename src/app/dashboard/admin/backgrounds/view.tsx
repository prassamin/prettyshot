"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layers, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { getBackgrounds, type Background } from "@/app/actions/backgrounds";
import { UploadForm } from "./components/upload-form";
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
      setTab("library");
    },
    [refreshBackgrounds],
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="relative flex w-fit items-center gap-1 rounded-2xl border border-border/50 bg-surface-muted/50 p-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "relative flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
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

      <AnimatePresence mode="wait">
        {tab === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <UploadForm onUploaded={handleUploaded} />
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
