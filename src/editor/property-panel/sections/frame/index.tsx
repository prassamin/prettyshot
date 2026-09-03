/**
 * Frame tool — the frame picker embedded in the property panel.
 */

"use client";

import * as React from "react";

import { isBrowserFrame } from "@/editor/frames/catalog";
import { useEditorStateField } from "@/editor/lib/engine";

import { OrientationToggle, ColorSwatchRow } from "./controls";
import {
  ALL_CATEGORY_ID,
  FALLBACK_OPTIONS,
  isCompactFrameCategory,
  resolveFrameColor,
} from "./options";
import { DeviceTile } from "./tile";
import { FrameCategoryTabs } from "./tabs";
import type { FrameOption, ImageFit } from "./types";
import type { DeviceFrame } from "@/editor/frames/types";
import {
  lookupDynamicDeviceFrameModel,
  normalizeDeviceId,
  useFramesCatalog,
} from "@/editor/frames/dynamic-catalog";

export function FramePickerInline({
  value,
  onChange,
  previewImage,
  imageFit = "cover",
}: {
  value: DeviceFrame;
  onChange: (deviceFrame: DeviceFrame) => void;
  previewImage?: string | null;
  imageFit?: ImageFit;
}) {
  const { categories, allOptions } = useFramesCatalog();
  const screenshot = useEditorStateField((c) => c.screenshot);
  const preview = previewImage ?? screenshot;

  const current =
    allOptions.find(
      (o) =>
        o.id === value.id ||
        normalizeDeviceId(o.id) === normalizeDeviceId(value.id),
    ) ??
    allOptions[0] ??
    FALLBACK_OPTIONS[0];
  const currentDevice = lookupDynamicDeviceFrameModel(current.id);
  const effectiveOrientation =
    isBrowserFrame(current.id) || !current.supportsOrientation
      ? "horizontal"
      : value.orientation;
  const [activeCategoryId, setActiveCategoryId] =
    React.useState(ALL_CATEGORY_ID);

  const currentColor = resolveFrameColor(
    current,
    currentDevice,
    value.variantId,
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
      onChange({
        id: option.id,
        variantId: resolveFrameColor(option, device, value.variantId),
        orientation: nextOrientation,
      });
    },
    [onChange, value.variantId],
  );

  const changeColor = (variantId: string) =>
    onChange({ id: current.id, variantId, orientation: effectiveOrientation });
  const changeOrientation = (orientation: "vertical" | "horizontal") =>
    onChange({ id: current.id, variantId: currentColor, orientation });

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Tabs strip */}
      <div className="relative z-10 shrink-0 bg-transparent px-3 py-2.5">
        <FrameCategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          onChange={setActiveCategoryId}
        />
      </div>

      {/* Gallery */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {activeCategoryId === ALL_CATEGORY_ID ? (
          <div className="mb-3 grid grid-cols-2 gap-2">
            <DeviceTile
              option={FALLBACK_OPTIONS[0]}
              selectedColor={currentColor}
              active={value.id === "none"}
              screenshot={preview}
              imageFit={imageFit}
              compact
              onSelect={selectFrame}
            />
          </div>
        ) : null}
        {visibleCategories.map((category) => (
          <div key={category.id} className="mb-4 last:mb-0">
            {activeCategoryId === ALL_CATEGORY_ID ? (
              <div className="mb-2 flex items-center gap-1.5 px-0.5">
                {category.iconUrl ? (
                  <img
                    src={category.iconUrl}
                    alt=""
                    className="size-3.5 object-contain"
                  />
                ) : (
                  <category.icon className="size-3.5 text-muted-foreground/80" />
                )}
                <span className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground/80 uppercase">
                  {category.label}
                </span>
              </div>
            ) : null}
            <div className="grid grid-cols-2 justify-items-center gap-2.5">
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
                    value.id === option.id ||
                    normalizeDeviceId(value.id) ===
                      normalizeDeviceId(option.id)
                  }
                  screenshot={preview}
                  imageFit={imageFit}
                  compact={isCompactFrameCategory(category)}
                  onSelect={selectFrame}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Dock — pinned variant + orientation controls */}
      {current.variantIds.length > 0 || current.supportsOrientation ? (
        <div className="relative z-10 shrink-0 border-t border-border bg-background/50 px-3 py-3 shadow-[0_-2px_10px_color-mix(in_oklab,var(--overlay)_3%,transparent)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {current.variantIds.length > 0 ? (
              <div className="min-w-37.5 flex-1">
                <div className="mb-1.5 px-0.5 text-[9px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  Color
                </div>
                <ColorSwatchRow
                  variantIds={current.variantIds}
                  colorMap={current.colorMap}
                  selected={currentColor}
                  onChange={changeColor}
                />
              </div>
            ) : null}
            {current.supportsOrientation ? (
              <div className="shrink-0">
                <div className="mb-1.5 px-0.5 text-[9px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  Orientation
                </div>
                <OrientationToggle
                  value={effectiveOrientation}
                  onChange={changeOrientation}
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
