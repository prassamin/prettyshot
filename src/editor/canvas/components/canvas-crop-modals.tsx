"use client";

import * as React from "react";

import { CropModal } from "@/editor/crop/crop-modal";
import type { CropTarget } from "@/editor/lib/crop-utils";
import type { CropRegion } from "@/editor/crop/types";
import type { Slot } from "@/editor/elements/types";

export type SlotCropRequest = CropTarget & {
  slotId: string;
};

type CanvasCropModalsProps = {
  isCanvasPreview: boolean;
  mainCropRequest: CropTarget | null;
  setMainCropRequest: (target: CropTarget | null) => void;
  screenshot: string | null;
  originalScreenshot: string | null;
  applyCroppedScreenshot: (cropped: string, region: CropRegion) => void;
  slotCropRequest: SlotCropRequest | null;
  setSlotCropRequest: (target: SlotCropRequest | null) => void;
  slots: Slot[];
  applyCroppedSlot: (slotId: string, cropped: string, region: CropRegion) => void;
};

export function CanvasCropModals({
  isCanvasPreview,
  mainCropRequest,
  setMainCropRequest,
  screenshot,
  originalScreenshot,
  applyCroppedScreenshot,
  slotCropRequest,
  setSlotCropRequest,
  slots,
  applyCroppedSlot,
}: CanvasCropModalsProps) {
  if (isCanvasPreview) return null;

  return (
    <>
      <CropModal
        open={mainCropRequest !== null}
        onOpenChange={(open) => {
          if (!open) setMainCropRequest(null);
        }}
        screenshotUrl={originalScreenshot ?? screenshot}
        initialRegion={mainCropRequest?.initialRegion}
        targetAspect={mainCropRequest?.aspect}
        onCrop={(cropped, region) => {
          applyCroppedScreenshot(cropped, region);
        }}
      />

      <CropModal
        open={slotCropRequest !== null}
        onOpenChange={(open) => {
          if (!open) setSlotCropRequest(null);
        }}
        screenshotUrl={
          slotCropRequest
            ? (() => {
                const slot = slots.find(
                  (s) => s.id === slotCropRequest.slotId,
                );
                return slot?.originalSrc ?? slot?.src ?? null;
              })()
            : null
        }
        initialRegion={slotCropRequest?.initialRegion}
        targetAspect={slotCropRequest?.aspect}
        onCrop={(cropped, region) => {
          if (slotCropRequest) {
            applyCroppedSlot(
              slotCropRequest.slotId,
              cropped,
              region,
            );
            setSlotCropRequest(null);
          }
        }}
      />
    </>
  );
}
