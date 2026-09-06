"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Redo2, Undo2 } from "lucide-react";
import { toast } from "@heroui/react";

import { findAspectOption } from "@/editor/aspect/presets";
import { Drawer } from "@heroui/react";
import {
  useSelectedScreenshotTile,
  useEditor,
  useEditorEngine,
} from "@/editor/lib/engine";
import type { AspectState } from "@/editor/lib/engine";
import { useConfirm } from "@/components/confirm-provider";
import { readImageFileAsDataUrl } from "@/editor/lib/image-resize";
import { cn } from "@/lib/utils";
import { MAX_FILE_SIZE } from "@/config";

import { MobileAnnotationBar } from "./annotation-bar";
import {
  ALL_CATEGORIES,
  DESIGN_CATEGORIES,
  TOOLS_CATEGORIES,
  type CategoryId,
} from "./categories";
import { InlineOptions } from "./inline-options";

export function MobileToolbar() {
  const [active, setActive] = React.useState<CategoryId | null>(null);
  const assetInputRef = React.useRef<HTMLInputElement>(null);
  const instanceId = React.useId();

  const { confirm } = useConfirm();
  const reset = useEditorEngine((s) => s.reset);
  const undo = useEditorEngine((s) => s.undo);
  const redo = useEditorEngine((s) => s.redo);
  const canUndo = useEditorEngine((s) => s.past.length > 0);
  const canRedo = useEditorEngine((s) => s.future.length > 0);

  const {
    aspect: globalAspect,
    activeTool,
    addText,
    addAsset,
    addSlot,
    setActiveTool,
    setSelectedTextId,
    setSelectedAssetId,
    setSelectedAnnotationShapeId,
    setIsScreenshotSelected,
    setSelectedSlotId,
    setAspect,
    setAnnotation,
    deviceFrame,
  } = useEditor();

  const selectedSlot = useSelectedScreenshotTile();

  const isAnnotateMode = activeTool === "draw";

  const frameId = deviceFrame.id;
  const hasDeviceFrame = frameId !== "none";
  const showBorder = !hasDeviceFrame;

  const filteredToolsCategories = TOOLS_CATEGORIES.filter((c) => {
    if (c.id === "border") return showBorder;
    return true;
  });

  const inlineActive = active;

  const close = React.useCallback(() => {
    setActive(null);
  }, []);

  const handleAspectChange = React.useCallback(
    (id: string, custom?: { w: number; h: number }) => {
      let nextAspect: AspectState;
      if (custom) {
        nextAspect = { id: "custom", w: custom.w, h: custom.h };
      } else {
        const aspectOption = findAspectOption(id);
        nextAspect = {
          id,
          w: aspectOption?.w ?? (id === "auto" ? 0 : 16),
          h: aspectOption?.h ?? (id === "auto" ? 0 : 9),
        };
      }
      setAspect(nextAspect);
    },
    [deviceFrame, selectedSlot, setAspect],
  );

  const resetSelection = React.useCallback(() => {
    setSelectedTextId(null);
    setSelectedAssetId(null);
    setSelectedAnnotationShapeId(null);
    setIsScreenshotSelected(false);
    setSelectedSlotId(null);
  }, [
    setSelectedTextId,
    setSelectedAssetId,
    setSelectedAnnotationShapeId,
    setIsScreenshotSelected,
    setSelectedSlotId,
  ]);

  const addImageAsset = React.useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.danger("File must be an image");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.danger("Image size must be less than 10MB");
        return;
      }
      try {
        const src = await readImageFileAsDataUrl(file, {
          downscaleAbove: MAX_FILE_SIZE,
          maxDimension: 1600,
        });
        const id = addAsset(src);
        resetSelection();
        setSelectedAssetId(id);
        setActiveTool("pointer");
      } catch {
        toast.danger("Failed to load image asset");
      }
    },
    [addAsset, resetSelection, setActiveTool, setSelectedAssetId],
  );

  const handleCategoryClick = (cat: CategoryId) => {
    if (cat === "pointer") {
      setActiveTool("pointer");
      resetSelection();
      setActive(null);
      return;
    }

    if (cat === "extra_shot") {
      addSlot();
      return;
    }

    if (cat === "asset") {
      assetInputRef.current?.click();
      return;
    }

    if (cat === "text") {
      const id = addText();
      resetSelection();
      setSelectedTextId(id);
      setActiveTool("pointer");
      setActive(null);
      return;
    }

    if (cat === "reset") {
      void confirm({
        title: "Reset Canvas?",
        description:
          "This will reset all canvas styles, background, device frame, and element placements back to default settings.",
        isDanger: true,
        confirmLabel: "Reset",
        cancelLabel: "Cancel",
        onConfirm() {
          reset();
          toast.success("Canvas reset to defaults");
        },
      });
      return;
    }

    if (cat === "annotate") {
      setAnnotation({ mode: "pen" });
      setActiveTool("draw");
      setActive(null);
      return;
    }

    if (active === cat) {
      setActive(null);
    } else {
      setActive(cat);
    }
  };

  return (
    <>
      {/* Hidden file input for adding image assets */}
      <input
        ref={assetInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = event.target.files;
          if (files) {
            for (const file of Array.from(files)) {
              void addImageAsset(file);
            }
          }
          event.target.value = "";
        }}
      />

      {/* HeroUI Bottom Drawer */}
      <Drawer
        isOpen={Boolean(inlineActive)}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <Drawer.Backdrop variant="transparent">
          <Drawer.Content
            placement="bottom"
            className={cn(
              "h-auto max-h-[60dvh]",
              inlineActive === "background" && "h-[50dvh]",
              inlineActive === "lighting" && "h-auto max-h-[62dvh]",
              (inlineActive === "overlay" ||
                inlineActive === "border" ||
                inlineActive === "shadow" ||
                inlineActive === "transform") &&
                "h-auto max-h-[58dvh]",
              inlineActive === "adjust" && "h-[54dvh]",
              inlineActive === "frame" && "h-[58dvh] max-h-[68dvh]",
            )}
          >
            <Drawer.Dialog
              className={cn(
                "flex h-auto max-h-[60dvh] flex-col overflow-hidden text-foreground rounded-t-2xl border-t border-border bg-surface-secondary shadow-2xl p-0 focus-visible:outline-none select-none px-3.5 py-2.5",
                inlineActive === "background" && "h-[50dvh]",
                inlineActive === "lighting" && "h-auto max-h-[62dvh]",
                (inlineActive === "overlay" ||
                  inlineActive === "border" ||
                  inlineActive === "shadow" ||
                  inlineActive === "transform") &&
                  "h-auto max-h-[58dvh]",
                inlineActive === "adjust" && "h-[54dvh]",
                inlineActive === "frame" && "h-[58dvh] max-h-[68dvh]",
              )}
            >
              {/* Clean Drag Pill */}
              <div className="flex w-full items-center justify-center pt-2 pb-0.5 cursor-pointer">
                <div className="h-1 w-8 rounded-full bg-muted-foreground/25" />
              </div>

              {/* Drawer Title Bar */}
              <div className="flex h-8 shrink-0 items-center justify-between border-b border-border/70 px-3.5">
                <span className="text-[12px] font-semibold text-foreground capitalize tracking-tight">
                  {ALL_CATEGORIES.find((c) => c.id === active)?.label ?? active}
                </span>
              </div>
              <Drawer.Body
                className={cn(
                  "min-h-0 flex-1 p-0 pb-[max(env(safe-area-inset-bottom),0.35rem)]",
                  inlineActive === "frame"
                    ? "overflow-hidden flex flex-col"
                    : "overflow-y-auto",
                  "has-data-[overflow='hidden']:overflow-hidden",
                )}
              >
                {inlineActive && (
                  <InlineOptions
                    id={inlineActive}
                    aspect={globalAspect}
                    onAspectChange={handleAspectChange}
                    onClose={close}
                  />
                )}
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>

      {/* Full-width anchored bottom bar with generous height and a smooth gradient blend */}
      <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-45 flex w-full flex-col bg-linear-to-t from-surface-secondary/95 via-background/98 via-60% to-transparent pt-6 pb-[max(env(safe-area-inset-bottom),0.75rem)] select-none">
        {/* Transparent Top Control Strip */}
        <div className="mb-0.5 flex h-7 w-full items-center justify-end px-3">
          {/* Quick Undo / Redo Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Undo"
              disabled={!canUndo}
              onClick={undo}
              className={cn(
                "flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground",
                !canUndo &&
                  "cursor-not-allowed opacity-25 hover:text-muted-foreground",
              )}
            >
              <Undo2 className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Redo"
              disabled={!canRedo}
              onClick={redo}
              className={cn(
                "flex size-7 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground",
                !canRedo &&
                  "cursor-not-allowed opacity-25 hover:text-muted-foreground",
              )}
            >
              <Redo2 className="size-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Tool Rail: switches between Annotation Toolbar & Main Studio Toolbar */}
        <AnimatePresence mode="wait" initial={false}>
          {isAnnotateMode ? (
            <motion.div
              key="mobile-annotation-rail"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              <MobileAnnotationBar onExit={() => setActiveTool("pointer")} />
            </motion.div>
          ) : (
            <motion.div
              key="mobile-studio-rail"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              className="flex h-16 w-full items-center gap-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {/* Design & Creation Tools */}
              {DESIGN_CATEGORIES.map((c) => {
                const Icon = c.icon;
                const isSelected = active === c.id;

                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleCategoryClick(c.id)}
                    className="group relative flex h-14 min-w-15 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 text-left outline-none transition-transform active:scale-95"
                  >
                    {/* Clean Floating Active Pill */}
                    {isSelected && (
                      <motion.div
                        layoutId={`mobile-category-pill-${instanceId}`}
                        className="absolute inset-0 rounded-xl border border-border bg-surface-secondary shadow-xs"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 32,
                          mass: 0.7,
                        }}
                      />
                    )}

                    <Icon
                      className={cn(
                        "relative z-10 size-5 shrink-0 transition-colors duration-150",
                        isSelected
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "relative z-10 truncate text-[11px] transition-colors duration-150",
                        isSelected
                          ? "font-semibold text-foreground tracking-tight"
                          : "font-medium text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {c.label}
                    </span>
                  </button>
                );
              })}

              {/* Visual Vertical Divider */}
              <div className="mx-1 flex h-8 items-center">
                <span className="h-5 w-px shrink-0 bg-border/80" />
              </div>

              {/* Style & Property Tools */}
              {filteredToolsCategories.map((c) => {
                const Icon = c.icon;
                const isSelected = active === c.id;

                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleCategoryClick(c.id)}
                    className="group relative flex h-14 min-w-15 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 text-left outline-none transition-transform active:scale-95"
                  >
                    {/* Clean Floating Active Pill */}
                    {isSelected && (
                      <motion.div
                        layoutId={`mobile-category-pill-${instanceId}`}
                        className="absolute inset-0 rounded-xl border border-border bg-surface-secondary shadow-xs"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 32,
                          mass: 0.7,
                        }}
                      />
                    )}

                    <Icon
                      className={cn(
                        "relative z-10 size-5 shrink-0 transition-colors duration-150",
                        isSelected
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "relative z-10 truncate text-[11px] transition-colors duration-150",
                        isSelected
                          ? "font-semibold text-foreground tracking-tight"
                          : "font-medium text-muted-foreground group-hover:text-foreground",
                      )}
                    >
                      {c.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
