/**
 * Background section — auto-gradient extraction.
 *
 * Samples the dominant colors of the screenshot and builds a set of
 * matching gradients ("Auto" background type). Reports a status so the UI
 * can show idle / loading / error / ready states.
 */

import * as React from "react";

import { buildGradients, extractHexPalette } from "@/editor/lib/color";

type AutoResult = {
  key: string;
  gradients: string[];
  error: boolean;
};

export type AutoGradientStatus = "idle" | "loading" | "ready" | "error";

export function useAutoGradients(screenshot: string | null) {
  const [autoResult, setAutoResult] = React.useState<AutoResult | null>(null);

  React.useEffect(() => {
    if (!screenshot) return;
    let cancelled = false;
    extractHexPalette(screenshot, 6)
      .then((colors) => {
        if (cancelled) return;
        const gradients = buildGradients(colors, 100);
        setAutoResult({
          key: screenshot,
          gradients,
          error: gradients.length === 0,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setAutoResult({ key: screenshot, gradients: [], error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [screenshot]);

  const autoGradients = React.useMemo(
    () =>
      autoResult && screenshot && autoResult.key === screenshot
        ? autoResult.gradients
        : [],
    [autoResult, screenshot],
  );

  const autoStatus: AutoGradientStatus = !screenshot
    ? "idle"
    : !autoResult || autoResult.key !== screenshot
      ? "loading"
      : autoResult.error
        ? "error"
        : "ready";

  return { autoGradients, autoStatus };
}
