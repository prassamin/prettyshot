"use client";

import * as React from "react";
import { toast } from "@heroui/react";
import { Film, Download, Copy, X, Clapperboard } from "lucide-react";
import { motion } from "framer-motion";
import { Modal, Popover } from "@heroui/react";

import {
  exportCanvas,
  EXPORT_RESOLUTION_WIDTHS,
  type ExportFormat,
  type ExportResolution,
} from "@/editor/lib/export";
import {
  exportAnimation,
  type AnimationExportFormat,
  type AnimationExportProgress,
} from "@/editor/lib/animation/export";
import { useEditorEngine } from "@/editor/lib/engine";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { cn } from "@/lib/utils";
import { GroupToggleList, RadioCard, ToggleListItem } from "./elements";
import { CANVAS_ID } from "@/editor/lib/engine-core/initial-config";
import { FeatureId } from "@/config/features";
import { FeatureLock } from "../components/feature-lock";
import { useFeatureGate } from "@/hooks/use-feature-gate";

const IMAGE_FORMAT_OPTIONS: {
  id: ExportFormat;
  label: string;
  featureId?: FeatureId;
}[] = [
  { id: "png", label: "PNG", featureId: "export.png" },
  { id: "jpeg", label: "JPEG", featureId: "export.jpeg" },
  { id: "webp", label: "WebP", featureId: "export.webp" },
];

const IMAGE_SIZE_OPTIONS: {
  id: ExportResolution;
  label: string;
  multiplier: string;
  featureId?: FeatureId;
}[] = [
  { id: "hd", label: "1x HD", multiplier: "1080p", featureId: "export.hd" },
  { id: "4k", label: "2x 4K", multiplier: "2160p", featureId: "export.4k" },
  { id: "8k", label: "4x 8K", multiplier: "4320p", featureId: "export.8k" },
];

const ANIMATION_FORMATS: {
  id: AnimationExportFormat;
  label: string;
  featureId?: FeatureId;
}[] = [
  { id: "mp4", label: "MP4" },
  { id: "webm", label: "WebM" },
];

const ANIMATION_FPS = [
  { id: "30", label: "30 FPS" },
  { id: "60", label: "60 FPS" },
];

const ANIMATION_RESOLUTIONS = [
  { id: "720", label: "720p HD", width: 720 },
  { id: "1080", label: "1080p FHD", width: 1080 },
  { id: "2160", label: "4K UHD", width: 2160 },
];

export function ExportDropdownMenu({
  withWatermark,
  onWatermarkToggle,
  onPerformCopy,
  isCopyBusy,
}: {
  withWatermark: boolean;
  onWatermarkToggle: (include: boolean) => void;
  onPerformCopy: () => Promise<void>;
  isCopyBusy: boolean;
}) {
  const isAnimateMode = useEditorEngine((s) => s.isAnimateMode);
  const aspect = useEditorEngine((s) => s.present.aspect);
  const animation = useEditorEngine((s) => s.present.animation);
  const hasAnimationKeyframes = Boolean(
    animation && animation.clips.length > 0,
  );
  const gate = useFeatureGate();

  const [activeTab, setActiveTab] = React.useState<"image" | "video">(
    isAnimateMode ? "video" : "image",
  );

  React.useEffect(() => {
    if (isAnimateMode) {
      setActiveTab("video");
    }
  }, [isAnimateMode]);

  const [imageFormat, setImageFormat] = usePersistentState<ExportFormat>(
    "prettyshot:export:format",
    "png",
    (v: any): v is ExportFormat => ["png", "jpeg", "webp"].includes(v),
  );
  const [resolution, setResolution] = usePersistentState<ExportResolution>(
    "prettyshot:export:resolution",
    "hd",
    (v: any): v is ExportResolution => ["hd", "4k", "8k"].includes(v),
  );

  const [animFormat, setAnimFormat] = usePersistentState<AnimationExportFormat>(
    "prettyshot:export:anim_format",
    "mp4",
    (v: any): v is AnimationExportFormat => ["mp4", "webm"].includes(v),
  );
  const [animFps, setAnimFps] = usePersistentState<string>(
    "prettyshot:export:anim_fps",
    "30",
    (v: any): v is string => ["30", "60"].includes(v),
  );
  const [animRes, setAnimRes] = usePersistentState<string>(
    "prettyshot:export:anim_res",
    "1080",
    (v: any): v is string => ["720", "1080", "2160"].includes(v),
  );

  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportProgress, setExportProgress] =
    React.useState<AnimationExportProgress | null>(null);
  const [previewFrame, setPreviewFrame] = React.useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const calculatedDimensions = React.useMemo(() => {
    const targetW = EXPORT_RESOLUTION_WIDTHS[resolution] || 1920;
    const aspectW = aspect.w > 0 ? aspect.w : 1920;
    const aspectH = aspect.h > 0 ? aspect.h : 1080;
    const targetH = Math.round((targetW * aspectH) / aspectW);
    return { w: targetW, h: targetH };
  }, [aspect, resolution]);

  const triggerImageDownload = React.useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    toast.promise(
      exportCanvas(CANVAS_ID, imageFormat, resolution, {
        watermark: withWatermark,
      }),
      {
        error: (e) => {
          setIsExporting(false);
          return e.message || `Export failed. Please try again.`;
        },
        loading: `Rendering ${imageFormat.toUpperCase()} (${resolution.toUpperCase()})...`,
        success: (data) => {
          setMenuOpen(false);
          setIsExporting(false);
          return `Exported ${data}`;
        },
      },
    );
  }, [imageFormat, withWatermark, resolution, isExporting]);

  const handleExportAnimation = React.useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    setPreviewFrame(null);
    // Close the popover first so it never stacks above the export dialog.
    setMenuOpen(false);
    setExportDialogOpen(true);
    setExportProgress({
      phase: "preparing",
      current: 0,
      total: 100,
      etaMs: null,
    });
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await exportAnimation({
        format: animFormat,
        fps: parseInt(animFps, 10),
        targetWidth: parseInt(animRes, 10),
        watermark: withWatermark,
        onProgress: (progress) => setExportProgress(progress),
        onFrame: (dataUrl) => setPreviewFrame(dataUrl),
        signal: controller.signal,
      });

      setExportDialogOpen(false);
      setMenuOpen(false);
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast.danger("Export canceled");
      } else {
        console.error("Animation export error:", err);
        toast.danger(err?.message || "Export failed. Please try again.");
      }
      setExportDialogOpen(false);
    } finally {
      setIsExporting(false);
      setExportProgress(null);
      setPreviewFrame(null);
      abortControllerRef.current = null;
    }
  }, [animFormat, animFps, animRes, withWatermark, isExporting]);

  const handleCancelExport = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const onWatermarkChange = gate.can("brand.watermark")
    ? onWatermarkToggle
    : gate.message;

  return (
    <Popover isOpen={menuOpen} onOpenChange={setMenuOpen}>
      <Popover.Trigger>
        <button
          type="button"
          className="group relative flex h-9 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm transition-all hover:bg-accent-hover hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="h-[200%] w-12 -translate-x-full rotate-35 animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-primary-foreground/20 to-transparent" />
          </div>
          <Download className="size-4" />
          Export
        </button>
      </Popover.Trigger>

      <Popover.Content
        placement="bottom end"
        offset={12}
        className="w-85 p-0 rounded-[20px] bg-popover/95 backdrop-blur-2xl border border-border/70 shadow-2xl overflow-hidden ring-1 ring-border/40"
      >
        <div className="flex w-full flex-col">
          {/* Header */}
          <div className="relative px-5 pt-5 pb-4 bg-linear-to-b from-surface-muted/50 to-transparent border-b border-border/40">
            <div className="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-linear-to-r from-transparent via-primary/40 to-transparent opacity-60" />

            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  Export
                </h3>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                  Render your final asset to device
                </p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="relative flex h-9 w-full rounded-[10px] bg-surface-secondary p-1 shadow-inner border border-border/60">
              {["image", "video"].map((tab) => {
                const isActive = activeTab === tab;
                const isVideo = tab === "video";
                const isDisabled =
                  isVideo && !hasAnimationKeyframes && !isAnimateMode;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab as "image" | "video")}
                    className={cn(
                      "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all z-10",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground",
                      isDisabled && "opacity-30 cursor-not-allowed",
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="export-tab"
                        className="absolute inset-0 rounded-[8px] bg-surface-tertiary border border-border/70 shadow-xs"
                        initial={false}
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.5,
                        }}
                      />
                    )}
                    <span className="relative z-10 uppercase">{tab}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-5 px-5 py-5">
            {activeTab === "image" ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-5"
              >
                {/* Format Selection */}
                <div className="space-y-2">
                  <SectionLabel>Format</SectionLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {IMAGE_FORMAT_OPTIONS.map((fmt) => (
                      <FeatureLock
                        key={fmt.id}
                        featureId={fmt.featureId}
                        overlay="badge"
                        icon={false}
                      >
                        <RadioCard
                          title={fmt.label}
                          selected={imageFormat === fmt.id}
                          onClick={() => setImageFormat(fmt.id)}
                        />
                      </FeatureLock>
                    ))}
                  </div>
                </div>

                {/* Quality Selection */}
                <div className="space-y-2">
                  <SectionLabel>Quality</SectionLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {IMAGE_SIZE_OPTIONS.map((res) => (
                      <FeatureLock
                        key={res.id}
                        featureId={res.featureId}
                        overlay="badge"
                        icon={false}
                      >
                        <RadioCard
                          title={res.label}
                          desc={res.multiplier}
                          selected={resolution === res.id}
                          onClick={() => setResolution(res.id)}
                        />
                      </FeatureLock>
                    ))}
                  </div>
                </div>

                {/* Computed Resolution Table */}
                <div className="flex flex-col rounded-[10px] border border-border/50 bg-surface-secondary/60 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                      Resolution
                    </span>
                    <span className="text-xs font-mono text-foreground/80">
                      {calculatedDimensions.w} × {calculatedDimensions.h} px
                    </span>
                  </div>
                </div>

                {/* Options */}
                <div className="rounded-xl border border-border/50 bg-surface-secondary/40 p-1">
                  <ToggleListItem
                    title="PrettyShot Watermark"
                    subtext="Add subtle branding in the center"
                    isOn={withWatermark}
                    onToggle={onWatermarkChange}
                  />
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={() => void triggerImageDownload()}
                  disabled={isExporting}
                  className={cn(
                    "relative flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-md transition-all duration-200 select-none overflow-hidden group",
                    "hover:bg-accent-hover hover:shadow-lg active:scale-[0.98]",
                    isExporting && "cursor-not-allowed opacity-60",
                  )}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="h-[200%] w-16 -translate-x-full rotate-35 animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-primary-foreground/20 to-transparent" />
                  </div>
                  <Download className="size-4" />
                  <span>
                    {isExporting
                      ? "Rendering..."
                      : `Download ${imageFormat.toUpperCase()}`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    void onPerformCopy();
                  }}
                  disabled={isCopyBusy || isExporting}
                  className={cn(
                    "xl:hidden relative flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border/80 bg-surface-secondary text-xs font-bold text-foreground transition-all duration-200 select-none overflow-hidden",
                    "hover:bg-surface-tertiary active:scale-[0.98]",
                    (isCopyBusy || isExporting) &&
                      "cursor-not-allowed opacity-60",
                  )}
                >
                  <Copy className="size-4" />
                  <span>{isCopyBusy ? "Copying..." : "Copy to Clipboard"}</span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-5"
              >
                <FeatureLock
                  featureId="export.video"
                  className="[&>div]:flex [&>div]:flex-col [&>div]:gap-5"
                >
                  {/* Video Format */}
                  <div className="space-y-2">
                    <SectionLabel>Video Format</SectionLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {ANIMATION_FORMATS.map((fmt) => (
                        <RadioCard
                          key={fmt.id}
                          title={fmt.label}
                          selected={animFormat === fmt.id}
                          onClick={() => setAnimFormat(fmt.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Framerate */}
                  <div className="space-y-2">
                    <SectionLabel>Framerate</SectionLabel>
                    <GroupToggleList
                      currentValue={animFps}
                      onSelection={(fps: any) => setAnimFps(fps)}
                      items={ANIMATION_FPS}
                    />
                  </div>

                  {/* Resolution */}
                  <div className="space-y-2">
                    <SectionLabel>Resolution</SectionLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {ANIMATION_RESOLUTIONS.map((res) => (
                        <RadioCard
                          key={res.id}
                          title={res.label.split(" ")[0]}
                          desc={res.label.split(" ")[1] ?? ""}
                          selected={animRes === String(res.width)}
                          onClick={() => setAnimRes(String(res.width))}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="rounded-xl border border-border/50 bg-surface-secondary/40 p-1">
                    <ToggleListItem
                      title="PrettyShot Watermark"
                      subtext="Add subtle branding to exported video"
                      isOn={withWatermark}
                      onToggle={onWatermarkChange}
                    />
                  </div>

                  {/* Primary Animation CTA */}
                  <button
                    type="button"
                    onClick={() => void handleExportAnimation()}
                    disabled={isExporting}
                    className={cn(
                      "relative flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-md transition-all duration-200 select-none overflow-hidden group",
                      "hover:bg-accent-hover hover:shadow-lg active:scale-[0.98]",
                      isExporting && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="h-[200%] w-16 -translate-x-full rotate-35 animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-primary-foreground/20 to-transparent" />
                    </div>
                    <Film className="size-4" />
                    <span>
                      {isExporting
                        ? "Rendering Video..."
                        : `Export ${animFormat.toUpperCase()} (${animRes}p)`}
                    </span>
                  </button>
                </FeatureLock>
              </motion.div>
            )}
          </div>
        </div>
      </Popover.Content>

      {/* Live frame-preview export dialog */}
      <Modal
        isOpen={exportDialogOpen}
        onOpenChange={(open) => {
          if (!open && isExporting) handleCancelExport();
          setExportDialogOpen(open);
        }}
      >
        <Modal.Backdrop isDismissable={false}>
          <Modal.Container>
            <Modal.Dialog className="p-0 md:max-w-[70dvw] lg:max-w-[35dvw] overflow-hidden rounded-2xl border border-border/70 bg-popover/95 shadow-2xl">
              <div className="flex w-full flex-col gap-4 p-5">
                {/* Header */}
                <div className="flex items-center gap-2.5">
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight leading-relaxed text-foreground">
                      Exporting
                    </h3>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {animFormat.toUpperCase()} · {animRes}p · {animFps} FPS ·
                      Rendering frames
                    </p>
                  </div>
                </div>

                {/* Live frame preview */}
                <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-surface-secondary/60">
                  {previewFrame ? (
                    <img
                      src={previewFrame}
                      alt="Export frame preview"
                      className="size-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="flex flex-col items-center gap-2"
                      >
                        <Clapperboard className="size-8" />
                        <span className="text-[11px] font-medium">
                          Preparing frames...
                        </span>
                      </motion.div>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary uppercase tracking-wide text-[10px]">
                      {exportProgress?.phase === "preparing" &&
                        "Preparing frames..."}
                      {exportProgress?.phase === "capturing" &&
                        `Rendering frame ${exportProgress.current} / ${exportProgress.total}`}
                      {exportProgress?.phase === "encoding" &&
                        "Encoding video..."}
                      {exportProgress?.phase === "finishing" && "Finalizing..."}
                    </span>
                    {exportProgress?.etaMs != null && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ETA{" "}
                        {Math.max(
                          0,
                          Math.round((exportProgress.etaMs / 1000) * 10) / 10,
                        )}
                        s
                      </span>
                    )}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary border border-border/60">
                    <motion.div
                      className="h-full bg-primary relative"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.round(
                          ((exportProgress?.current ?? 0) /
                            Math.max(1, exportProgress?.total ?? 1)) *
                            100,
                        )}%`,
                      }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="absolute inset-0 bg-primary-foreground/20 w-full h-full animate-[shimmer_1s_infinite] -translate-x-full" />
                    </motion.div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end border-t border-border/40 pt-3">
                  <button
                    type="button"
                    onClick={handleCancelExport}
                    className="flex items-center gap-1.5 rounded-lg bg-surface-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-surface-tertiary hover:text-danger border border-border/60"
                  >
                    <X className="size-3" />
                    Cancel Export
                  </button>
                </div>
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Popover>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
      {children}
    </label>
  );
}
