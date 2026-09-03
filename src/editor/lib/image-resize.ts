/**
 * Image Resize & Optimization Utilities
 *
 * Provides offscreen canvas decoding, aspect-preserving downscaling, and compression
 * for user-uploaded files, dragged assets, and remote wallpaper backgrounds.
 */

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_MAX_RAW_BYTES = 800 * 1024;
const DEFAULT_JPEG_QUALITY = 0.85;

export interface DownscaleOptions {
  maxDimension?: number;
  maxRawBytes?: number;
  jpegQuality?: number;
}

interface DownscaleSourceOptions extends DownscaleOptions {
  isPng?: boolean;
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("FileReader did not return a string"));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

async function decodeBlob(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob);
    } catch {}
  }
  const dataUrl = await readBlobAsDataUrl(blob);
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = dataUrl;
  });
}

function loadImageWithCors(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = url;
  });
}

function getDims(source: ImageBitmap | HTMLImageElement): {
  width: number;
  height: number;
} {
  if ("naturalWidth" in source) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  return { width: source.width, height: source.height };
}

function downscaleSource(
  source: ImageBitmap | HTMLImageElement,
  { width, height }: { width: number; height: number },
  options: DownscaleSourceOptions,
): string | null {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const jpegQuality = options.jpegQuality ?? DEFAULT_JPEG_QUALITY;

  const longest = Math.max(width, height);
  const scale = longest > maxDimension ? maxDimension / longest : 1;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  const keepPng = options.isPng === true;
  const mimeType = keepPng ? "image/png" : "image/jpeg";
  const quality = keepPng ? undefined : jpegQuality;
  try {
    return canvas.toDataURL(mimeType, quality);
  } catch {
    return null;
  }
}

/**
 * Resizes a File object offscreen if its dimensions or byte size exceed limits.
 */
export async function downscaleImageFile(
  file: File,
  options: DownscaleOptions = {},
): Promise<string> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const maxRawBytes = options.maxRawBytes ?? DEFAULT_MAX_RAW_BYTES;

  const source = await decodeBlob(file);
  const dims = getDims(source);
  const longest = Math.max(dims.width, dims.height);
  const needsResize = longest > maxDimension;
  const needsReencode = file.size > maxRawBytes;

  if (!needsResize && !needsReencode) {
    if ("close" in source) source.close();
    return await readBlobAsDataUrl(file);
  }

  const result = downscaleSource(source, dims, {
    ...options,
    isPng: file.type === "image/png",
  });
  if ("close" in source) source.close();
  return result ?? (await readBlobAsDataUrl(file));
}

/**
 * Reads an image file into a Data URL, optionally downscaling if larger than threshold bytes.
 */
export async function readImageFileAsDataUrl(
  file: File,
  options: {
    downscaleAbove?: number;
    maxDimension?: number;
    jpegQuality?: number;
  } = {},
): Promise<string> {
  const threshold = options.downscaleAbove ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(threshold) || file.size <= threshold) {
    return await readBlobAsDataUrl(file);
  }
  return await downscaleImageFile(file, {
    maxDimension: options.maxDimension ?? 2400,
    maxRawBytes: 0,
    jpegQuality: options.jpegQuality ?? 0.9,
  });
}

const urlCache = new Map<string, Promise<string>>();
const resolvedUrlCache = new Map<string, string>();

function cacheKeyFor(url: string, options: DownscaleOptions): string {
  const dim = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const q = options.jpegQuality ?? DEFAULT_JPEG_QUALITY;
  return `${url}|${dim}|${q}`;
}

/**
 * Returns synchronously cached downscaled Data URL for a remote URL if available.
 */
export function getOptimizedUrlSync(
  url: string,
  options: DownscaleOptions = {},
): string | null {
  if (!url || url.startsWith("data:")) return url || null;
  const key = cacheKeyFor(url, options);
  return resolvedUrlCache.get(key) ?? null;
}

async function fetchBlobForDownscale(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url, { credentials: "omit" });
    if (response.ok) return await response.blob();
  } catch {}
  return null;
}

/**
 * Fetches a remote image URL, downscales it offscreen, and caches the result.
 */
export function downscaleImageFromUrl(
  url: string,
  options: DownscaleOptions = {},
): Promise<string> {
  if (!url || url.startsWith("data:")) return Promise.resolve(url);
  const cacheKey = cacheKeyFor(url, options);
  const cached = urlCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const blob = await fetchBlobForDownscale(url);
    if (blob) {
      try {
        const source = await decodeBlob(blob);
        const dims = getDims(source);
        const result = downscaleSource(source, dims, {
          ...options,
          isPng: blob.type === "image/png",
        });
        if ("close" in source) source.close();
        if (result) {
          resolvedUrlCache.set(cacheKey, result);
          return result;
        }
      } catch {}
    }

    try {
      const img = await loadImageWithCors(url);
      const dims = getDims(img);
      const result = downscaleSource(img, dims, options);
      if (result) {
        resolvedUrlCache.set(cacheKey, result);
        return result;
      }
    } catch {}

    return url;
  })();

  urlCache.set(cacheKey, promise);
  promise.catch(() => urlCache.delete(cacheKey));
  return promise;
}
