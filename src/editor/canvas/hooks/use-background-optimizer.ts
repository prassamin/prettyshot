"use client";

import * as React from "react";

import {
  downscaleImageFromUrl,
  getOptimizedUrlSync,
} from "@/editor/lib/image-resize";
import { useEditorEngine } from "@/editor/lib/engine";
import type { Background } from "@/editor/property-panel/sections/background/types";

const BACKGROUND_OPTIMIZATION_CONFIG = {
  maxDimension: 1600,
  jpegQuality: 0.9,
};

/**
 * Automatically optimizes remote background image assets by downscaling high-resolution
 * pictures and caching them locally to ensure snappy canvas re-renders and smooth exports.
 */
export function useBackgroundOptimizer(
  background: Background,
  skipOptimization: boolean,
) {
  React.useEffect(() => {
    if (
      background.type !== "image" ||
      !background.sourceUrl ||
      skipOptimization
    ) {
      return;
    }

    const { sourceUrl } = background;
    const thumbUrl = background.thumbUrl ?? undefined;

    const commitOptimizedBackground = (dataUrl: string) => {
      useEditorEngine.getState().setBackground(
        {
          type: "image",
          value: dataUrl,
          sourceUrl,
          thumbUrl,
        },
        { silent: true },
      );
    };

    // Already a data URL / locally optimized
    if (background.value.startsWith("data:")) return;

    // Check synchronous memory cache first
    const cachedDataUrl = getOptimizedUrlSync(
      sourceUrl,
      BACKGROUND_OPTIMIZATION_CONFIG,
    );
    if (cachedDataUrl) {
      commitOptimizedBackground(cachedDataUrl);
      return;
    }

    // Perform async downscaling
    let isMounted = true;
    void downscaleImageFromUrl(sourceUrl, BACKGROUND_OPTIMIZATION_CONFIG)
      .then((optimizedDataUrl) => {
        if (!isMounted) return;
        const currentBackground = useEditorEngine.getState().present.background;
        if (
          currentBackground.type === "image" &&
          currentBackground.sourceUrl === sourceUrl
        ) {
          commitOptimizedBackground(optimizedDataUrl);
        }
      })
      .catch(() => {
        // Fallback silently if remote CORS blocks canvas extraction
      });

    return () => {
      isMounted = false;
    };
  }, [
    background.sourceUrl,
    background.type,
    background.value,
    background.thumbUrl,
    skipOptimization,
  ]);
}
