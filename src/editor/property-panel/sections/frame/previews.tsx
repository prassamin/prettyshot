/**
 * Frame picker — tile previews.
 *
 * The visual heart of the gallery: renders the real frame (browser skin via
 * Chrome/Safari components, or device deviceFrame PNG with the screenshot
 * projected onto its screen) inside each tile.
 */

import * as React from "react";
import { SquareDashed } from "lucide-react";

import {
  deviceFrameGeometry,
  deviceFrameViewportClip,
  deviceFrameViewportTransform,
} from "@/editor/lib/canvas-helpers";
import { ChromeFrame } from "@/editor/frames/browser/chrome";
import { SafariFrame } from "@/editor/frames/browser/safari";
import {
  CHROME_BROWSER_FRAME_ID,
  getBrowserFrame,
} from "@/editor/frames/catalog";
import { cn } from "@/lib/utils";

import {
  BROWSER_TILE_PREVIEW_WIDTH,
  BROWSER_TILE_PREVIEW_VIRTUAL_WIDTH,
} from "./constants";
import type { FrameKind, ImageFit } from "./types";

/** Reveal a tile's preview only when it nears the viewport. */
export function useLazyVisible(rootMargin = "200px") {
  const ref = React.useRef<HTMLButtonElement | null>(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [rootMargin]);
  return { ref, visible };
}

const DEMO_IPHONE_SCREENSHOT = "/thumbnails/iphone17.webp";
const DEMO_DESKTOP_SCREENSHOT = "/thumbnails/macos.webp";

/** Device deviceFrame preview: screen projection + device PNG overlay. */
export const DeviceTilePreview = React.memo(function DeviceTilePreview({
  kind,
  spec,
  preview,
  rotatePreview,
  screenshot,
  imageFit,
}: {
  deviceId?: string;
  kind?: FrameKind;
  spec: ReturnType<typeof deviceFrameGeometry>;
  preview: string;
  rotatePreview: boolean;
  screenshot?: string | null;
  imageFit?: ImageFit;
}) {
  const screenRef = React.useRef<HTMLDivElement | null>(null);
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = React.useState<number | undefined>(
    undefined,
  );
  // Measured available box (px) — used to CONTAIN the device box on both
  // axes. The tile preview area has a fixed height but a variable width, so
  // width-only or height-only sizing lets a wide landscape device (or a tall
  // phone) spill out of the box on the other axis.
  const [boxSize, setBoxSize] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

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

  React.useLayoutEffect(() => {
    // Measure the AVAILABLE area — the parent tile box (fixed h-24/h-28),
    // not this element (which resizes with the measurement).
    const node = boxRef.current?.parentElement;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setBoxSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const isLandscape = React.useMemo(() => {
    if (!spec?.aspectRatio) return false;
    const parts = spec.aspectRatio.split("/").map((s) => parseFloat(s.trim()));
    if (
      parts.length === 2 &&
      !isNaN(parts[0]) &&
      !isNaN(parts[1]) &&
      parts[1] > 0
    ) {
      return parts[0] > parts[1];
    }
    return false;
  }, [spec?.aspectRatio]);

  // Exact contain box in px once the available area is measured. Falls back
  // to the previous CSS behavior (height- or width-driven) before the first
  // measurement so the first paint doesn't jump.
  const ratio = React.useMemo(() => {
    const parts = (spec?.aspectRatio ?? "1/1")
      .split("/")
      .map((s) => parseFloat(s.trim()));
    if (
      parts.length === 2 &&
      Number.isFinite(parts[0]) &&
      Number.isFinite(parts[1]) &&
      parts[0] > 0 &&
      parts[1] > 0
    ) {
      return parts[0] / parts[1];
    }
    return 1;
  }, [spec?.aspectRatio]);

  const containStyle = React.useMemo(() => {
    if (!boxSize || boxSize.width <= 0 || boxSize.height <= 0) return null;
    const availW = boxSize.width;
    const availH = boxSize.height;
    let width = availW;
    let height = width / ratio;
    if (height > availH) {
      height = availH;
      width = height * ratio;
    }
    return { width, height };
  }, [boxSize, ratio]);

  const fallbackMedia =
    kind === "desktop" || kind === "laptop" || kind === "tv" || isLandscape
      ? DEMO_DESKTOP_SCREENSHOT
      : DEMO_IPHONE_SCREENSHOT;

  const activeMedia = screenshot || fallbackMedia;

  return (
    <div
      ref={boxRef}
      className="relative flex items-center justify-center overflow-hidden drop-shadow-sm shrink-0"
      style={
        containStyle
          ? { width: containStyle.width, height: containStyle.height }
          : {
              aspectRatio: spec.aspectRatio,
              width: isLandscape ? "100%" : "auto",
              height: isLandscape ? "auto" : "100%",
              maxWidth: "100%",
              maxHeight: "100%",
            }
      }
    >
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div
          ref={screenRef}
          className="pointer-events-none relative w-full overflow-hidden bg-black text-foreground"
          style={{
            aspectRatio: spec.screen.aspectRatio,
            transformOrigin: "center center",
            ...deviceFrameViewportClip(spec.screen, stageWidth),
            transform: deviceFrameViewportTransform(spec.screen),
          }}
        >
          {imageFit === "contain" && (
            <img
              src={activeMedia}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none"
              style={{
                filter: "blur(18px) brightness(0.55) saturate(1.4)",
                transform: "scale(1.12)",
              }}
            />
          )}
          <img
            src={activeMedia}
            alt=""
            className={cn(
              "relative z-10 h-full w-full object-cover",
              imageFitClassName(imageFit ?? "cover"),
            )}
            loading="lazy"
          />
        </div>
      </div>
      <img
        src={preview}
        alt=""
        className={cn(
          "pointer-events-none absolute inset-0 z-10 h-full w-full object-contain select-none",
          rotatePreview && "scale-[1.38] rotate-90",
        )}
        loading="lazy"
      />
    </div>
  );
});

/** Browser skin preview: Chrome/Safari component scaled to tile width. */
export const BrowserTilePreview = React.memo(function BrowserTilePreview({
  frameId,
  color,
  screenshot,
  imageFit,
}: {
  frameId: string;
  color: string;
  screenshot: string | null;
  imageFit: ImageFit;
}) {
  const frame = getBrowserFrame(frameId);
  const scale = BROWSER_TILE_PREVIEW_WIDTH / BROWSER_TILE_PREVIEW_VIRTUAL_WIDTH;
  const imageSrc = screenshot ?? frame?.previewImageUrl;

  return (
    <div
      className="relative overflow-hidden drop-shadow-sm"
      style={{
        width: BROWSER_TILE_PREVIEW_WIDTH,
        aspectRatio: frame?.aspectRatio,
      }}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: BROWSER_TILE_PREVIEW_VIRTUAL_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {frameId === CHROME_BROWSER_FRAME_ID ? (
          <ChromeFrame
            mediaSrc={imageSrc}
            fit={imageFit}
            tone={color === "dark" ? "dark" : "light"}
            shellRadius="5px"
            viewportRadius="0 0 4px 4px"
            className="block w-full"
          />
        ) : (
          <SafariFrame
            mediaSrc={imageSrc}
            fit={imageFit}
            tone={color === "dark" ? "dark" : "light"}
            viewportRadius="0 0 4px 4px"
            className="block w-full"
          />
        )}
      </div>
    </div>
  );
});

function imageFitClassName(imageFit: ImageFit) {
  if (imageFit === "contain") return "object-contain";
  if (imageFit === "fill") return "object-fill";
  return "object-cover";
}

/** Fallback silhouette when a device has no renderable preview. */
export function DeviceGlyph({
  kind,
  active,
}: {
  kind: FrameKind;
  active: boolean;
}) {
  if (kind === "none") {
    return (
      <div
        className={cn(
          "relative flex h-17.5 w-25 flex-col items-center justify-center rounded-xl border border-dashed transition-all duration-300",
          active
            ? "border-primary/50 bg-primary/8 text-primary shadow-[0_0_12px_color-mix(in_oklab,var(--primary)_12%,transparent)]"
            : "border-foreground/25 bg-foreground/1.5 text-foreground/50 group-hover:border-foreground/45 group-hover:bg-foreground/4 group-hover:text-foreground/75",
        )}
      >
        <SquareDashed className="size-6 stroke-[1.5] transition-opacity" />
      </div>
    );
  }

  const stroke = active ? "border-foreground/80" : "border-foreground/40";
  const fill = active ? "bg-foreground/15" : "bg-foreground/5";
  const accent = active ? "bg-foreground/80" : "bg-foreground/40";

  let shapeClass = "h-19.5 w-10.5 rounded-[12px] border-2"; // default phone
  if (kind === "tablet" || kind === "ereader")
    shapeClass = "h-16 w-12 rounded-[10px] border-2";
  if (kind === "desktop" || kind === "tv")
    shapeClass = "h-12 w-20 rounded-[8px] border-2";
  if (kind === "laptop") shapeClass = "h-11 w-18 rounded-[6px] border-2";
  if (kind === "watch") shapeClass = "h-10 w-8 rounded-[8px] border-2";

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center",
        shapeClass,
        stroke,
        fill,
      )}
    >
      {kind === "phone" && (
        <span className={cn("absolute top-1 h-1 w-3 rounded-full", accent)} />
      )}
      {kind === "laptop" && (
        <span
          className={cn("absolute -bottom-1.5 h-0.5 w-8 rounded-full", accent)}
        />
      )}
      {(kind === "desktop" || kind === "tv") && (
        <span
          className={cn("absolute -bottom-2.5 h-1.5 w-6 rounded-sm", accent)}
        />
      )}
    </div>
  );
}
