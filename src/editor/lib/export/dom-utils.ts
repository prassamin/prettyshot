import type { ExportResolution, ExportCaptureOptions } from "./types";
import { EXPORT_RESOLUTION_WIDTHS } from "./types";
import { appendWatermark } from "./watermark";

const EXPORT_ASSET_PRELOAD_TIMEOUT_MS = 12_000;
export const XHTML_NS = "http://www.w3.org/1999/xhtml";
export const SVG_NS = "http://www.w3.org/2000/svg";


const triggerAnchorDownload = (url: string, name: string) => {
  const link = document.createElement("a");
  link.download = name;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export function findCanvasElement(canvasId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-stage-id="${canvasId}"]`);
}

export function getCanvasLayoutDims(node: HTMLElement): {
  width: number;
  height: number;
} | null {
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  if (!width || !height) return null;
  return { width, height };
}

export function getCanvasRenderedDims(canvasId: string): {
  width: number;
  height: number;
} | null {
  const node = findCanvasElement(canvasId);
  if (!node) return null;
  return getCanvasLayoutDims(node);
}

export function getOutputDims(
  canvasId: string,
  resolution: ExportResolution,
): { width: number; height: number } | null {
  const dims = getCanvasRenderedDims(canvasId);
  if (!dims) return null;
  const targetWidth = EXPORT_RESOLUTION_WIDTHS[resolution];
  const ratio = targetWidth / dims.width;
  return {
    width: Math.round(targetWidth),
    height: Math.round(dims.height * ratio),
  };
}

export function triggerDownload(url: string, filename: string) {
  triggerAnchorDownload(url, filename);
}

type AssetRewrite = {
  restore: () => void;
};

const URL_FUNCTION_RE = /url\((['"]?)(.*?)\1\)/g;

export function rewriteExportAssets(root: HTMLElement): {
  rewrites: AssetRewrite[];
  preloadUrls: string[];
} {
  const rewrites: AssetRewrite[] = [];
  const preloadUrls: string[] = [];

  // Swap background thumbnail → full-res source URL for elements that carry
  // data-bg-source-url. The editor renders the thumb for perf; export needs
  // the full image so the output isn't blurry.
  for (const el of Array.from(
    root.querySelectorAll<HTMLElement>("[data-bg-source-url]"),
  )) {
    const sourceUrl = el.getAttribute("data-bg-source-url");
    if (!sourceUrl) continue;
    
    const previousValue = el.style.backgroundImage;
    el.style.backgroundImage = `url("${sourceUrl}")`;
    preloadUrls.push(sourceUrl);
    rewrites.push({
      restore: () => {
        el.style.backgroundImage = previousValue;
      },
    });
  }

  return { rewrites, preloadUrls };
}


export async function waitForExportAssets(urls: string[]) {
  const uniqueUrls = Array.from(new Set(urls));
  await Promise.all(
    uniqueUrls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const image = new Image();
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeoutId);
            resolve();
          };
          const timeoutId = window.setTimeout(
            finish,
            EXPORT_ASSET_PRELOAD_TIMEOUT_MS,
          );
          image.crossOrigin = "anonymous";
          image.onload = finish;
          image.onerror = finish;
          image.src = url;
        }),
    ),
  );
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

async function waitForImageElement(img: HTMLImageElement): Promise<void> {
  if (img.complete) return;
  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    img.addEventListener("load", finish, { once: true });
    img.addEventListener("error", finish, { once: true });
    setTimeout(finish, 5000);
  });
}

export async function embedCloneImages(root: HTMLElement): Promise<void> {
  await Promise.all(
    Array.from(root.querySelectorAll("img")).map(async (img) => {
      const src = img.getAttribute("src");
      if (!src) return;

      if (!src.startsWith("data:")) {
        try {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), 5000);
          const response = await fetch(src, { credentials: "omit", signal: controller.signal });
          clearTimeout(id);
          if (response.ok) {
            const dataUrl = await readBlobAsDataUrl(await response.blob());
            img.src = dataUrl;
            img.removeAttribute("crossorigin");
          } else {
            img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAACAAEA//8DAAAGAAVXv6vUAAAAAElFTkSuQmCC";
          }
        } catch {
          img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAACAAEA//8DAAAGAAVXv6vUAAAAAElFTkSuQmCC";
        }
      }

      await waitForImageElement(img);
    }),
  );
}

export async function embedCloneBackgroundImages(root: HTMLElement): Promise<void> {
  const cache = new Map<string, Promise<string | null>>();
  const fetchDataUrl = (url: string): Promise<string | null> => {
    const existing = cache.get(url);
    if (existing) return existing;
    const p = (async () => {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(url, { credentials: "omit", signal: controller.signal });
        clearTimeout(id);
        if (!response.ok) return null;
        return await readBlobAsDataUrl(await response.blob());
      } catch {
        return null;
      }
    })();
    cache.set(url, p);
    return p;
  };

  const jobs: Promise<void>[] = [];
  for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    const value = el.style.backgroundImage;
    if (!value || !value.includes("url(")) continue;
    const matches = Array.from(value.matchAll(URL_FUNCTION_RE));
    if (matches.length === 0) continue;
    jobs.push(
      (async () => {
        let next = value;
        for (const m of matches) {
          const raw = m[2];
          if (!raw || raw.startsWith("data:")) continue;
          const dataUrl = await fetchDataUrl(raw);
          if (dataUrl) next = next.split(m[0]).join(`url("${dataUrl}")`);
        }
        if (next !== value) el.style.backgroundImage = next;
      })(),
    );
  }
  await Promise.all(jobs);
}

export function makeExportStyle(scopeId: string) {
  const exportStyle = document.createElement("style");
  exportStyle.id = "__export-override";
  const scope = `[data-export-scope="${scopeId}"]`;

  // Do NOT zero `outline` globally — style borders use CSS outline on the
  // screenshot box. Only strip UI chrome (selection rings, focus rings, caret).
  exportStyle.textContent = `
    ${scope}, ${scope} * {
      caret-color: transparent !important;
      --tw-ring-shadow: 0 0 #0000 !important;
      --tw-ring-offset-shadow: 0 0 #0000 !important;
      animation: none !important;
      transition: none !important;
    }
    ${scope} [data-export-hidden="true"] { display: none !important; }
    ${scope} [data-selection-border="true"] {
      outline: none !important;
      border: none !important;
      box-shadow: none !important;
    }
  `;
  return exportStyle;
}


export function prepareExportNode(
  source: HTMLElement,
  width: number,
  height: number,
  options: ExportCaptureOptions = {},
) {
  const wrapper = document.createElement("div");
  const node = source.cloneNode(true) as HTMLElement;
  const scopeId = `export-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const exportStyle = makeExportStyle(scopeId);

  wrapper.style.position = "fixed";
  wrapper.style.left = "-100000px";
  wrapper.style.top = "0";
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${height}px`;
  wrapper.style.overflow = "hidden";
  wrapper.style.pointerEvents = "none";

  node.setAttribute("data-export-scope", scopeId);
  node.style.position = "relative";
  node.style.left = "0";
  node.style.top = "0";
  node.style.width = `${width}px`;
  node.style.height = `${height}px`;
  node.style.pointerEvents = "none";
  node.style.transform = "none";

  document.head.appendChild(exportStyle);
  if (options.watermark) {
    appendWatermark(node, width, height);
  }
  wrapper.appendChild(node);
  document.body.appendChild(wrapper);

  return {
    node,
    cleanup: () => {
      wrapper.remove();
      exportStyle.remove();
    },
  };
}

export function getNodeBorderRadius(node: HTMLElement): number {
  return parseFloat(getComputedStyle(node).borderTopLeftRadius) || 0;
}

export async function clipBlobToRoundedRect(
  blob: Blob,
  width: number,
  height: number,
  radius: number,
): Promise<Blob> {
  if (radius <= 0) return blob;
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(0, 0, width, height, r);
  } else {
    ctx.moveTo(r, 0);
    ctx.lineTo(width - r, 0);
    ctx.arcTo(width, 0, width, r, r);
    ctx.lineTo(width, height - r);
    ctx.arcTo(width, height, width - r, height, r);
    ctx.lineTo(r, height);
    ctx.arcTo(0, height, 0, height - r, r);
    ctx.lineTo(0, r);
    ctx.arcTo(0, 0, r, 0, r);
    ctx.closePath();
  }
  ctx.clip();
  ctx.drawImage(bitmap, 0, 0);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("clip failed"))),
      "image/png",
    );
  });
}

export function filterExportHidden(node: Node) {
  if (node instanceof Element) {
    if (node.getAttribute("data-export-hidden") === "true") return false;
  }
  return true;
}

export function collectDocumentCss(): string {
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | null = null;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin — not readable
    }
    if (!rules) continue;
    for (const rule of Array.from(rules)) css += rule.cssText + "\n";
  }
  return css;
}

export function computedStyleText(computed: CSSStyleDeclaration): string {
  if (computed.cssText) return computed.cssText;
  let text = "";
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];
    text += `${prop}:${computed.getPropertyValue(prop)};`;
  }
  return text;
}

type ContainerContext = { type: string; width: number; height: number };

/**
 * Walk up from `node` to the nearest ancestor that establishes a query container
 * (`container-type: size | inline-size`) and return its type + layout size. The
 * canvas node itself is not the container — `data-editor-canvas-surface` is, an
 * ancestor the export clone leaves behind. Recreating a same-sized container
 * around the clone makes `cqw`/`cqh` reads resolve to the same pixels as on
 * screen (e.g. the framed main's animated anchor position).
 */
export function findNearestContainerContext(
  node: HTMLElement,
): ContainerContext | null {
  let el = node.parentElement;
  while (el) {
    const containerType = window.getComputedStyle(el).containerType;
    if (containerType && containerType !== "normal") {
      return {
        type: containerType,
        width: el.offsetWidth,
        height: el.offsetHeight,
      };
    }
    el = el.parentElement;
  }
  return null;
}

export function withBakedComputedStyles<T>(els: HTMLElement[], serialize: () => T): T {
  const authored = els.map((el) => el.getAttribute("style"));

  const baked = els.map((el) => {
    let text = computedStyleText(window.getComputedStyle(el));
    const inline = el.style;
    for (let j = 0; j < inline.length; j++) {
      const prop = inline[j];
      if (prop.startsWith("--"))
        text += `${prop}:${inline.getPropertyValue(prop)};`;
    }
    return text;
  });
  for (let i = 0; i < els.length; i++) els[i].setAttribute("style", baked[i]);
  try {
    return serialize();
  } finally {
    for (let i = 0; i < els.length; i++) {
      const original = authored[i];
      if (original === null) els[i].removeAttribute("style");
      else els[i].setAttribute("style", original);
    }
  }
}
