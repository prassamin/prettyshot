"use client";

import * as React from "react";

import {
  overlayLayerOpacityVar,
  OVERLAY_BASE_OPACITY_VAR,
  type AnimateOverlayStack,
} from "@/editor/lib/animation/playback";
import type { OverlayConfig } from "@/editor/property-panel/sections/backdrop/types";
import { resolveOverlayUrl } from "@/editor/property-panel/sections/backdrop/utils";
import { overlayLayerCss } from "@/editor/lib/canvas-helpers";
import { TOKEN_OVERLAY_OPACITY } from "@/editor/property-panel/sections/backdrop/constants";

type CanvasOverlayLayerProps = {
  overlay: OverlayConfig;
  animateOverlayStack?: AnimateOverlayStack;
};

export const CanvasOverlayLayer = React.memo(
  ({ overlay, animateOverlayStack }: CanvasOverlayLayerProps) => {
    if (animateOverlayStack && animateOverlayStack.layers.length > 0) {
      return (
        <>
          {animateOverlayStack.base.position === "overlay"
            ? (() => {
                const style = overlayLayerCss(
                  animateOverlayStack.base,
                  OVERLAY_BASE_OPACITY_VAR,
                  0,
                );
                return style ? (
                  <div
                    aria-hidden
                    data-export-stack="foreground"
                    className="pointer-events-none absolute inset-0 bg-cover bg-center"
                    style={{ ...style, zIndex: 200 }}
                  />
                ) : null;
              })()
            : null}
          {animateOverlayStack.layers.map((layer) => {
            if (layer.overlay.position !== "overlay") return null;
            const style = overlayLayerCss(
              layer.overlay,
              overlayLayerOpacityVar(layer.id),
              layer.restOpaque ? 1 : 0,
            );
            return style ? (
              <div
                key={layer.id}
                aria-hidden
                data-export-stack="foreground"
                className="pointer-events-none absolute inset-0 bg-cover bg-center"
                style={{ ...style, zIndex: 200 }}
              />
            ) : null;
          })}
        </>
      );
    }

    if (overlay.id !== null && overlay.position === "overlay") {
      return (
        <div
          aria-hidden
          data-export-stack="foreground"
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("${resolveOverlayUrl(overlay.id, overlay.url)}")`,
            opacity: `var(${TOKEN_OVERLAY_OPACITY}, ${overlay.opacity / 100})`,
            zIndex: 200,
          }}
        />
      );
    }

    return null;
  },
);

CanvasOverlayLayer.displayName = "CanvasOverlayLayer";
