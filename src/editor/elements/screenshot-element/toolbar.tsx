/**
 * ScreenshotToolbar — floating toolbar for a selected capture element.
 *
 * Renders inside the selection chrome near the shot box (positioned by the
 * screenshot element). Mirrors the shape/annotation toolbars: layer
 * ordering as individual bring-to-front / send-to-back buttons, duplicate,
 * and delete. Screenshot-specific extras on top:
 *
 *   • Image fit — object-fit popover (cover / contain / fill) for the
 *     captured media.
 *
 * Moving the box is handled by the shared SelectionChrome (like shapes), so
 * no drag handle lives here. Crop/replace live in the element's inline edit
 * menu (ShotActionsMenu).
 */
"use client";

import { BringToFront, Expand, SendToBack } from "lucide-react";
import { toast } from "@heroui/react";

import {
  ActionButton,
  ActionPopover,
  DeleteAction,
  Divider,
  DuplicateAction,
  ToolPanel,
} from "@/editor/toolbar/controls";
import { FitSelectorPanel } from "@/editor/toolbar/panels/fit-selector-panel";
import { useEditor } from "@/editor/lib/engine";
import type { Slot } from "./types";
import { MAX_SCREENSHOT_TILES } from "@/editor/lib/engine-core/initial-config";

export function ScreenshotToolbar({
  slot,
  canDeleteSlot,
}: {
  slot: Slot;
  canDeleteSlot: boolean;
}) {
  const {
    updateSlot,
    deleteSlot,
    duplicateSlot,
    bringSlotToFront,
    sendSlotToBack,
    setSelectedSlotId,
  } = useEditor();

  return (
    <ToolPanel aria-label="Screenshot box controls">
      {slot.src && (
        <>
          <ActionPopover
            tooltip="Image fit"
            contentClassName="p-2"
            trigger={({ open }) => (
              <ActionButton aria-label="Image fit" active={open}>
                <Expand className="size-4.5" />
              </ActionButton>
            )}
          >
            <FitSelectorPanel
              selected={slot.objectFit ?? "cover"}
              onSelect={(fit) => updateSlot(slot.id, { objectFit: fit })}
            />
          </ActionPopover>
          <Divider />
        </>
      )}

      <ActionButton
        aria-label="Bring to front"
        tooltip="Bring to front"
        onClick={() => bringSlotToFront(slot.id)}
      >
        <BringToFront className="size-4.5" />
      </ActionButton>

      <ActionButton
        aria-label="Send to back"
        tooltip="Send to back"
        onClick={() => sendSlotToBack(slot.id)}
      >
        <SendToBack className="size-4.5" />
      </ActionButton>

      {canDeleteSlot && (
        <DuplicateAction
          ariaLabel="Duplicate screenshot box"
          onDuplicate={() => {
            const id = duplicateSlot(slot.id);
            if (id) setSelectedSlotId(id);
            else
              toast(`Screenshot box limit reached (${MAX_SCREENSHOT_TILES})`);
          }}
        />
      )}

      {canDeleteSlot ? (
        <DeleteAction
          ariaLabel="Delete screenshot box"
          onDelete={() => {
            deleteSlot(slot.id);
            setSelectedSlotId(null);
          }}
        />
      ) : null}
    </ToolPanel>
  );
}
