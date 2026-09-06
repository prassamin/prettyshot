"use client";

import * as React from "react";
import { Check, Ban } from "lucide-react";

import { ProgressiveImage } from "@/components/progressive-image";
import { cn } from "@/lib/utils";
import { getOverlays, type Overlay } from "@/app/actions/overlays";
import { registerOverlayUrls } from "./utils";

import type { GalleryLayoutMode } from "./types";
import { FeatureLock } from "@/editor/components/feature-lock";

type VisibilityObserverCallback = () => void;

const loadedTextureIds = new Set<number>();
let cachedOverlayItems: Overlay[] | null = null;

interface OverlayGridProps {
  selectedId: number | null;
  onSelect: (overlay: Overlay | null) => void;
  layout?: GalleryLayoutMode;
}

export const OverlayGrid = React.memo(function OverlayGrid({
  selectedId,
  onSelect,
  layout = "grid",
}: OverlayGridProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const elementCallbacks = React.useRef<
    Map<Element, VisibilityObserverCallback>
  >(new Map());
  const [viewportObserver, setViewportObserver] =
    React.useState<IntersectionObserver | null>(null);

  const [overlayItems, setOverlayItems] = React.useState<Overlay[]>(
    () => cachedOverlayItems || [],
  );
  const [isLoading, setIsLoading] = React.useState(() => !cachedOverlayItems);

  // Fetch overlays with 0ms client-side cache fallback
  React.useEffect(() => {
    if (cachedOverlayItems) {
      registerOverlayUrls(cachedOverlayItems);
      setOverlayItems(cachedOverlayItems);
      setIsLoading(false);
      return;
    }
    getOverlays()
      .then((items) => {
        cachedOverlayItems = items;
        registerOverlayUrls(items);
        setOverlayItems(items);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Viewport IntersectionObserver setup
  React.useEffect(() => {
    const observerInstance = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const callback = elementCallbacks.current.get(entry.target);
          if (callback) {
            callback();
            elementCallbacks.current.delete(entry.target);
            observerInstance.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "200px" },
    );

    setViewportObserver(observerInstance);
    const callbacksMap = elementCallbacks.current;

    return () => {
      observerInstance.disconnect();
      callbacksMap.clear();
    };
  }, []);

  const observeElement = React.useCallback(
    (targetEl: Element, callback: VisibilityObserverCallback) => {
      if (!viewportObserver) return;
      elementCallbacks.current.set(targetEl, callback);
      viewportObserver.observe(targetEl);
    },
    [viewportObserver],
  );

  const unobserveElement = React.useCallback(
    (targetEl: Element) => {
      elementCallbacks.current.delete(targetEl);
      viewportObserver?.unobserve(targetEl);
    },
    [viewportObserver],
  );

  const onSelectRef = React.useRef(onSelect);
  React.useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const handleSelection = React.useCallback((overlay: Overlay | null) => {
    onSelectRef.current(overlay);
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className={cn(
        layout === "carousel"
          ? "flex items-center gap-2.5 overflow-x-auto py-2.5 px-2 -my-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "grid grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1 px-0.5 py-0.5 custom-scrollbar contain-[layout_paint]",
      )}
    >
      {/* None / Clear Selection Tile */}
      {!isLoading && (
        <button
          key="none"
          type="button"
          onClick={() => handleSelection(null)}
          title="No shadow overlay"
          className={cn(
            "group relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border bg-card transition-all select-none",
            layout === "carousel" && "size-15 shrink-0",
            selectedId === null
              ? "border-primary bg-primary/8 ring-2 ring-primary/40 ring-offset-1 ring-offset-background shadow-xs scale-105 text-primary font-semibold"
              : "border-border/60 text-muted-foreground/75 hover:border-foreground/40 hover:text-foreground hover:scale-105",
          )}
        >
          <Ban className="size-4 opacity-70 transition-transform group-hover:scale-110" />
          <span className="text-[9.5px] font-medium tracking-tight">None</span>
          {selectedId === null && (
            <span className="pointer-events-none absolute top-1 right-1 z-10 grid size-3.5 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xs">
              <Check className="size-2 stroke-3" />
            </span>
          )}
        </button>
      )}

      {/* Shadow Texture Asset Tiles */}
      {isLoading
        ? Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={`texture-skeleton-${idx}`}
              className={cn(
                "overflow-hidden image-shimmer",
                layout === "carousel"
                  ? "size-15 shrink-0 rounded-xl"
                  : "aspect-square rounded-lg",
              )}
            />
          ))
        : overlayItems.map((item) => (
            <FeatureLock
              key={item.id}
              featureId="backdrop.shadow"
              overlay="badge"
              size="sm"
              blur={false}
              icon={false}
            >
              <OverlayGridItem
                key={item.id}
                overlay={item}
                observe={observeElement}
                unobserve={unobserveElement}
                isSelected={selectedId === item.id}
                onSelect={handleSelection}
                layout={layout}
              />
            </FeatureLock>
          ))}
    </div>
  );
});

interface OverlayGridItemProps {
  overlay: Overlay;
  observe: (el: Element, cb: VisibilityObserverCallback) => void;
  unobserve: (el: Element) => void;
  isSelected: boolean;
  onSelect: (overlay: Overlay) => void;
  layout?: GalleryLayoutMode;
}

const OverlayGridItem = React.memo(function OverlayGridItem({
  overlay,
  observe,
  unobserve,
  isSelected,
  onSelect,
  layout = "grid",
}: OverlayGridItemProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const wasPreviouslyCached = loadedTextureIds.has(overlay.id);
  const [isRendered, setIsRendered] = React.useState(wasPreviouslyCached);

  React.useEffect(() => {
    if (isRendered) return;
    const targetEl = buttonRef.current;
    if (!targetEl) return;
    observe(targetEl, () => {
      loadedTextureIds.add(overlay.id);
      setIsRendered(true);
    });
    return () => unobserve(targetEl);
  }, [observe, unobserve, isRendered, overlay.id]);

  const handleClick = React.useCallback(
    () => onSelect(overlay),
    [onSelect, overlay],
  );

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      title={overlay.name}
      className={cn(
        "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border bg-card transition-all contain-[layout_style_paint]",
        layout === "carousel" && "size-15 shrink-0",
        isSelected
          ? "border-primary ring-2 ring-primary/40 ring-offset-1 ring-offset-background shadow-xs scale-105"
          : "border-border/60 opacity-85 hover:opacity-100 hover:border-foreground/40 hover:scale-105",
      )}
    >
      {isRendered && (
        <ProgressiveImage
          src={overlay.thumbnail}
          alt=""
          className="size-full object-cover"
        />
      )}

      {isSelected && (
        <span className="pointer-events-none absolute top-1 right-1 z-10 grid size-3.5 place-items-center rounded-full bg-primary text-primary-foreground shadow-2xs">
          <Check className="size-2 stroke-3" />
        </span>
      )}
    </button>
  );
});
