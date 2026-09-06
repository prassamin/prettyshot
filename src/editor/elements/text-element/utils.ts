/**
 * CSS style builder for the text content div.
 *
 * Handles borders, text stroke (outline), drop shadow, and alignment —
 * shared between the editable and static render paths so they stay identical.
 */
import type * as React from "react"
import type { TextElement } from "./types"

export function computeTextStyle({
  text,
  borderStyle,
  borderWidth,
  borderColor,
  fontSize = text.fontSize,
}: {
  text: TextElement
  borderStyle: string
  borderWidth: number
  borderColor: string
  fontSize?: number
}): React.CSSProperties {
  return {
    fontSize,
    fontWeight: text.fontWeight,
    letterSpacing: `${text.letterSpacing ?? 0}px`,
    color: text.color,
    textAlign: text.align,
    lineHeight: text.lineHeight ?? 1.3,
    borderStyle,
    borderWidth,
    borderColor,
    wordBreak: "break-word",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    overflow: "hidden",
    ...(text.strokeColor && text.strokeWidth
      ? {
          WebkitTextStroke: `${text.strokeWidth}px ${text.strokeColor}`,
          paintOrder: "stroke fill",
        }
      : {}),
    ...(text.textShadow ? { textShadow: text.textShadow } : {}),
  }
}

/** True if the event target is an input/textarea/contenteditable (don't intercept keys). */
export function isEditingInput(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']")
  )
}

/**
 * Read the `--canvas-fit-scale` CSS custom property set by the Canvas component.
 * This gives us the actual visual scale factor so pointer coords can be
 * translated correctly when the canvas is zoomed / fitted.
 */
export function getCanvasScale(
  canvas: HTMLElement | null,
  fallback: number
) {
  if (!canvas) return fallback
  const raw = window
    .getComputedStyle(canvas)
    .getPropertyValue("--canvas-fit-scale")
  const scale = Number.parseFloat(raw)
  return Number.isFinite(scale) && scale > 0 ? scale : fallback
}
