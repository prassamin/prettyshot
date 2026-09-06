"use client";

import * as React from "react";

import {
  useEditorEngine,
  useEditorStateField,
  useSelectedScreenshotTile,
} from "@/editor/lib/engine";
import { cn } from "@/lib/utils";

type FitMode = "contain" | "cover" | "fill";

interface FitOption {
  id: FitMode;
  name: string;
  tag: string;
  icon: React.ReactNode;
}

const FIT_OPTIONS: FitOption[] = [
  {
    id: "cover",
    name: "Cover",
    tag: "Crop to Fill",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-full"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          strokeDasharray="3 3"
          className="opacity-40"
        />
        <rect x="1" y="6" width="22" height="12" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "contain",
    name: "Contain",
    tag: "Fit Inside",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-full"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          strokeDasharray="3 3"
          className="opacity-40"
        />
        <rect x="7" y="5" width="10" height="14" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "fill",
    name: "Fill",
    tag: "Full Bounds",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-full"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          className="opacity-30"
        />
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path
          d="M12 7v10M12 7l-2 2M12 7l2 2M12 17l-2-2M12 17l2-2"
          className="opacity-50"
        />
        <path
          d="M7 12h10M7 12l2-2M7 12l2 2M17 12l-2-2M17 12l-2 2"
          className="opacity-50"
        />
      </svg>
    ),
  },
];

export function MobileFitPanel() {
  const selectedSlot = useSelectedScreenshotTile();
  const screenshot = useEditorStateField((c) => c.screenshot);
  const objectFit = useEditorStateField((c) => c.objectFit);
  const setObjectFit = useEditorEngine((s) => s.setObjectFit);
  const updateSlot = useEditorEngine((s) => s.updateSlot);

  const activeFit = selectedSlot?.objectFit ?? objectFit ?? "cover";
  const hasFitTarget = selectedSlot
    ? Boolean(selectedSlot.src)
    : Boolean(screenshot);

  const setFit = React.useCallback(
    (fit: FitMode) => {
      if (selectedSlot) {
        updateSlot(selectedSlot.id, { objectFit: fit });
        return;
      }
      setObjectFit(fit);
    },
    [selectedSlot, setObjectFit, updateSlot],
  );

  return (
    <div className="flex w-full flex-col select-none text-foreground px-1 pt-1 pb-3">
      {/* Horizontal Rail of Fit Options (Aligned to start) */}
      <div className="flex w-full items-center justify-start gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FIT_OPTIONS.map((item) => {
          const isActive = activeFit === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={!hasFitTarget}
              aria-pressed={isActive}
              onClick={() => setFit(item.id)}
              className={cn(
                "group flex min-w-18 w-18 shrink-0 cursor-pointer flex-col items-center gap-1.5 outline-none transition-transform active:scale-90",
                !hasFitTarget &&
                  "cursor-not-allowed opacity-40 active:scale-100",
              )}
            >
              {/* Refined Icon Container */}
              <div className="flex h-11 w-full items-center justify-center">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl border transition-all duration-150",
                    isActive
                      ? "border-primary bg-primary/15 text-primary shadow-xs ring-1 ring-primary/30"
                      : "border-border/80 bg-surface-tertiary/70 text-muted-foreground group-hover:border-border group-hover:text-foreground",
                  )}
                >
                  <span className="size-5.5 flex items-center justify-center">
                    {item.icon}
                  </span>
                </div>
              </div>

              {/* Typography */}
              <div className="flex w-full flex-col items-center text-center">
                <span
                  className={cn(
                    "w-full truncate text-[12px] font-bold leading-tight transition-colors duration-150",
                    isActive
                      ? "text-primary"
                      : "text-foreground group-hover:text-foreground",
                  )}
                >
                  {item.name}
                </span>
                <span
                  className={cn(
                    "w-full truncate text-[9.5px] font-medium leading-tight mt-0.5 transition-colors duration-150",
                    isActive
                      ? "text-primary/90 font-semibold"
                      : "text-muted-foreground/80",
                  )}
                >
                  {item.tag}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
