/**
 * LeftSidebar — the editor's tool rail (desktop xl+).
 *
 * Figma/Canva-style navigation: one row per tool. Clicking a row opens that
 * tool's detailed controls in the right property panel (see
 * `editor/property-panel`). Animate mode appends an "Animation" entry.
 */

"use client";

import * as React from "react";
import { LayoutGroup, motion } from "framer-motion";

import { usePanelTool } from "@/editor/providers/panel-tool-provider";
import { cn } from "@/lib/utils";
import { TOOLS } from "./tools";

export function LeftSidebar({
  className,
}: {
  className?: string;
}) {
  const { tool, setTool } = usePanelTool();
  const [hoveredTool, setHoveredTool] = React.useState<string | null>(null);
  const instanceId = React.useId();

  const entries = TOOLS;

  const activePillId = `${instanceId}-active-pill`;
  const hoverPillId = `${instanceId}-hover-pill`;

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 w-60 shrink-0 flex-col overflow-hidden border-r border-border bg-surface-secondary/95 select-none",
        className,
      )}
    >
      {/* Tools rail */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3 custom-scrollbar">
        <div className="mb-1.5 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
          Tools
        </div>
        <LayoutGroup id={`sidebar-rail-${instanceId}`}>
          <nav
            className="space-y-0.5"
            onMouseLeave={() => setHoveredTool(null)}
          >
            {entries.map((entry) => {
              const active = tool === entry.id;
              const isHovered = hoveredTool === entry.id && !active;
              const Icon = entry.icon;

              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTool(entry.id)}
                  onMouseEnter={() => setHoveredTool(entry.id)}
                  className="group relative flex h-8.5 w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left outline-none"
                >
                  {/* Subtle Hover Pill */}
                  {isHovered && (
                    <motion.div
                      layoutId={hoverPillId}
                      className="absolute inset-0 rounded-lg bg-surface-tertiary/80"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: "spring",
                        bounce: 0.15,
                        duration: 0.2,
                      }}
                    />
                  )}

                  {/* Figma-grade Active Selection Pill */}
                  {active && (
                    <motion.div
                      layoutId={activePillId}
                      className="absolute inset-0 rounded-lg border border-border/80 bg-surface-tertiary shadow-2xs"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                        mass: 0.7,
                      }}
                    />
                  )}

                  {/* Tool Icon */}
                  <Icon
                    className={cn(
                      "relative z-10 size-4 shrink-0 transition-colors duration-150",
                      active
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />

                  {/* Tool Label */}
                  <span
                    className={cn(
                      "relative z-10 truncate text-[12.5px] transition-colors duration-150",
                      active
                        ? "font-semibold text-foreground tracking-tight"
                        : "font-medium text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {entry.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </LayoutGroup>
      </div>
    </aside>
  );
}
