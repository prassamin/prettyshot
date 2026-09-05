"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ImagePlus, RotateCcw, UploadCloud } from "lucide-react";
import type { FrameCreatorState } from "./use-frame-creator";

export function UploadFooter({
  ctx,
  onUpload,
  onDone,
  onReset,
}: {
  ctx: FrameCreatorState;
  onUpload: () => void;
  onDone: () => void;
  onReset: () => void;
}) {
  const {
    uploading,
    progressMap,
    done,
    totalFiles,
    ready,
    isEditing,
    runUpload,
    frameName,
    frameId,
    categorySlug,
  } = ctx;

  const doneCount = Object.values(progressMap).filter((v) => v === 100).length;

  return (
    <div className="relative border-t border-border/50 px-6 py-4">
      <AnimatePresence>
        {uploading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Uploading {totalFiles} files…</span>
              <span>
                {doneCount} / {totalFiles} done
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-background">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-primary to-orange-400"
                animate={{ width: `${(doneCount / totalFiles) * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </motion.div>
        ) : done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="grid size-9 place-items-center rounded-full bg-success text-success-foreground"
              >
                <Check className="size-4" />
              </motion.span>
              <div>
                <p className="text-[12px] font-semibold text-foreground">
                  {isEditing
                    ? `${frameName || frameId} updated`
                    : `${frameName || frameId} is live`}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isEditing
                    ? `Changes saved for ${categorySlug} / ${frameId}`
                    : `in the ${categorySlug} category`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDone}
              className="flex items-center gap-1.5 rounded-xl border border-border/60 px-4 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <UploadCloud className="size-3.5" />
              {isEditing ? "Done" : "Upload another"}
            </button>
          </motion.div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onReset}
                title={
                  isEditing
                    ? "Exit edit and start a fresh upload"
                    : "Clear the form to start a new upload"
                }
                className="flex items-center gap-1.5 rounded-xl border border-border/60 px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-danger/40 hover:bg-danger/10 hover:text-danger"
              >
                <RotateCcw className="size-3.5" />
                {isEditing ? "Exit edit" : "Reset"}
              </button>
              <span className="hidden items-center gap-2 text-[10px] text-muted-foreground sm:flex">
                <ImagePlus className="size-3.5" />
                {isEditing
                  ? "Metadata + replaced files will be updated"
                  : `${totalFiles} files will be uploaded`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => runUpload(onUpload)}
              disabled={!ready}
              className="group flex items-center gap-2 rounded-xl bg-linear-to-r from-primary to-orange-400 px-6 py-2.5 text-[12px] font-semibold text-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100"
            >
              {isEditing ? "Save changes" : "Upload"}
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}