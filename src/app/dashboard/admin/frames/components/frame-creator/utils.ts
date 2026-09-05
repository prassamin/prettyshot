import { toast } from "@heroui/react";

import type { FrameGeometry } from "@/app/actions/frames";

export const VARIANT_PALETTE = [
  "#1c1c1e", // black
  "#e2e3e7", // silver
  "#f5f5f7", // white
  "#6e6e73", // grey
  "#e0645c", // cosmic orange
  "#1e3a5f", // deep blue
  "#8e8cd8", // lavender
  "#b7c9d3", // mist blue
  "#7d7f7a", // sage
  "#3b3a36", // space black
  "#d6d3cd", // starlight
  "#b0b4bd", // space gray
  "#2ec4b6", // teal
  "#d4a537", // gold
  "#c2352f", // red
];

export function colorForVariant(
  name: string,
  colors: Record<string, string>,
): string {
  const trimmed = name.trim();
  if (!trimmed) return "#6b7280";
  if (colors[trimmed]) return colors[trimmed];
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) >>> 0;
  }
  return VARIANT_PALETTE[hash % VARIANT_PALETTE.length];
}

export const DEFAULT_GEOMETRY: FrameGeometry = {
  aspectRatio: "1 / 2",
  screen: {
    aspectRatio: "0.9 / 1.64",
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    borderRadius: 28,
  },
};

/**
 * Intelligent geometry detection: scans transparent cutout in frame PNG
 * to compute exact screen aspect ratio, scale, offsets, and corner radius.
 */
export function detectGeometry(img: HTMLImageElement): FrameGeometry {
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  if (!w || !h) return DEFAULT_GEOMETRY;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Find bounding box of inner transparent pixels (alpha < 15)
      // Check from a generous inner margin to avoid outer transparent borders
      let minX = w;
      let maxX = 0;
      let minY = h;
      let maxY = 0;
      let transparentCount = 0;

      const step = Math.max(1, Math.floor(Math.min(w, h) / 400));

      for (let y = Math.floor(h * 0.05); y < Math.floor(h * 0.95); y += step) {
        for (let x = Math.floor(w * 0.05); x < Math.floor(w * 0.95); x += step) {
          const idx = (y * w + x) * 4;
          const alpha = data[idx + 3] ?? 255;
          if (alpha < 25) {
            transparentCount++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (transparentCount > 50 && maxX > minX && maxY > minY) {
        const screenW = maxX - minX;
        const screenH = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const scale = Number((screenW / w).toFixed(3));
        const offsetX = Number((((centerX - w / 2) / w) * 100).toFixed(2));
        const offsetY = Number((((centerY - h / 2) / h) * 100).toFixed(2));

        return {
          aspectRatio: `${w} / ${h}`,
          screen: {
            aspectRatio: `${screenW} / ${screenH}`,
            scale: Math.max(0.2, Math.min(1.5, scale)),
            offsetX: Math.abs(offsetX) > 0.1 ? offsetX : 0,
            offsetY: Math.abs(offsetY) > 0.1 ? offsetY : 0,
            borderRadius: Math.max(0, Math.round(Math.min(screenW, screenH) * 0.04)),
          },
        };
      }
    }
  } catch (err) {
    console.warn("Pixel scan failed, falling back to dimension ratio:", err);
  }

  // Fallback calculation
  const isLandscape = w > h;
  const screenW = Math.round(w * (isLandscape ? 0.9 : 0.88));
  const screenH = Math.round(h * (isLandscape ? 0.82 : 0.88));
  const offsetY = isLandscape ? -8 : 0;

  return {
    aspectRatio: `${w} / ${h}`,
    screen: {
      aspectRatio: `${screenW} / ${screenH}`,
      scale: 1,
      offsetX: 0,
      offsetY,
      borderRadius: Math.max(8, Math.round(Math.min(w, h) * 0.015)),
    },
  };
}

export function detectGeometryFromFile(
  file: File,
  onDetected: (geometry: FrameGeometry) => void,
  onDone: () => void,
) {
  const url = URL.createObjectURL(file);
  const probe = new Image();
  probe.onload = () => {
    onDetected(detectGeometry(probe));
    onDone();
    URL.revokeObjectURL(url);
    toast.success("Geometry auto-detected from frame");
  };
  probe.onerror = () => {
    onDone();
    URL.revokeObjectURL(url);
  };
  probe.src = url;
}