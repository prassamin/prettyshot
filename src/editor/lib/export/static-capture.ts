import { toJpeg, toBlob } from "html-to-image";
import {
  buildExportFilename,
  DEFAULT_EXPORT_FILENAME_FORMAT,
  
  getExportTemplateLabel,
} from "./filename";
import type { ExportFormat, ExportResolution, CopyResolution, ExportCaptureOptions } from "./types";
import { EXPORT_RESOLUTION_WIDTHS, EXPORT_FORMAT_EXTENSION, COPY_RESOLUTION_WIDTHS } from "./types";
import { WATERMARK_LOGO_SRC } from "./watermark";
import {
  findCanvasElement,
  getCanvasLayoutDims,
  prepareExportNode,
  rewriteExportAssets,
  waitForExportAssets,
  embedCloneImages,
  filterExportHidden,
  getNodeBorderRadius,
  clipBlobToRoundedRect,
  triggerDownload
} from "./dom-utils";

export async function exportCanvas(
  canvasId: string,
  format: ExportFormat,
  resolution: ExportResolution,
  options: ExportCaptureOptions = { watermark: true },
): Promise<string> {
  const node = findCanvasElement(canvasId);
  if (!node) throw new Error("Canvas not found");

  const layoutDims = getCanvasLayoutDims(node);
  if (!layoutDims) throw new Error("Canvas has zero width");
  const { width: renderedWidth, height: renderedHeight } = layoutDims;

  const targetWidth = EXPORT_RESOLUTION_WIDTHS[resolution];
  const pixelRatio = targetWidth / renderedWidth;
  const outputWidth = Math.round(renderedWidth * pixelRatio);
  const outputHeight = Math.round(renderedHeight * pixelRatio);
  const borderRadius = getNodeBorderRadius(node);

  const exportTarget = prepareExportNode(
    node,
    renderedWidth,
    renderedHeight,
    options,
  );
  const { rewrites, preloadUrls } = rewriteExportAssets(exportTarget.node);
  const assetUrls = options.watermark
    ? [...preloadUrls, WATERMARK_LOGO_SRC]
    : preloadUrls;

  const baseOptions = {
    pixelRatio,
    cacheBust: false,
    filter: filterExportHidden,
    imagePlaceholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAACAAEA//8DAAAGAAVXv6vUAAAAAElFTkSuQmCC",
  } as const;

  const filename = buildExportFilename({
    format: DEFAULT_EXPORT_FILENAME_FORMAT,
    scale: resolution,
    template: getExportTemplateLabel(),
    width: outputWidth,
    height: outputHeight,
    extension: EXPORT_FORMAT_EXTENSION[format],
  });

  try {
    await waitForExportAssets(assetUrls);
    await embedCloneImages(exportTarget.node);

    if (format === "png") {
      const rawBlob = await toBlob(exportTarget.node, baseOptions);
      if (!rawBlob) throw new Error("Could not capture canvas");
      const clipped = await clipBlobToRoundedRect(
        rawBlob,
        outputWidth,
        outputHeight,
        borderRadius * pixelRatio,
      );
      const url = URL.createObjectURL(clipped);
      try {
        triggerDownload(url, filename);
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      return filename;
    }
    if (format === "jpeg") {
      const url = await toJpeg(exportTarget.node, {
        ...baseOptions,
        backgroundColor: "#ffffff",
        quality: 0.95,
      });
      triggerDownload(url, filename);
      return filename;
    }

    const pngBlob = await toBlob(exportTarget.node, baseOptions);
    if (!pngBlob) throw new Error("Could not capture canvas");
    const bitmap = await createImageBitmap(pngBlob);
    const offscreen = document.createElement("canvas");
    offscreen.width = bitmap.width;
    offscreen.height = bitmap.height;
    const ctx = offscreen.getContext("2d");
    if (!ctx) throw new Error("Could not get 2d context");
    ctx.drawImage(bitmap, 0, 0);
    const webpBlob: Blob | null = await new Promise((resolve) =>
      offscreen.toBlob(resolve, "image/webp", 0.95),
    );
    if (!webpBlob) throw new Error("Could not encode WebP");
    const objectUrl = URL.createObjectURL(webpBlob);
    try {
      triggerDownload(objectUrl, filename);
    } finally {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
    return filename;
  } finally {
    for (const rewrite of rewrites.reverse()) {
      rewrite.restore();
    }
    exportTarget.cleanup();
  }
}

export async function copyCanvasAsPng(
  canvasId: string,
  resolution: CopyResolution = "1080p",
  options: ExportCaptureOptions = { watermark: true },
): Promise<void> {
  if (!navigator?.clipboard?.write) {
    throw new Error("Clipboard write is not supported");
  }

  const blob = await captureCanvasAsPngBlob(
    canvasId,
    COPY_RESOLUTION_WIDTHS[resolution],
    options,
  );

  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": blob,
    }),
  ]);
}

export async function captureCanvasAsPngBlob(
  canvasId: string,
  targetWidth = 1920,
  options: ExportCaptureOptions = {},
): Promise<Blob> {
  const node = findCanvasElement(canvasId);
  if (!node) throw new Error("Canvas not found");

  const layoutDims = getCanvasLayoutDims(node);
  if (!layoutDims) throw new Error("Canvas has zero width");
  const { width: renderedWidth, height: renderedHeight } = layoutDims;

  const pixelRatio = targetWidth / renderedWidth;

  const exportTarget = prepareExportNode(
    node,
    renderedWidth,
    renderedHeight,
    options,
  );
  const { rewrites, preloadUrls } = rewriteExportAssets(exportTarget.node);
  const assetUrls = options.watermark
    ? [...preloadUrls, WATERMARK_LOGO_SRC]
    : preloadUrls;

  try {
    await waitForExportAssets(assetUrls);
    await embedCloneImages(exportTarget.node);

  const captureOptions = {
    pixelRatio,
    cacheBust: false,
    filter: filterExportHidden,
    imagePlaceholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAACAAEA//8DAAAGAAVXv6vUAAAAAElFTkSuQmCC",
  } as const;

    let blob: Blob | null = null;
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        blob = await toBlob(exportTarget.node, captureOptions);
        if (blob) break;
      } catch (raw) {
        lastError = raw;
      }
    }
    if (!blob) {
      const msg =
        lastError instanceof Error
          ? lastError.message
          : lastError instanceof DOMException
            ? lastError.message
            : typeof lastError === "string"
              ? lastError
              : "Canvas capture failed — try again";
      throw new Error(msg);
    }
    return blob;
  } finally {
    for (const rewrite of rewrites.reverse()) {
      rewrite.restore();
    }
    exportTarget.cleanup();
  }
}
