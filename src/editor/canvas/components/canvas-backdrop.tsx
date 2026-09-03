"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  backgroundLayerOpacityVar,
  filterLayerOpacityVar,
  overlayLayerOpacityVar,
  OVERLAY_BASE_OPACITY_VAR,
  type AnimateBgStack,
  type AnimateFilterStack,
  type AnimateOverlayStack,
} from "@/editor/lib/animation/playback";
import { backgroundCss } from "@/editor/lib/engine";
import {
  lightingOverlayCss,
  overlayLayerCss,
} from "@/editor/lib/canvas-helpers";
import type { Background } from "@/editor/property-panel/sections/background/types";
import {
  buildColorFilterCss,
  resolveOverlayUrl,
} from "@/editor/property-panel/sections/backdrop/utils";
import type {
  BackdropConfig,
  BackdropFilterKind,
  OverlayConfig,
} from "@/editor/property-panel/sections/backdrop/types";
import {
  TOKEN_BACKDROP_FX_PREVIEW,
  TOKEN_BACKDROP_NOISE_PREVIEW,
  TOKEN_OVERLAY_OPACITY,
} from "@/editor/property-panel/sections/backdrop/constants";

const EMPTY_BG_LAYERS: AnimateBgStack["layers"] = [];
const EMPTY_FILTER_LAYERS: AnimateFilterStack["layers"] = [];
const EMPTY_OVERLAY_LAYERS: AnimateOverlayStack["layers"] = [];

let cachedNoiseDataUrl: string | null = null;

function getNoiseTexture(size = 150): string {
  if (typeof window === "undefined") return "";
  if (cachedNoiseDataUrl) return cachedNoiseDataUrl;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  cachedNoiseDataUrl = canvas.toDataURL("image/png");
  return cachedNoiseDataUrl;
}

type CanvasBackdropProps = {
  background: Background;
  backdrop: BackdropConfig;
  adjustmentsFilter: string | undefined;
  noiseEnabled: boolean;
  noiseOpacity: number;
  overlay: OverlayConfig;
  animateBgStack?: AnimateBgStack;
  animateFilterStack?: AnimateFilterStack;
  animateOverlayStack?: AnimateOverlayStack;
  lightingAnimated?: boolean;
};

export const CanvasBackdrop = React.memo(
  ({
    background,
    backdrop,
    adjustmentsFilter,
    noiseEnabled,
    noiseOpacity,
    overlay: _overlay,
    animateBgStack,
    animateFilterStack,
    animateOverlayStack,
    lightingAnimated = false,
  }: CanvasBackdropProps) => {
    const [noiseUrl, setNoiseUrl] = React.useState<string>(() => {
      if (typeof window !== "undefined") return getNoiseTexture();
      return "";
    });

    React.useEffect(() => {
      if (!noiseUrl) {
        setNoiseUrl(getNoiseTexture());
      }
    }, [noiseUrl]);

    const resolveEffectiveBackground = React.useCallback(
      (bg: Background): Background => {
        if (bg.type !== "image") return bg;
        if (bg.value.startsWith("data:")) return bg;

        if (bg.sourceUrl && bg.thumbUrl && !bg.thumbUrl.startsWith("data:")) {
          return { ...bg, value: bg.thumbUrl };
        }
        return bg;
      },
      [],
    );

    const effectiveBackground = React.useMemo(
      () => resolveEffectiveBackground(background),
      [resolveEffectiveBackground, background],
    );

    const bgStackBase = animateBgStack?.base ?? null;
    const bgLayers = animateBgStack?.layers ?? EMPTY_BG_LAYERS;
    const hasBgStack = bgLayers.length > 0;
    const effectiveBgBase = React.useMemo(
      () => (bgStackBase ? resolveEffectiveBackground(bgStackBase) : null),
      [resolveEffectiveBackground, bgStackBase],
    );
    const effectiveBgLayers = React.useMemo(
      () =>
        bgLayers.map((layer) => ({
          ...layer,
          background: resolveEffectiveBackground(layer.background),
        })),
      [resolveEffectiveBackground, bgLayers],
    );

    const outerLightingStyle =
      backdrop.lighting.target === "outer" || lightingAnimated
        ? lightingOverlayCss(backdrop.lighting, {
            active: backdrop.lighting.target === "outer",
            forceMount: lightingAnimated,
          })
        : null;

    const filterCssFor = React.useCallback(
      (filterKind: BackdropFilterKind): string => {
        const fxPart = `var(${TOKEN_BACKDROP_FX_PREVIEW}, ${adjustmentsFilter ?? "brightness(1)"})`;
        const af = buildColorFilterCss(filterKind);
        return af ? `${fxPart} ${af}` : fxPart;
      },
      [adjustmentsFilter],
    );
    const filterValue = filterCssFor(backdrop.filter ?? "none");

    const filterStackBase = animateFilterStack?.base ?? "none";
    const filterLayers = animateFilterStack?.layers ?? EMPTY_FILTER_LAYERS;
    const hasFilterStack = filterLayers.length > 0;

    const overlayLayers = animateOverlayStack?.layers ?? EMPTY_OVERLAY_LAYERS;

    return (
      <div
        data-export-stack="underlay"
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ isolation: "isolate" }}
        >
          {hasFilterStack ? (
            <>
              <div
                suppressHydrationWarning
                aria-hidden
                className={cn(
                  "absolute inset-0",
                  effectiveBackground.type === "none" &&
                    "bg-transparency-checker",
                )}
                data-bg-source-url={
                  effectiveBackground.type === "image" &&
                  effectiveBackground.sourceUrl &&
                  effectiveBackground.sourceUrl !== effectiveBackground.value
                    ? effectiveBackground.sourceUrl
                    : undefined
                }
                style={{
                  ...backgroundCss(effectiveBackground),
                  filter: filterCssFor(filterStackBase),
                }}
              />
              {filterLayers.map((layer) => {
                const layerFilter = filterCssFor(layer.filter);
                return (
                  <div
                    key={layer.id}
                    aria-hidden
                    className={cn(
                      "absolute inset-0",
                      effectiveBackground.type === "none" &&
                        "bg-transparency-checker",
                    )}
                    data-bg-source-url={
                      effectiveBackground.type === "image" &&
                      effectiveBackground.sourceUrl &&
                      effectiveBackground.sourceUrl !==
                        effectiveBackground.value
                        ? effectiveBackground.sourceUrl
                        : undefined
                    }
                    style={{
                      ...backgroundCss(effectiveBackground),
                      filter: layerFilter,
                      opacity: `var(${filterLayerOpacityVar(layer.id)}, ${layer.restOpaque ? 1 : 0})`,
                    }}
                  />
                );
              })}
            </>
          ) : hasBgStack && effectiveBgBase ? (
            <>
              <div
                aria-hidden
                className={cn(
                  "absolute inset-0",
                  effectiveBgBase.type === "none" && "bg-transparency-checker",
                )}
                data-bg-source-url={
                  effectiveBgBase.type === "image" &&
                  effectiveBgBase.sourceUrl &&
                  effectiveBgBase.sourceUrl !== effectiveBgBase.value
                    ? effectiveBgBase.sourceUrl
                    : undefined
                }
                style={{
                  ...backgroundCss(effectiveBgBase),
                  filter: filterValue,
                }}
              />
              {effectiveBgLayers.map((layer) => (
                <div
                  key={layer.id}
                  aria-hidden
                  className={cn(
                    "absolute inset-0",
                    layer.background.type === "none" &&
                      "bg-transparency-checker",
                  )}
                  data-bg-source-url={
                    layer.background.type === "image" &&
                    layer.background.sourceUrl &&
                    layer.background.sourceUrl !== layer.background.value
                      ? layer.background.sourceUrl
                      : undefined
                  }
                  style={{
                    ...backgroundCss(layer.background),
                    filter: filterValue,
                    opacity: `var(${backgroundLayerOpacityVar(layer.id)}, ${layer.restOpaque ? 1 : 0})`,
                  }}
                />
              ))}
            </>
          ) : (
            <div
              aria-hidden
              className={cn(
                "absolute inset-0",
                effectiveBackground.type === "none" &&
                  "bg-transparency-checker",
              )}
              data-bg-source-url={
                effectiveBackground.type === "image" &&
                effectiveBackground.sourceUrl &&
                effectiveBackground.sourceUrl !== effectiveBackground.value
                  ? effectiveBackground.sourceUrl
                  : undefined
              }
              style={{
                ...backgroundCss(effectiveBackground),
                filter: filterValue,
              }}
            />
          )}

          {/* Underlay Overlays */}
          {animateOverlayStack && animateOverlayStack.layers.length > 0 ? (
            <>
              {animateOverlayStack.base.position === "underlay"
                ? (() => {
                    const baseStyle = overlayLayerCss(
                      animateOverlayStack.base,
                      OVERLAY_BASE_OPACITY_VAR,
                      0,
                    );
                    return baseStyle ? (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-cover bg-center"
                        style={baseStyle}
                      />
                    ) : null;
                  })()
                : null}
              {overlayLayers.map((layer) => {
                if (layer.overlay.position !== "underlay") return null;
                const style = overlayLayerCss(
                  layer.overlay,
                  overlayLayerOpacityVar(layer.id),
                  layer.restOpaque ? 1 : 0,
                );
                if (!style) return null;
                return (
                  <div
                    key={layer.id}
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-cover bg-center"
                    style={style}
                  />
                );
              })}
            </>
          ) : _overlay.id !== null && _overlay.position === "underlay" ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("${resolveOverlayUrl(_overlay.id, _overlay.url)}")`,
                opacity: `var(${TOKEN_OVERLAY_OPACITY}, ${_overlay.opacity / 100})`,
              }}
            />
          ) : null}

          {/* Outer Studio Lighting Overlay */}
          {outerLightingStyle ? (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={outerLightingStyle}
            />
          ) : null}

          {/* Film Grain / Noise Overlay */}
          {noiseEnabled && noiseUrl ? (
            <div
              aria-hidden
              data-noise-canvas
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `url(${noiseUrl})`,
                backgroundRepeat: "repeat",
                opacity: `var(${TOKEN_BACKDROP_NOISE_PREVIEW}, ${noiseOpacity})`,
                mixBlendMode: "overlay",
              }}
            />
          ) : null}
        </div>
      </div>
    );
  },
);

CanvasBackdrop.displayName = "CanvasBackdrop";
