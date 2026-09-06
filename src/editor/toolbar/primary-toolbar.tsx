"use client";

import * as React from "react";
import {
  Clapperboard,
  Grid3x3,
  ImagePlus,
  Layers,
  LineSquiggle,
  MousePointer2,
  Move,
  TypeIcon,
} from "lucide-react";
import { toast } from "@heroui/react";

import { LayersPanel } from "@/editor/toolbar/panels/layers-panel";
import { ActionButton, ActionPopover } from "@/editor/toolbar/controls";
import { useEditor, useEditorEngine } from "@/editor/lib/engine";
import { readImageFileAsDataUrl } from "@/editor/lib/image-resize";
import PositionPanel from "./panels/position-panel";
import { type EditorToolBarTool } from "@/types/editor";
import { MAX_SCREENSHOT_TILES } from "@/editor/lib/engine-core/initial-config";
import { FeatureLock } from "../components/feature-lock";
import { FeatureId } from "@/config/features";
import { MAX_FILE_SIZE } from "@/config";

type Action = {
  id: EditorToolBarTool;
  label: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  popover?: React.ReactNode;
  featureId?: FeatureId;
  popoverWidth?: string;
};

const primaryActions: Action[] = [
  { id: "pointer", label: "Select", shortcut: "V", icon: MousePointer2 },
  {
    id: "text",
    label: "Text",
    icon: TypeIcon,
    shortcut: "T",
    featureId: "elements.text",
  },
  {
    id: "draw",
    label: "Draw",
    icon: LineSquiggle,
    shortcut: "P",
    featureId: "elements.annotations",
  },
];

const secondaryActions: Action[] = [
  {
    id: "position",
    label: "Arrange",
    icon: Move,
    popover: <PositionPanel targetLabel="Arrange" />,
    popoverWidth: "w-64 p-3",
  },
  {
    id: "layers",
    label: "Layers",
    icon: Layers,
    popover: <LayersPanel />,
    popoverWidth: "w-auto p-0",
  },
];

export function PrimaryToolbar() {
  const isAnimateMode = useEditorEngine((s) => s.isAnimateMode);
  const {
    activeTool,
    setActiveTool,
    addText,
    setSelectedTextId,
    addAsset,
    setSelectedAssetId,
    setAnnotation,
    setIsScreenshotSelected,
    setSelectedSlotId,
    addSlot,
    slots,
    setSelectedAnnotationShapeId,
    setIsAnimateMode,
  } = useEditor();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const importImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.danger("File must be an image");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.danger("Image size must be less than 10MB");
      return;
    }
    void readImageFileAsDataUrl(file, {
      downscaleAbove: MAX_FILE_SIZE,
      maxDimension: 1600,
    })
      .then((src) => {
        const id = addAsset(src);
        setSelectedAssetId(id);
        setSelectedTextId(null);
        setSelectedSlotId(null);
        setIsScreenshotSelected(false);
        setActiveTool("pointer");
      })
      .catch(() => {
        toast.danger("Failed to load image");
      });
  };

  const pickTool = (id: EditorToolBarTool) => {
    if (id === "text") {
      const newId = addText();
      setSelectedTextId(newId);
      setSelectedSlotId(null);
      setIsScreenshotSelected(false);
      setActiveTool("pointer");
      return;
    }
    if (id === "draw") {
      setAnnotation({ mode: "pen" });
    }
    setActiveTool(id);
  };

  const renderAction = (action: Action) => {
    const isActive = activeTool === action.id;
    const Icon = action.icon;

    if (action.popover) {
      return (
        <ActionPopover
          key={action.id}
          tooltip={
            <div className="flex items-center gap-2">
              <span>{action.label}</span>
              {action.shortcut && (
                <kbd className="rounded bg-surface-tertiary px-1.5 font-mono text-sm text-muted-foreground">
                  {action.shortcut}
                </kbd>
              )}
            </div>
          }
          contentClassName={action.popoverWidth}
          onOpenChange={(open) => {
            if (!open) setActiveTool("pointer");
          }}
          trigger={({ open }) => (
            <FeatureLock
              featureId={action.featureId}
              overlay="badge"
              size="xs"
              icon={false}
            >
              <ActionButton
                aria-label={action.label}
                active={open || isActive}
                onClick={() => pickTool(action.id)}
              >
                <Icon className="size-4.5" />
              </ActionButton>
            </FeatureLock>
          )}
        >
          {action.popover}
        </ActionPopover>
      );
    }

    return (
      <FeatureLock
        key={action.id}
        featureId={action.featureId}
        overlay="badge"
        size="xs"
        icon={false}
      >
        <ActionButton
          aria-label={action.label}
          tooltip={
            <div className="flex items-center gap-2">
              <span>{action.label}</span>
              {action.shortcut && (
                <kbd className="rounded bg-surface-tertiary px-1.5 font-mono text-sm text-muted-foreground">
                  {action.shortcut}
                </kbd>
              )}
            </div>
          }
          active={isActive}
          onClick={() => pickTool(action.id)}
        >
          <Icon className="size-4.5" />
        </ActionButton>
      </FeatureLock>
    );
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files) {
            for (const f of Array.from(files)) importImage(f);
          }
          e.target.value = "";
        }}
      />

      <div className="flex items-center gap-1">
        {primaryActions.map(renderAction)}
      </div>

      <FeatureLock
        featureId="elements.assets"
        overlay="badge"
        size="xs"
        icon={false}
      >
        <ActionButton
          aria-label="Import Image"
          tooltip="Import Image"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="size-4.5" />
        </ActionButton>
      </FeatureLock>

      <span className="mx-1 h-5 w-px bg-foreground/10" />

      <div className="flex items-center gap-1">
        {secondaryActions.map(renderAction)}
      </div>

      <FeatureLock
        featureId="core.multiSlot"
        overlay="badge"
        size="xs"
        icon={false}
      >
        <ActionButton
          aria-label="Add screenshot box"
          tooltip={
            slots.length >= MAX_SCREENSHOT_TILES
              ? `Maximum ${MAX_SCREENSHOT_TILES} screenshot boxes`
              : "Add a screenshot"
          }
          onClick={() => {
            const id = addSlot();
            if (id) {
              setSelectedSlotId(id);
              setSelectedTextId(null);
              setSelectedAssetId(null);
              setSelectedAnnotationShapeId(null);
              setIsScreenshotSelected(false);
              setActiveTool("pointer");
            }
          }}
        >
          <Grid3x3 className="size-4.5" />
        </ActionButton>
      </FeatureLock>

      <span className="mx-1 h-5 w-px bg-foreground/10" />

      <ActionButton
        aria-label="Animate"
        tooltip="Animate"
        active={isAnimateMode}
        onClick={() => {
          setIsAnimateMode(true);
        }}
      >
        <Clapperboard className="size-4.5" />
      </ActionButton>
    </>
  );
}
