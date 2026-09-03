/**
 * DropPrompt — the "drag & drop or browse" upload prompt.
 *
 * Rendered inside an empty frame's screen region (or the bare canvas) so
 * the user has a clear first action: drop a file or open the file picker.
 *
 * ── Variants ──────────────────────────────────────────────────────────────
 * - Full: the complete upload area (icon + copy + browse button + hint).
 * - Compact: a single circular "+" trigger that opens a micro popover with
 *   the full upload area inside.
 * - Decorative (`decorative`): a bare circular "+" glyph with no behavior —
 *   used by the frame-picker preview tiles so they look uploadable without
 *   being interactive.
 *
 * `tilt` rotates the whole prompt (used inside rotated deviceFrame screens so the
 * prompt reads upright against the device).
 */

"use client";

import { cn } from "@/lib/utils";
import { EmptyBackdrop } from "@/editor/screenshot/empty-backdrop";
import { UploadArea } from "@/editor/screenshot/upload-area";

type DropPromptProps = {
  /** Whether a file drag is currently hovering this target. */
  isDropHover?: boolean;
  /** Consumes a dropped file / opens the picker. */
  onPickFile: (file: File) => void;
  /** Rotates the prompt content (deg) — counter-rotates inside device frames. */
  tilt?: number;
  /** Compact variant: micro "+" trigger instead of the full area. */
  compact?: boolean;
};

export function DropPrompt({
  isDropHover = false,
  onPickFile,
  tilt = 0,
  compact = false,
}: DropPromptProps) {
  const rotationStyle = tilt ? { transform: `rotate(${tilt}deg)` } : undefined;

  return (
    <EmptyBackdrop
      data-drag-over={isDropHover}
      className={cn(
        "@container flex items-center justify-center p-[3cqw] text-foreground transition-all",
      )}
      style={{ containerType: "inline-size" }}
    >
      {compact ? (
        <div style={rotationStyle}>
          <UploadArea
            compact
            isDropHover={isDropHover}
            onPickFile={onPickFile}
            showHint
          />
        </div>
      ) : (
        <>
          {/* Full upload area on wide screens… */}
          <div
            className={cn(
              "@container hidden w-full max-w-85 @md:block",
            )}
            style={{ containerType: "inline-size", ...rotationStyle }}
          >
            <UploadArea
              isDropHover={isDropHover}
              onPickFile={onPickFile}
              showHint
              className="w-full"
            />
          </div>
          {/* …and the micro trigger on narrow ones. */}
          <div
            className={cn("@md:hidden")}
            style={rotationStyle}
          >
            <UploadArea
              compact
              isDropHover={isDropHover}
              onPickFile={onPickFile}
              showHint
            />
          </div>
        </>
      )}
    </EmptyBackdrop>
  );
}
