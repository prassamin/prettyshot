/**
 * Crop source — loads a media URL into a decodable image and renders
 * cropped regions back out as PNG data URLs.
 *
 * `createCropSource` returns a `CropSource` with the natural dimensions +
 * a `release()` so the caller can free the loaded image; the modal keeps
 * the source alive through its close animation before releasing.
 */

import type { CropRegion } from "./types";

export interface CropSource {
  previewUrl: string;
  width: number;
  height: number;
  release: () => void;
  image: HTMLImageElement;
}

export async function createCropSource(url: string): Promise<CropSource> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  const promise = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Failed to load image"));
  });
  image.src = url;
  await promise;

  return {
    previewUrl: url,
    width: image.naturalWidth,
    height: image.naturalHeight,
    release: () => {
      
      image.src = "";
    },
    image,
  };
}

export async function cropSourceFromBlob(blob: Blob): Promise<CropSource> {
  const url = URL.createObjectURL(blob);
  const source = await createCropSource(url);
  return {
    ...source,
    previewUrl: url,
    release: () => {
      source.release();
      URL.revokeObjectURL(url);
    },
  };
}

export async function renderCroppedImage(
  source: CropSource,
  region: CropRegion,
): Promise<string> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  const cropX = (source.width * region.x) / 100;
  const cropY = (source.height * region.y) / 100;
  const cropWidth = (source.width * region.width) / 100;
  const cropHeight = (source.height * region.height) / 100;

  canvas.width = cropWidth;
  canvas.height = cropHeight;

  ctx.drawImage(
    source.image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  return canvas.toDataURL("image/png");
}
