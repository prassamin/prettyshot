/**
 * TextElementToolbar — floating toolbar portal for a selected text element.
 *
 * Positioned just above or below the element depending on available space.
 * Portalled to document.body so it can overflow the canvas container.
 */
"use client";

import { createPortal } from "react-dom";

import { TextToolbar } from "@/editor/toolbar/text-toolbar";
import { computeToolbarOffset } from "@/editor/toolbar/controls";
import type { TextElement } from "./types";

export function TextElementToolbar({
  text,
  toolbarRect,
}: {
  text: TextElement;
  toolbarRect: DOMRect;
}) {
  if (typeof document === "undefined") return null;

  const flipBelow = toolbarRect.top < 80;
  const top = flipBelow ? toolbarRect.bottom + 12 : toolbarRect.top - 12;
  const left = toolbarRect.left + toolbarRect.width / 2;

  return createPortal(
    <div
      data-floating-anchor={`text:${text.id}`}
      className="pointer-events-none fixed z-40"
      style={{
        top,
        left,
        transform: computeToolbarOffset(flipBelow, 1),
        transformOrigin: flipBelow ? "top center" : "bottom center",
      }}
    >
      <div className="pointer-events-auto">
        <TextToolbar text={text} />
      </div>
    </div>,
    document.body,
  );
}
