import { toPng, toJpeg } from "html-to-image";

interface CaptureOptions {
  format: "png" | "jpg";
  scale: number;
}

export async function captureElement(
  element: HTMLElement,
  options: CaptureOptions,
): Promise<string> {
  const fn = options.format === "jpg" ? toJpeg : toPng;
  return fn(element, {
    pixelRatio: options.scale,
    quality: options.format === "jpg" ? 0.95 : undefined,
  });
}

export function downloadImage(
  dataUrl: string,
  filename: string,
  format: "png" | "jpg",
) {
  const ext = format === "jpg" ? "jpg" : "png";
  const name = filename.replace(/\.[^.]+$/, "") || "screenshot";
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `${name}-prettyshot.${ext}`;
  a.click();
}

export async function copyToClipboard(dataUrl: string) {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  await navigator.clipboard.write([
    new ClipboardItem({ [blob.type]: blob }),
  ]);
}
