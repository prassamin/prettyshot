"use client";

import * as React from "react";
import {
  Eye,
  Move,
  RefreshCcw,
  Sliders,
  Smartphone,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Label, Modal, Slider } from "@heroui/react";

import type { FrameGeometry } from "@/app/actions/frames";
import { cn } from "@/lib/utils";
import { detectGeometry } from "./utils";
import {
  deviceFrameViewportClip,
  deviceFrameViewportTransform,
} from "@/editor/frames/geometry";

type WallpaperOption = {
  id: string;
  name: string;
  url: string;
  isLandscape: boolean;
};

const SAMPLE_WALLPAPERS: WallpaperOption[] = [
  {
    id: "abstract-wave",
    name: "Abstract Fluid",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    isLandscape: true,
  },
  {
    id: "mountain-sunset",
    name: "Alpine Sunset",
    url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    isLandscape: true,
  },
  {
    id: "dark-neon",
    name: "Cyber Neon",
    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
    isLandscape: true,
  },
  {
    id: "minimal-gradient",
    name: "Minimal Pastel",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    isLandscape: true,
  },
];

const PRESET_RATIOS = [
  { label: "16:10 (MacBook)", value: "16 / 10" },
  { label: "16:9 (Desktop)", value: "16 / 9" },
  { label: "19.5:9 (iPhone)", value: "19.5 / 9" },
  { label: "9:19.5 (Portrait)", value: "9 / 19.5" },
  { label: "4:3 (iPad)", value: "4 / 3" },
  { label: "3:4 (iPad Port)", value: "3 / 4" },
];

function GeometrySlider({
  label,
  value,
  min,
  max,
  step,
  formatOptions,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  formatOptions?: Intl.NumberFormatOptions;
  onChange: (v: number) => void;
  hint?: React.ReactNode;
}) {
  return (
    <Slider
      value={value}
      onChange={(v) => {
        const val = Array.isArray(v) ? v[0] : v;
        onChange(val);
      }}
      minValue={min}
      maxValue={max}
      step={step}
      formatOptions={formatOptions}
      className="w-full"
    >
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Slider.Output className="text-xs font-mono font-semibold text-foreground tabular-nums" />
      <Slider.Track>
        <Slider.Fill />
        <Slider.Thumb />
      </Slider.Track>
      {hint}
    </Slider>
  );
}

export function GeometryEditorModal({
  isOpen,
  onClose,
  geometry,
  onChange,
  frameImageUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  geometry: FrameGeometry;
  onChange: (geom: FrameGeometry) => void;
  frameImageUrl?: string | null;
}) {
  const [localGeom, setLocalGeom] = React.useState<FrameGeometry>(geometry);
  const [selectedWallpaper, setSelectedWallpaper] =
    React.useState<string>("abstract-wave");
  const [showGuides, setShowGuides] = React.useState(true);
  const [zoomLevel, setZoomLevel] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const panStartRef = React.useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });

  const [isDetecting, setIsDetecting] = React.useState(false);
  const stageContainerRef = React.useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = React.useState<number>(400);

  // ONLY sync geometry from prop and reset zoom/pan when the modal transitions from closed to open!
  const wasOpenRef = React.useRef(false);
  React.useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setLocalGeom(geometry);
      setZoomLevel(1);
      setPan({ x: 0, y: 0 });
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, geometry]);

  // Track stage container size for corner-radius calculations
  React.useLayoutEffect(() => {
    const node = stageContainerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setStageWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [isOpen]);

  const patchScreen = (patch: Partial<FrameGeometry["screen"]>) => {
    const updated = {
      ...localGeom,
      screen: {
        ...localGeom.screen,
        ...patch,
      },
    };
    setLocalGeom(updated);
    onChange(updated);
  };

  const patchFrameAspect = (aspectRatio: string) => {
    const updated = {
      ...localGeom,
      aspectRatio,
    };
    setLocalGeom(updated);
    onChange(updated);
  };

  const handleAutoDetect = () => {
    if (!frameImageUrl) return;
    setIsDetecting(true);
    const probe = new Image();
    probe.crossOrigin = "anonymous";
    probe.onload = () => {
      const detected = detectGeometry(probe);
      setLocalGeom(detected);
      onChange(detected);
      setIsDetecting(false);
    };
    probe.onerror = () => setIsDetecting(false);
    probe.src = frameImageUrl;
  };

  // Pan handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // only left click
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPan({
      x: panStartRef.current.startPanX + dx,
      y: panStartRef.current.startPanY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoomLevel((z) =>
      Math.max(0.25, Math.min(5.0, Number((z + delta).toFixed(2)))),
    );
  };

  const resetView = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  const [frameW, frameH] = React.useMemo(() => {
    const parts = localGeom.aspectRatio
      .split("/")
      .map((s) => parseFloat(s.trim()));
    if (
      parts.length === 2 &&
      !isNaN(parts[0]) &&
      !isNaN(parts[1]) &&
      parts[0] > 0 &&
      parts[1] > 0
    ) {
      return [parts[0], parts[1]];
    }
    return [16, 9];
  }, [localGeom.aspectRatio]);

  const [screenW, screenH] = React.useMemo(() => {
    const parts = localGeom.screen.aspectRatio
      .split("/")
      .map((s) => parseFloat(s.trim()));
    if (
      parts.length === 2 &&
      !isNaN(parts[0]) &&
      !isNaN(parts[1]) &&
      parts[0] > 0 &&
      parts[1] > 0
    ) {
      return [parts[0], parts[1]];
    }
    return [16, 10];
  }, [localGeom.screen.aspectRatio]);

  const getSliderBounds = (val: number) => {
    if (val > 100) {
      return { min: 100, max: Math.max(3500, Math.ceil(val * 1.5)), step: 1 };
    }
    return { min: 1, max: Math.max(32, Math.ceil(val * 1.5)), step: 0.1 };
  };

  const frameWBounds = getSliderBounds(frameW);
  const frameHBounds = getSliderBounds(frameH);
  const screenWBounds = getSliderBounds(screenW);
  const screenHBounds = getSliderBounds(screenH);

  const activeWallpaper =
    SAMPLE_WALLPAPERS.find((w) => w.id === selectedWallpaper)?.url ??
    SAMPLE_WALLPAPERS[0].url;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Backdrop className="bg-background/85 backdrop-blur-md transition-all">
        <Modal.Container>
          <Modal.Dialog className="p-0 w-[95vw] max-w-6xl h-[88vh] max-h-225 flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-surface-secondary shadow-2xl">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-border/70 py-3.5 px-6 bg-surface-secondary">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Sliders className="size-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    Screen Geometry & Alignment Editor
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Zoom in up to 500%, drag to pan, and align pixel-perfect
                    screen cutouts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid size-8 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5 hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body: Strictly Side-by-Side Flex Layout (Left: Stage, Right: Controls) */}
            <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
              {/* Left: Interactive Canvas Preview Stage with Pan & High Zoom */}
              <div
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={cn(
                  "flex-1 relative h-full flex items-center justify-center overflow-hidden bg-background/80 p-6 select-none border-r border-border/60",
                  isPanning ? "cursor-grabbing" : "cursor-grab",
                )}
              >
                {/* Checkerboard backdrop */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)",
                    backgroundSize: "20px 20px",
                    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                  }}
                />

                {/* Stage controls bar (Top Rail) */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-1.5 rounded-2xl border border-border/70 bg-surface-tertiary/95 px-3 py-1.5 backdrop-blur-md shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setShowGuides((v) => !v)}
                    className={cn(
                      "flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-lg cursor-pointer transition-colors",
                      showGuides
                        ? "bg-primary/20 text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Eye className="size-3.5" />
                    <span>Guides</span>
                  </button>

                  <div className="h-4 w-px bg-border/80 mx-1" />

                  {/* Zoom Buttons & Controls (Up to 500%) */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setZoomLevel((z) =>
                          Math.max(0.25, Number((z - 0.25).toFixed(2))),
                        )
                      }
                      className="p-1 text-muted-foreground hover:text-foreground rounded-md cursor-pointer hover:bg-surface"
                      title="Zoom Out (Wheel Down)"
                    >
                      <ZoomOut className="size-3.5" />
                    </button>

                    <span className="text-[11px] font-mono font-semibold text-foreground w-11 text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setZoomLevel((z) =>
                          Math.min(5.0, Number((z + 0.25).toFixed(2))),
                        )
                      }
                      className="p-1 text-muted-foreground hover:text-foreground rounded-md cursor-pointer hover:bg-surface"
                      title="Zoom In (Wheel Up)"
                    >
                      <ZoomIn className="size-3.5" />
                    </button>
                  </div>

                  <div className="h-4 w-px bg-border/80 mx-1" />

                  {/* Fast Zoom Presets */}
                  <div className="flex items-center gap-1">
                    {[
                      { label: "Fit", value: 1 },
                      { label: "150%", value: 1.5 },
                      { label: "200%", value: 2 },
                      { label: "300%", value: 3 },
                      { label: "500%", value: 5 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setZoomLevel(preset.value)}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors",
                          zoomLevel === preset.value
                            ? "bg-primary text-primary-foreground font-bold"
                            : "text-muted-foreground hover:bg-surface hover:text-foreground",
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="h-4 w-px bg-border/80 mx-1" />

                  <button
                    type="button"
                    onClick={resetView}
                    className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md border border-border/60 hover:bg-surface cursor-pointer flex items-center gap-1"
                    title="Reset Zoom & Pan"
                  >
                    <RefreshCcw className="size-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Pan Hint Banner */}
                <div className="absolute bottom-3 left-3 z-30 pointer-events-none rounded-lg bg-surface-tertiary/80 border border-border/50 px-2.5 py-1 text-[10px] text-muted-foreground/80 backdrop-blur-sm flex items-center gap-1.5">
                  <Move className="size-3" />
                  <span>Click & Drag to pan canvas | Scroll wheel to zoom</span>
                </div>

                {/* Live Preview Stage Box */}
                <div
                  ref={stageContainerRef}
                  className="relative flex items-center justify-center transition-transform duration-75 ease-out"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                    transformOrigin: "center center",
                    aspectRatio: localGeom.aspectRatio,
                    maxWidth: "85%",
                    maxHeight: "85%",
                    width: "auto",
                    height: "auto",
                  }}
                >
                  {/* Invisible aspect ratio sizer img */}
                  {frameImageUrl ? (
                    <img
                      src={frameImageUrl}
                      alt=""
                      className="invisible max-h-[70vh] max-w-[55vw] object-contain pointer-events-none"
                    />
                  ) : (
                    <div className="w-112.5 h-75" />
                  )}

                  {/* Projected Screen Box Layer (Behind Frame Artwork) */}
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                    <div
                      className={cn(
                        "relative w-full overflow-hidden bg-black transition-all",
                        showGuides &&
                          "ring-2 ring-primary/90 shadow-[0_0_25px_rgba(var(--primary),0.45)]",
                      )}
                      style={{
                        aspectRatio: localGeom.screen.aspectRatio,
                        ...deviceFrameViewportClip(localGeom.screen, stageWidth),
                        transform: deviceFrameViewportTransform({
                          scale: localGeom.screen.scale ?? 1,
                          offsetX: localGeom.screen.offsetX ?? 0,
                          offsetY: localGeom.screen.offsetY ?? 0,
                        }),
                      }}
                    >
                      <img
                        src={activeWallpaper}
                        alt="Screen Preview"
                        className="h-full w-full object-cover select-none pointer-events-none"
                      />

                      {/* Center crosshair guide */}
                      {showGuides && (
                        <div className="absolute inset-0 pointer-events-none opacity-50">
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/90" />
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/90" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Device Frame Artwork Layer (Foreground) */}
                  {frameImageUrl ? (
                    <img
                      src={frameImageUrl}
                      alt="Frame Artwork"
                      className="pointer-events-none absolute inset-0 z-20 h-full w-full object-contain select-none drop-shadow-md"
                    />
                  ) : (
                    <div className="z-20 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-surface/50 p-6 text-center text-xs text-muted-foreground">
                      <Smartphone className="size-8 mb-2 opacity-50" />
                      <span>Upload a frame image to preview alignment</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Fine-Tuning Controls Panel with HeroUI Sliders */}
              <div className="w-95 shrink-0 h-full overflow-y-auto p-5 space-y-4 bg-surface-secondary/70">
                {/* Auto detect action */}
                {frameImageUrl && (
                  <button
                    type="button"
                    onClick={handleAutoDetect}
                    disabled={isDetecting}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20 active:scale-98"
                  >
                    <Wand2
                      className={cn("size-4", isDetecting && "animate-spin")}
                    />
                    <span>
                      {isDetecting
                        ? "Scanning Pixels…"
                        : "Auto-Detect From PNG Cutout"}
                    </span>
                  </button>
                )}

                {/* Sample Wallpaper Switcher */}
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Sample Wallpaper
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SAMPLE_WALLPAPERS.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWallpaper(w.id)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-1.5 rounded-xl border text-[10px] font-medium transition-all cursor-pointer",
                          selectedWallpaper === w.id
                            ? "border-primary bg-primary/15 text-foreground ring-1 ring-primary"
                            : "border-border/60 bg-surface-tertiary text-muted-foreground hover:bg-surface",
                        )}
                      >
                        <img
                          src={w.url}
                          alt=""
                          className="h-12 w-full object-cover rounded-lg"
                        />
                        <span className="truncate w-full text-center">
                          {w.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Screen Scale & Position (The Core Geometry Fix with HeroUI Sliders) */}
                <div className="space-y-4 rounded-2xl border border-border/70 bg-surface-tertiary/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground">
                      Screen Sizing & Placement
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        patchScreen({ offsetX: 0, offsetY: 0, scale: 1 })
                      }
                      className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Reset Offsets
                    </button>
                  </div>

                  {/* Scale Slider */}
                  <GeometrySlider
                    label="Screen Scale"
                    value={localGeom.screen.scale ?? 1}
                    min={0.3}
                    max={1.3}
                    step={0.005}
                    formatOptions={{
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    }}
                    onChange={(val) => patchScreen({ scale: val })}
                  />

                  {/* Vertical Offset (Offset Y - Crucial for laptops!) */}
                  <GeometrySlider
                    label="Position Y (Vertical Shift)"
                    value={localGeom.screen.offsetY ?? 0}
                    min={-40}
                    max={40}
                    step={0.5}
                    formatOptions={{
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }}
                    onChange={(val) => patchScreen({ offsetY: val })}
                    hint={
                      <div className="flex justify-between text-[9px] text-muted-foreground/70 mt-1">
                        <span>▲ Shift Up (Laptops)</span>
                        <span>Centered</span>
                        <span>Shift Down ▼</span>
                      </div>
                    }
                  />

                  {/* Horizontal Offset (Offset X) */}
                  <GeometrySlider
                    label="Position X (Horizontal Shift)"
                    value={localGeom.screen.offsetX ?? 0}
                    min={-30}
                    max={30}
                    step={0.5}
                    formatOptions={{
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }}
                    onChange={(val) => patchScreen({ offsetX: val })}
                  />

                  {/* Corner Radius */}
                  <GeometrySlider
                    label="Corner Radius"
                    value={localGeom.screen.borderRadius ?? 0}
                    min={0}
                    max={60}
                    step={1}
                    onChange={(val) =>
                      patchScreen({ borderRadius: Math.round(val) })
                    }
                  />
                </div>

                {/* Screen Aspect Ratio Controls */}
                <div className="space-y-3.5 rounded-2xl border border-border/70 bg-surface-tertiary/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground">
                      Screen Aspect Ratio
                    </span>
                    <input
                      value={localGeom.screen.aspectRatio}
                      onChange={(e) =>
                        patchScreen({ aspectRatio: e.target.value })
                      }
                      placeholder="W / H"
                      className="w-28 rounded-lg border border-border/60 bg-background px-2 py-1 font-mono text-[11px] text-foreground text-center focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Screen Aspect Width Slider */}
                  <GeometrySlider
                    label="Screen Width (W)"
                    value={screenW}
                    min={screenWBounds.min}
                    max={screenWBounds.max}
                    step={screenWBounds.step}
                    onChange={(newW) =>
                      patchScreen({ aspectRatio: `${newW} / ${screenH}` })
                    }
                  />

                  {/* Screen Aspect Height Slider */}
                  <GeometrySlider
                    label="Screen Height (H)"
                    value={screenH}
                    min={screenHBounds.min}
                    max={screenHBounds.max}
                    step={screenHBounds.step}
                    onChange={(newH) =>
                      patchScreen({ aspectRatio: `${screenW} / ${newH}` })
                    }
                  />

                  {/* Ratio Presets */}
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1.5">
                      Quick Screen Presets
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_RATIOS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => patchScreen({ aspectRatio: p.value })}
                          className="rounded-md border border-border/70 bg-surface px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-pointer"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Frame Aspect Ratio Controls */}
                <div className="space-y-3.5 rounded-2xl border border-border/70 bg-surface-tertiary/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-foreground">
                      Frame Outer Aspect Ratio
                    </span>
                    <input
                      value={localGeom.aspectRatio}
                      onChange={(e) => patchFrameAspect(e.target.value)}
                      placeholder="W / H"
                      className="w-28 rounded-lg border border-border/60 bg-background px-2 py-1 font-mono text-[11px] text-foreground text-center focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Frame Aspect Width Slider */}
                  <GeometrySlider
                    label="Frame Width (W)"
                    value={frameW}
                    min={frameWBounds.min}
                    max={frameWBounds.max}
                    step={frameWBounds.step}
                    onChange={(newW) => patchFrameAspect(`${newW} / ${frameH}`)}
                  />

                  {/* Frame Aspect Height Slider */}
                  <GeometrySlider
                    label="Frame Height (H)"
                    value={frameH}
                    min={frameHBounds.min}
                    max={frameHBounds.max}
                    step={frameHBounds.step}
                    onChange={(newH) => patchFrameAspect(`${frameW} / ${newH}`)}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 flex items-center justify-between border-t border-border/70 py-3.5 px-6 bg-surface-tertiary/50">
              <span className="text-[11px] font-mono text-muted-foreground">
                Scale: {localGeom.screen.scale?.toFixed(3)} | Offset: (
                {localGeom.screen.offsetX ?? 0}%,{" "}
                {localGeom.screen.offsetY ?? 0}%) | Radius:{" "}
                {localGeom.screen.borderRadius}px
              </span>
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 shadow-md active:scale-95"
              >
                Apply & Done
              </button>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
