import { toCanvas, getFontEmbedCSS } from "html-to-image";
import { supportsObjectViewBox } from "@/editor/lib/crop-utils";
import type { AnimationCapture, ExportCaptureOptions } from "./types";
import {
  findCanvasElement,
  getCanvasLayoutDims,
  prepareExportNode,
  rewriteExportAssets,
  waitForExportAssets,
  embedCloneImages,
  embedCloneBackgroundImages,
  filterExportHidden,
  XHTML_NS,
  SVG_NS,
  collectDocumentCss,
  findNearestContainerContext,
  withBakedComputedStyles
} from "./dom-utils";

async function warmUpWebKitCapture(captureFrame: () => Promise<unknown>) {
  if (supportsObjectViewBox()) return;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await captureFrame();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
}

export async function prepareAnimationCapture(
  canvasId: string,
  targetWidth = 1280,
): Promise<AnimationCapture> {
  const node = findCanvasElement(canvasId);
  if (!node) throw new Error("Canvas not found");

  const layoutDims = getCanvasLayoutDims(node);
  if (!layoutDims) throw new Error("Canvas has zero width");
  const { width: renderedWidth, height: renderedHeight } = layoutDims;

  const pixelRatio = targetWidth / renderedWidth;
  const outputWidth = Math.round(renderedWidth * pixelRatio);
  const outputHeight = Math.round(renderedHeight * pixelRatio);

  const exportTarget = prepareExportNode(
    node,
    renderedWidth,
    renderedHeight,
    {},
  );
  const { rewrites, preloadUrls } = rewriteExportAssets(exportTarget.node);

  await waitForExportAssets(preloadUrls);
  await embedCloneImages(exportTarget.node);

  await embedCloneBackgroundImages(exportTarget.node);

  const captureOptions = {
    pixelRatio,
    cacheBust: false,
    filter: filterExportHidden,
    imagePlaceholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAACAAEA//8DAAAGAAVXv6vUAAAAAElFTkSuQmCC",
  } as const;

  const captureFrame = async () => {
    const canvas = await toCanvas(exportTarget.node, captureOptions);
    if (
      !(canvas instanceof HTMLCanvasElement) ||
      canvas.width <= 0 ||
      canvas.height <= 0
    ) {
      throw new Error("Frame capture returned an invalid canvas");
    }
    return canvas;
  };

  await warmUpWebKitCapture(captureFrame);

  return {
    node: exportTarget.node,
    width: outputWidth,
    height: outputHeight,
    needsPaint: true,
    captureFrame,
    cleanup: () => {
      for (const rewrite of rewrites.reverse()) rewrite.restore();
      exportTarget.cleanup();
    },
  };
}

export async function prepareFastAnimationCapture(
  canvasId: string,
  targetWidth = 1280,
): Promise<AnimationCapture> {
  const node = findCanvasElement(canvasId);
  if (!node) throw new Error("Canvas not found");

  const layoutDims = getCanvasLayoutDims(node);
  if (!layoutDims) throw new Error("Canvas has zero width");
  const { width: renderedWidth, height: renderedHeight } = layoutDims;

  const pixelRatio = targetWidth / renderedWidth;
  const outputWidth = Math.round(renderedWidth * pixelRatio);
  const outputHeight = Math.round(renderedHeight * pixelRatio);

  const containerContext = findNearestContainerContext(node);

  const exportTarget = prepareExportNode(
    node,
    renderedWidth,
    renderedHeight,
    {},
  );
  const { rewrites, preloadUrls } = rewriteExportAssets(exportTarget.node);

  const wrapper = exportTarget.node.parentElement;
  if (wrapper && containerContext) {
    wrapper.style.containerType = containerContext.type;
    wrapper.style.width = `${containerContext.width}px`;
    wrapper.style.height = `${containerContext.height}px`;
    wrapper.style.display = "block";
    exportTarget.node.style.position = "absolute";
    exportTarget.node.style.top = "0";
    exportTarget.node.style.left = "0";
  }

  await waitForExportAssets(preloadUrls);

  await embedCloneImages(exportTarget.node);
  await embedCloneBackgroundImages(exportTarget.node);

  const bakeEls = () => [
    exportTarget.node,
    ...Array.from(exportTarget.node.querySelectorAll<HTMLElement>("*")),
  ];

  exportTarget.node.setAttribute("xmlns", XHTML_NS);

  const fontCss = await getFontEmbedCSS(exportTarget.node).catch(() => "");
  const css = `${collectDocumentCss()}\n${fontCss}`;

  const svgOpen =
    `<svg xmlns="${SVG_NS}" width="${outputWidth}" height="${outputHeight}"` +
    ` viewBox="0 0 ${renderedWidth} ${renderedHeight}">` +
    `<foreignObject x="0" y="0" width="${renderedWidth}" height="${renderedHeight}">` +
    `<style xmlns="${XHTML_NS}"><![CDATA[${css}]]></style>`;
  const svgClose = `</foreignObject></svg>`;
  // Pre-encode the constant (large) prefix/suffix so only the small per-frame
  // body is URL-encoded each deviceFrame.
  const dataUrlHead = `data:image/svg+xml;charset=utf-8,`;
  const encodedOpen = encodeURIComponent(svgOpen);
  const encodedClose = encodeURIComponent(svgClose);

  const serializer = new XMLSerializer();
  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = outputWidth;
  frameCanvas.height = outputHeight;
  const ctx = frameCanvas.getContext("2d");
  if (!ctx) {
    exportTarget.cleanup();
    throw new Error("Could not get 2d context for fast capture");
  }

  const captureFrame = async () => {
    // Bake computed styles (resolving theme colors + cqw → px for this frame)
    // just for the serialization, then restore the var-driven inline styles.
    const body = withBakedComputedStyles(bakeEls(), () =>
      serializer.serializeToString(exportTarget.node),
    );
    const url =
      dataUrlHead + encodedOpen + encodeURIComponent(body) + encodedClose;
    // `Image.decode()` rejects on SVG-with-<foreignObject> in some Firefox

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error("Fast capture: SVG frame failed to load"));
      image.src = url;
    });
    ctx.clearRect(0, 0, outputWidth, outputHeight);
    ctx.drawImage(img, 0, 0, outputWidth, outputHeight);
    return frameCanvas;
  };

  await warmUpWebKitCapture(captureFrame);

  return {
    node: exportTarget.node,
    width: outputWidth,
    height: outputHeight,
    needsPaint: false,
    captureFrame,
    cleanup: () => {
      for (const rewrite of rewrites.reverse()) rewrite.restore();
      exportTarget.cleanup();
    },
  };
}
