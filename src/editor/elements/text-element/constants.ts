/**
 * Text element constants & helpers.
 *
 * ── Tuning notes ──
 * SNAP_ENTER_DIST/SNAP_EXIT_DIST have hysteresis (enter < exit) so the snap
 * doesn't jitter when the user hesitates at the center.
 */

import type { HandleAnchor } from "./types"

/** Minimum pointer movement (px) before a click becomes a drag. */
export const MOVE_THRESHOLD = 5

/** Distance (px) from canvas center where center‑snap engages. */
export const SNAP_ENTER_DIST = 15

/** Distance (px) from canvas center where center‑snap disengages (hysteresis). */
export const SNAP_EXIT_DIST = 20

/**
 * Resize handle definitions.
 * Each entry is [anchorId, verticalClass, horizontalClass, transformClass, cursorStyle].
 */
export const RESIZE_ANCHORS: readonly [
  HandleAnchor, string, string, string, string,
][] = [
  ["ml", "top-1/2", "left-0", "-translate-x-1/2 -translate-y-1/2", "ew-resize"],
  ["mr", "top-1/2", "right-0", "translate-x-1/2 -translate-y-1/2", "ew-resize"],
  ["mt", "top-0", "left-1/2", "-translate-x-1/2 -translate-y-1/2", "ns-resize"],
  ["mb", "bottom-0", "left-1/2", "-translate-x-1/2 translate-y-1/2", "ns-resize"],
  ["tl", "top-0", "left-0", "-translate-x-1/2 -translate-y-1/2", "nwse-resize"],
  ["tr", "top-0", "right-0", "translate-x-1/2 -translate-y-1/2", "nesw-resize"],
  ["bl", "bottom-0", "left-0", "-translate-x-1/2 translate-y-1/2", "nesw-resize"],
  ["br", "bottom-0", "right-0", "translate-x-1/2 translate-y-1/2", "nwse-resize"],
]