"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudCheck, CloudAlert, Cloud } from "lucide-react";
import { useEditorEngine } from "@/editor/lib/engine";
import { useFeatureGate } from "@/hooks/use-feature-gate";
import { Tooltip } from "@/components/tooltip";
import { cn } from "@/lib/utils";
import { Spinner } from "@heroui/react";

export function ProjectStatus() {
  const saveStatus = useEditorEngine((s) => s.saveStatus);
  const saveError = useEditorEngine((s) => s.saveError);
  const lastSavedAt = useEditorEngine((s) => s.lastSavedAt);
  const requestSave = useEditorEngine((s) => s.requestSave);
  const { can } = useFeatureGate();
  const isCloud = can("cloud.sync");

  const [timeAgo, setTimeAgo] = React.useState<string>("");

  React.useEffect(() => {
    if (!lastSavedAt) {
      setTimeAgo("");
      return;
    }

    const update = () => {
      const elapsedSec = Math.max(
        0,
        Math.floor((Date.now() - lastSavedAt) / 1000),
      );
      if (elapsedSec < 5) {
        setTimeAgo("just now");
      } else if (elapsedSec < 60) {
        setTimeAgo(`${elapsedSec}s ago`);
      } else if (elapsedSec < 3600) {
        const mins = Math.floor(elapsedSec / 60);
        const secs = elapsedSec % 60;
        setTimeAgo(secs === 0 ? `${mins}m ago` : `${mins}m ${secs}s ago`);
      } else {
        const hours = Math.floor(elapsedSec / 3600);
        const mins = Math.floor((elapsedSec % 3600) / 60);
        setTimeAgo(`${hours}h ${mins}m ago`);
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [lastSavedAt]);

  const tooltipContent = (
    <div className="flex flex-col gap-0.5 text-left text-[11px] leading-tight select-none">
      <div className="font-semibold text-foreground">
        {saveStatus === "saving"
          ? isCloud
            ? "Saving changes to cloud..."
            : "Saving changes to this device..."
          : saveStatus === "unsaved"
            ? "Unsaved changes"
            : saveStatus === "error"
              ? "Sync error"
              : isCloud
                ? "All changes saved to cloud"
                : "Saved to this device"}
      </div>
      <div className="text-[10px] text-muted-foreground">
        {saveStatus === "error"
          ? saveError || "Could not sync changes. Click to retry."
          : saveStatus === "unsaved"
            ? "Changes will save automatically, or click to save now"
            : timeAgo
              ? `Last saved ${timeAgo}`
              : isCloud
                ? "Designs automatically sync to your account"
                : "Saved in your browser storage"}
      </div>
    </div>
  );

  return (
    <Tooltip
      delay={200}
      closeDelay={100}
      content={tooltipContent}
      contentProps={{
        className: "p-2.5 rounded-lg bg-surface",
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          requestSave();
        }}
        aria-label={`Project sync status: ${saveStatus}`}
        className={cn(
          "group relative flex h-7 items-center gap-1.5 rounded-lg px-2 text-xs transition-all duration-200 select-none",
          saveStatus === "error"
            ? "cursor-pointer text-danger hover:bg-danger-soft-hover"
            : saveStatus === "saving"
              ? "cursor-wait text-warning hover:text-warning/80"
              : saveStatus === "unsaved"
                ? "cursor-pointer text-muted-foreground hover:text-foreground hover:bg-surface-tertiary/50"
                : "cursor-pointer text-success hover:text-success/80 hover:bg-surface-tertiary/50",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {saveStatus === "saving" && (
            <motion.div
              key="saving"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5"
            >
              <Spinner className="size-3.5 animate-spin" />
              <span className="hidden md:inline font-medium text-[11px]">
                Saving...
              </span>
            </motion.div>
          )}

          {saveStatus === "unsaved" && (
            <motion.div
              key="unsaved"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5"
            >
              <span className="relative flex size-3.5 items-center justify-center">
                <Cloud className="size-3.5 transition-colors" />
                <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-primary ring-1 ring-background" />
              </span>
              <span className="hidden md:inline font-medium text-[11px] transition-colors">
                Unsaved
              </span>
            </motion.div>
          )}

          {saveStatus === "saved" && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5"
            >
              <CloudCheck className="size-3.5 transition-colors" />
              <span className="hidden md:inline font-medium text-[11px] transition-colors">
                Saved
              </span>
            </motion.div>
          )}

          {saveStatus === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1.5"
            >
              <CloudAlert className="size-3.5" />
              <span className="hidden md:inline font-semibold text-[11px]">
                Error
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </Tooltip>
  );
}
