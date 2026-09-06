"use client";

import { MobileAspectPanel } from "./aspect-panel";
import { MobileBackgroundPanel } from "./background-panel";
import { MobileFramePanel } from "./frame-panel";
import { MobileFilterPanel } from "./filter-panel";
import { MobileLayersPanel } from "./layers-panel";
import { MobileLightingPanel } from "./lighting-panel";
import { MobileOverlayPanel } from "./overlay-panel";
import { MobileAdjustPanel } from "./adjust-panel";
import { MobileBorderPanel } from "./border-panel";
import { MobileShadowPanel } from "./shadow-panel";
import { MobileTransformPanel } from "./transform-panel";
import type { AspectState } from "@/editor/lib/engine";

import type { CategoryId } from "./categories";
import { MobileFitPanel } from "./fit-panel";
import { MobileMovePanel } from "./move-panel";

export function InlineOptions({
  id,
  aspect,
  onAspectChange,
  onClose,
}: {
  id: CategoryId;
  aspect: AspectState;
  onAspectChange: (id: string, custom?: { w: number; h: number }) => void;
  onClose: () => void;
}) {
  if (id === "aspect") {
    return (
      <div className="flex w-full flex-col">
        <MobileAspectPanel
          aspect={aspect}
          onChange={onAspectChange}
          onClose={onClose}
        />
      </div>
    );
  }

  if (id === "fit") {
    return (
      <div className="flex w-full flex-col">
        <MobileFitPanel />
      </div>
    );
  }

  if (id === "move") {
    return (
      <div className="flex w-full flex-col">
        <MobileMovePanel />
      </div>
    );
  }

  if (id === "layers") {
    return (
      <div className="flex w-full flex-col">
        <MobileLayersPanel />
      </div>
    );
  }

  if (id === "background") {
    return (
      <div className="h-full overflow-y-auto px-1">
        <MobileBackgroundPanel />
      </div>
    );
  }

  if (id === "frame") {
    return (
      <div className="h-full w-full overflow-hidden px-1">
        <MobileFramePanel />
      </div>
    );
  }

  if (id === "filter") {
    return (
      <div className="flex w-full flex-col">
        <MobileFilterPanel />
      </div>
    );
  }

  if (id === "lighting") {
    return (
      <div className="h-full overflow-y-auto px-2">
        <MobileLightingPanel />
      </div>
    );
  }

  if (id === "overlay") {
    return (
      <div className="h-full overflow-y-auto px-2">
        <MobileOverlayPanel />
      </div>
    );
  }

  if (id === "adjust") {
    return (
      <div className="h-full overflow-y-auto px-2">
        <MobileAdjustPanel />
      </div>
    );
  }

  if (id === "border") {
    return (
      <div className="h-full overflow-y-auto px-2">
        <MobileBorderPanel />
      </div>
    );
  }

  if (id === "shadow") {
    return (
      <div className="h-full overflow-y-auto px-2">
        <MobileShadowPanel />
      </div>
    );
  }

  if (id === "transform") {
    return (
      <div className="h-full overflow-y-auto px-2">
        <MobileTransformPanel />
      </div>
    );
  }

  return null;
}
