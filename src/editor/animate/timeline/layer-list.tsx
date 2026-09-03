"use client";

import { Image as ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { TimelineLayer } from "../types";
import { Tooltip } from "@/components/tooltip";

type LayerListProps = {
  layers: TimelineLayer[];
  activeLayerId: string;
  onLayerSelect: (layerId: string) => void;
};

/**
 * Sticky left column of the timeline — one button per animation layer.
 * Clicking a button selects that layer as the target for new keyframes.
 */
export function LayerList({
  layers,
  activeLayerId,
  onLayerSelect,
}: LayerListProps) {
  return (
    <div className="sticky left-0 z-30 mt-6 flex w-36 shrink-0 flex-col gap-1.5">
      {layers.map((layer) => {
        const isActive = activeLayerId === layer.id;
        return (
          <Tooltip content={layer.label} key={layer.id}>
            <button
              key={layer.id}
              type="button"
              onClick={() => onLayerSelect(layer.id)}
              className={cn(
                "group relative flex h-11 w-full cursor-pointer items-center gap-2 overflow-hidden rounded-lg border px-2 text-left transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none",
                isActive
                  ? "border-primary/40 bg-linear-to-r from-primary/15 via-primary/5 to-transparent text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:bg-surface-secondary/60 hover:text-foreground",
              )}
            >
              {isActive && (
                <span className="absolute inset-y-1.5 left-0 w-0.75 rounded-r-full bg-primary shadow-[0_0_8px_var(--primary)]" />
              )}
              <span className="relative block size-7 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
                {layer.src ? (
                  <img
                    src={layer.src}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="absolute inset-0 m-auto size-3.5 text-muted-foreground" />
                )}
                <span className="absolute inset-0 bg-linear-to-t from-overlay/30 to-transparent" />
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                {layer.label}
              </span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
