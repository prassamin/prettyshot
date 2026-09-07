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

      // Find the TRUE screen hole as the largest transparent region that is
      // fully enclosed by opaque pixels (the device body). A simple "bbox of
      // transparent pixels" fails on laptops/open-lid shapes: the transparent
      // margins around the base/keyboard inflate the box. Instead run a
      // scanline connected-component pass (run-level union-find, O(pixels))
      // and keep the biggest region that never touches the canvas edge —
      // that region IS the screen cutout, for phones, laptops, monitors, etc.
      const alphaAt = (i: number) => data[i * 4 + 3] ?? 255;
      const isOpaque = (i: number) => alphaAt(i) > 128;
      const step = Math.max(1, Math.floor(Math.min(w, h) / 300));

      // Downsample the read: sample every `step` px per row/col.
      const sw = Math.ceil(w / step);
      const sh = Math.ceil(h / step);
      const sample: Uint8Array = new Uint8Array(sw * sh);
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const px = Math.min(w - 1, x * step);
          const py = Math.min(h - 1, y * step);
          sample[y * sw + x] = isOpaque(py * w + px) ? 1 : 0;
        }
      }

      // Union-find over runs of transparent pixels per row.
      const parent: number[] = [];
      const size: number[] = [];
      const bx0: number[] = [];
      const by0: number[] = [];
      const bx1: number[] = [];
      const by1: number[] = [];
      const touchesEdge = new Set<number>();
      const find = (i: number): number => {
        while (parent[i] !== i) {
          parent[i] = parent[parent[i]];
          i = parent[i];
        }
        return i;
      };
      const union = (a: number, b: number) => {
        let ra = find(a);
        let rb = find(b);
        if (ra === rb) return ra;
        if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
        parent[rb] = ra;
        size[ra] += size[rb];
        bx0[ra] = Math.min(bx0[ra], bx0[rb]);
        by0[ra] = Math.min(by0[ra], by0[rb]);
        bx1[ra] = Math.max(bx1[ra], bx1[rb]);
        by1[ra] = Math.max(by1[ra], by1[rb]);
        return ra;
      };

      let nextId = 0;
      let prevRow: Array<[number, number, number]> = []; // [start,end,comp]

      for (let y = 0; y < sh; y++) {
        const row: Array<[number, number, number]> = [];
        let runStart = -1;
        for (let x = 0; x <= sw; x++) {
          const transparent = x < sw && sample[y * sw + x] === 0;
          if (transparent && runStart === -1) runStart = x;
          if ((!transparent || x === sw) && runStart !== -1) {
            const s = runStart;
            const e = x - 1;
            runStart = -1;
            // Find previous-row components overlapping [s,e]
            let comp = -1;
            for (const [ps, pe, pc] of prevRow) {
              if (s <= pe && e >= ps) {
                comp = comp === -1 ? pc : union(comp, pc);
              }
            }
            if (comp === -1) {
              comp = nextId++;
              parent[comp] = comp;
              size[comp] = 0;
              bx0[comp] = s;
              by0[comp] = y;
              bx1[comp] = e;
              by1[comp] = y;
            }
            const root = find(comp);
            // grow bbox + size
            bx0[root] = Math.min(bx0[root], s);
            by0[root] = Math.min(by0[root], y);
            bx1[root] = Math.max(bx1[root], e);
            by1[root] = Math.max(by1[root], y);
            size[root] += e - s + 1;
            if (s <= 0 || e >= sw - 1 || y <= 0 || y >= sh - 1) {
              touchesEdge.add(root);
            }
            row.push([s, e, root]);
          }
        }
        prevRow = row;
      }

      // Largest enclosed (non-edge) component = the screen cutout.
      let best = -1;
      let bestPx = 0;
      for (let c = 0; c < nextId; c++) {
        if (touchesEdge.has(c)) continue;
        if (size[c] > 100 && size[c] > bestPx) {
          bestPx = size[c];
          best = c;
        }
      }

      if (best !== -1) {
        // Scale sampled coords back to real pixels.
        const minX = bx0[best] * step;
        const minY = by0[best] * step;
        const maxX = Math.min(w - 1, (bx1[best] + 1) * step - 1);
        const maxY = Math.min(h - 1, (by1[best] + 1) * step - 1);
        const screenW = maxX - minX;
        const screenH = maxY - minY;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Raw hole scale (holeW / frameW). Bump by ~1% so the screen tucks a
        // hair under the anti-aliased bezel edge — under-fill shows as a gap
        // at full zoom, while a 1% over-fill is hidden by the opaque frame.
        const rawScale = screenW / w;
        const scale = Number((rawScale * 1.01).toFixed(3));
        const offsetX = Number((((centerX - w / 2) / w) * 100).toFixed(2));
        const offsetY = Number((((centerY - h / 2) / h) * 100).toFixed(2));

        return {
          aspectRatio: `${w} / ${h}`,
          screen: {
            aspectRatio: `${screenW} / ${screenH}`,
            scale: Math.max(0.2, Math.min(1.5, scale)),
            offsetX: Math.abs(offsetX) > 0.1 ? offsetX : 0,
            offsetY: Math.abs(offsetY) > 0.1 ? offsetY : 0,
            // Rough corner radius: ~20% of the smaller screen dimension
            // (typical for modern phones); fine-tune in the visual editor.
            borderRadius: Math.max(
              8,
              Math.round(Math.min(screenW, screenH) * 0.2),
            ),
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