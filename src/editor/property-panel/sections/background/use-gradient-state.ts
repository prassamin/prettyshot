/**
 * Background section — gradient editing state.
 *
 * Owns the preset/auto gradient overrides (per-option customizations) and
 * exposes the edit operations (angle, stop colors, reset) shared by the
 * gradient panels.
 */

import * as React from "react";

import { type Background } from "./types";
import { GRADIENT_PRESETS } from "./presets";
import {
  BACKGROUND_MAX_DIMENSION,
  DEFAULT_LINEAR_GRADIENT,
} from "./constants";
import {
  buildLinearGradient,
  normalizeGradientColors,
  parseLinearGradient,
  withGradientOptions,
} from "./utils";

type SetBackground = (b: Background) => void;

export function useGradientState({
  background,
  autoGradients,
  setBackground,
}: {
  background: Background;
  autoGradients: string[];
  setBackground: SetBackground;
}) {
  const [gradientOverrides, setGradientOverrides] = React.useState<
    Record<string, string>
  >({});
  const [autoGradientOverrides, setAutoGradientOverrides] = React.useState<
    Record<string, string>
  >({});

  const gradientOptions = React.useMemo(
    () =>
      withGradientOptions({
        values: GRADIENT_PRESETS,
        valuePrefix: "preset",
        overrides: gradientOverrides,
      }),
    [gradientOverrides],
  );

  const autoGradientOptions = React.useMemo(
    () =>
      withGradientOptions({
        values: autoGradients,
        valuePrefix: "auto",
        overrides: autoGradientOverrides,
      }),
    [autoGradients, autoGradientOverrides],
  );

  const activeGradientOption = React.useMemo(
    () =>
      background.type === "gradient"
        ? (gradientOptions.find(
            (option) => option.value === background.value,
          ) ?? null)
        : null,
    [background, gradientOptions],
  );

  const activeAutoGradientOption = React.useMemo(
    () =>
      background.type === "auto"
        ? (autoGradientOptions.find(
            (option) => option.value === background.value,
          ) ?? null)
        : null,
    [background, autoGradientOptions],
  );

  const gradientConfig = React.useMemo(() => {
    if (background.type !== "gradient" && background.type !== "auto")
      return null;
    const parsedGradient = parseLinearGradient(background.value);
    if (!parsedGradient) return null;
    return {
      angle: parsedGradient.angle,
      colors: normalizeGradientColors(parsedGradient.colors, 4),
    };
  }, [background]);

  const setGradientAngle = (angle: number) => {
    if (background.type !== "gradient" && background.type !== "auto") return;
    const parsedGradient =
      parseLinearGradient(background.value) ?? DEFAULT_LINEAR_GRADIENT;
    const normalizedColors = normalizeGradientColors(parsedGradient.colors, 4);
    const nextGradient = buildLinearGradient({
      angle,
      colors: normalizedColors,
    });
    if (background.type === "gradient") {
      if (!activeGradientOption) return;
      setGradientOverrides((prev) => ({
        ...prev,
        [activeGradientOption.id]: nextGradient,
      }));
      setBackground({ type: "gradient", value: nextGradient });
      return;
    }
    if (!activeAutoGradientOption) return;
    setAutoGradientOverrides((prev) => ({
      ...prev,
      [activeAutoGradientOption.id]: nextGradient,
    }));
    setBackground({ type: "auto", value: nextGradient });
  };

  const setGradientColor = (colorIndex: number, colorValue: string) => {
    if (background.type !== "gradient" && background.type !== "auto") return;
    const parsedGradient =
      parseLinearGradient(background.value) ?? DEFAULT_LINEAR_GRADIENT;
    const normalizedColors = normalizeGradientColors(parsedGradient.colors, 4);
    if (colorIndex < 0 || colorIndex >= normalizedColors.length) return;
    normalizedColors[colorIndex] = colorValue;
    const nextGradient = buildLinearGradient({
      angle: parsedGradient.angle,
      colors: normalizedColors,
    });
    if (background.type === "gradient") {
      if (!activeGradientOption) return;
      setGradientOverrides((prev) => ({
        ...prev,
        [activeGradientOption.id]: nextGradient,
      }));
      setBackground({ type: "gradient", value: nextGradient });
      return;
    }
    if (!activeAutoGradientOption) return;
    setAutoGradientOverrides((prev) => ({
      ...prev,
      [activeAutoGradientOption.id]: nextGradient,
    }));
    setBackground({ type: "auto", value: nextGradient });
  };

  const resetGradientEdits = () => {
    if (background.type !== "gradient" && background.type !== "auto") return;
    if (background.type === "gradient") {
      if (!activeGradientOption) return;
      setGradientOverrides((prev) => {
        const next = { ...prev };
        delete next[activeGradientOption.id];
        return next;
      });
      setBackground({
        type: "gradient",
        value: activeGradientOption.baseValue,
      });
      return;
    }
    if (!activeAutoGradientOption) return;
    setAutoGradientOverrides((prev) => {
      const next = { ...prev };
      delete next[activeAutoGradientOption.id];
      return next;
    });
    setBackground({ type: "auto", value: activeAutoGradientOption.baseValue });
  };

  const canResetGradient =
    background.type === "gradient"
      ? !!(
          activeGradientOption &&
          activeGradientOption.value !== activeGradientOption.baseValue
        )
      : !!(
          activeAutoGradientOption &&
          activeAutoGradientOption.value !== activeAutoGradientOption.baseValue
        );

  return {
    gradientOptions,
    autoGradientOptions,
    gradientConfig,
    setGradientAngle,
    setGradientColor,
    resetGradientEdits,
    canResetGradient,
  };
}

/** Max dimension used when downscaling picked background images. */
export { BACKGROUND_MAX_DIMENSION };
