"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderKanban, LayoutGrid, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  getFramesCatalogUncached,
  type FrameCategoryInfo,
} from "@/app/actions/frames";
import { FrameCreator } from "./components/upload-wizard";
import { FramesGallery } from "./components/frames-gallery";
import { CategoryManager } from "./components/category-manager";

type TabId = "upload" | "library" | "categories";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { id: "upload", label: "Upload", icon: PlusCircle },
    { id: "library", label: "Library", icon: LayoutGrid },
    { id: "categories", label: "Categories", icon: FolderKanban },
  ];

export function FramesView({
  initialCatalog,
}: {
  initialCatalog: FrameCategoryInfo[];
}) {
  const [catalog, setCatalog] = React.useState(initialCatalog);
  const [tab, setTab] = React.useState<TabId>("upload");
  const [editing, setEditing] = React.useState<{
    categoryId: string;
    frame: FrameCategoryInfo["frames"][number];
  } | null>(null);

  const refreshCatalog = React.useCallback(async () => {
    try {
      const fresh = await getFramesCatalogUncached();
      if (fresh) setCatalog(fresh);
    } catch (err) {
      console.error("Failed to fetch fresh catalog:", err);
    }
  }, []);

  const handleEdit = React.useCallback(
    (categoryId: string, frame: FrameCategoryInfo["frames"][number]) => {
      setEditing({ categoryId, frame });
      setTab("upload");
    },
    [],
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
                "relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-medium transition-colors",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="frames-admin-tab"
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
            <FrameCreator
              categories={catalog}
              editing={editing}
              onUploaded={() => {
                setEditing(null);
                refreshCatalog();
              }}
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
            <FramesGallery
              initialCatalog={catalog}
              onCatalogUpdate={setCatalog}
              onEdit={handleEdit}
            />
          </motion.div>
        )}

        {tab === "categories" && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mx-auto max-w-2xl"
          >
            <CategoryManager
              categories={catalog}
              onCatalogUpdate={setCatalog}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}