/**
 * CropModal — the screenshot crop dialog.
 *
 * Opened from the shot's edit menu (crop action). Provides:
 *
 *   • Zoomable viewport (wheel-free; explicit − / % / + controls) with a
 *     dotted backdrop so the image edges stay visible.
 *   • Aspect presets (Free + ratio chips), defaulting to the canvas aspect.
 *   • Custom aspect-locked edge handles on the selection (see crop-canvas).
 *   • Reset + Apply actions; applying closes the dialog and reports the
 *     cropped PNG + percent region to the caller.
 *
 * The image source is loaded lazily when the dialog opens and released a
 * beat after close (the dialog animates out), so memory is freed without
 * flashing a blank modal during the transition.
 */

"use client";

import * as React from "react";
import { Loader2, Minus, Plus, RotateCcw, X } from "lucide-react";
import type { PercentCrop } from "react-image-crop";
import type { Preset } from "./types";
import { toast } from "@heroui/react";
import { Modal } from "@heroui/react";

import {
  CropApplyButton,
  CropCanvas,
  CropCanvasContent,
  CropResetButton,
} from "./crop-canvas";
import { cn } from "@/lib/utils";
import { createCropSource, renderCroppedImage } from "./crop-source";
import type { CropSource } from "./crop-source";
import { useCropDragAutoscroll } from "@/editor/crop/use-crop-drag-autoscroll";
import type { CropRegion } from "./types";
import { clampNumber } from "@/editor/lib/geometry";
import { Tooltip } from "@/components/tooltip";

const MIN_ZOOM = 1;
const MAX_ZOOM = 16;
const ZOOM_STEP = 1.5;
const VIEWPORT_PADDING = 48;
const FIT_FALLBACK_HEIGHT = 372;
const CLOSE_ANIMATION_MS = 400;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

const PRESETS: Preset[] = [
  { label: "1:1", aspect: 1, w: 14, h: 14 },
  { label: "4:3", aspect: 4 / 3, w: 18, h: 13.5 },
  { label: "3:2", aspect: 3 / 2, w: 18, h: 12 },
  { label: "16:10", aspect: 16 / 10, w: 18, h: 11.25 },
  { label: "16:9", aspect: 16 / 9, w: 18, h: 10.125 },
  { label: "5:4", aspect: 5 / 4, w: 16, h: 12.8 },
  { label: "4:5", aspect: 4 / 5, w: 12.8, h: 16 },
];

export function CropModal({
  open,
  onOpenChange,
  screenshotUrl,
  initialRegion,
  targetAspect,
  onCrop,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screenshotUrl: string | null;
  initialRegion?: CropRegion | null;
  targetAspect?: number | null;
  onCrop: (croppedBase64: string, region: CropRegion) => void;
}) {
  const safeTargetAspect =
    targetAspect && Number.isFinite(targetAspect) && targetAspect > 0
      ? targetAspect
      : null;
  const defaultAspect = safeTargetAspect ?? 16 / 10;

  const [aspectOverride, setAspectOverride] = React.useState<{
    defaultAspect: number;
    aspect: number | null;
  } | null>(null);
  const [loadedSource, setLoadedSource] = React.useState<{
    url: string;
    source: CropSource;
  } | null>(null);

  const aspect =
    aspectOverride?.defaultAspect === defaultAspect
      ? aspectOverride.aspect
      : null;
  const isFree = aspect === null;
  const setAspect = React.useCallback(
    (nextAspect: number | null) => {
      setAspectOverride({ defaultAspect, aspect: nextAspect });
    },
    [defaultAspect],
  );

  const [zoom, setZoom] = React.useState(MIN_ZOOM);

  const sourceRef = React.useRef<CropSource | null>(null);
  const releaseSource = React.useCallback(() => {
    sourceRef.current?.release();
    sourceRef.current = null;
  }, []);

  // Keep the source alive through the close animation, then free it.
  const releaseSourceAfterClose = React.useCallback(() => {
    const source = sourceRef.current;
    sourceRef.current = null;
    if (source) window.setTimeout(() => source.release(), CLOSE_ANIMATION_MS);
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setAspectOverride(null);
        releaseSourceAfterClose();
        setLoadedSource(null);
        setZoom(MIN_ZOOM);
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, releaseSourceAfterClose],
  );

  React.useEffect(() => {
    if (!open || !screenshotUrl) return;

    let cancelled = false;
    const loader = createCropSource(screenshotUrl);

    void loader
      .then((source) => {
        if (cancelled) {
          source.release();
          return;
        }
        releaseSource();
        sourceRef.current = source;
        setLoadedSource({ url: screenshotUrl, source });
      })
      .catch(() => {
        if (cancelled) return;
        toast.danger("Could not load this image");
        handleOpenChange(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, screenshotUrl, releaseSource, handleOpenChange]);

  React.useEffect(() => releaseSource, [releaseSource]);

  const source =
    open && loadedSource?.url === screenshotUrl ? loadedSource.source : null;

  const [viewport, setViewport] = React.useState<{
    width: number;
    height: number;
  } | null>(null);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const dragAutoScroll = useCropDragAutoscroll(viewportRef);

  React.useEffect(() => dragAutoScroll.stop, [dragAutoScroll]);

  const measureViewport = React.useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node;
    if (!node) return;
    const read = () => {
      const width = node.clientWidth;
      const height = node.clientHeight;
      setViewport((current) =>
        current?.width === width && current?.height === height
          ? current
          : { width, height },
      );
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (viewportRef.current === node) viewportRef.current = null;
    };
  }, []);

  const fitSize = React.useMemo(() => {
    if (!source || !viewport) return null;
    const availWidth = viewport.width - VIEWPORT_PADDING;
    const availHeight = viewport.height - VIEWPORT_PADDING;
    if (availWidth <= 0 || availHeight <= 0) return null;
    if (!source.width || !source.height) return null;
    const scale = Math.min(
      availWidth / source.width,
      availHeight / source.height,
    );
    return { width: source.width * scale, height: source.height * scale };
  }, [source, viewport]);

  // Zoom keeps the viewport center anchored (recorded before the size change,
  // restored after layout).
  const scrollAnchor = React.useRef<{ x: number; y: number } | null>(null);
  const zoomTo = (next: number) => {
    const clamped = clampZoom(next);
    if (clamped === zoom) {
      scrollAnchor.current = null;
      return;
    }
    const node = viewportRef.current;
    if (node) {
      scrollAnchor.current = {
        x:
          (node.scrollLeft + node.clientWidth / 2) /
          Math.max(1, node.scrollWidth),
        y:
          (node.scrollTop + node.clientHeight / 2) /
          Math.max(1, node.scrollHeight),
      };
    }
    setZoom(clamped);
  };

  const displaySize = React.useMemo(() => {
    if (!fitSize) return null;
    return { width: fitSize.width * zoom, height: fitSize.height * zoom };
  }, [fitSize, zoom]);

  React.useLayoutEffect(() => {
    const anchor = scrollAnchor.current;
    const node = viewportRef.current;
    if (!anchor || !node) return;
    scrollAnchor.current = null;
    node.scrollLeft = anchor.x * node.scrollWidth - node.clientWidth / 2;
    node.scrollTop = anchor.y * node.scrollHeight - node.clientHeight / 2;
  }, [displaySize]);

  const canZoom = !!fitSize;

  const [showLoader, setShowLoader] = React.useState(false);
  React.useEffect(() => {
    if (!open || source) return;
    const timer = window.setTimeout(() => setShowLoader(true), 180);
    return () => {
      window.clearTimeout(timer);
      setShowLoader(false);
    };
  }, [open, source]);

  const handleApply = React.useCallback(
    (_croppedImage: string, region: PercentCrop) => {
      if (!source) return;
      const x = clampNumber(region.x, 0, 100);
      const y = clampNumber(region.y, 0, 100);
      const width = clampNumber(region.width, 0, 100);
      const height = clampNumber(region.height, 0, 100);
      if (x === null || y === null || width === null || height === null) return;
      const cropRegion: CropRegion = { x, y, width, height };

      handleOpenChange(false);
      void renderCroppedImage(source, cropRegion)
        .then((cropped) => {
          if (cropped) onCrop(cropped, cropRegion);
        })
        .catch(() => {
          toast.danger("Could not apply this crop");
        });
    },
    [source, handleOpenChange, onCrop],
  );

  const initialPercentCrop = React.useMemo<PercentCrop | undefined>(() => {
    if (!initialRegion) return undefined;
    return { unit: "%", ...initialRegion };
  }, [initialRegion]);

  const targetPreset = React.useMemo<Preset>(() => {
    const ratio = defaultAspect;
    const longSide = 18;
    const shortSide = longSide / ratio;
    return ratio >= 1
      ? {
          label: "Canvas",
          aspect: ratio,
          w: longSide,
          h: Math.max(8, Math.min(18, shortSide)),
        }
      : {
          label: "Canvas",
          aspect: ratio,
          w: Math.max(8, Math.min(18, longSide * ratio)),
          h: longSide,
        };
  }, [defaultAspect]);

  const presets = React.useMemo(() => {
    const rest = PRESETS.filter(
      (preset) => Math.abs(preset.aspect - targetPreset.aspect) > 0.01,
    );
    return [targetPreset, ...rest];
  }, [targetPreset]);

  return (
    <Modal isOpen={open} onOpenChange={handleOpenChange}>
      <Modal.Backdrop className="bg-background/80 backdrop-blur-sm">
        <Modal.Container>
          <Modal.Dialog className="flex max-w-200 flex-col gap-0 overflow-hidden rounded-[24px] border border-border/50 bg-background/80 p-0 shadow-2xl ring-1 ring-white/5 backdrop-blur-3xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 bg-foreground/5 px-6 py-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold tracking-tight text-foreground">
                  Crop screenshot
                </span>
                <p className="text-[12px] text-muted-foreground/80">
                  Drag the handles or pick a preset ratio
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-foreground/5 text-muted-foreground transition-all hover:scale-105 hover:bg-white/10 hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body */}
            {!source ? (
              <div
                role="status"
                className="flex h-130 items-center justify-center"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, color-mix(in oklab, var(--foreground) 5%, transparent) 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              >
                {showLoader ? (
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-background/50 px-4 py-2.5 text-[13px] text-muted-foreground shadow-xl backdrop-blur-md">
                    <Loader2 className="size-4 animate-spin" />
                    Preparing image...
                  </span>
                ) : null}
              </div>
            ) : (
              <CropCanvas
                key={aspect ?? "free"}
                src={source.previewUrl}
                aspect={aspect ?? undefined}
                keepSelection
                initialCrop={
                  aspect === null ||
                  Math.abs(aspect - targetPreset.aspect) < 0.01
                    ? initialPercentCrop
                    : undefined
                }
                onCrop={handleApply}
              >
                <div className="relative">
                  {/* Scrollable viewport with the zoom controls overlay. */}
                  <div
                    ref={measureViewport}
                    className="h-130 [scrollbar-gutter:stable] overflow-auto overscroll-contain"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 2px 2px, color-mix(in oklab, var(--foreground) 5%, transparent) 1px, transparent 0)",
                      backgroundSize: "24px 24px",
                    }}
                  >
                    <div className="flex h-max min-h-full w-max min-w-full items-center justify-center p-6">
                      <CropCanvasContent
                        className="rounded-xl shadow-2xl"
                        style={
                          displaySize
                            ? { maxWidth: "none", maxHeight: "none" }
                            : {
                                maxWidth: "100%",
                                maxHeight: FIT_FALLBACK_HEIGHT,
                              }
                        }
                        imageStyle={
                          displaySize
                            ? {
                                width: displaySize.width,
                                height: displaySize.height,
                                maxWidth: "none",
                                maxHeight: "none",
                              }
                            : undefined
                        }
                      />
                    </div>
                  </div>

                  {/* Zoom controls */}
                  {canZoom ? (
                    <div className="pointer-events-auto absolute top-4 right-4 flex items-center gap-1 rounded-full border border-border/50 bg-background/80 p-1 shadow-xl backdrop-blur-xl">
                      <button
                        type="button"
                        onClick={() => zoomTo(zoom / ZOOM_STEP)}
                        disabled={zoom <= MIN_ZOOM}
                        aria-label="Zoom out"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <Tooltip content="Fit to view" noDelay>
                        <button
                          type="button"
                          onClick={() => zoomTo(MIN_ZOOM)}
                          aria-label="Fit to view"
                          className="min-w-12 cursor-pointer rounded-full px-2 py-1 text-[11px] font-medium text-foreground tabular-nums transition-colors hover:bg-white/10"
                        >
                          {Math.round(zoom * 100)}%
                        </button>
                      </Tooltip>
                      <button
                        type="button"
                        onClick={() => zoomTo(zoom * ZOOM_STEP)}
                        disabled={zoom >= MAX_ZOOM}
                        aria-label="Zoom in"
                        className="flex size-7 cursor-pointer items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Floating Footer Dock */}
                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/10 bg-background/70 p-2 shadow-2xl backdrop-blur-2xl">
                  {/* Aspect Ratios */}
                  <div className="flex items-center gap-1">
                    <AspectChip
                      label="Free"
                      active={isFree}
                      dashed
                      w={18}
                      h={18}
                      onClick={() => setAspect(null)}
                    />
                    <div className="mx-1 h-8 w-px bg-white/10" />
                    {presets.map((p) => {
                      const isActive =
                        aspect !== null && Math.abs(aspect - p.aspect) < 0.01;
                      return (
                        <AspectChip
                          key={p.label || p.aspect}
                          label={p.label}
                          active={isActive}
                          w={p.w}
                          h={p.h}
                          onClick={() => setAspect(p.aspect)}
                        />
                      );
                    })}
                  </div>

                  <div className="h-8 w-px bg-white/10" />

                  {/* Actions */}
                  <div className="flex items-center gap-2 pr-1">
                    <Tooltip noDelay content="Reset Crop">
                      <CropResetButton
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
                        aria-label="Reset crop"
                      >
                        <RotateCcw className="size-4" />
                      </CropResetButton>
                    </Tooltip>
                    <CropApplyButton
                      className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-semibold tracking-wide text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all hover:scale-105 hover:bg-primary/90"
                      aria-label="Apply crop"
                    >
                      Apply
                    </CropApplyButton>
                  </div>
                </div>
              </CropCanvas>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

/** Ratio chip in the footer (Free variant uses a dashed box). */
function AspectChip({
  label,
  active,
  dashed,
  w,
  h,
  onClick,
}: {
  label: string;
  active: boolean;
  dashed?: boolean;
  w?: number;
  h?: number;
  onClick: () => void;
}) {
  return (
    <Tooltip content={label}>
      <button
        onClick={onClick}
        className={cn(
          "group flex shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg w-12 h-12 transition-all duration-300",
          active
            ? "bg-primary/20 text-primary shadow-[inset_0_0_0_1px_rgba(var(--primary),0.3)]"
            : "bg-transparent text-muted-foreground hover:bg-white/10 hover:text-foreground",
        )}
        aria-pressed={active}
      >
        <span
          aria-hidden
          className={cn(
            "block shrink-0 rounded-[2px] border-2 transition-all duration-300",
            dashed && "border-dashed",
            active
              ? "border-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]"
              : "border-current opacity-70",
          )}
          style={w && h ? { width: `${w}px`, height: `${h}px` } : undefined}
        />
        {label && (
          <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">
            {label}
          </span>
        )}
      </button>
    </Tooltip>
  );
}
