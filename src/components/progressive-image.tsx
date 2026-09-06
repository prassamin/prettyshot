"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressiveImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  src: string;
  mode?: "progressive" | "shimmer";
  progressive?: "pixel" | "blur";
  shimmer?: boolean;
};

// Global cache for loaded images
const imageCache = new Map<string, HTMLImageElement>();

export const ProgressiveImage = React.forwardRef<
  HTMLImageElement,
  ProgressiveImageProps
>(function ProgressiveImage(
  {
    src,
    mode = "shimmer",
    progressive = "blur",
    shimmer = true,
    className,
    style,
    onLoad,
    ...imgProps
  },
  ref,
) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [stage, setStage] = React.useState(0);

  // Progressive mode: canvas-based loading
  React.useEffect(() => {
    if (mode !== "progressive" || !src) return;

    let cancelled = false;
    setLoaded(false);
    setStage(0);

    const renderImage = (img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const cached = imageCache.has(src);

      if (cached) {
        // Cached: render full immediately
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0);
        setStage(6);
        setLoaded(true);
        onLoad?.({} as React.SyntheticEvent<HTMLImageElement>);
        return;
      }

      // Not cached: progressive render
      if (progressive === "blur") {
        renderBlurProgressive(img, canvas, ctx, w, h);
      } else {
        renderPixelProgressive(img, canvas, ctx, w, h);
      }
    };

    const renderPixelProgressive = (
      img: HTMLImageElement,
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
    ) => {
      const sizes = [4, 8, 16, 32, 64, 128];
      let i = 0;

      const renderNext = () => {
        if (cancelled || i >= sizes.length) {
          imageCache.set(src, img);
          setLoaded(true);
          onLoad?.({} as React.SyntheticEvent<HTMLImageElement>);
          return;
        }

        const size = sizes[i];
        canvas.width = size;
        canvas.height = size;

        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, size, size);

        // Object-fit: cover
        const imgAspect = w / h;
        let sx = 0, sy = 0, sw = w, sh = h;
        if (imgAspect > 1) { sw = h; sx = (w - sw) / 2; }
        else { sh = w; sy = (h - sh) / 2; }

        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

        setStage(i + 1);
        i++;
        setTimeout(renderNext, 60);
      };

      renderNext();
    };

    const renderBlurProgressive = (
      img: HTMLImageElement,
      canvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
    ) => {
      const blurSteps = [20, 12, 6, 2, 0];
      let i = 0;

      // Start with full size but blurred
      canvas.width = w;
      canvas.height = h;

      const renderNext = () => {
        if (cancelled || i >= blurSteps.length) {
          // Final sharp render
          ctx.filter = "none";
          ctx.drawImage(img, 0, 0);
          imageCache.set(src, img);
          setLoaded(true);
          onLoad?.({} as React.SyntheticEvent<HTMLImageElement>);
          return;
        }

        const blur = blurSteps[i];
        ctx.clearRect(0, 0, w, h);
        ctx.filter = blur > 0 ? `blur(${blur}px)` : "none";
        ctx.drawImage(img, 0, 0);

        setStage(i + 1);
        i++;
        setTimeout(renderNext, 80);
      };

      renderNext();
    };

    // Check cache first
    const cachedImg = imageCache.get(src);
    if (cachedImg) {
      renderImage(cachedImg);
      return;
    }

    // Load image
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (!cancelled) renderImage(img);
    };

    img.onerror = () => {
      if (!cancelled) setLoaded(true);
    };

    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, mode, progressive, onLoad]);

  // Shimmer mode: simple fade-in
  React.useLayoutEffect(() => {
    if (mode !== "shimmer") return;
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      imageCache.set(src, img);
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src, mode]);

  const handleLoad = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (mode === "shimmer") {
        imageCache.set(src, e.currentTarget);
        setLoaded(true);
        onLoad?.(e);
      }
    },
    [mode, src, onLoad],
  );

  const setRef = React.useCallback(
    (node: HTMLImageElement | null) => {
      imgRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Progressive mode
  if (mode === "progressive") {
    return (
      <div className={cn("relative overflow-hidden", className)} style={style}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            imageRendering: progressive === "pixel" && stage < 6 ? "pixelated" : "auto",
          }}
        />
      </div>
    );
  }

  // Shimmer mode rendering
  const showShimmer = shimmer && !loaded;

  return (
    <img
      {...imgProps}
      ref={setRef}
      src={src}
      alt={imgProps.alt ?? ""}
      data-loaded={loaded}
      onLoad={handleLoad}
      className={cn(showShimmer && "image-shimmer", className)}
      style={{
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.3s ease",
        ...style,
      }}
    />
  );
});
