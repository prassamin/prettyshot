"use client";

import { Ban } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BorderStyle } from "./types";
import { BORDER_STYLE_OPTIONS } from "./constants";

interface StyleControlProps {
  style: BorderStyle | undefined;
  disabled?: boolean;
  onChangeStyle: (style: BorderStyle) => void;
}

function StyleBoxPreview({ style }: { style: BorderStyle }) {
  if (style === "none") {
    return (
      <div className="relative flex size-full items-center justify-center">
        <div className="relative flex size-full items-center justify-center rounded-md border border-dashed border-muted-foreground/30 bg-transparent">
          <Ban className="size-3.5 text-muted-foreground/50 stroke-[2.2]" />
        </div>
      </div>
    );
  }

  const getBorderClass = () => {
    switch (style) {
      case "dashed":
        return "border-2 border-dashed";
      case "dotted":
        return "border-2 border-dotted";
      case "double":
        return "border-[3px] border-double";
      case "groove":
        return "border-[3px] border-groove";
      case "ridge":
        return "border-[3px] border-ridge";
      case "solid":
      default:
        return "border-2 border-solid";
    }
  };

  return (
    <div
      style={{ borderColor: "inherit" }}
      className={cn(
        "size-full rounded-md bg-transparent shadow-2xs transition-colors",
        getBorderClass(),
      )}
    />
  );
}

export function StyleControl({
  style = "none",
  disabled = false,
  onChangeStyle,
}: StyleControlProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-4 gap-2",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      {BORDER_STYLE_OPTIONS.map((option) => {
        const isActive = style === option.id;
        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChangeStyle(option.id)}
            aria-pressed={isActive}
            className={cn(
              "group relative flex cursor-pointer flex-col items-center overflow-hidden rounded-xl border p-1.5 transition-all duration-200 ease-out select-none",
              isActive
                ? "border-primary/80 bg-primary/12 ring-1.5 ring-primary shadow-[0_0_18px_rgba(var(--primary),0.28)] scale-[1.01]"
                : "border-border/50 bg-foreground/2 hover:border-foreground/30 hover:bg-foreground/6 hover:scale-[1.02] hover:shadow-md",
              disabled && "cursor-not-allowed hover:scale-100 hover:border-border/50 hover:bg-foreground/2",
            )}
            title={option.label}
          >
            {/* Background Indicator */}
            {isActive && !disabled && (
              <motion.span
                layoutId="border-style-active-indicator"
                className="absolute inset-0 z-0 rounded-lg bg-primary/20 ring-1.5 ring-primary shadow-[0_0_14px_rgba(var(--primary),0.25)]"
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 32,
                }}
              />
            )}

            {/* Pure Border Preview Box */}
            <div
              className={cn(
                "relative z-10 h-10 w-full overflow-hidden rounded-md p-1",
                isActive ? "border-primary/80" : "border-muted-foreground/30",
              )}
            >
              <StyleBoxPreview style={option.id} />
            </div>

            {/* Label */}
            <span
              className={cn(
                "relative z-10 mt-1 text-[10.5px] tracking-tight transition-colors line-clamp-1",
                isActive
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
