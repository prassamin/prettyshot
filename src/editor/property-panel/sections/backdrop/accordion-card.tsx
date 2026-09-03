"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccordionPanelProps } from "./types";
import { Tooltip } from "@/components/tooltip";

export function AccordionCard({
  title,
  icon: SectionIcon,
  isOpen,
  onToggle,
  isActive = false,
  disabled = false,
  onReset,
  resetTitle = "Reset to default",
  children,
  className,
}: AccordionPanelProps) {
  const handleResetClick = React.useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      onReset?.();
    },
    [onReset],
  );

  return (
    <div
      className={cn(
        "transition-colors pb-0.5",
        disabled && "opacity-50",
        className,
      )}
    >
      {/* Interactive Section Header */}
      <button
        type="button"
        onClick={disabled ? undefined : onToggle}
        aria-expanded={isOpen}
        aria-disabled={disabled}
        className={cn(
          "group/item flex h-8.5 w-full cursor-pointer items-center justify-between rounded-md px-1.5 text-left select-none transition-all hover:bg-muted/40",
          isActive || isOpen
            ? "text-foreground"
            : "text-muted-foreground/80 hover:text-foreground",
          disabled && "cursor-not-allowed hover:bg-transparent",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {SectionIcon && (
            <SectionIcon
              className={cn(
                "size-3.5 transition-colors",
                isActive || isOpen
                  ? "text-foreground"
                  : "text-muted-foreground/70 group-hover/item:text-foreground",
              )}
            />
          )}
          <span
            className={cn(
              "truncate text-[12px] font-semibold tracking-tight transition-colors",
              isActive || isOpen
                ? "text-foreground"
                : "text-muted-foreground/80 group-hover/item:text-foreground",
            )}
          >
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isActive && onReset && !disabled && (
            <Tooltip content={resetTitle}>
              <span
                role="button"
                tabIndex={0}
                aria-label={resetTitle}
                onClick={handleResetClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleResetClick(e);
                  }
                }}
                className="flex size-5 cursor-pointer items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                <RotateCcw className="size-3" />
              </span>
            </Tooltip>
          )}

          <div
            className={cn(
              "flex size-4 items-center justify-center text-muted-foreground/50 transition-transform duration-200",
              isOpen && "rotate-180 text-foreground",
            )}
          >
            <ChevronDown className="size-3.5" />
          </div>
        </div>
      </button>

      {/* Fluid Expandable Content Area */}
      <AnimatePresence initial={false}>
        {isOpen && !disabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-1.5 pt-1.5 pb-3 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
