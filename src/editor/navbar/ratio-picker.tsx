"use client";

import * as React from "react";
import {
  ArrowLeftRight,
  Crop,
  Maximize2,
  Ratio,
  ChevronDown,
} from "lucide-react";

import { Popover } from "@heroui/react";
import { cn } from "@/lib/utils";

import { ASPECT_CATEGORIES, ALL_OPTIONS } from "@/editor/aspect/presets";
import { type AspectOption } from "@/editor/aspect/types";
import { FeatureLock } from "../components/feature-lock";

export function RatioGallery({
  selectedId,
  onSelection,
  closePopover,
}: {
  selectedId?: string;
  onSelection: (id: string, customDims?: { w: number; h: number }) => void;
  closePopover: () => void;
}) {
  const [widthVal, setWidthVal] = React.useState("1920");
  const [heightVal, setHeightVal] = React.useState("1080");
  const [currentTab, setCurrentTab] = React.useState<string>("basic");

  const category =
    ASPECT_CATEGORIES.find((s) => s.id === currentTab) ?? ASPECT_CATEGORIES[0];

  const parsedW = Number(widthVal);
  const parsedH = Number(heightVal);
  const isValidCustom =
    Number.isFinite(parsedW) &&
    Number.isFinite(parsedH) &&
    parsedW > 0 &&
    parsedH > 0;

  const handleCustomApply = () => {
    if (!isValidCustom) return;
    onSelection("custom", { w: parsedW, h: parsedH });
    closePopover();
  };

  const handleSwapValues = () => {
    setWidthVal(heightVal);
    setHeightVal(widthVal);
  };

  return (
    <div className="flex h-full w-full flex-col bg-surface-secondary text-foreground">
      {/* Category Tabs Header */}
      <div className="flex shrink-0 items-center overflow-x-auto border-b border-border/60 bg-surface-secondary px-2 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ASPECT_CATEGORIES.map((cat) => {
          const isActive = currentTab === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCurrentTab(cat.id)}
              className={cn(
                "relative flex h-10 items-center whitespace-nowrap px-3 text-xs font-medium transition-colors select-none",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {cat.label}
              {isActive && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary rounded-t-full shadow-[0_-1px_4px_color-mix(in_oklab,var(--foreground)_40%,transparent)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Options Grid */}
      <div className="flex-1 overflow-y-auto p-3 bg-background">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
          {category.options.map((opt) => (
            <RatioCard
              key={opt.id}
              config={opt}
              isActive={selectedId === opt.id}
              category={category.id}
              onTap={() => {
                onSelection(opt.id);
                closePopover();
              }}
            />
          ))}
        </div>
      </div>

      {/* Custom Size Footer */}
      <div className="shrink-0 border-t border-border/70 bg-surface-secondary px-3 py-3 shadow-[0_-4px_12px_color-mix(in_oklab,var(--overlay)_15%,transparent)]">
        <FeatureLock featureId="aspect.custom">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-tertiary/80 border border-border/50 text-muted-foreground shadow-xs">
              <Ratio className="size-4" />
            </div>

            <div className="flex flex-1 items-center rounded-xl border border-border/80 bg-surface-tertiary/80 px-2.5 py-1 focus-within:border-primary/60 transition-colors">
              <span className="font-mono text-[10px] font-bold text-muted-foreground mr-1.5">
                W
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={widthVal}
                onChange={(e) =>
                  setWidthVal(e.target.value.replace(/[^\d]/g, ""))
                }
                onKeyDown={(e) => e.key === "Enter" && handleCustomApply()}
                className="w-full bg-transparent font-mono text-[12px] text-foreground outline-none"
              />
              <span className="font-mono text-[9px] text-muted-foreground/60">
                px
              </span>
            </div>

            <button
              type="button"
              aria-label="Swap dimensions"
              onClick={handleSwapValues}
              className="flex size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border/70 bg-surface-tertiary/60 text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-tertiary active:scale-95"
            >
              <ArrowLeftRight className="size-3.5" />
            </button>

            <div className="flex flex-1 items-center rounded-xl border border-border/80 bg-surface-tertiary/80 px-2.5 py-1 focus-within:border-primary/60 transition-colors">
              <span className="font-mono text-[10px] font-bold text-muted-foreground mr-1.5">
                H
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={heightVal}
                onChange={(e) =>
                  setHeightVal(e.target.value.replace(/[^\d]/g, ""))
                }
                onKeyDown={(e) => e.key === "Enter" && handleCustomApply()}
                className="w-full bg-transparent font-mono text-[12px] text-foreground outline-none"
              />
              <span className="font-mono text-[9px] text-muted-foreground/60">
                px
              </span>
            </div>

            <button
              type="button"
              disabled={!isValidCustom}
              onClick={handleCustomApply}
              className={cn(
                "h-8 shrink-0 cursor-pointer rounded-xl px-3 text-[11.5px] font-semibold transition-all shadow-xs active:scale-95 select-none",
                isValidCustom
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "cursor-not-allowed bg-surface-tertiary text-muted-foreground/40",
              )}
            >
              Apply
            </button>
          </div>
        </FeatureLock>
      </div>
    </div>
  );
}

function RatioCard({
  config,
  isActive,
  category,
  onTap,
}: {
  config: AspectOption;
  isActive: boolean;
  category: string;
  onTap: () => void;
}) {
  const isAutoShape = config.ratio === "—";
  const [widthRatio, heightRatio] = isAutoShape
    ? [1, 1]
    : config.ratio.split(":").map(Number);
  const safeW = Number.isFinite(widthRatio) && widthRatio > 0 ? widthRatio : 1;
  const safeH =
    Number.isFinite(heightRatio) && heightRatio > 0 ? heightRatio : 1;

  const MAX_BOX_SIZE = 28;
  let visualW: number, visualH: number;
  if (isAutoShape) {
    visualW = 22;
    visualH = 22;
  } else if (safeW >= safeH) {
    visualW = MAX_BOX_SIZE;
    visualH = Math.max(14, Math.round((safeH / safeW) * MAX_BOX_SIZE));
  } else {
    visualH = MAX_BOX_SIZE;
    visualW = Math.max(14, Math.round((safeW / safeH) * MAX_BOX_SIZE));
  }

  return (
    <FeatureLock
      featureId={category === "basic" ? "aspect.basic" : "aspect.presets"}
    >
      <button
        type="button"
        onClick={onTap}
        className={cn(
          "flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all duration-150 select-none cursor-pointer",
          isActive
            ? "border-primary/70 bg-primary/10 shadow-xs ring-1 ring-primary/30"
            : "border-border/70 bg-surface-secondary hover:border-border hover:bg-surface-tertiary/70",
        )}
      >
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-tertiary/80 border border-border/60">
          {isAutoShape ? (
            <Maximize2
              className={cn(
                "size-3.5",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            />
          ) : (
            <div
              style={{ width: `${visualW}px`, height: `${visualH}px` }}
              className={cn(
                "rounded-[3px] border transition-colors",
                isActive
                  ? "border-primary bg-primary/30"
                  : "border-muted-foreground/60 bg-muted-foreground/15",
              )}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-1">
            <span
              className={cn(
                "truncate text-xs font-semibold tracking-tight",
                isActive ? "text-primary" : "text-foreground",
              )}
            >
              {config.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
            <span>{config.ratio === "—" ? "Natural" : config.ratio}</span>
            {config.w && config.h ? (
              <>
                <span>•</span>
                <span className="opacity-75">{`${config.w}×${config.h}`}</span>
              </>
            ) : null}
          </div>
        </div>
      </button>
    </FeatureLock>
  );
}

export function RatioSelector({
  currentId,
  onRatioSelect,
  dropdownAlign = "start",
  styleVariant = "default",
  triggerClass,
}: {
  currentId: string;
  onRatioSelect: (id: string, custom?: { w: number; h: number }) => void;
  dropdownAlign?: "start" | "end";
  styleVariant?: "default" | "navbar";
  triggerClass?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const activeOption =
    ALL_OPTIONS.find((o) => o.id === currentId) ?? ALL_OPTIONS[0];
  const isCompact = styleVariant === "navbar";

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <button
          type="button"
          className={cn(
            isCompact
              ? "flex h-8 items-center gap-1.5 rounded-xl border border-border/80 bg-surface-tertiary/60 px-2.5 text-[12px] font-medium text-foreground hover:bg-surface-tertiary transition-colors"
              : "group flex h-10 w-full items-center gap-2 rounded-xl bg-surface-tertiary/60 px-3 text-left transition-colors hover:bg-surface-tertiary",
            isOpen && "ring-1 ring-primary/20",
            triggerClass,
          )}
        >
          <Crop className="size-3.5 text-muted-foreground" />
          <span className="tabular font-medium text-foreground">
            {isCompact
              ? activeOption.ratio === "—"
                ? "Aspect: Auto"
                : `Aspect: ${activeOption.ratio}`
              : activeOption.ratio === "—"
                ? "Auto"
                : activeOption.ratio}
          </span>
          {activeOption.w && !isCompact ? (
            <span className="font-mono text-[11px] text-muted-foreground">
              {`${activeOption.w}×${activeOption.h}`}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground/60 transition-transform duration-200",
              isCompact
                ? isOpen
                  ? "rotate-180"
                  : "rotate-0"
                : isOpen && "rotate-0",
            )}
          />
        </button>
      </Popover.Trigger>

      <Popover.Content
        placement={dropdownAlign === "start" ? "bottom start" : "bottom end"}
        containerPadding={12}
        className="flex h-[min(460px,75dvh)] w-[min(380px,calc(100vw-1rem))] flex-col gap-0 overflow-hidden rounded-2xl border border-border/80 bg-surface-secondary p-0 shadow-2xl backdrop-blur-2xl focus-visible:outline-none"
      >
        <RatioGallery
          selectedId={currentId}
          onSelection={onRatioSelect}
          closePopover={() => setIsOpen(false)}
        />
      </Popover.Content>
    </Popover>
  );
}
