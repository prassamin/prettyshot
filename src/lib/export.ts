import { toPng, toJpeg, toCanvas } from "html-to-image";

interface CaptureOptions {
  format: "png" | "jpg" | "webp";
  scale: number;
}

export async function captureElement(
  element: HTMLElement,
  options: CaptureOptions,
): Promise<string> {
  const { format, scale } = options;
  const opts = { pixelRatio: scale, quality: 0.95 };

  if (format === "jpg") {
    return toJpeg(element, opts);
  }
  if (format === "webp") {
    const canvas = await toCanvas(element, opts);
    return canvas.toDataURL("image/webp", 0.95);
  }
  // default png
  return toPng(element, opts);
}

export function downloadImage(
  dataUrl: string,
  filename: string,
  format: "png" | "jpg" | "webp",
) {
  const name = filename.replace(/\.[^.]+$/, "") || "screenshot";
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${name}-prettyshot.${format}`;
  a.click();
}

export async function copyToClipboard(dataUrl: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  await navigator.clipboard.write([
    new ClipboardItem({ [blob.type]: blob }),
  ]);
}
