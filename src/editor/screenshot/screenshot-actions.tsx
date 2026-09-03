/**
 * ScreenshotActionsMenu — the floating edit menu attached to a captured shot.
 *
 * Appears as a circular pencil trigger that, when clicked, opens a popover
 * with the shot's actions:
 *
 *   • Replace media  (full upload area)
 *   • Crop
 *   • Delete        (optional)
 *
 * The trigger scales with the canvas zoom (`--canvas-fit-scale`) so it stays
 * a comfortable click target regardless of the stage transform, and it is
 * tagged `data-export-hidden` so it never leaks into exported frames.
 *
 * Dev note: the frame picker used to live here too — it was extracted for a
 * dedicated settings surface. See the toolbar(s) for the frame picker entry.
 */

"use client";

import { Crop, Trash,Pencil } from "lucide-react";
import { UploadArea } from "./upload-area";

import { Popover } from "@heroui/react";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { Tooltip } from "@/components/tooltip";

type ScreenshotActionsMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropRequest: () => void;
  onReplaceWith: (file: File) => void;
  onRemove: () => void;
  showDelete?: boolean;
};

export function ScreenshotActionsMenu({
  open,
  onOpenChange,
  onCropRequest,
  onReplaceWith,
  onRemove,
  showDelete = true,
}: ScreenshotActionsMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  return (
    <Popover isOpen={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger>
        <Tooltip content="Edit screenshot">
          <button
            ref={triggerRef}
            data-export-hidden="true"
            type="button"
            aria-label="Edit screenshot"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenChange(!open);
            }}
            style={{
              transform:
                "scale(clamp(1, calc(1 / var(--canvas-fit-scale, 1)), 1.8))",
              transformOrigin: "center",
            }}
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-background text-foreground shadow-xl ring-2 ring-foreground/15 transition-[ring-color] hover:ring-foreground/30 sm:size-14"
          >
            <Pencil className="size-5 sm:size-7" />
          </button>
        </Tooltip>
      </Popover.Trigger>
      <Popover.Content
        data-export-hidden="true"
        placement="bottom"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="screenshot-edit-popover w-[320px] gap-0 rounded-2xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl data-closed:animate-none"
      >
        <div className="overflow-hidden rounded-2xl">
          <UploadArea
            onPickFile={(file) => {
              onReplaceWith(file);
              handleOpenChange(false);
            }}
          />
          <div
            className={cn(
              "grid gap-2 border-t border-border/60 p-2.5",
              showDelete ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenChange(false);
                onCropRequest();
              }}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground/6 text-[13px] font-medium text-foreground/75 transition-all hover:bg-foreground/10 hover:text-foreground"
            >
              <Crop className="size-4" />
              Crop
            </button>
            {showDelete ? (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenChange(false);
                  onRemove();
                }}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-danger/10 text-[13px] font-medium text-danger transition-all hover:bg-danger/18 hover:text-danger"
              >
                <Trash className="size-4" />
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </Popover.Content>
    </Popover>
  );
}
