/**
 * SelectionChrome — shared selection chrome for canvas elements.
 *
 * Renders 8 resize handles or arrow endpoint handles, a rotation handle,
 * and optional center‑snap crosshair guides. The `type` prop controls
 * which handles appear:
 *   - "box" (default): 8 resize handles + rotation
 *   - "arrow": 2 endpoint handles + rotation
 *   - "text": same as "box" but with larger mobile touch targets
 *
 * Callers provide the pointer event callbacks — the actual resize/rotate
 * math stays in each element type.
 */
"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ResizeHandleId } from "../types";



type HandleDef = {
  id: ResizeHandleId;
  vClass: string;
  hClass: string;
  transformClass: string;
  cursor: string;
};

/** Resize handle positions for box-shaped elements (t/b/l/r = top/bottom/left/right, m = middle). */
const HANDLES: HandleDef[] = [
  {
    id: "ml",
    vClass: "top-1/2",
    hClass: "left-0",
    transformClass: "-translate-x-1/2 -translate-y-1/2",
    cursor: "ew-resize",
  },
  {
    id: "mr",
    vClass: "top-1/2",
    hClass: "right-0",
    transformClass: "translate-x-1/2 -translate-y-1/2",
    cursor: "ew-resize",
  },
  {
    id: "mt",
    vClass: "top-0",
    hClass: "left-1/2",
    transformClass: "-translate-x-1/2 -translate-y-1/2",
    cursor: "ns-resize",
  },
  {
    id: "mb",
    vClass: "bottom-0",
    hClass: "left-1/2",
    transformClass: "-translate-x-1/2 translate-y-1/2",
    cursor: "ns-resize",
  },
  {
    id: "tl",
    vClass: "top-0",
    hClass: "left-0",
    transformClass: "-translate-x-1/2 -translate-y-1/2",
    cursor: "nwse-resize",
  },
  {
    id: "tr",
    vClass: "top-0",
    hClass: "right-0",
    transformClass: "translate-x-1/2 -translate-y-1/2",
    cursor: "nesw-resize",
  },
  {
    id: "bl",
    vClass: "bottom-0",
    hClass: "left-0",
    transformClass: "-translate-x-1/2 translate-y-1/2",
    cursor: "nesw-resize",
  },
  {
    id: "br",
    vClass: "bottom-0",
    hClass: "right-0",
    transformClass: "translate-x-1/2 translate-y-1/2",
    cursor: "nwse-resize",
  },
];

/** Arrow endpoint handle positions — centered on the tail/head of the arrow. */
const ARROW_ENDPOINTS = [
  {
    id: "tail" as const,
    className:
      "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing",
  },
  {
    id: "head" as const,
    className:
      "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing",
  },
];

type Props = {
  /** Which handle set to render. "box" = 8 resize handles, "arrow" = 2 endpoints, "text" = box + mobile touch targets. */
  type?: "box" | "arrow" | "text";
  /** Inverse rotation string so controls stay level while the element rotates. */
  counterRotate?: string;
  /** Show center-snap crosshair guides (from the element's snap logic). */
  isRotateSnapped?: boolean;
  /** Rotation handle pointer callbacks — omit all three to hide the button. */
  startRotate?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  moveRotate?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  endRotate?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  /** Resize handle pointer callbacks (box/text type). */
  startResize?: (
    handle: ResizeHandleId,
  ) => (e: React.PointerEvent<HTMLButtonElement>) => void;
  moveResize?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  endResize?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  /** Arrow endpoint pointer callbacks (arrow type). */
  startArrowEndpoint?: (
    endpoint: "tail" | "head",
  ) => (e: React.PointerEvent<HTMLButtonElement>) => void;
  moveArrowEndpoint?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  endArrowEndpoint?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  /** Render larger touch targets on mobile (used by text element). */
  mobileTouchTargets?: boolean;
  /** Drag handlers for moving the element from inside the chrome. */
  onDragPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDragPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onDragPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export function SelectionChrome({
  type = "box",
  counterRotate,
  isRotateSnapped,
  startRotate,
  moveRotate,
  endRotate,
  startResize,
  moveResize,
  endResize,
  startArrowEndpoint,
  moveArrowEndpoint,
  endArrowEndpoint,
  mobileTouchTargets,
  onDragPointerDown,
  onDragPointerMove,
  onDragPointerUp,
}: Props) {
  const isArrow = type === "arrow";

  return (
    <div
      data-export-hidden="true"
      className="pointer-events-auto absolute inset-0 cursor-all-scroll border border-primary/80 border-dashed"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={onDragPointerDown}
      onPointerMove={onDragPointerMove}
      onPointerUp={onDragPointerUp}
      onPointerCancel={onDragPointerUp}
    >
      {isRotateSnapped && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-[-1] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <div className="absolute w-1000 border-t border-dashed border-primary/95" />
          <div className="absolute h-1000 border-l border-dashed border-primary/95" />
        </div>
      )}

      {startRotate && (
        <button
          aria-label="Rotate"
          onPointerDown={startRotate}
          onPointerMove={moveRotate}
          onPointerUp={endRotate}
          onPointerCancel={endRotate}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto absolute -bottom-9 left-1/2 z-10 flex size-7 cursor-grab items-center justify-center rounded-full border border-primary/80 bg-background/95 text-primary shadow-md backdrop-blur-md"
          style={{
            transform: `translate(-50%, 0) ${counterRotate ?? ""}`,
            transformOrigin: "top center",
          }}
        >
          <RefreshCcw className="size-3.5" />
        </button>
      )}

      {isArrow
        ? ARROW_ENDPOINTS.map((ep) => (
            <button
              key={ep.id}
              aria-label={`${ep.id} arrow endpoint`}
              className={cn(
                "pointer-events-auto absolute z-10 size-5 rounded-full border-2 border-primary bg-background shadow",
                ep.className,
              )}
              onPointerDown={startArrowEndpoint!(ep.id)}
              onPointerMove={moveArrowEndpoint!}
              onPointerUp={endArrowEndpoint!}
              onPointerCancel={endArrowEndpoint!}
              onClick={(e) => e.stopPropagation()}
            />
          ))
        : HANDLES.map(({ id, vClass, hClass, transformClass, cursor }) => (
            <button
              key={id}
              aria-label={`Resize ${id}`}
              onPointerDown={startResize!(id)}
              onPointerMove={moveResize!}
              onPointerUp={endResize!}
              onPointerCancel={endResize!}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "pointer-events-auto absolute z-10",
                mobileTouchTargets
                  ? "flex size-8 items-center justify-center rounded-full border border-transparent bg-transparent md:block md:size-2.5 md:border-primary md:bg-background md:shadow"
                  : "size-2.5 rounded-full border border-primary bg-background shadow",
                vClass,
                hClass,
                transformClass,
              )}
              style={{ cursor }}
            >
              {mobileTouchTargets && (
                <span
                  className={cn(
                    "block rounded-full border border-primary bg-background shadow md:hidden",
                    id === "ml" || id === "mr" ? "h-6 w-2" : "size-3",
                  )}
                />
              )}
            </button>
          ))}
    </div>
  );
}
