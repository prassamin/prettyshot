/**
 * ScreenshotPlain — the frame-less screenshot renderer.
 *
 * Renders the captured media as a bare image when the canvas frame is
 * "none" (no device deviceFrame, no browser frame). Everything else (hover edit
 * menu, selection outline, inner lighting) still applies on top.
 *
 * ── Placement modes ───────────────────────────────────────────────────────
 * The component adapts to three hosting situations:
 *
 * Free-placed (`freeLeft`/`freeTop` are numbers) — the screenshot sits
 *    at explicit pixel coordinates inside a sized stage; offset preview
 *    tokens (`--stage-bare-left/top`) let animations retarget it.
 * Nested fill — inside a wrapper box that already defines the media
 *    bounds (`inset: 0`), used by the row layout.
 * Nested contain — the media keeps its natural aspect ratio inside the
 *    box; a ResizeObserver measures the rendered image so the lighting
 *    overlay and selection outline can hug it exactly.
 *
 * ── Interaction & DOM contract ────────────────────────────────────────────
 * • Click/press handlers come from the parent (drag, select).
 * • `attachShadowBox` puts `data-editor-shadow-box-target` on the image so
 *   the export pipeline applies the drop shadow to the media silhouette.
 * • Selection outline + edit menu + lighting are `pointer-events-none` and
 *   export-hidden.
 */

"use client";

import * as React from "react";

import { useAnimationPlayerOptional } from "@/editor/animate/hooks/use-animation-player";
import { cn } from "@/lib/utils";
import { useEditor } from "@/editor/lib/engine";
import { ScreenshotActionsMenu } from "./screenshot-actions";
import type { ScreenshotLayer } from "./types";

type StageDims = {
  stageW: number;
  stageH: number;
  imgW: number;
  imgH: number;
};

type ScreenshotPlainProps = {
  /** Captured media URL to display. */
  mediaSrc: string;
  /** Extra styles for the media element (border radius, opacity, …). */
  mediaCss: React.CSSProperties;
  /** Fully resolved positioning style, or null to use the default centering. */
  positionedCss: React.CSSProperties | null;
  /** Base CSS transform (animations chain on top of it). */
  transform: string;
  /** Explicit free-placement left (px); undefined = centered. */
  freeLeft: number | undefined;
  /** Explicit free-placement top (px); undefined = centered. */
  freeTop: number | undefined;
  /** Stage + image dimensions for free placement math. */
  stageDims: StageDims | null;
  /** Layer visibility metadata for the screenshot element. */
  layer: ScreenshotLayer;
  /** Whether the screenshot is currently selected. */
  isSelected: boolean;
  /** Whether a drag gesture is in flight. */
  isDragging: boolean;
  /** Disable the position transition (while dragging/previewing). */
  disableTransitions: boolean;
  /** When set, suppresses the edit menu (an element is being edited). */
  activeTextId: string | null;
  /** Ref to the stage wrapper (measured for placements). */
  stageRef: React.RefObject<HTMLDivElement | null>;
  /** Ref to the media `<img>` (natural dimensions). */
  imageRef: React.RefObject<HTMLImageElement | null>;
  /** Pointer down on the stage container (deselect etc.). */
  onStagePointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  /** Selects the screenshot (click). */
  onPick: (e: React.MouseEvent<HTMLImageElement>) => void;
  onPointerDown: (e: React.PointerEvent<HTMLImageElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLImageElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLImageElement>) => void;
  onWheel?: React.WheelEventHandler<HTMLDivElement>;
  /** Fired when the media image loads (dimension measurement). */
  onMediaLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  /** Opens the crop modal. */
  onCropRequest: () => void;
  /** Replaces the media with a chosen file. */
  onReplaceWith: (file: File) => void;
  /** Removes the screenshot entirely. */
  onRemove: () => void;
  /** Marks the image as the shadow target for the export pipeline. */
  attachShadowBox?: boolean;
  /** Object-fit strategy for the media. */
  fit?: "contain" | "cover" | "fill";
  /** Optional inner lighting overlay styles. */
  lightingStyle?: React.CSSProperties | null;
};

export function ScreenshotPlain({
  mediaSrc,
  mediaCss,
  positionedCss,
  transform,
  freeLeft,
  freeTop,
  stageDims,
  layer,
  isSelected,
  isDragging,
  disableTransitions,
  activeTextId,
  stageRef,
  imageRef,
  onStagePointerDown,
  onPick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  onMediaLoad,
  onCropRequest,
  onReplaceWith,
  onRemove,
  attachShadowBox = false,
  fit = "cover",
  lightingStyle,
}: ScreenshotPlainProps) {
  const { activeTool, annotation } = useEditor();
  const [editOpen, setEditOpen] = React.useState(false);
  const animationPlayer = useAnimationPlayerOptional();
  const isAnimationPlaying = animationPlayer?.isPlaying ?? false;

  // Measured rendered size of the media in "nested contain" mode.
  const [nestedContainSize, setNestedContainSize] = React.useState<{
    w: number;
    h: number;
  } | null>(null);

  const isFreePlaced = typeof freeLeft === "number";
  const leftStyle = isFreePlaced
    ? `var(--stage-bare-left, ${freeLeft}px)`
    : "50%";
  const topStyle =
    typeof freeTop === "number" ? `var(--stage-bare-top, ${freeTop}px)` : "50%";

  // Nested = hosted by a box that already constrains the media bounds
  // (row layout), as opposed to free placement on the bare canvas.
  const isNested = !isFreePlaced && stageDims == null;
  const isNestedContain = isNested && fit === "contain";

  const contentTransform =
    (typeof mediaCss.transform === "string" && mediaCss.transform) ||
    transform ||
    "";

  // Keep the lighting/outline sized to the actual image when the media
  // letterboxes itself (contain inside a bigger box).
  React.useLayoutEffect(() => {
    if (!isNestedContain) return;
    const el = imageRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      setNestedContainSize((prev) =>
        prev && prev.w === w && prev.h === h ? prev : { w, h },
      );
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imageRef, isNestedContain, fit, mediaSrc]);

  const measuredContainSize = isNestedContain ? nestedContainSize : null;

  // Position the media per placement mode (see module docs).
  const imagePositionStyle: React.CSSProperties = isNestedContain
    ? {
        left: "50%",
        top: "50%",
        maxWidth: "100%",
        maxHeight: "100%",
        width: "auto",
        height: "auto",
        ...mediaCss,
        transform: `translate(-50%, -50%) ${contentTransform}`.trim(),
        transformStyle: mediaCss.transformStyle ?? "preserve-3d",
      }
    : isNested
      ? {
          inset: 0,
          width: "100%",
          height: "100%",
          ...mediaCss,

          transform: contentTransform || undefined,
        }
      : {
          ...mediaCss,
          left: leftStyle,
          top: topStyle,
          ...(positionedCss
            ? null
            : {
                transform: `translate(-50%, -50%) ${transform}`,
              }),
        };

  // Sizing for the lighting overlay + selection outline, matching the media
  // in every placement mode.
  const overlaySizeStyle: React.CSSProperties = isNestedContain
    ? measuredContainSize
      ? {
          left: "50%",
          top: "50%",
          width: measuredContainSize.w,
          height: measuredContainSize.h,
        }
      : {
          inset: 0,
          width: "100%",
          height: "100%",
        }
    : isNested
      ? { inset: 0, width: "100%", height: "100%" }
      : isFreePlaced && stageDims
        ? {
            left: leftStyle,
            top: topStyle,
            width: stageDims.imgW,
            height: stageDims.imgH,
          }
        : {
            left: leftStyle,
            top: topStyle,
            width: "100%",
            height: "100%",
          };

  const overlayTransformStyle: React.CSSProperties =
    isNestedContain && measuredContainSize
      ? {
          transform: `translate(-50%, -50%) ${contentTransform}`.trim(),
          transformStyle: "preserve-3d",
        }
      : isFreePlaced || positionedCss
        ? {
            transform: mediaCss.transform,
            transformStyle: mediaCss.transformStyle,
          }
        : isNested
          ? {
              transform: contentTransform || undefined,
              transformStyle: "preserve-3d",
            }
          : {
              transform: `translate(-50%, -50%) ${transform}`,
              transformStyle: "preserve-3d",
            };

  const wantsContain = isNestedContain || (!isNested && fit === "contain");

  const isMoveTool = activeTool === "pointer" || annotation.mode === "move";
  const mediaClassName = cn(
    "pointer-events-auto absolute select-none",

    isNested && !isNestedContain && "inset-0 h-full w-full",
    !isNested && fit === "cover" && "h-full w-full object-cover",
    !isNested && fit === "fill" && "h-full w-full object-fill",

    wantsContain && "max-h-full max-w-full object-contain",
    isNested && fit === "cover" && "object-cover",
    isNested && fit === "fill" && "object-fill",
    layer.hidden && "pointer-events-none",
    isDragging || disableTransitions || activeTool === "position"
      ? "cursor-grabbing transition-none"
      : "transition-none",
    isMoveTool && "cursor-grab",
    isSelected && isMoveTool && "outline-none",
  );

  return (
    <div
      ref={stageRef}
      className="group/screenshot pointer-events-none relative h-full w-full overflow-visible"
      onPointerDown={onStagePointerDown}
      onWheel={onWheel}
    >
      {/* The media itself — drag/select handlers wired by the parent. */}
      <img
        ref={imageRef as any}
        src={mediaSrc}
        alt="Screenshot"
        data-editor-shadow-box-target={attachShadowBox ? "" : undefined}
        onLoad={onMediaLoad as any}
        onClick={onPick as any}
        onPointerDown={onPointerDown as any}
        onPointerMove={onPointerMove as any}
        onPointerUp={onPointerUp as any}
        onPointerCancel={onPointerUp as any}
        style={imagePositionStyle}
        className={mediaClassName}
      />

      {/* Inner lighting overlay — hugs the media. */}
      {lightingStyle && !layer.hidden ? (
        <div
          aria-hidden
          data-export-stack="foreground"
          data-export-inner-lighting=""
          className="pointer-events-none absolute z-10 transition-none"
          style={{
            ...lightingStyle,
            ...overlaySizeStyle,
            ...overlayTransformStyle,
            borderRadius: mediaCss.borderRadius,
            zIndex: 10,
          }}
        />
      ) : null}

      {/* Selection outline — dashed border around the media. */}
      {isSelected && !layer.hidden ? (
        <div
          aria-hidden
          data-selection-border="true"
          className="pointer-events-none absolute z-50 outline-2 outline-dashed outline-offset-2 outline-primary transition-none"
          style={{
            ...overlaySizeStyle,
            ...overlayTransformStyle,
            borderRadius: mediaCss.borderRadius,
          }}
        />
      ) : null}

      {/* Hover edit menu — positioned at the media's visual center. */}
      {isMoveTool && stageDims && !activeTextId && !isAnimationPlaying ? (
        <div
          className={cn(
            "pointer-events-none absolute z-50 flex items-center justify-center transition-opacity",
            editOpen || isSelected
              ? "opacity-100"
              : "opacity-0 group-hover/screenshot:opacity-100",
            isDragging || disableTransitions
              ? "transition-none"
              : "transition-[opacity,left,top] duration-300 ease-out",
          )}
          style={{
            left:
              (freeLeft ?? stageDims.stageW / 2 - stageDims.imgW / 2) +
              stageDims.imgW / 2,
            top:
              (freeTop ?? stageDims.stageH / 2 - stageDims.imgH / 2) +
              stageDims.imgH / 2,
            transform: `translate(-50%, -50%) ${transform}`,
            transformOrigin: "center",
            transformStyle: "preserve-3d",
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
      ) : null}
    </div>
  );
}
