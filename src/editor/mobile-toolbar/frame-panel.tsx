"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Smartphone } from "lucide-react";

import {
  ALL_CATEGORY_ID,
  FALLBACK_OPTIONS,
  isCompactFrameCategory,
  resolveFrameColor,
} from "../property-panel/sections/frame/options";
import { DeviceTile } from "../property-panel/sections/frame/tile";
import {
  ColorSwatchRow,
  OrientationToggle,
} from "../property-panel/sections/frame/controls";
import type { FrameOption } from "../property-panel/sections/frame/types";
import type { DeviceFrame } from "@/editor/frames/types";
import { isBrowserFrame } from "@/editor/frames/catalog";
import {
  lookupDynamicDeviceFrameModel,
  normalizeDeviceId,
  useFramesCatalog,
} from "@/editor/frames/dynamic-catalog";
import { useEditor, useEditorEngine } from "@/editor/lib/engine";
import { cn } from "@/lib/utils";

export function MobileFramePanel() {
  const { categories, allOptions } = useFramesCatalog();
  const { deviceFrame, setDeviceFrame, screenshot, slots } = useEditor();
  const selectedSlotId = useEditorEngine((s) => s.selectedSlotId);
  const updateSlot = useEditorEngine((s) => s.updateSlot);

  const selectedSlot = selectedSlotId
    ? slots.find((s) => s.id === selectedSlotId)
    : null;

  const currentFrame = selectedSlot
    ? (selectedSlot.deviceFrame ?? deviceFrame)
    : deviceFrame;

  const handleFrameChange = React.useCallback(
    (frame: DeviceFrame) => {
      if (selectedSlot) {
        updateSlot(selectedSlot.id, { deviceFrame: frame });
      } else {
        setDeviceFrame(frame);
      }
    },
    [selectedSlot, setDeviceFrame, updateSlot],
  );

  const [activeCategoryId, setActiveCategoryId] =
    React.useState(ALL_CATEGORY_ID);

  const currentOption =
    allOptions.find(
      (o) =>
        o.id === currentFrame.id ||
        normalizeDeviceId(o.id) === normalizeDeviceId(currentFrame.id),
    ) ??
    allOptions[0] ??
    FALLBACK_OPTIONS[0];
  const currentDevice = lookupDynamicDeviceFrameModel(currentOption.id);
  const effectiveOrientation =
    isBrowserFrame(currentOption.id) || !currentOption.supportsOrientation
      ? "horizontal"
      : currentFrame.orientation;

  const currentColor = resolveFrameColor(
    currentOption,
    currentDevice,
    currentFrame.variantId,
  );

  const selectedCategory = categories.find((s) => s.id === activeCategoryId);
  const visibleCategories =
    activeCategoryId === ALL_CATEGORY_ID
      ? categories
      : selectedCategory
        ? [selectedCategory]
        : [];

  const selectFrame = React.useCallback(
    (option: FrameOption) => {
      const device = lookupDynamicDeviceFrameModel(option.id);
      const nextOrientation =
        isBrowserFrame(option.id) || !option.supportsOrientation
          ? "horizontal"
          : "vertical";
      handleFrameChange({
        id: option.id,
        variantId: resolveFrameColor(option, device, currentFrame.variantId),
        orientation: nextOrientation,
      });
    },
    [currentFrame.variantId, handleFrameChange],
  );

  const changeColor = (variantId: string) =>
    handleFrameChange({
      id: currentOption.id,
      variantId,
      orientation: effectiveOrientation,
    });

  const changeOrientation = (orientation: "vertical" | "horizontal") =>
    handleFrameChange({
      id: currentOption.id,
      variantId: currentColor,
      orientation,
    });

  const hasColors = currentOption.variantIds.length > 0;
  const hasOrientation = Boolean(currentOption.supportsOrientation);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden select-none text-foreground">
      {/* Pinned Top Header — Category Chips & Active Device Controls (NEVER SCROLLS AWAY) */}
      <div className="shrink-0 flex flex-col gap-2 bg-surface-secondary pb-2.5 pt-0.5 border-b border-border/40">
        {/* Category Chips Rail */}
        <div className="flex w-full items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 select-none">
          <button
            type="button"
            onClick={() => setActiveCategoryId(ALL_CATEGORY_ID)}
            className={cn(
              "flex h-7.5 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[11px] font-medium transition-all active:scale-95 shadow-xs",
              activeCategoryId === ALL_CATEGORY_ID
                ? "bg-primary text-primary-foreground font-semibold"
                : "border border-border/80 bg-surface-tertiary/70 text-muted-foreground hover:bg-surface-secondary hover:text-foreground",
            )}
          >
            <Smartphone
              className={cn(
                "size-3.5",
                activeCategoryId === ALL_CATEGORY_ID
                  ? "text-primary-foreground"
                  : "text-muted-foreground",
              )}
            />
            <span>All</span>
          </button>
          {categories.map((category) => {
            const isSelected = activeCategoryId === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={cn(
                  "flex h-7.5 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[11px] font-medium transition-all active:scale-95 shadow-xs",
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "border border-border/80 bg-surface-tertiary/70 text-muted-foreground hover:bg-surface-secondary hover:text-foreground",
                )}
              >
                {category.iconUrl ? (
                  <img
                    src={category.iconUrl}
                    alt=""
                    className="size-3.5 object-contain"
                  />
                ) : (
                  <category.icon
                    className={cn(
                      "size-3.5",
                      isSelected
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  />
                )}
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Controls Bar (Device Finish & Orientation) */}
        <AnimatePresence initial={false}>
          {(hasColors || hasOrientation) && currentFrame.id !== "none" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-tertiary/90 p-2 shadow-xs backdrop-blur-xs">
                {hasColors && (
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase px-0.5">
                      Device Finish
                    </span>
                    <ColorSwatchRow
                      variantIds={currentOption.variantIds}
                      colorMap={currentOption.colorMap}
                      selected={currentColor}
                      onChange={changeColor}
                    />
                  </div>
                )}

                {hasOrientation && (
                  <div className="flex flex-col gap-1 shrink-0 items-end">
                    <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase px-0.5">
                      Orientation
                    </span>
                    <OrientationToggle
                      value={effectiveOrientation}
                      onChange={changeOrientation}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dedicated Scrollable Frame Gallery (ONLY THIS AREA SCROLLS) */}
      <div className="min-h-0 flex-1 overflow-y-auto pt-2.5 pb-6 px-0.5">
        {activeCategoryId === ALL_CATEGORY_ID && (
          <div className="mb-3 grid grid-cols-2 md:grid-cols-3 gap-2.5">
            <DeviceTile
              option={FALLBACK_OPTIONS[0]}
              selectedColor={currentColor}
              active={currentFrame.id === "none"}
              screenshot={screenshot}
              imageFit="cover"
              compact
              onSelect={selectFrame}
            />
          </div>
        )}

        {visibleCategories.map((category) => (
          <div key={category.id} className="mb-4 last:mb-0">
            {activeCategoryId === ALL_CATEGORY_ID && (
              <div className="mb-2 flex items-center gap-1.5 px-0.5">
                {category.iconUrl ? (
                  <img
                    src={category.iconUrl}
                    alt=""
                    className="size-3.5 object-contain"
                  />
                ) : (
                  <category.icon className="size-3 text-muted-foreground/80" />
                )}
                <span className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase">
                  {category.label}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 justify-items-center gap-2.5">
              {[
                ...(activeCategoryId === ALL_CATEGORY_ID
                  ? []
                  : [FALLBACK_OPTIONS[0]]),
                ...category.options,
              ].map((option) => (
                <DeviceTile
                  key={option.id}
                  option={option}
                  selectedColor={currentColor}
                  active={
                    currentFrame.id === option.id ||
                    normalizeDeviceId(currentFrame.id) ===
                      normalizeDeviceId(option.id)
                  }
                  screenshot={screenshot}
                  imageFit="cover"
                  compact={isCompactFrameCategory(category)}
                  onSelect={selectFrame}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
