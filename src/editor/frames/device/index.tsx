/**
 * Device deviceFrame stage for the screenshot element.
 *
 * Renders the captured media projected onto a device frame (PNG artwork of
 * a phone/tablet/laptop/monitor from the CDN). The media is fitted into the
 * device's *screen region*, which is a transformed child box sized from the
 * per-device geometry in `config.ts` (`MOCKUP_SCREEN_GEOMETRY`).
 *
 * ── Layer order (bottom → top) ────────────────────────────────────────────
 *   z-0  — screen projection: blurred "contain" backdrop + sharp media.
 *   z-10 — the device PNG artwork itself (`data-export-frame-chrome`).
 *   z-20 — hover edit menu (crop / replace / delete).
 *
 * The chrome artwork is untagged from the media stack so the frame's drop
 * shadow keeps following the PNG silhouette during export.
 *
 * ── Rotation ──────────────────────────────────────────────────────────────
 * Portrait devices inside a horizontal canvas are rotated -90° by the
 * consumer (`rotation` prop). The media content is counter-rotated so it
 * reads upright; `rotatedScreenContentStyle` derives the swap box size from
 * the screen aspect ratio.
 *
 * ── DOM contract with the export pipeline ─────────────────────────────────
 * Same as the browser stage: `data-editor-shadow-filter-target` +
 * `data-editor-shadow-filter-base` must stay on the positioned deviceFrame, and
 * the media stack lives under `[data-export-stack="media"]` (see
 * lib/editor/apply-animation-frame).
 */

"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { ProgressiveImage } from "@/components/progressive-image";
import { cn } from "@/lib/utils";
import { useEditor } from "@/editor/lib/engine";
import {
  framePositionedStyle,
  isDesktopFrame,
  deviceFrameViewportClip,
  deviceFrameViewportTransform,
  parseAspectRatio,
} from "../geometry";
import { InnerLightingOverlay } from "@/editor/screenshot/inner-lighting-overlay";
import { ScreenshotActionsMenu } from "@/editor/screenshot/screenshot-actions";
import type { DeviceFrameStageProps } from "./types";

/**
 * Filled-state device deviceFrame: screen projection + frame + hover edit menu.
 *
 * Requires `stageDims` or falls back to a ResizeObserver probe of the
 * stage element for the viewport clip sizing.
 */
export function DeviceFrameStage({
  mediaSrc,
  deviceFrame,
  geometry,
  layer,
  transform,
  rotation,
  shadowCss,
  offset,
  anchor,
  fit = "cover",
  isSelected,
  isDragging,
  stageDims,
  stageRef,
  imageRef,
  onPick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  onMediaLoad,
  onCropRequest,
  onReplaceWith,
  onRemove,
  showHoverMenu = true,
  clampToMinSide = false,
  usePreviewTokens = true,
  lightingStyle,
  mediaCss,
}: DeviceFrameStageProps) {
  const { activeTool, annotation } = useEditor();
  const [editOpen, setEditOpen] = React.useState(false);
  const [measuredStageWidth, setMeasuredStageWidth] = React.useState<
    number | undefined
  >();

  const stageWidth = stageDims?.stageW ?? measuredStageWidth;
  const desktop = isDesktopFrame(deviceFrame.deviceId);
  // Counter-rotation for portrait frames in a horizontal canvas.
  const rotatedContentStyle = rotation
    ? rotatedScreenContentStyle(geometry.screen.aspectRatio, -rotation)
    : undefined;
  const isMoveTool = activeTool === "pointer" || annotation.mode === "move";

  const mediaClassName = cn(
    "pointer-events-none h-full w-full max-w-none object-center select-none",
    fit === "contain" && "relative z-10 object-contain",
    fit === "cover" && "object-cover",
    fit === "fill" && "object-fill",
    rotation && "absolute top-1/2 left-1/2",
  );

  // Pre-load the alternate orientation image in background so switching is instant
  React.useEffect(() => {
    if (
      !deviceFrame.src ||
      typeof window === "undefined" ||
      !deviceFrame.src.includes("cloudinary.com")
    )
      return;
    const isRotated = deviceFrame.src.includes("/a_270/");
    const altSrc = isRotated
      ? deviceFrame.src.replace(/\/a_270\//, "/")
      : deviceFrame.src.includes("/upload/")
        ? deviceFrame.src.replace(/\/upload\//, "/upload/a_270/")
        : deviceFrame.src.replace(/\/authenticated\//, "/authenticated/a_270/");
    if (altSrc && altSrc !== deviceFrame.src) {
      const img = new window.Image();
      img.src = altSrc;
    }
  }, [deviceFrame.src, deviceFrame.orientation]);

  // Track initial mount so we don't animate on page load
  const isFirstMountRef = React.useRef(true);
  React.useEffect(() => {
    isFirstMountRef.current = false;
  }, []);

  // Probe the stage width when the consumer couldn't provide `stageDims`.
  React.useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const updateStageWidth = () => {
      const width =
        parseFloat(getComputedStyle(node).width) ||
        node.getBoundingClientRect().width ||
        node.clientWidth;
      if (!width) return;
      setMeasuredStageWidth((prev) => (prev === width ? prev : width));
    };

    updateStageWidth();
    const observer = new ResizeObserver(updateStageWidth);
    observer.observe(node);
    return () => observer.disconnect();
  }, [deviceFrame.src, stageRef]);

  return (
    <div
      className="group/deviceframe pointer-events-none relative h-full w-full"
      style={{ containerType: "size" }}
    >
      {/* Positioned, theme-consistent frame element. */}
      <div
        className={cn(
          "pointer-events-auto absolute top-0 left-0 max-h-full max-w-full select-none",
          layer.hidden && "pointer-events-none",
          isDragging || activeTool === "position"
            ? "cursor-grabbing transition-none"
            : "transition-[transform,opacity,filter,box-shadow,aspect-ratio,width,height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isMoveTool && "cursor-grab",
        )}
        data-editor-shadow-filter-target
        data-editor-shadow-filter-base={shadowCss || ""}
        style={framePositionedStyle({
          aspectRatio: geometry.aspectRatio,
          rotation,
          scopeToMinSide: clampToMinSide,
          anchor,
          offset,
          transform,
          shadowFilter: shadowCss,
          layer,
          readPreviewVars: usePreviewTokens,
        })}
        onClick={onPick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <motion.div
          key={`${deviceFrame.deviceId ?? "frame"}-${deviceFrame.orientation}`}
          initial={
            isFirstMountRef.current
              ? false
              : {
                  rotate: deviceFrame.orientation === "landscape" ? 90 : -90,
                  scale: 0.86,
                  opacity: 0.9,
                }
          }
          animate={{
            rotate: 0,
            scale: 1,
            opacity: 1,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 22,
            mass: 0.85,
          }}
          className="relative h-full w-full origin-center"
          style={{ transformOrigin: "center center" }}
        >
          {/* Screen projection — behind the device artwork. */}
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
            <div
              ref={stageRef}
              className="pointer-events-none relative w-full overflow-clip bg-black transition-[aspect-ratio,transform,border-radius] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                aspectRatio: geometry.screen.aspectRatio,
                ...deviceFrameViewportClip(geometry.screen, stageWidth),
                transform: deviceFrameViewportTransform(geometry.screen),
              }}
            >
              {/* Blurred backdrop for "contain" fit — mimics browser letterbox. */}
              {fit === "contain" && (
                <ProgressiveImage
                  src={mediaSrc}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none"
                  style={{
                    filter: "blur(18px) brightness(0.55) saturate(1.4)",
                    transform: "scale(1.12)",
                  }}
                />
              )}
              <ProgressiveImage
                ref={imageRef}
                shimmer
                src={mediaSrc}
                alt="Screenshot"
                draggable={false}
                onLoad={onMediaLoad}
                className={mediaClassName}
                style={{ ...rotatedContentStyle, ...mediaCss }}
              />
              <InnerLightingOverlay style={lightingStyle} />
            </div>
          </div>

          {/* Device artwork — untagged so the shadow follows the silhouette. */}
          <img
            key={deviceFrame.src}
            src={deviceFrame.src}
            alt=""
            draggable={false}
            data-export-frame-chrome=""
            className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
        </motion.div>

        {/* Hover edit menu — centered on the screen for desktops, on the
            frame for everything else. */}
        {showHoverMenu && isMoveTool && !layer.hidden && desktop ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div
              className="relative w-full overflow-visible"
              style={{
                aspectRatio: geometry.screen.aspectRatio,
                ...deviceFrameViewportClip(geometry.screen, stageWidth),
                transform: deviceFrameViewportTransform(geometry.screen),
              }}
            >
              <div
                className={cn(
                  "pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200",
                  editOpen || isSelected
                    ? "opacity-100"
                    : "opacity-0 group-hover/deviceframe:opacity-100",
                  isDragging && !editOpen && "opacity-0!",
                )}
                style={{
                  transform: `translate(-50%, -50%) scale(${1 / geometry.screen.scale})`,
                }}
              >
                <ScreenshotActionsMenu
                  open={editOpen}
                  onOpenChange={setEditOpen}
                  onCropRequest={onCropRequest}
                  onReplaceWith={onReplaceWith}
                  onRemove={onRemove}
                />
              </div>
            </div>
          </div>
        ) : showHoverMenu && isMoveTool && !layer.hidden ? (
          <div
            className={cn(
              "pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200",
              editOpen || isSelected
                ? "opacity-100"
                : "opacity-0 group-hover/deviceframe:opacity-100",
              isDragging && !editOpen && "opacity-0!",
            )}
          >
            <ScreenshotActionsMenu
              open={editOpen}
              onOpenChange={setEditOpen}
              onCropRequest={onCropRequest}
              onReplaceWith={onReplaceWith}
              onRemove={onRemove}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Box sizing for counter-rotated screen content.
 *
 * When the whole frame is rotated (e.g. -90°), the media must be re-boxed
 * from `ratio` (w/h of the screen) into `1/ratio` with a translate+rotate
 * so it fills the rotated viewport without distortion.
 */
function rotatedScreenContentStyle(
  aspectRatio: string,
  rotation: number,
): React.CSSProperties | undefined {
  const ratio = parseAspectRatio(aspectRatio);
  if (!ratio)
    return { transform: `translate(-50%, -50%) rotate(${rotation}deg)` };

  return {
    width: `${100 / ratio}%`,
    height: `${ratio * 100}%`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
  };
}
