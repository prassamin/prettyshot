/**
 * Empty-state device deviceFrame: the device frame presented as a drop target.
 *
 * Mirrors `DeviceFrameStage` geometry so the drop slot lines up exactly
 * with where the filled frame will appear: same viewport projection
 * (`deviceFrameViewportClip` / `deviceFrameViewportTransform`), same positioned
 * deviceFrame, and a `DropPrompt` (drag hint / upload zone) projected onto
 * the device screen.
 *
 * In compact mode — small or tilted frames — the full upload zone is
 * replaced by the chip UI from `DropPrompt`.
 */

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ProgressiveImage } from "@/components/progressive-image";

import { cn } from "@/lib/utils";
import {
  framePositionedStyle,
  isDesktopFrame,
  deviceFrameViewportClip,
  deviceFrameViewportTransform,
} from "../geometry";
import { useEditor } from "@/editor/lib/engine";
import { DropPrompt } from "@/editor/screenshot/drop-prompt";
import { InnerLightingOverlay } from "@/editor/screenshot/inner-lighting-overlay";
import type { DeviceFrameDropSlotProps } from "./types";

/**
 * Empty-state device deviceFrame — frame + drop/upload UI on the screen.
 */
export function DeviceFrameDropSlot({
  deviceFrame,
  geometry,
  isDropHover,
  onPickFile,
  transform,
  rotation,
  offset,
  anchor,
  isDragging,
  shadowCss,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  compact = false,
  clampToMinSide = false,
  usePreviewTokens = true,
  lightingStyle,
}: DeviceFrameDropSlotProps) {
  const { activeTool, annotation } = useEditor();
  const screenRef = React.useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = React.useState<number | undefined>(
    undefined,
  );
  const isFirstMountRef = React.useRef(true);
  const desktop = isDesktopFrame(deviceFrame.deviceId);

  React.useEffect(() => {
    isFirstMountRef.current = false;
  }, []);

  // Probe the screen box width for the viewport clip sizing.
  React.useLayoutEffect(() => {
    const node = screenRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setStageWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="pointer-events-none relative h-full w-full"
      style={{ containerType: "size" }}
    >
      {/* Positioned frame element (mirrors the filled state). */}
      <div
        className={cn(
          "pointer-events-auto absolute top-0 left-0 max-h-full max-w-full select-none",
          isDragging
            ? "cursor-grabbing transition-none"
            : "transition-[transform,opacity,filter,box-shadow,aspect-ratio,width,height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          (activeTool === "pointer" || annotation.mode === "move") &&
            !isDragging &&
            "cursor-grab",
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
          readPreviewVars: usePreviewTokens,
        })}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
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
          {/* Drop UI projected onto the device screen. */}
          <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
            <div
              ref={screenRef}
              style={{
                aspectRatio: geometry.screen.aspectRatio,
                ...deviceFrameViewportClip(geometry.screen, stageWidth),
                transform: deviceFrameViewportTransform(geometry.screen),
              }}
              className="pointer-events-auto relative w-full overflow-hidden transition-[aspect-ratio,transform,border-radius] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              <DropPrompt
                isDropHover={isDropHover}
                onPickFile={onPickFile}
                tilt={rotation ? -rotation : 0}
                compact={compact || !desktop}
              />
              <InnerLightingOverlay style={lightingStyle} />
            </div>
          </div>

          {/* Device artwork. */}
          <img
            key={deviceFrame.src}
            src={deviceFrame.src}
            alt=""
            className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
        </motion.div>
      </div>
    </div>
  );
}
