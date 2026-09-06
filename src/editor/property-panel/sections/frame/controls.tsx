/**
 * Frame picker — footer controls (color swatches + orientation toggle).
 */

import { Smartphone } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import { formatColor, formatOrientation } from "./options";

export function OrientationToggle({
  value,
  onChange,
}: {
  value: "vertical" | "horizontal";
  onChange: (orientation: "vertical" | "horizontal") => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-foreground/4 p-1 ring-1 ring-border/50">
      {(["vertical", "horizontal"] as const).map((orientation) => {
        const active = value === orientation;
        const isHoriz = orientation === "horizontal";
        return (
          <button
            key={orientation}
            type="button"
            aria-label={formatOrientation(orientation)}
            title={formatOrientation(orientation)}
            onClick={() => onChange(orientation)}
            className={cn(
              "relative flex h-7 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-colors",
              active
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="frame-orient-pill"
                className="absolute inset-0 rounded-md bg-background shadow-xs ring-1 ring-border/60"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Smartphone
                className={cn(
                  "size-3.5 transition-transform",
                  isHoriz && "rotate-90",
                )}
              />
              <span className="capitalize">
                {orientation === "vertical" ? "Portrait" : "Landscape"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ColorSwatchRow({
  variantIds,
  colorMap,
  selected,
  onChange,
}: {
  variantIds: string[];
  colorMap?: Record<string, string>;
  selected: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {variantIds.map((color) => {
        const active = color === selected;
        return (
          <button
            key={color}
            type="button"
            aria-label={formatColor(color)}
            title={formatColor(color)}
            aria-pressed={active}
            onClick={() => onChange(color)}
            className={cn(
              "relative flex size-6.5 cursor-pointer items-center justify-center rounded-full transition-all duration-200",
              active
                ? "scale-105 ring-2 ring-primary ring-offset-2 ring-offset-background"
                : "opacity-80 hover:scale-110 hover:opacity-100",
            )}
          >
            <span
              className="size-4.5 rounded-full border border-black/10 shadow-sm"
              style={{ background: colorMap?.[color] || "#6b7280" }}
            />
          </button>
        );
      })}
    </div>
  );
}
