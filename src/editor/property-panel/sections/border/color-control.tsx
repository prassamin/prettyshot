"use client";

import * as React from "react";
import { PaletteGrid } from "../../components";
import type { Border } from "./types";
import { BORDER_COLOR_PRESETS } from "./constants";
import { deriveDynamicPalette } from "./utils";

interface ColorControlProps {
  border: Border;
  disabled?: boolean;
  onApplyBorder: (nextBorder: Border) => void;
  background: { type: string; value: string; thumbUrl?: string | null };
  screenshotSrc: string | null | undefined;
}

export function ColorControl({
  border,
  disabled = false,
  onApplyBorder,
  background,
  screenshotSrc,
}: ColorControlProps) {
  const [swatchPresets, setSwatchPresets] = React.useState<string[]>([]);
  const isBorderActive = border.color !== null;
  const activeColor = border.color || BORDER_COLOR_PRESETS[0];

  React.useEffect(() => {
    let isSubscribed = true;
    deriveDynamicPalette(
      background.type,
      background.value,
      background.thumbUrl,
      screenshotSrc,
    ).then((palette) => {
      if (isSubscribed) setSwatchPresets(palette);
    });
    return () => {
      isSubscribed = false;
    };
  }, [background.thumbUrl, background.type, background.value, screenshotSrc]);

  const isCustomColor =
    isBorderActive &&
    !swatchPresets.some((c) => c.toLowerCase() === activeColor.toLowerCase());

  return (
    <PaletteGrid
      presets={swatchPresets}
      disabled={disabled}
      selected={isBorderActive ? activeColor : null}
      onSelect={(hex) => onApplyBorder({ ...border, color: hex })}
      customColor={isCustomColor ? activeColor : BORDER_COLOR_PRESETS[0]}
      onCustomColor={(hex) => onApplyBorder({ ...border, color: hex })}
      isCustom={isCustomColor}
      size="sm"
      shape="square"
      columnsClassName="grid grid-cols-7 gap-1"
      customLabel="Custom border color"
    />
  );
}
