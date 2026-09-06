import type { Background } from "@/editor/property-panel/sections/background/types";
import { colord, extend } from "colord";
import a11yPlugin from "colord/plugins/a11y";

extend([a11yPlugin]);

const FALLBACK_SWATCHES = ["#FAFAF9", "#E7E5E4", "#C4C2C0"];

export function mutedSwatches(bg: Background): string[] {
  if (bg.type === "image" || bg.type === "none") return FALLBACK_SWATCHES;
  const matches = bg.value.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
  const out: string[] = [];
  for (const hex of matches) {
    const hsl = colord(hex).toHsl();
    if (!hsl) continue;
    const sat = Math.min(28, hsl.s * 0.45);
    const lightness = hsl.l < 50 ? 78 : 82;
    const swatch = `hsl(${Math.round(hsl.h)} ${Math.round(sat)}% ${lightness}%)`;
    if (!out.includes(swatch)) out.push(swatch);
  }
  if (!out.length) return FALLBACK_SWATCHES;
  if (out.length === 1) return [out[0], FALLBACK_SWATCHES[0]];
  return out.slice(0, 3);
}

type RgbTriplet = { r: number; g: number; b: number };

const colorCache = new Map<string, RgbTriplet[]>();

function normalizeImgSrc(url: string): string {
  if (!url || url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (isSameOriginUrl(url)) return url;
  return url;
}

function isSameOriginUrl(url: string): boolean {
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

async function dominantColors(url: string, max: number): Promise<RgbTriplet[]> {
  const cached = colorCache.get(url);
  if (cached && cached.length >= max) return cached.slice(0, max);
  const result = await new Promise<RgbTriplet[]>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 64;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        const buckets = new Map<string, RgbTriplet & { n: number }>();
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 128) continue;
          const key = `${r >> 6}-${g >> 6}-${b >> 6}`;
          const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
          bucket.r += r;
          bucket.g += g;
          bucket.b += b;
          bucket.n += 1;
          buckets.set(key, bucket);
        }
        const sorted = [...buckets.values()]
          .sort((a, b) => b.n - a.n)
          .map(({ r, g, b, n }) => ({ r: r / n, g: g / n, b: b / n }));
        const picked: RgbTriplet[] = [];
        for (const c of sorted) {
          const distinct = picked.every(
            (p) =>
              Math.abs(p.r - c.r) + Math.abs(p.g - c.g) + Math.abs(p.b - c.b) > 55,
          );
          if (distinct) {
            picked.push(c);
            if (picked.length >= max) break;
          }
        }
        resolve(picked);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = normalizeImgSrc(url);
  });
  colorCache.set(url, result);
  return result;
}

function softenColor(r: number, g: number, b: number): string {
  let c = colord({ r, g, b });
  const currentSat = c.toHsl().s;
  const targetSat = Math.min(28, currentSat * 0.45);
  c = c.desaturate(Math.max(0, (currentSat - targetSat) / 100));
  const currentL = c.toHsl().l;
  const targetL = currentL < 50 ? 78 : 82;
  const delta = (targetL - currentL) / 100;
  c = delta > 0 ? c.lighten(delta) : c.darken(Math.abs(delta));
  return c.toHslString();
}

export async function extractPalette(url: string, max = 3): Promise<string[]> {
  const picked = await dominantColors(url, max);
  return picked.map(({ r, g, b }) => softenColor(r, g, b));
}

export async function extractHexPalette(url: string, max = 6): Promise<string[]> {
  const picked = await dominantColors(url, max);
  return picked.map((rgb) => colord(rgb).toHex());
}

export function buildGradients(colors: string[], max = 100): string[] {
  if (colors.length < 2) return [];
  const out: string[] = [];
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  const pairs: [string, string][] = [];
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      pairs.push([colors[i], colors[j]]);
    }
  }
  for (const deg of angles) {
    for (const [a, b] of pairs) {
      out.push(`linear-gradient(${deg}deg, ${a}, ${b})`);
      if (out.length >= max) return out;
    }
  }
  for (let i = 0; i < colors.length; i++) {
    for (let j = 0; j < colors.length; j++) {
      if (i === j) continue;
      for (let k = 0; k < colors.length; k++) {
        if (k === i || k === j) continue;
        out.push(`linear-gradient(135deg, ${colors[i]}, ${colors[j]}, ${colors[k]})`);
        if (out.length >= max) return out;
      }
    }
  }
  for (const [a, b] of pairs) {
    out.push(`radial-gradient(circle at 30% 30%, ${a}, ${b})`);
    if (out.length >= max) return out;
  }
  return out;
}

const luminanceCache = new Map<string, number>();

function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const ch = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

async function avgLuminance(url: string): Promise<number> {
  const cached = luminanceCache.get(url);
  if (cached !== undefined) return cached;
  const result = await new Promise<number>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;
          sum += luminance({ r: data[i], g: data[i + 1], b: data[i + 2] });
          count++;
        }
        resolve(count ? sum / count : 0.5);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = normalizeImgSrc(url);
  });
  luminanceCache.set(url, result);
  return result;
}

async function resolveContrast(
  screenshot: string | null,
  background: Background,
): Promise<string> {
  let lum: number | null = null;
  if (background.type === "solid") {
    const rgba = colord(background.value).toRgb();
    lum = luminance(rgba);
  } else if (background.type === "gradient") {
    const matches = background.value.match(/#[0-9a-fA-F]{3,8}/g) ?? [];
    if (matches.length) {
      lum =
        matches.reduce((s, h) => s + luminance(colord(h).toRgb()), 0) / matches.length;
    }
  } else if (background.type === "image") {
    try {
      lum = await avgLuminance(background.value);
    } catch {}
  }
  if (lum === null && screenshot) {
    try {
      lum = await avgLuminance(screenshot);
    } catch {}
  }
  if (lum === null) return "#ffffff";
  return lum > 0.5 ? "#000000" : "#ffffff";
}

async function pointLuminance(
  url: string,
  relX: number,
  relY: number,
  radius = 20,
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const cx = Math.round(relX * img.naturalWidth);
        const cy = Math.round(relY * img.naturalHeight);
        const sx = Math.max(0, cx - radius);
        const sy = Math.max(0, cy - radius);
        const sw = Math.min(radius * 2, img.naturalWidth - sx);
        const sh = Math.min(radius * 2, img.naturalHeight - sy);
        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no ctx"));
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const { data } = ctx.getImageData(0, 0, sw, sh);
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;
          sum += luminance({ r: data[i], g: data[i + 1], b: data[i + 2] });
          count++;
        }
        resolve(count ? sum / count : 0.5);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = normalizeImgSrc(url);
  });
}

export async function sampleContrastColor(
  canvasEl: HTMLElement | null,
  xPct: number,
  yPct: number,
  screenshot: string | null,
  background: Background,
): Promise<string> {
  if (canvasEl) {
    const rect = canvasEl.getBoundingClientRect();
    const clientX = rect.left + (xPct / 100) * rect.width;
    const clientY = rect.top + (yPct / 100) * rect.height;

    const elements = document.elementsFromPoint(clientX, clientY);
    const imgEl = elements.find(
      (el) =>
        el instanceof HTMLImageElement &&
        el.getAttribute("alt") === "Screenshot",
    ) as HTMLImageElement | undefined;

    if (imgEl && screenshot) {
      const imgRect = imgEl.getBoundingClientRect();
      const relX = Math.max(
        0,
        Math.min(1, (clientX - imgRect.left) / imgRect.width),
      );
      const relY = Math.max(
        0,
        Math.min(1, (clientY - imgRect.top) / imgRect.height),
      );
      try {
        const lum = await pointLuminance(screenshot, relX, relY);
        return lum > 0.5 ? "#000000" : "#ffffff";
      } catch {}
    }

    for (const el of elements) {
      if (!(el instanceof HTMLElement)) continue;
      if (canvasEl.contains(el) === false) continue;
      if (el.hasAttribute("data-export-hidden")) continue;
      if (el.hasAttribute("data-text-element-id")) continue;
      const bg = window.getComputedStyle(el).backgroundColor;
      if (!bg || bg === "transparent") continue;
      const color = colord(bg);
      if (color.alpha() <= 0.05) continue;
      const lum = luminance(color.toRgb());
      return lum > 0.5 ? "#000000" : "#ffffff";
    }
  }

  return resolveContrast(null, background);
}
