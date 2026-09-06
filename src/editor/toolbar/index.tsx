"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { AnnotationToolbar } from "@/editor/toolbar/annotation-toolbar";
import { PrimaryToolbar } from "@/editor/toolbar/primary-toolbar";

import { cn } from "@/lib/utils";
import { useEditor } from "@/editor/lib/engine";
export function FloatingToolbar() {
  const { activeTool, setActiveTool } = useEditor();
  const isAnnotateMode = activeTool === "draw";

  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-4 z-20 flex w-full max-w-[calc(100vw-1.5rem)] flex-col items-center gap-2 px-3 sm:w-auto sm:px-0",
        isAnnotateMode
          ? "left-1/2 -translate-x-1/2"
          : "left-1/2 -translate-x-1/2",
      )}
    >
      <div className="flex items-center gap-2 max-xl:flex-col">
        <div
          data-mode={isAnnotateMode ? "annotate" : "default"}
          className={cn(
            "pointer-events-auto flex items-center gap-1 rounded-2xl border border-border/50 bg-surface-secondary/95 p-1.5 shadow-2xl backdrop-blur-md",
            "[scrollbar-width:none] overflow-x-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            isAnnotateMode &&
              "max-w-[calc(100vw-1.5rem)] md:max-xl:max-w-[calc(100vw-300px)]",
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isAnnotateMode ? "annotate" : "default"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className={cn(
                "flex items-center gap-0.5",
                isAnnotateMode ? "min-w-0 flex-1" : "min-w-max",
              )}
            >
              {isAnnotateMode ? (
                <AnnotationToolbar onExit={() => setActiveTool("pointer")} />
              ) : (
                <PrimaryToolbar />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
