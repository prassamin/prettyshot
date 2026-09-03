/**
 * CropCanvas — the interactive crop surface for captured media.
 *
 * A thin, context-driven wrapper around `react-image-crop`:
 *
 *   <CropCanvas src={...} aspect={...} onCrop={...}>
 *     <CropCanvasContent />          ← renders the image + selection overlay
 *     <CropApplyButton />            ← commits the crop
 *     <CropResetButton />            ← restores the initial selection
 *   </CropCanvas>
 *
 * ── Custom edge handles ───────────────────────────────────────────────────
 * react-image-crop's corner handles can't be constrained to a fixed aspect
 * ratio mid-drag (the aspect only snaps on commit), so `CropCanvasContent`
 * renders its own top/right/bottom/left edge handles that keep the aspect
 * locked while resizing. They only appear when an `aspect` is set.
 *
 * ── Crop math ─────────────────────────────────────────────────────────────
 * The crop is tracked in percent coordinates (unit "%") and converted to
 * pixels only at commit time. `cropToPngDataUrl` renders the source image
 * onto a canvas with the natural-size scale factor and exports PNG.
 */

"use client";

import {
  createContext,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";
import { cn } from "@/lib/utils";
import type {
  CropApplyButtonProps,
  CropCanvasContextValue,
  CropCanvasProps,
  CropCanvasContentProps,
  CropEdge,
  EdgeResizeHandler,
  CropResetButtonProps,
} from "./types";

import "react-image-crop/dist/ReactCrop.css";

/**
 * Build a centered crop for the media, respecting an optional aspect ratio.
 */
function centeredAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined,
): PercentCrop {
  if (!aspect) {
    return centerCrop(
      { x: 0, y: 0, width: 90, height: 90, unit: "%" },
      mediaWidth,
      mediaHeight,
    );
  }

  const maxFraction = 0.82;
  const maxW = mediaWidth * maxFraction;
  const maxH = mediaHeight * maxFraction;
  const widthFromHeight = maxH * aspect;
  const pixelWidth = Math.min(maxW, widthFromHeight);
  const widthPct = (pixelWidth / mediaWidth) * 100;

  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: widthPct,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

/** Whether an existing crop already satisfies the requested aspect. */
function aspectMatches(
  crop: PercentCrop,
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined,
) {
  if (!aspect) return true;
  const cropWidth = (crop.width / 100) * mediaWidth;
  const cropHeight = (crop.height / 100) * mediaHeight;
  if (!cropWidth || !cropHeight) return false;
  return Math.abs(cropWidth / cropHeight - aspect) < 0.01;
}

/**
 * Render the cropped region of the source image to a PNG data URL.
 */
const cropToPngDataUrl = async (
  imageSrc: HTMLImageElement,
  pixelCrop: PixelCrop,
): Promise<string> => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Context is null, this should never happen.");
  }

  const scaleX = imageSrc.naturalWidth / imageSrc.width;
  const scaleY = imageSrc.naturalHeight / imageSrc.height;

  ctx.imageSmoothingEnabled = false;
  canvas.width = Math.round(pixelCrop.width * scaleX);
  canvas.height = Math.round(pixelCrop.height * scaleY);

  ctx.drawImage(
    imageSrc,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
};

const CropCanvasContext = createContext<CropCanvasContextValue | null>(null);

const useCropCanvas = () => {
  const context = useContext(CropCanvasContext);
  if (!context) {
    throw new Error("CropCanvas components must be used within CropCanvas");
  }
  return context;
};

export const CropCanvas = ({
  file,
  src,
  maxImageSize = 1024 * 1024 * 5,
  onCrop,
  children,
  onChange,
  onComplete,
  initialCrop: initialCropProp,
  ...reactCropProps
}: CropCanvasProps) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgSrc, setImgSrc] = useState<string>(src || "");
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [initialCrop, setInitialCrop] = useState<PercentCrop>();

  useEffect(() => {
    if (src) {
      setImgSrc(src);
      return;
    }
    if (file) {
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(typeof reader.result === "string" ? reader.result : ""),
      );
      reader.readAsDataURL(file);
    }
  }, [file, src]);

  const onImageLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const autoCrop = centeredAspectCrop(width, height, reactCropProps.aspect);
      const startCrop =
        initialCropProp &&
        aspectMatches(initialCropProp, width, height, reactCropProps.aspect)
          ? initialCropProp
          : autoCrop;
      setCrop(startCrop);
      setInitialCrop(startCrop);
    },
    [reactCropProps.aspect, initialCropProp],
  );

  const handleChange = (pixelCrop: PixelCrop, percentCrop: PercentCrop) => {
    setCrop(percentCrop);
    onChange?.(pixelCrop, percentCrop);
  };

  const handleComplete = (pixelCrop: PixelCrop, percentCrop: PercentCrop) => {
    setCompletedCrop(pixelCrop);
    onComplete?.(pixelCrop, percentCrop);
  };

  const applyCrop = async () => {
    if (!imgRef.current) {
      return;
    }

    // Fall back to the current crop if the user hasn't dragged yet
    // (onComplete only fires after a drag, so completedCrop may be null).
    let pixelCrop: PixelCrop | null = completedCrop;
    if (!pixelCrop && crop) {
      const { width, height } = imgRef.current;
      pixelCrop = {
        unit: "px",
        x: (crop.x / 100) * width,
        y: (crop.y / 100) * height,
        width: (crop.width / 100) * width,
        height: (crop.height / 100) * height,
      };
    }
    if (!pixelCrop || pixelCrop.width === 0 || pixelCrop.height === 0) {
      return;
    }

    const croppedImage = await cropToPngDataUrl(imgRef.current, pixelCrop);

    if (crop) {
      onCrop?.(croppedImage, crop);
    }
  };

  const resetCrop = () => {
    if (initialCrop) {
      setCrop(initialCrop);
      setCompletedCrop(null);
    }
  };

  const contextValue: CropCanvasContextValue = {
    file,
    maxImageSize,
    imgSrc,
    crop,
    completedCrop,
    imgRef,
    onCrop,
    reactCropProps,
    handleChange,
    handleComplete,
    onImageLoad,
    applyCrop,
    resetCrop,
  };

  return (
    <CropCanvasContext.Provider value={contextValue}>
      {children}
    </CropCanvasContext.Provider>
  );
};

/**
 * The image + selection overlay. Renders custom aspect-locked edge handles
 * when a fixed aspect is active.
 */
export const CropCanvasContent = ({
  style,
  imageStyle,
  className,
}: CropCanvasContentProps) => {
  const {
    imgSrc,
    crop,
    handleChange,
    handleComplete,
    onImageLoad,
    imgRef,
    reactCropProps,
  } = useCropCanvas();

  /**
   * Pointer-drag resize on a single edge, keeping the aspect ratio locked
   * around the crop's center (react-image-crop's built-in handles only snap
   * the aspect on commit).
   */
  const startEdgeResize = useCallback(
    (edge: CropEdge, e: ReactPointerEvent<HTMLDivElement>) => {
      if (!crop || !imgRef.current) return;

      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);

      const image = imgRef.current;
      const imageRect = image.getBoundingClientRect();
      const mediaW = imageRect.width || image.width;
      const mediaH = imageRect.height || image.height;
      if (!mediaW || !mediaH) return;

      const startCrop = {
        x: (crop.x / 100) * mediaW,
        y: (crop.y / 100) * mediaH,
        width: (crop.width / 100) * mediaW,
        height: (crop.height / 100) * mediaH,
      };
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const right = startCrop.x + startCrop.width;
      const bottom = startCrop.y + startCrop.height;

      const resize = (clientX: number, clientY: number, complete: boolean) => {
        const dx = clientX - startClientX;
        const dy = clientY - startClientY;
        const aspect = reactCropProps.aspect;
        const resizingWidth = edge === "e" || edge === "w";
        const desiredWidth =
          edge === "e"
            ? startCrop.width + dx
            : edge === "w"
              ? startCrop.width - dx
              : startCrop.width;
        const desiredHeight =
          edge === "s"
            ? startCrop.height + dy
            : edge === "n"
              ? startCrop.height - dy
              : startCrop.height;
        const maxWidth =
          edge === "e" ? mediaW - startCrop.x : edge === "w" ? right : mediaW;
        const maxHeight =
          edge === "s" ? mediaH - startCrop.y : edge === "n" ? bottom : mediaH;
        const minWidth = Math.min(
          reactCropProps.minWidth ?? Math.min(mediaW, mediaH) * 0.08,
          Math.max(1, maxWidth),
        );
        const minHeight = Math.min(
          reactCropProps.minHeight ?? Math.min(mediaW, mediaH) * 0.08,
          Math.max(1, maxHeight),
        );
        let nextWidth = resizingWidth
          ? Math.max(minWidth, Math.min(maxWidth, desiredWidth))
          : startCrop.width;
        let nextHeight = resizingWidth
          ? startCrop.height
          : Math.max(minHeight, Math.min(maxHeight, desiredHeight));
        let nextX = edge === "w" ? right - nextWidth : startCrop.x;
        let nextY = edge === "n" ? bottom - nextHeight : startCrop.y;

        if (aspect && Number.isFinite(aspect) && aspect > 0) {
          const centerX = startCrop.x + startCrop.width / 2;
          const centerY = startCrop.y + startCrop.height / 2;
          const centeredMaxWidth = Math.max(
            2 * Math.min(centerX, mediaW - centerX),
          );
          const centeredMaxHeight = Math.max(
            2 * Math.min(centerY, mediaH - centerY),
          );
          const aspectMinWidth = Math.max(minWidth, minHeight * aspect);
          const aspectMinHeight = Math.max(minHeight, minWidth / aspect);

          if (resizingWidth) {
            const aspectMaxWidth = Math.min(
              maxWidth,
              centeredMaxHeight * aspect,
            );
            nextWidth = Math.max(
              Math.min(aspectMinWidth, aspectMaxWidth),
              Math.min(aspectMaxWidth, desiredWidth),
            );
            nextHeight = nextWidth / aspect;
            nextX = edge === "w" ? right - nextWidth : startCrop.x;
            nextY = centerY - nextHeight / 2;
          } else {
            const aspectMaxHeight = Math.min(
              maxHeight,
              centeredMaxWidth / aspect,
            );
            nextHeight = Math.max(
              Math.min(aspectMinHeight, aspectMaxHeight),
              Math.min(aspectMaxHeight, desiredHeight),
            );
            nextWidth = nextHeight * aspect;
            nextX = centerX - nextWidth / 2;
            nextY = edge === "n" ? bottom - nextHeight : startCrop.y;
          }

          nextX = Math.max(0, Math.min(mediaW - nextWidth, nextX));
          nextY = Math.max(0, Math.min(mediaH - nextHeight, nextY));
        }

        const pixelCrop: PixelCrop = {
          unit: "px",
          x: nextX,
          y: nextY,
          width: nextWidth,
          height: nextHeight,
        };
        const percentCrop: PercentCrop = {
          unit: "%",
          x: (nextX / mediaW) * 100,
          y: (nextY / mediaH) * 100,
          width: (nextWidth / mediaW) * 100,
          height: (nextHeight / mediaH) * 100,
        };

        handleChange(pixelCrop, percentCrop);
        if (complete) handleComplete(pixelCrop, percentCrop);
      };

      const target = e.currentTarget;
      const pointerId = e.pointerId;
      const onMove = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        event.preventDefault();
        resize(event.clientX, event.clientY, false);
      };
      const onUp = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        resize(event.clientX, event.clientY, true);
        cleanup();
      };
      const onCancel = (event: PointerEvent) => {
        if (event.pointerId !== pointerId) return;
        cleanup();
      };
      const cleanup = () => {
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onCancel);
        if (target.hasPointerCapture(pointerId)) {
          target.releasePointerCapture(pointerId);
        }
      };

      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onCancel);
    },
    [crop, handleChange, handleComplete, imgRef, reactCropProps],
  );

  // Map our theme tokens onto react-image-crop's CSS variables.
  const themedStyle = {
    "--rc-border-color": "rgba(255, 255, 255, 0.5)",
    "--rc-focus-color": "var(--primary, #3b82f6)",
  } as CSSProperties;

  return (
    <ReactCrop
      className={cn("max-h-69.25 max-w-full", className)}
      crop={crop}
      onChange={handleChange}
      onComplete={handleComplete}
      renderSelectionAddon={
        reactCropProps.aspect
          ? () => (
              <>
                <EdgeHandle edge="n" onPointerDown={startEdgeResize} />
                <EdgeHandle edge="e" onPointerDown={startEdgeResize} />
                <EdgeHandle edge="s" onPointerDown={startEdgeResize} />
                <EdgeHandle edge="w" onPointerDown={startEdgeResize} />
              </>
            )
          : undefined
      }
      style={{ ...themedStyle, ...style }}
      {...reactCropProps}
    >
      {imgSrc && (
        <img alt="crop" ref={imgRef} className="size-full" style={imageStyle} src={imgSrc} onLoad={onImageLoad} />
      )}
    </ReactCrop>
  );
};

/** Aspect-locked edge drag handle (top / right / bottom / left). */
function EdgeHandle({
  edge,
  onPointerDown,
}: {
  edge: CropEdge;
  onPointerDown: EdgeResizeHandler;
}) {
   return (
    <div
      aria-hidden
      onPointerDown={(e) => onPointerDown(edge, e)}
      className={cn(
        "absolute z-10 ReactCrop__drag-handle",
        edge === "n" && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize ord-n",
        edge === "s" && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize ord-s",
        edge === "e" && "top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-ew-resize ord-e",
        edge === "w" && "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize ord-w",
      )}
    >
    </div>
  );
}

/**
 * Commits the current crop. `onCrop` is called on the enclosing
 * `CropCanvas` with the PNG data URL + percent region.
 */
export const CropApplyButton = ({
  children,
  onClick,
  ...props
}: CropApplyButtonProps) => {
  const { applyCrop } = useCropCanvas();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    setTimeout(() => {
      void applyCrop();
    }, 0);
  };

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
};

/**
 * Restores the initial (auto-centered) selection.
 */
export const CropResetButton = ({
  children,
  onClick,
  ...props
}: CropResetButtonProps) => {
  const { resetCrop } = useCropCanvas();

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    resetCrop();
    onClick?.(e);
  };

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  );
};
