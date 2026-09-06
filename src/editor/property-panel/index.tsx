/**
 * the editor's right property panel (desktop xl+).
 *
 * Shows the controls of the tool selected in the left sidebar (see
 * `editor/providers/panel-tool-provider.tsx`). Header displays the active tool name; the body
 * renders that tool's section only with smooth fluid transitions.
 */

"use client";

import * as React from "react";
import { LockKeyhole, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { ScrollShadow } from "@heroui/react";
import { TOOLS } from "@/editor/sidebar/tools";
import { usePanelTool } from "@/editor/providers/panel-tool-provider";
import { FramePickerInline } from "@/editor/property-panel/sections/frame";
import {
  useEditorStateField,
  useEditorEngine,
  useSelectedScreenshotTile,
} from "@/editor/lib/engine";
import type { DeviceFrame } from "@/editor/lib/engine";
import { cn } from "@/lib/utils";

import { BackdropSection } from "./sections/backdrop";
import { BackgroundSection } from "./sections/background";
import { BorderSection } from "./sections/border";
import { ShadowSection } from "./sections/shadow";
import { TransformSection } from "./sections/transform";

const TOOL_TITLES: Record<string, string> = {
  deviceFrame: "Frame",
  background: "Background",
  backdrop: "Backdrop",
  border: "Border",
  transform: "Transform",
  shadow: "Shadow",
};
const CanvasLockOverlay = ({ title }: { title: string }) => (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/70 px-6 text-center backdrop-blur-[2px]">
    <span className="flex size-8 items-center justify-center rounded-full border border-border bg-surface-secondary text-muted-foreground">
      <LockKeyhole className="size-3.5" />
    </span>
    <p className="text-[11px] leading-relaxed text-muted-foreground">
      {title} is a canvas-level property — it only applies to the whole group or
      the Main layer.
    </p>
  </div>
);

export function PropertyPenel({ className }: { className?: string }) {
  const { tool } = usePanelTool();
  const toolItem = TOOLS.find((t) => t.id === tool);
  const Icon = toolItem?.icon || SlidersHorizontal;

  const isAnimateMode = useEditorEngine((s) => s.isAnimateMode);
  const selectedSlotId = useEditorEngine((s) => s.selectedSlotId);
  const selectedTextId = useEditorEngine((s) => s.selectedTextId);
  // Canvas-level properties (background / backdrop / frame) only animate on
  // the whole group or the Main layer — locked while a slot/text layer is the
  // active animation target. Slot-level props (shadow, border, radius,
  // transform, position…) stay editable.
  const canvasLocked =
    isAnimateMode && (selectedSlotId != null || selectedTextId != null);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-65 shrink-0 flex-col overflow-hidden border-l border-border bg-surface-secondary/95 xl:w-77 select-none",
        className,
      )}
    >
      {/* Panel header with smooth animated transition */}
      <div className="flex h-11 shrink-0 items-center border-b border-border px-4 text-muted-foreground overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tool}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="flex items-center gap-2"
          >
            <Icon className="size-4 text-primary" />
            <span className="text-[12.5px] font-semibold tracking-tight text-foreground">
              {TOOL_TITLES[tool] ?? "Properties"}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Panel body with fluid cross-fade transition */}
      <ScrollShadow hideScrollBar className="min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tool}
            initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
            transition={{
              duration: 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              tool === "frame" ? "h-full" : "px-3 py-4 pb-20 xl:px-4",
            )}
          >
            {tool === "frame" ? <FrameTool /> : null}
            {tool === "background" ? (
              <div className="relative">
                <BackgroundSection />
                {canvasLocked && <CanvasLockOverlay title="Background" />}
              </div>
            ) : null}
            {tool === "backdrop" ? <BackdropSection /> : null}
            {tool === "border" ? <BorderSection /> : null}
            {tool === "transform" ? <TransformSection /> : null}
            {tool === "shadow" ? <ShadowSection /> : null}
          </motion.div>
        </AnimatePresence>
      </ScrollShadow>
    </aside>
  );
}

/**
 * Frame tool: the picker embedded inline (no popover) with the same
 * contextual write behavior the sidebar used to have.
 */
function FrameTool() {
  const globalAspect = useEditorEngine((s) => s.present.aspect);
  const frame = useEditorStateField((c) => c.deviceFrame);
  const objectFit = useEditorStateField((c) => c.objectFit);
  const setDeviceFrameForMatchingSlots = useEditorEngine(
    (s) => s.setDeviceFrameForMatchingSlots,
  );
  const setMainScreenshotDeviceFrame = useEditorEngine(
    (s) => s.setMainScreenshotDeviceFrame,
  );
  const updateSlot = useEditorEngine((s) => s.updateSlot);
  const selectedSlot = useSelectedScreenshotTile();
  const isScreenshotSelected = useEditorEngine((s) => s.isScreenshotSelected);

  const displayFrame = selectedSlot?.deviceFrame ?? frame;
  const activeFrameRef = React.useRef(frame);
  React.useLayoutEffect(() => {
    activeFrameRef.current = frame;
  });

  const handleFrameChange = React.useCallback(
    (nextFrame: DeviceFrame) => {
      if (selectedSlot) {
        updateSlot(selectedSlot.id, { deviceFrame: nextFrame });
      } else if (isScreenshotSelected) {
        setMainScreenshotDeviceFrame(nextFrame);
      } else {
        setDeviceFrameForMatchingSlots(nextFrame);
      }
    },
    [
      selectedSlot,
      isScreenshotSelected,
      updateSlot,
      setMainScreenshotDeviceFrame,
      setDeviceFrameForMatchingSlots,
      globalAspect,
    ],
  );

  return (
    <FramePickerInline
      value={displayFrame}
      onChange={handleFrameChange}
      previewImage={selectedSlot ? selectedSlot.src : undefined}
      imageFit={selectedSlot?.objectFit ?? objectFit ?? "cover"}
    />
  );
}
