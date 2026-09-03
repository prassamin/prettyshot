"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/tooltip";

export type ObjectFit = "contain" | "cover" | "fill";

const FIT_OPTIONS: ReadonlyArray<{
  value: ObjectFit;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "contain",
    label: "Contain",
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
    value: "cover",
    label: "Cover",
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
    value: "fill",
    label: "Fill",
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

export function FitSelectorPanel({
  selected,
  onSelect,
}: {
  selected: ObjectFit;
  onSelect: (fit: ObjectFit) => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-1">
      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        Fit Mode
      </span>
      <div className="flex gap-1.5">
        {FIT_OPTIONS.map(({ value: optionValue, label, icon }) => {
          const isSelected = selected === optionValue;
          return (
            <Tooltip content={label} key={optionValue}>
              <button
                onClick={() => onSelect(optionValue)}
                className={cn(
                  "group w-14 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border px-2 py-2.5 outline-none transition-all duration-200",
                  isSelected
                    ? "border-primary/20 bg-primary/10 text-primary shadow-sm"
                    : "border-transparent bg-surface-secondary/3 text-muted-foreground hover:bg-foreground/10/6 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-5 transition-colors",
                    isSelected
                      ? "text-primary"
                      : "group-hover:text-foreground/80",
                  )}
                >
                  {icon}
                </span>
                <span className="text-[10px] font-medium tracking-wide">
                  {label}
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
