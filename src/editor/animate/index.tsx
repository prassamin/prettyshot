"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Trash } from "lucide-react";

import { Tooltip } from "@/components/tooltip";

import { AnimateControls } from "./controls";
import { ClipTransitionButton } from "./transition-toolbar";
import { useTimeline } from "./hooks/use-timeline";
import { LayerList } from "./timeline/layer-list";
import { TimelineStrip } from "./timeline/timeline-strip";
import { FeatureLock } from "../components/feature-lock";
export { AnimationLayer } from "./playback-layer";

export function AnimateBar() {
  const {
    pxFor,
    durationMs,
    playheadMs,
    isPlaying,
    canRazor,
    razorMode,
    requestExit,
    toggle,
    toggleRazor,
    reset,
    scrollRef,
    onScrubDown,
    onScrubMove,
    onScrubUp,
    ticks,
    trackRef,
    layers,
    activeLayerId,
    onLayerSelect,
    clipsForLayer,
    onDurationHandleDown,
    onDurationHandleMove,
    onDurationHandleUp,
    isDurationDragging,
    trackListRef,
    onTrackMove,
    onTrackLeave,
    onTrackClick,
    onTrackPointerDown,
    onTrackPointerUp,
    rangeSelectRect,
    showDropPreview,
    dropPreviewLayerId,
    dropPreviewRef,
    dropPreviewWidthPx,
    highlightedClipIds,
    selectedClip,
    selectedClipIds,
    updateAnimationClip,
    draggingClipId,
    interactingClipId,
    clipsAnimated,
    resolveClipImages,
    resolveClipIcons,
    onClipPointerDown,
    onClipPointerMove,
    onClipPointerUp,
    deleteSelectedClip,
  } = useTimeline();

  const selectedCount = selectedClipIds.length;
  const hasSelection = selectedCount > 0;
  const deleteLabel =
    selectedCount > 1 ? `Delete ${selectedCount} keyframes` : "Delete keyframe";

  // Stretch the timeline strip to the visible panel edge so the end-void
  // pattern always fills the full remaining width of the timeline panel.
  const [viewportW, setViewportW] = React.useState(0);
  React.useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewportW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollRef]);
  const timelineW = Math.max(pxFor(60000), viewportW ? viewportW - 152 : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto absolute right-3 bottom-3 left-3 z-30 rounded-2xl border border-border bg-surface-secondary p-3 shadow-2xl"
    >
      <AnimateControls
        isPlaying={isPlaying}
        playheadMs={playheadMs}
        durationMs={durationMs}
        canRazor={canRazor}
        razorActive={razorMode}
        onExit={requestExit}
        onTogglePlay={toggle}
        onToggleRazor={toggleRazor}
        onReset={reset}
        transitionControl={
          hasSelection ? (
            <>
              <Tooltip
                noDelay
                content={
                  <>
                    {deleteLabel}
                    <kbd
                      data-slot="kbd"
                      className="rounded border border-border bg-surface-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      del
                    </kbd>
                  </>
                }
              >
                <button
                  type="button"
                  aria-label={deleteLabel}
                  disabled={isPlaying}
                  onClick={deleteSelectedClip}
                  className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors bg-surface-tertiary/50 hover:bg-danger/10 hover:text-danger disabled:pointer-events-none disabled:opacity-50"
                >
                  <Trash className="size-4.5" />
                </button>
              </Tooltip>
              {selectedClip ? (
                <ClipTransitionButton
                  clip={selectedClip}
                  onUpdate={(patch) =>
                    updateAnimationClip(selectedClip.id, patch)
                  }
                  disabled={isPlaying}
                />
              ) : null}
            </>
          ) : null
        }
      />
      <FeatureLock featureId="animate">
        <div
          className="mt-3 h-45 overflow-y-auto overscroll-y-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-scrollbar [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/60 [&::-webkit-scrollbar-corner]:bg-transparent"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--scrollbar) transparent",
          }}
          onWheelCapture={(e) => e.stopPropagation()}
        >
          <div
            ref={scrollRef}
            className="overflow-x-auto overflow-y-hidden touch-pan-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              className="relative flex min-w-max gap-x-2"
              style={{ width: pxFor(durationMs) + 144 + 8 }}
            >
              <LayerList
                layers={layers}
                activeLayerId={activeLayerId}
                onLayerSelect={onLayerSelect}
              />

              <TimelineStrip
                timelineW={timelineW}
                pxFor={pxFor}
                durationMs={durationMs}
                playheadMs={playheadMs}
                ticks={ticks}
                layers={layers}
                razorMode={razorMode}
                clipsAnimated={clipsAnimated}
                isDurationDragging={isDurationDragging}
                showDropPreview={showDropPreview}
                dropPreviewLayerId={dropPreviewLayerId}
                dropPreviewWidthPx={dropPreviewWidthPx}
                dropPreviewRef={dropPreviewRef}
                rangeSelectRect={rangeSelectRect}
                highlightedClipIds={highlightedClipIds}
                draggingClipId={draggingClipId}
                interactingClipId={interactingClipId}
                trackRef={trackRef}
                trackListRef={trackListRef}
                clipsForLayer={clipsForLayer}
                resolveClipImages={resolveClipImages}
                resolveClipIcons={resolveClipIcons}
                onLayerSelect={onLayerSelect}
                onScrubDown={onScrubDown}
                onScrubMove={onScrubMove}
                onScrubUp={onScrubUp}
                onDurationHandleDown={onDurationHandleDown}
                onDurationHandleMove={onDurationHandleMove}
                onDurationHandleUp={onDurationHandleUp}
                onTrackClick={onTrackClick}
                onTrackPointerDown={onTrackPointerDown}
                onTrackMove={onTrackMove}
                onTrackPointerUp={onTrackPointerUp}
                onTrackLeave={onTrackLeave}
                onClipPointerDown={onClipPointerDown}
                onClipPointerMove={onClipPointerMove}
                onClipPointerUp={onClipPointerUp}
              />
            </div>
          </div>
        </div>
      </FeatureLock>
    </motion.div>
  );
}
