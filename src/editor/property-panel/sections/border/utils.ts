import { extractHexPalette } from "@/editor/lib/color";
import { BORDER_COLOR_PRESETS } from "./constants";

/**
 * Derives a dynamic 6-color palette from the background or screenshot image.
 */
export async function deriveDynamicPalette(
  bgType: string,
  bgValue: string,
  bgThumbUrl: string | null | undefined,
  screenshotSrc: string | null | undefined,
): Promise<string[]> {
  let imageUrl: string | null = null;

  if (bgType === "image") {
    imageUrl = bgThumbUrl ?? bgValue;
  } else if (screenshotSrc) {
    imageUrl = screenshotSrc;
  }

  if (imageUrl) {
    try {
      const extracted = await extractHexPalette(imageUrl, 4);
      return assembleFinalPresets(extracted);
    } catch {
      return assembleFinalPresets([]);
    }
  }

  if (bgType === "gradient" || bgType === "solid") {
    const hexMatches = bgValue.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
    return assembleFinalPresets(hexMatches.slice(0, 4));
  }

  return assembleFinalPresets([]);
}

function assembleFinalPresets(extractedColors: string[]): string[] {
  const merged = extractedColors.length > 0
    ? [...new Set(["#ffffff", "#0f172a", ...extractedColors].map((c) => c.toLowerCase()))]
    : [...BORDER_COLOR_PRESETS];

  const presets = [...merged];
  while (presets.length < 6) {
    const fallback = BORDER_COLOR_PRESETS[presets.length];
    if (fallback) presets.push(fallback);
    else break;
  }
  return presets.slice(0, 6);
}
