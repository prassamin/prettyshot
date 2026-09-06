/**
 * Editable and static text content renderers.
 *
 * EditableTextContent — used when the user is typing (contentEditable).
 *   Commits on blur, Escape, or Cmd+Enter.
 * StaticTextContent — read‑only display used otherwise.
 *   Shows the selection border when the element is selected but has no custom border.
 */
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { computeTextStyle } from "./utils";
import { TextElement } from "./types";

export function EditableTextContent({
  text,
  editorRef,
  showBorder,
  borderStyle,
  borderWidth,
  borderColor,
  commitContent,
}: {
  text: TextElement;
  editorRef: React.RefObject<HTMLDivElement | null>;
  showBorder: string | boolean | null;
  borderStyle: string;
  borderWidth: number;
  borderColor: string;
  commitContent: () => void;
}) {
  return (
    <div
      ref={editorRef}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      onBlur={commitContent}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          commitContent();
        } else if (e.key === "Enter") {
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            commitContent();
          }
        }
      }}
      className={cn(
        "cursor-text px-2 py-1 wrap-break-word whitespace-pre-wrap outline-none",
        showBorder && "rounded-md",
      )}
      style={computeTextStyle({ text, borderStyle, borderWidth, borderColor })}
    />
  );
}

export function StaticTextContent({
  text,
  textViewRef,
  showBorder,
  borderStyle,
  borderWidth,
  borderColor,
  isSelected,
}: {
  text: TextElement;
  textViewRef: React.RefObject<HTMLDivElement | null>;
  showBorder: string | boolean | null;
  borderStyle: string;
  borderWidth: number;
  borderColor: string;
  isSelected: boolean;
}) {
  return (
    <div
      ref={textViewRef}
      className={cn(
        "px-2 py-1 wrap-break-word whitespace-pre-wrap",
        showBorder && "rounded-md",
      )}
      data-selection-border={
        !text.borderColor && isSelected ? "true" : undefined
      }
      style={computeTextStyle({ text, borderStyle, borderWidth, borderColor })}
    >
      {text.content}
    </div>
  );
}
