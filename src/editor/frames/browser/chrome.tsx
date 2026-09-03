/**
 * Chromium deviceFrame deviceFrame.
 *
 * Renders a pixel-accurate imitation of a Chromium-based browser window
 * (Chrome-style tab strip + toolbar) purely with CSS layout and inline SVG
 * glyphs — no raster assets. Used inside the screenshot stage to frame the
 * captured media (see `index.tsx` in this folder) and in the frame picker
 * preview (frame picker).
 *
 * ── Layout model ──────────────────────────────────────────────────────────
 * The shell is sized by `aspect-ratio` (1202 × 776 design units) and scales
 * with its container via container queries (`cqw` units). The viewport
 * ("screen") is a child box positioned with percentage coordinates that map
 * the design-units geometry to any render size:
 *
 *   viewport x = 1 / 1202, y = 76 / 776, w = 1200 / 1202, h = 700 / 776
 *
 * All chrome pixels (tab strip, toolbar, address pill) are laid out with the
 * same percentages or `cqw` values so nothing needs to be measured at
 * runtime. The whole shell is an inline-block so it can sit inside a
 * `preserve-3d` transformed stage without breaking layout.
 *
 * ── Theming ───────────────────────────────────────────────────────────────
 * Pass `tone="dark" | "light" | undefined`. `undefined` means "follow the
 * app theme" (dark: classes only). Every color decision flows through
 * `chromiumPalette()` so adding a new tone is a one-line change.
 */

import { ProgressiveImage } from "@/components/progressive-image";
import type {
  ChromeFrameProps,
  ChromePalette,
  FrameTone,
} from "./types";
import type { MediaFit } from "../types";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  RotateCw,
  Settings2,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Design-unit geometry of the Chrome window artwork. */
const FRAME_DESIGN_W = 1202;
const FRAME_DESIGN_H = 776;

/** Where the web viewport sits inside the artwork, in design units. */
const VIEWPORT_X = 0;
const VIEWPORT_Y = 75;
const VIEWPORT_W = 1202;
const VIEWPORT_H = 702;

/** Percentage insets of the viewport box (kept as formulas, not magic numbers). */
const VIEWPORT_LEFT_PCT = (VIEWPORT_X / FRAME_DESIGN_W) * 100;
const VIEWPORT_TOP_PCT = (VIEWPORT_Y / FRAME_DESIGN_H) * 100;
const VIEWPORT_WIDTH_PCT = (VIEWPORT_W / FRAME_DESIGN_W) * 100;
const VIEWPORT_HEIGHT_PCT = (VIEWPORT_H / FRAME_DESIGN_H) * 100;

/** Percentage placement of the address pill. */
const ADDRESS_LEFT_PCT = (172 / FRAME_DESIGN_W) * 100;
const ADDRESS_WIDTH_PCT = (820 / FRAME_DESIGN_W) * 100;

/**
 * A static, theme-aware Chromium window deviceFrame.
 *
 * @see ChromeFrameProps for the full prop contract.
 */
export function ChromeFrame({
  mediaSrc,
  url,
  tone,
  children,
  viewportRef,
  imageRef,
  onMediaLoad,
  mediaCss,
  fit = "cover",
  shellRadius = "8px",
  viewportRadius = "0 0 8px 8px",
  urlValue,
  urlPlaceholder = "Search Google or type a URL",
  onUrlChange,
  shimmer = true,
  className,
  style,
  ...props
}: ChromeFrameProps) {
  // The address bar shows the controlled value, falling back to the static
  // `url` prop (used by the frame-picker preview which has no editing UI).
  const addressText = urlValue ?? url ?? "";
  const tabTitle = deriveTabLabel(addressText);
  // Editable mode only when the parent wires up `onUrlChange`.
  const editable = Boolean(onUrlChange);
  const palette = chromiumPalette(tone);

  // The media OR the passed children occupy the web viewport.
  const viewportContent = mediaSrc ? (
    <ProgressiveImage
      ref={imageRef}
      shimmer={shimmer}
      src={mediaSrc}
      alt=""
      onLoad={onMediaLoad}
      className={`block size-full ${fitClassForObjectFit(fit)}`}
      style={mediaCss}
    />
  ) : (
    children
  );

  const viewportBg =
    fit === "contain" ? palette.viewportContain : palette.viewportFill;

  return (
    <div
      className={`relative inline-block w-full overflow-hidden border align-middle leading-none ${palette.shell} ${className ?? ""}`}
      style={{
        aspectRatio: `${FRAME_DESIGN_W}/${FRAME_DESIGN_H}`,
        borderRadius: shellRadius,
        containerType: "inline-size",
        ...palette.shellInline,
        ...style,
      }}
      {...props}
    >
      {/* Web viewport — sits under the chrome layers (z-0). */}
      <div
        ref={viewportRef}
        className={`absolute z-0 overflow-hidden ${viewportBg.className}`}
        style={{
          left: `${VIEWPORT_LEFT_PCT}%`,
          top: `${VIEWPORT_TOP_PCT}%`,
          width: `${VIEWPORT_WIDTH_PCT}%`,
          height: `${VIEWPORT_HEIGHT_PCT}%`,
          borderRadius: viewportRadius,
          ...viewportBg.inline,
        }}
      >
        {viewportContent}
      </div>

      {/* Tab strip — window controls, active tab, new-tab button. */}
      <div
        className={`absolute inset-x-0 top-0 z-10 h-[4.381443%] ${palette.tabStrip.className}`}
        style={palette.tabStrip.inline}
      >
        {/* Traffic lights (macOS-style) */}
        <div className="absolute top-1/2 left-[1.746%] flex -translate-y-1/2 items-center gap-[0.665cqw]">
          <span className="size-[0.998cqw] rounded-full bg-[#ff5f57]" />
          <span className="size-[0.998cqw] rounded-full bg-[#febc2e]" />
          <span className="size-[0.998cqw] rounded-full bg-[#28c840]" />
        </div>

        {/* Active tab chip with derived page title */}
        <div className="flex h-full items-center gap-2 absolute bottom-0 left-[8.153078%] w-[calc(100%-8.153078%)]">
          <div
            className={`flex h-[82%] w-[19.467554%] items-center gap-[0.55cqw] rounded-[0.5cqw] px-[1cqw] text-[1cqw] ${palette.activeTab.className}`}
            style={palette.activeTab.inline}
          >
            <span className="truncate opacity-90">{tabTitle}</span>
            <span className="ml-auto text-[1.05em] opacity-50">
              <X className="size-[1.12cqw]" />
            </span>
          </div>

          {/* Separator + "+" new-tab glyph */}
          <div
            className={`h-1/2 w-px ${palette.divider.className}`}
            style={palette.divider.inline}
          />
          <div
            className={`text-[1.35cqw] ${palette.mutedIcon.className}`}
            style={palette.mutedIcon.inline}
          >
            <Plus className="size-[1.12cqw]" />
          </div>
        </div>
      </div>

      {/* Toolbar — nav chevrons, refresh, address pill, star + overflow. */}
      <div
        className={`absolute inset-x-0 top-[4.381443%] z-20 h-[5.412371%] border-y ${palette.toolbar.className}`}
        style={palette.toolbar.inline}
      >
        <div
          className={`absolute top-1/2 left-[1.497504%] flex -translate-y-1/2 items-center gap-[1cqw] ${palette.mutedIcon.className}`}
          style={palette.mutedIcon.inline}
        >
          <ChevronLeft className="size-[1.8cqw]" />
          <ChevronRight className="size-[1.8cqw]" />
          <RotateCw className="size-[1.3cqw]" />
        </div>

        <div
          className={`absolute flex -translate-y-1/2 items-center gap-[0.72cqw] rounded-full px-[1cqw] text-[1.2cqw] ring-1 ${palette.address.className}`}
          style={{
            left: `${ADDRESS_LEFT_PCT}%`,
            top: "50%",
            width: `${ADDRESS_WIDTH_PCT}%`,
            height: `${(32 / 42) * 100}%`,
            ...palette.address.inline,
          }}
        >
          <Settings2 className="size-[1.12cqw]" />
          {editable ? (
            <span className="min-w-0 flex-1 truncate">
              <label
                aria-label="Chrome address"
                className="z-30 flex items-center overflow-hidden"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  inputMode="url"
                  value={addressText}
                  placeholder={urlPlaceholder}
                  spellCheck={false}
                  onChange={(e) => onUrlChange?.(e.target.value)}
                  className="min-w-0 flex-1 border-0 bg-transparent font-sans text-[1.2cqw] outline-none placeholder:text-current placeholder:opacity-65"
                />
              </label>
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate">{addressText}</span>
          )}
        </div>

        <div
          className={cn(
            `absolute top-1/2 right-[1.663894%] flex -translate-y-1/2 items-center gap-[1cqw]`,
            palette.mutedIcon.className,
          )}
          style={palette.mutedIcon.inline}
        >
          <Star className="size-[1.15cqw]" />
          <Menu className="size-[1.15cqw]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Map a `MediaFit` to Tailwind object-fit classes.
 *
 * `cover` pins to the top of the viewport (browsers top-align on overscan),
 * `contain` centers, `fill` stretches.
 */
function fitClassForObjectFit(fit: MediaFit) {
  if (fit === "contain") return "object-contain object-center";
  if (fit === "fill") return "object-fill";
  return "object-cover object-top";
}

/**
 * Derive a short human tab label from a URL.
 *
 * Strips protocol/auth/port/"www" and keeps the first host segment, e.g.
 * `https://www.example.com/path` → `Example`. Falls back to "New Tab".
 */
function deriveTabLabel(address: string) {
  const value = address.trim();
  if (!value) return "New Tab";

  const withoutProtocol = value.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  const hostOrText = withoutProtocol.split(/[/?#]/, 1)[0] ?? "";
  const withoutAuth = hostOrText.split("@").pop() ?? hostOrText;
  const withoutPort = withoutAuth.replace(/:\d+$/, "");
  const withoutWww = withoutPort.replace(/^www\./i, "");
  const firstPart = withoutWww.split(".").find(Boolean);

  return capitalizeFirst(firstPart || value);
}

function capitalizeFirst(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

/**
 * Resolved color tokens for the Chromium chrome — see `types.tsx`.
 */
function chromiumPalette(tone: FrameTone): ChromePalette {
  const dark = tone === "dark";
  const light = tone === "light";

  if (dark) {
    return {
      shell: "border-[#27272a] bg-[#202124] text-[#e8eaed]",
      tabStrip: {
        className: "bg-[#202124]",
        inline: { backgroundColor: "#202124" },
      },
      toolbar: {
        className: "border-[#2b2c30] bg-[#292a2d]",
        inline: { backgroundColor: "#292a2d", borderColor: "#2b2c30" },
      },
      address: {
        className: "bg-[#202124] text-[#bdc1c6] ring-white/5",
        inline: {
          backgroundColor: "#202124",
          color: "#bdc1c6",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.05)",
        },
      },
      activeTab: {
        className: "bg-[#292a2d] text-[#e8eaed]",
        inline: { backgroundColor: "#292a2d", color: "#e8eaed" },
      },
      mutedIcon: { className: "text-[#9aa0a6]", inline: { color: "#9aa0a6" } },
      divider: {
        className: "bg-white/10",
        inline: { backgroundColor: "rgba(255,255,255,0.1)" },
      },
      viewportContain: {
        className: "bg-[#292a2d]",
        inline: { backgroundColor: "#292a2d" },
      },
      viewportFill: {
        className: "bg-white dark:bg-[#292a2d]",
        inline: { backgroundColor: "#292a2d" },
      },
    };
  }

  if (light) {
    return {
      shell: "border-[#d9dce1] bg-[#dee1e6] text-[#202124]",
      tabStrip: {
        className: "bg-[#dee1e6]",
        inline: { backgroundColor: "#dee1e6" },
      },
      toolbar: {
        className: "border-[#d2d5da] bg-[#f1f3f4]",
        inline: { backgroundColor: "#f1f3f4", borderColor: "#d2d5da" },
      },
      address: {
        className: "bg-white text-[#5f6368] ring-black/5",
        inline: {
          backgroundColor: "#ffffff",
          color: "#5f6368",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.05)",
        },
      },
      activeTab: {
        className: "bg-[#f1f3f4] text-[#202124]",
        inline: { backgroundColor: "#f1f3f4", color: "#202124" },
      },
      mutedIcon: { className: "text-[#5f6368]", inline: { color: "#5f6368" } },
      divider: {
        className: "bg-black/10",
        inline: { backgroundColor: "rgba(0,0,0,0.1)" },
      },
      viewportContain: {
        className: "bg-[#f1f3f4]",
        inline: { backgroundColor: "#f1f3f4" },
      },
      viewportFill: {
        className: "bg-white dark:bg-[#292a2d]",
        inline: { backgroundColor: "#ffffff" },
      },
    };
  }

  // Theme-agnostic mode: Tailwind dark: variants drive everything.
  return {
    shell:
      "border-[#d9dce1] bg-[#dee1e6] text-[#202124] dark:border-[#27272a] dark:bg-[#202124] dark:text-[#e8eaed]",
    tabStrip: { className: "bg-[#dee1e6] dark:bg-[#202124]" },
    toolbar: {
      className:
        "border-[#d2d5da] bg-[#f1f3f4] dark:border-[#2b2c30] dark:bg-[#292a2d]",
    },
    address: {
      className:
        "bg-white text-[#5f6368] ring-black/5 dark:bg-[#202124] dark:text-[#bdc1c6] dark:ring-white/5",
    },
    activeTab: {
      className:
        "bg-[#f1f3f4] text-[#202124] dark:bg-[#292a2d] dark:text-[#e8eaed]",
    },
    mutedIcon: { className: "text-[#5f6368] dark:text-[#9aa0a6]" },
    divider: { className: "bg-black/10 dark:bg-white/10" },
    viewportContain: { className: "bg-[#f1f3f4] dark:bg-[#292a2d]" },
    viewportFill: { className: "bg-white dark:bg-[#292a2d]" },
  };
}
