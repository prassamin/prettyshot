import {
  WATERMARK_APP_NAME,
  WATERMARK_LOGO_SRC,
  WATERMARK_PREFIX,
} from "@/config";

export { WATERMARK_APP_NAME, WATERMARK_LOGO_SRC, WATERMARK_PREFIX };

export function appendWatermark(
  node: HTMLElement,
  width: number,
  height: number,
) {
  const watermark = document.createElement("div");
  const logo = document.createElement("img");
  const textWrap = document.createElement("div");
  const prefix = document.createElement("div");
  const label = document.createElement("div");
  const minEdge = Math.max(1, Math.min(width, height));
  const scale = Math.max(0.72, Math.min(0.75, minEdge / 720));
  const lineGap = Math.round(2 * scale);

  watermark.setAttribute("data-export-watermark", "true");
  watermark.style.position = "absolute";
  watermark.style.right = `${Math.round(18 * scale)}px`;
  watermark.style.bottom = `${Math.round(18 * scale)}px`;
  watermark.style.zIndex = "546789746789";
  watermark.style.display = "flex";
  watermark.style.opacity = "0.6";
  watermark.style.alignItems = "center";
  watermark.style.gap = `${Math.round(9 * scale)}px`;
  watermark.style.padding = `${Math.round(9 * scale)}px ${Math.round(12 * scale)}px`;
  watermark.style.borderRadius = `${Math.round(10 * scale)}px`;
  watermark.style.background = "rgba(0, 0, 0, 0.34)";
  watermark.style.color = "rgba(255, 255, 255, 0.97)";
  watermark.style.fontFamily =
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  watermark.style.pointerEvents = "none";

  logo.src = WATERMARK_LOGO_SRC;
  logo.alt = "";
  logo.style.width = `${Math.round(26 * scale)}px`;
  logo.style.height = `${Math.round(26 * scale)}px`;
  logo.style.display = "block";

  textWrap.style.display = "flex";
  textWrap.style.flexDirection = "column";
  textWrap.style.alignItems = "flex-start";
  textWrap.style.lineHeight = "1";
  textWrap.style.gap = `${lineGap}px`;

  prefix.textContent = WATERMARK_PREFIX;
  prefix.style.fontSize = `${Math.round(11 * scale)}px`;
  prefix.style.fontWeight = "500";
  prefix.style.color = "rgba(255, 255, 255, 0.74)";

  label.textContent = WATERMARK_APP_NAME;
  label.style.fontSize = `${Math.round(17 * scale)}px`;
  label.style.fontWeight = "700";
  label.style.whiteSpace = "nowrap";

  textWrap.appendChild(prefix);
  textWrap.appendChild(label);
  watermark.appendChild(logo);
  watermark.appendChild(textWrap);
  node.appendChild(watermark);
}
