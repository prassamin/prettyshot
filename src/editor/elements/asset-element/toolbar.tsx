/**
 * AssetToolbar — floating toolbar for a selected asset (imported image).
 *
 * Provides: replace, flip (h/v), filter grid, blend-mode grid, opacity slider,
 * layer ordering, duplicate, and delete. Moving is handled by the shared
 * SelectionChrome, so no drag handle is needed here.
 */
"use client";

import * as React from "react";

import {
  BringToFront,
  Droplets,
  FlipHorizontal2,
  FlipVertical2,
  RefreshCw,
  SendToBack,
} from "lucide-react";

import {
  ActionButton,
  ActionPopover,
  DeleteAction,
  Divider,
  DuplicateAction,
  ToolPanel,
} from "@/editor/toolbar/controls";
import { Slider } from "@/components/slider";
import { useEditor } from "@/editor/lib/engine";
import { readImageFileAsDataUrl } from "@/editor/lib/image-resize";
import { toast } from "@heroui/react";
import { MAX_FILE_SIZE } from "@/config";

import type { AssetElement } from "./types";

export function AssetToolbar({ asset }: { asset: AssetElement }) {
  const {
    deleteAsset,
    duplicateAsset,
    bringAssetToFront,
    sendAssetToBack,
    setSelectedAssetId,
    updateAsset,
  } = useEditor();
  const replaceInputRef = React.useRef<HTMLInputElement>(null);

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.danger("Image size must be less than 10MB");
      e.target.value = "";
      return;
    }
    void readImageFileAsDataUrl(file, {
      downscaleAbove: MAX_FILE_SIZE,
      maxDimension: 1600,
    })
      .then((src) => updateAsset(asset.id, { src }))
      .catch(() => {});
    e.target.value = "";
  };

  return (
    <ToolPanel>
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplace}
      />

      <ActionButton
        aria-label="Replace asset"
        tooltip="Replace"
        onClick={() => replaceInputRef.current?.click()}
      >
        <RefreshCw className="size-4.5" />
      </ActionButton>

      <ActionButton
        aria-label="Flip horizontal"
        tooltip="Flip horizontal"
        active={asset.flipX}
        onClick={() => updateAsset(asset.id, { flipX: !asset.flipX })}
      >
        <FlipHorizontal2 className="size-4.5" />
      </ActionButton>

      <ActionButton
        aria-label="Flip vertical"
        tooltip="Flip vertical"
        active={asset.flipY}
        onClick={() => updateAsset(asset.id, { flipY: !asset.flipY })}
      >
        <FlipVertical2 className="size-4.5" />
      </ActionButton>

      <Divider />

      <ActionPopover
        tooltip="Opacity"
        contentClassName="w-56 p-3"
        trigger={({ open }) => (
          <ActionButton
            aria-label="Opacity"
            active={open || asset.opacity < 100}
          >
            <Droplets className="size-4.5" />
          </ActionButton>
        )}
      >
        <AssetOpacitySlider asset={asset} />
      </ActionPopover>

      <Divider />

      <ActionButton
        aria-label="Bring to front"
        tooltip="Bring to front"
        onClick={() => bringAssetToFront(asset.id)}
      >
        <BringToFront className="size-4.5" />
      </ActionButton>

      <ActionButton
        aria-label="Send to back"
        tooltip="Send to back"
        onClick={() => sendAssetToBack(asset.id)}
      >
        <SendToBack className="size-4.5" />
      </ActionButton>

      <DuplicateAction
        ariaLabel="Duplicate asset"
        onDuplicate={() => {
          const id = duplicateAsset(asset.id);
          if (id) setSelectedAssetId(id);
        }}
      />

      <DeleteAction
        ariaLabel="Delete asset"
        onDelete={() => {
          deleteAsset(asset.id);
          setSelectedAssetId(null);
        }}
      />
    </ToolPanel>
  );
}

/** Opacity slider. */
function AssetOpacitySlider({ asset }: { asset: AssetElement }) {
  const { updateAsset } = useEditor();
  return (
    <Slider
      label="Opacity"
      min={0}
      max={100}
      step={1}
      value={asset.opacity}
      formatValue={(v) => `${Math.round(v)}%`}
      onValueChange={(v) => updateAsset(asset.id, { opacity: v })}
    />
  );
}
