/**
 * Frame picker — gallery tile.
 */

import * as React from "react";
import { Check } from "lucide-react";

import { deviceFrameGeometry } from "@/editor/lib/canvas-helpers";
import { cn } from "@/lib/utils";

import { FALLBACK_OPTIONS, resolveFrameColor } from "./options";
import {
  BrowserTilePreview,
  DeviceGlyph,
  DeviceTilePreview,
  useLazyVisible,
} from "./previews";
import {
  lookupDynamicDeviceFrameModel,
  lookupDynamicDeviceFrameVariant,
} from "@/editor/frames/dynamic-catalog";
import type { DeviceOrientation } from "@/editor/frames/types";
import type { FrameOption, ImageFit } from "./types";
import { FeatureLock } from "@/editor/components/feature-lock";
import { useAppStore } from "@/stores/app-store";
import { isPro } from "@/lib/utils";

export const DeviceTile = React.memo(function DeviceTile({
  option,
  selectedColor,
  active,
  screenshot,
  imageFit,
  compact = false,
  onSelect,
}: {
  option: FrameOption;
  selectedColor: string;
  active: boolean;
  screenshot?: string | null;
  imageFit?: ImageFit;
  compact?: boolean;
  onSelect: (option: FrameOption) => void;
}) {
  const { user } = useAppStore();
  const { ref, visible } = useLazyVisible();
  const device = option.isDevice
    ? lookupDynamicDeviceFrameModel(option.id)
    : undefined;
  const tileColor = resolveFrameColor(option, device, selectedColor);
  const targetTileOrientation: DeviceOrientation =
    option.supportsOrientation === false ? "landscape" : "portrait";
  const asset = option.isDevice
    ? lookupDynamicDeviceFrameVariant(
        option.id,
        tileColor,
        targetTileOrientation,
      )
    : null;
  const spec = option.isDevice
    ? deviceFrameGeometry(
        option.id,
        option.supportsOrientation === false ? "horizontal" : "vertical",
      )
    : null;
  const chromeSrc = asset?.src ?? option.previewSrc;
  const thumbSrc = asset?.thumbUrl ?? asset?.src ?? option.previewSrc;
  const effectiveFit = imageFit ?? "cover";

  return (
    <FeatureLock
      isLocked={
        option.isDevice && !isPro(user).isActive
          ? option.isFree === false
          : undefined
      }
      featureId={
        !option.isDevice && option.id !== FALLBACK_OPTIONS[0].id
          ? "frames.hardcoded"
          : undefined
      }
    >
      <button
        ref={ref}
        onClick={() => onSelect(option)}
        aria-pressed={active}
        className={cn(
          "group relative flex w-full flex-col items-center rounded-xl border p-1.5 transition-all duration-200 ease-out cursor-pointer select-none",
          active
            ? "border-primary/80 bg-primary/12 ring-1.5 ring-primary shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_28%,transparent)] scale-[1.01]"
            : "border-border/50 bg-foreground/2 hover:border-foreground/30 hover:bg-foreground/6 hover:scale-[1.02] hover:shadow-md",
        )}
      >
        {active ? (
          <span className="pointer-events-none absolute top-1.5 right-1.5 z-20 grid size-4.5 place-items-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background">
            <Check className="size-3 stroke-[2.5]" />
          </span>
        ) : null}
        <div
          className={cn(
            "relative flex w-full items-center justify-center overflow-hidden rounded-lg bg-transparent p-1",
            compact ? "h-24" : "h-28",
          )}
        >
          {!visible ? (
            <div className="h-full w-full animate-pulse rounded-md bg-muted/20" />
          ) : option.kind === "browser" ? (
            <BrowserTilePreview
              frameId={option.id}
              color={tileColor}
              screenshot={screenshot ?? null}
              imageFit={effectiveFit}
            />
          ) : screenshot && spec && chromeSrc ? (
            <DeviceTilePreview
              spec={spec}
              preview={chromeSrc}
              rotatePreview={false}
              screenshot={screenshot}
              imageFit={effectiveFit}
            />
          ) : thumbSrc ? (
            <img
              src={thumbSrc}
              alt={option.name}
              className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <DeviceGlyph kind={option.kind} active={active} />
          )}
        </div>
        <span
          className={cn(
            "mt-1.5 line-clamp-1 w-full text-center text-[11px] font-medium tracking-tight",
            active
              ? "font-semibold text-foreground"
              : "text-foreground/80 group-hover:text-foreground",
          )}
        >
          {option.name}
        </span>
      </button>
    </FeatureLock>
  );
});
