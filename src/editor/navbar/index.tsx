"use client";

import * as React from "react";
import { Copy, Eye, Undo2, Redo2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@heroui/react";
import Link from "next/link";
import Image from "next/image";
import { APP_NAME } from "@/config";

import { copyCanvasAsPng } from "@/editor/lib/export";
import { useEditorEngine } from "@/editor/lib/engine";
import { RatioSelector } from "./ratio-picker";
import { findAspectOption } from "@/editor/aspect/presets";
import { ExportDropdownMenu } from "./export-menu";
import { NavbarButton, NavbarActionButton } from "./elements";
import { CANVAS_ID } from "@/editor/lib/engine-core/initial-config";
import { Tooltip } from "@/components/tooltip";
import { ProjectStatus } from "./project-status";

export function TopNavigationBar() {
  const triggerUndo = useEditorEngine((s) => s.undo);
  const triggerRedo = useEditorEngine((s) => s.redo);
  const hasHistory = useEditorEngine((s) => s.past.length > 0);
  const hasFuture = useEditorEngine((s) => s.future.length > 0);

  const previewActive = useEditorEngine((s) => s.isPreviewMode);
  const togglePreview = useEditorEngine((s) => s.setIsPreviewMode);
  const isAnimating = useEditorEngine((s) => s.isAnimateMode);

  const activeRatio = useEditorEngine((s) => s.present.aspect);
  const activeFrame = useEditorEngine((s) => s.present.deviceFrame);
  const updateRatio = useEditorEngine((s) => s.setAspect);

  const onRatioChange = React.useCallback(
    (id: string, customDims?: { w: number; h: number }) => {
      if (customDims) {
        const nextRatio = { id, w: customDims.w, h: customDims.h };
        updateRatio(nextRatio);
        return;
      }
      const matchedOpt = findAspectOption(id);
      if (matchedOpt) {
        const nextRatio = { id, w: matchedOpt.w, h: matchedOpt.h };
        updateRatio(nextRatio);
      }
    },
    [updateRatio, activeFrame],
  );

  const [isBusyCopying, setIsBusyCopying] = React.useState(false);
  const [hasCopiedRecently, setHasCopiedRecently] = React.useState(false);
  const [includeLogoWatermark, setIncludeLogoWatermark] = React.useState(true);

  const executeImageCopy = React.useCallback(async () => {
    if (isBusyCopying) return;
    setIsBusyCopying(true);
    toast.promise(
      copyCanvasAsPng(CANVAS_ID, "1080p", {
        watermark: includeLogoWatermark,
      }),
      {
        error: (e) => {
          console.error(e);
          setIsBusyCopying(false);
          return `Copy failed. ${e.message}`;
        },
        loading: "Copying to clipboard…",
        success: () => {
          setHasCopiedRecently(true);
          setTimeout(() => setHasCopiedRecently(false), 2000);
          setIsBusyCopying(false);
          return `Copied image to clipboard!`;
        },
      },
    );
  }, [includeLogoWatermark, isBusyCopying]);

  return (
    <header className="flex h-13 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-secondary/95 px-3 sm:px-4 z-40 select-none">
      {/* Brand Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-lg p-1 transition-all hover:opacity-90"
        >
          <Image
            src="/prettyshot.svg"
            alt={`${APP_NAME} Logo`}
            width={28}
            height={22}
            priority
            className="transition-transform duration-200 group-hover:scale-105 shrink-0"
          />
          <div className="hidden sm:flex flex-col text-left leading-none">
            <span className="font-bold text-[14px] tracking-tight text-foreground">
              {APP_NAME}
            </span>
          </div>
        </Link>

        <ProjectStatus />
      </div>

      {/* Editor Controls Center */}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 md:gap-2">
        {/* Ratio Selector Component */}
        <RatioSelector
          currentId={activeRatio.id}
          onRatioSelect={onRatioChange}
          styleVariant="navbar"
          dropdownAlign="start"
          triggerClass="hidden lg:flex"
        />

        {/* History Navigation */}
        <div className="hidden lg:flex items-center rounded-xl border border-border/70 bg-surface-tertiary/60 p-0.5">
          <NavbarButton
            title="Undo"
            icon={Undo2}
            shortcut="⌘Z"
            onPress={triggerUndo}
            isDisabled={!hasHistory}
          />
          <NavbarButton
            title="Redo"
            icon={Redo2}
            shortcut="⌘⇧Z"
            onPress={triggerRedo}
            isDisabled={!hasFuture}
          />
        </div>

        {/* Fullscreen Preview Toggle */}
        <NavbarActionButton
          text="Preview"
          icon={Eye}
          variant={"secondary"}
          onAction={() => togglePreview(!previewActive)}
          className="inline-flex "
        />
      </div>

      {/* Actions & Export Right Side */}
      <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
        {/* Clipboard Copy */}
        {!isAnimating && (
          <Tooltip
            delay={0}
            closeDelay={0}
            content={
              <div className="flex items-center gap-2">
                Copy snapshot
                <kbd className="rounded bg-surface-tertiary px-1.5 font-mono text-sm text-muted-foreground">
                  ⌘C
                </kbd>
              </div>
            }
          >
            <button
              type="button"
              onClick={() => void executeImageCopy()}
              disabled={isBusyCopying}
              className="hidden xl:inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-surface-tertiary/60 px-3 text-xs font-medium text-foreground transition-all duration-150 select-none hover:bg-surface-tertiary active:scale-95 disabled:opacity-50"
            >
              <Copy className="size-3.5 text-muted-foreground" />
              <span className="relative inline-grid [&>span]:col-start-1 [&>span]:row-start-1">
                <span className="invisible whitespace-nowrap" aria-hidden>
                  Copy Image
                </span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={
                      isBusyCopying
                        ? "copying"
                        : hasCopiedRecently
                          ? "copied"
                          : "copy"
                    }
                    className="whitespace-nowrap"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                  >
                    {isBusyCopying
                      ? "Copying..."
                      : hasCopiedRecently
                        ? "Copied!"
                        : "Copy Image"}
                  </motion.span>
                </AnimatePresence>
              </span>
            </button>
          </Tooltip>
        )}

        {/* Master Export Trigger */}
        <ExportDropdownMenu
          withWatermark={includeLogoWatermark}
          onWatermarkToggle={setIncludeLogoWatermark}
          onPerformCopy={executeImageCopy}
          isCopyBusy={isBusyCopying}
        />
      </div>
    </header>
  );
}
