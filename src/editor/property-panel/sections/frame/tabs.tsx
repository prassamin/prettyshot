/**
 * Frame picker — category tabs.
 */

import * as React from "react";
import { Smartphone } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import { ALL_CATEGORY_ID } from "./options";
import type { FrameCategory } from "./types";

export function FrameCategoryTabs({
  categories,
  activeCategoryId,
  onChange,
  className,
}: {
  categories: FrameCategory[];
  activeCategoryId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Device categories"
      className={cn(
        "flex w-full items-center gap-1 overflow-x-auto rounded-lg bg-foreground/4 p-1 scrollbar-hide",
        className,
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeCategoryId === ALL_CATEGORY_ID}
        onClick={() => onChange(ALL_CATEGORY_ID)}
        className={cn(
          "relative flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors",
          activeCategoryId === ALL_CATEGORY_ID
            ? "font-semibold text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {activeCategoryId === ALL_CATEGORY_ID && (
          <motion.span
            layoutId="frame-cat-pill"
            className="absolute inset-0 rounded-md bg-background/60 shadow-xs ring-1 ring-border/60"
            transition={{ type: "spring", stiffness: 450, damping: 35 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5">
          <Smartphone className="size-3.5" />
          <span>All</span>
        </span>
      </button>
      {categories.map((category) => {
        const active = category.id === activeCategoryId;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(category.id)}
            className={cn(
              "relative flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors",
              active
                ? "font-semibold text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="frame-cat-pill"
                className="absolute inset-0 rounded-md bg-background shadow-xs ring-1 ring-border/60"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {category.iconUrl ? (
                <img
                  src={category.iconUrl}
                  alt=""
                  className="size-3.5 object-contain"
                />
              ) : (
                <category.icon className="size-3.5" />
              )}
              <span>{category.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
