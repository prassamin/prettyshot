/**
 * Shared type definitions for the browser deviceFrame stage.
 *
 * Central home for every type used across `browser-frames/` — component
 * props, geometry helpers, and frame internals. Keeping them here (rather
 * than inline in each frame file) gives a single place to read the public
 * contract of `WebBrowserStage` / `WebBrowserDropSlot` and the frame props
 * of `ChromeFrame` / `SafariFrame`.
 */

import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  Ref,
  SyntheticEvent,
} from "react";

import type { ScreenshotLayer } from "@/editor/screenshot/types";
import type {
  AnchorPoint,
  BrowserFrameColor,
  MediaFit,
  OffsetPx,
} from "../types";

/** Minimal event contract for the selection callback. */
export type SelectEvent = {
  stopPropagation: () => void;
};

/** Tonal presets; `undefined` opts into the ambient dark/light theme. */
export type FrameTone = "light" | "dark" | undefined;

/** Chrome density: "default" shows the full tab toolbar, "simple" hides it. */
export type FrameMode = "default" | "simple";

/* ── Chrome frame ─────────────────────────────────────────────────────────── */

export interface ChromeFrameProps extends HTMLAttributes<HTMLDivElement> {
  /** Fallback URL shown when no editable address value is provided. */
  url?: string;
  /** Screenshot/media to render inside the viewport. Omit to render children instead. */
  mediaSrc?: string;
  /** Theme of the chrome; omit to follow the app theme. */
  tone?: FrameTone;
  /** Arbitrary content rendered in the viewport when `mediaSrc` is absent. */
  children?: ReactNode;
  /** Ref to the viewport box (used to measure the media area). */
  viewportRef?: Ref<HTMLDivElement>;
  /** Ref to the rendered `<img>` (used to read natural dimensions). */
  imageRef?: Ref<HTMLImageElement>;
  /** Called when the media image finishes loading. */
  onMediaLoad?: (e: SyntheticEvent<HTMLImageElement>) => void;
  /** Extra inline styles for the media element. */
  mediaCss?: CSSProperties;
  /** Object-fit strategy for the media. */
  fit?: MediaFit;
  /** Corner radius of the whole shell. */
  shellRadius?: string | number;
  /** Corner radius of the viewport box (defaults to bottom-only rounding). */
  viewportRadius?: string | number;
  /** Controlled value of the address bar. */
  urlValue?: string;
  /** Placeholder text for the address bar. */
  urlPlaceholder?: string;
  /** When provided, renders an editable address input instead of static text. */
  onUrlChange?: (value: string) => void;
  /** Fade-in shimmer while the media loads. */
  shimmer?: boolean;
}

/** Resolved color tokens for the Chrome chrome — class + inline style pair. */
export type ChromePaletteEntry = { className?: string; inline?: CSSProperties };

export type ChromePalette = {
  shell: string;
  shellInline?: CSSProperties;
  tabStrip: ChromePaletteEntry;
  toolbar: ChromePaletteEntry;
  address: ChromePaletteEntry;
  activeTab: ChromePaletteEntry;
  mutedIcon: ChromePaletteEntry;
  divider: ChromePaletteEntry;
  viewportContain: ChromePaletteEntry;
  viewportFill: ChromePaletteEntry;
};

/* ── Safari frame ─────────────────────────────────────────────────────────── */

export interface SafariFrameProps extends HTMLAttributes<HTMLDivElement> {
  /** Fallback URL shown when no editable address value is provided. */
  url?: string;
  /** Screenshot/media to render inside the viewport. Omit to render children instead. */
  mediaSrc?: string;
  /** Toolbar density. */
  mode?: FrameMode;
  /** Theme of the chrome; omit to follow the app theme. */
  tone?: FrameTone;
  /** Arbitrary content rendered in the viewport when `mediaSrc` is absent. */
  children?: ReactNode;
  /** Ref to the viewport box (used to measure the media area). */
  viewportRef?: Ref<HTMLDivElement>;
  /** Ref to the rendered `<img>` (used to read natural dimensions). */
  imageRef?: Ref<HTMLImageElement>;
  /** Called when the media image finishes loading. */
  onMediaLoad?: (e: SyntheticEvent<HTMLImageElement>) => void;
  /** Extra inline styles for the media element. */
  mediaCss?: CSSProperties;
  /** Object-fit strategy for the media. */
  fit?: MediaFit;
  /** Corner radius of the viewport box. */
  viewportRadius?: string | number;
  /** Controlled value of the address bar. */
  urlValue?: string;
  /** Placeholder text for the address bar. */
  urlPlaceholder?: string;
  /** When provided, renders an editable address input instead of static text. */
  onUrlChange?: (value: string) => void;
  /** Fade-in shimmer while the media loads. */
  shimmer?: boolean;
}

/* ── Stage (filled + empty states) ───────────────────────────────────────── */

export type WebBrowserStageProps = {
  /** Captured media URL to display inside the browser viewport. */
  mediaSrc: string;
  /** Browser frame id (see BROWSER_FRAMES). */
  frameId: string;
  /** Chrome tone of the deviceFrame. */
  tone: BrowserFrameColor;
  /** Layer visibility metadata for the screenshot element. */
  layer: ScreenshotLayer;
  /** CSS transform applied to the positioned deviceFrame. */
  transform: string;
  /** Optional CSS filter for the frame's drop shadow. */
  shadowCss?: string;
  /** Pixel offset of the media within the deviceFrame. */
  offset: OffsetPx;
  /** Anchor of the media within the deviceFrame. */
  anchor: AnchorPoint;
  /** Object-fit strategy for the media. */
  fit?: MediaFit;
  /** Whether the screenshot is currently selected (drives hover menu). */
  isSelected: boolean;
  /** Whether a drag gesture is in flight (suppresses hover menu). */
  isDragging: boolean;
  /** Disables the hover edit menu entirely. */
  disableHoverMenu?: boolean;
  /** Ref to the stage wrapper (measured for placements). */
  stageRef: React.RefObject<HTMLDivElement | null>;
  /** Ref to the media `<img>` (natural dimensions). */
  imageRef: React.RefObject<HTMLImageElement | null>;
  /** Controlled address bar value. */
  url: string;
  /** Updates the address bar value. */
  onUrlChange: (value: string) => void;
  /** Selects the screenshot (click / keyboard). */
  onPick: (e: SelectEvent) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onWheel?: React.WheelEventHandler<HTMLDivElement>;
  /** Fired when the media image loads (dimension measurement). */
  onMediaLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  /** Opens the crop modal. */
  onCropRequest: () => void;
  /** Replaces the media with a chosen file. */
  onReplaceWith: (file: File) => void;
  /** Removes the screenshot entirely. */
  onRemove: () => void;
  /** Whether to render the hover edit menu. */
  showHoverMenu?: boolean;
  /** Whether to read preview tokens from CSS vars (export consistency). */
  usePreviewTokens?: boolean;
  /** Optional inner lighting overlay styles. */
  lightingStyle?: React.CSSProperties | null;
  /** Extra inline styles for the media element. */
  mediaCss?: React.CSSProperties;
};

export type WebBrowserDropSlotProps = {
  /** Browser frame id (see BROWSER_FRAMES). */
  frameId: string;
  /** Chrome tone of the deviceFrame. */
  tone: BrowserFrameColor;
  /** Whether a file drag is currently hovering the drop target. */
  isDropHover: boolean;
  /** Opens the file picker / consumes a dropped file. */
  onPickFile: (file: File) => void;
  /** CSS transform applied to the positioned deviceFrame. */
  transform: string;
  /** Optional CSS filter for the frame's drop shadow. */
  shadowCss?: string;
  /** Pixel offset of the media within the deviceFrame. */
  offset: OffsetPx;
  /** Anchor of the media within the deviceFrame. */
  anchor: AnchorPoint;
  /** Whether a drag gesture is in flight. */
  isDragging: boolean;
  /** Controlled address bar value. */
  url: string;
  /** Updates the address bar value. */
  onUrlChange: (value: string) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  /** Compact mode hides the full drop UI and shows a small upload chip. */
  compact?: boolean;
  /** Whether to read preview tokens from CSS vars (export consistency). */
  usePreviewTokens?: boolean;
  /** Optional inner lighting overlay styles. */
  lightingStyle?: React.CSSProperties | null;
};
