"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Palette,
  Maximize,
  Frame,
  Layers3,
  RotateCw,
  Monitor,
  Stamp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── section config ─── */

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
  gradient: string;
}

const sections: Section[] = [
  {
    id: "background",
    label: "Background",
    icon: <Palette className="size-4" />,
    gradient: "from-orange-400 to-rose-400",
  },
  {
    id: "frame",
    label: "Device Frame",
    icon: <Monitor className="size-4" />,
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "padding",
    label: "Padding & Size",
    icon: <Maximize className="size-4" />,
    gradient: "from-sky-400 to-blue-500",
  },
  {
    id: "border",
    label: "Border & Corners",
    icon: <Frame className="size-4" />,
    gradient: "from-violet-400 to-purple-500",
  },
  {
    id: "shadow",
    label: "Shadow",
    icon: <Layers3 className="size-4" />,
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "perspective",
    label: "Perspective",
    icon: <RotateCw className="size-4" />,
    gradient: "from-pink-400 to-rose-500",
  },
  {
    id: "watermark",
    label: "Watermark",
    icon: <Stamp className="size-4" />,
    gradient: "from-rose-400 to-red-500",
  },
];

/* ─── sidebar ─── */

interface ControlsSidebarProps {
  sectionContent?: Record<string, React.ReactNode>;
}

export function ControlsSidebar({ sectionContent }: ControlsSidebarProps) {
  const uid = useId();
  const [activeTab, setActiveTab] = useState<string>("background");

  return (
    <>
      {/* Desktop Canva-Style Layout (hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="hidden lg:flex h-full w-full"
      >
        {/* Secondary Panel (Content) */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden border-r border-zinc-200/50">
          <div className="border-b border-zinc-200/50 px-5 py-4 shrink-0 bg-white/90 backdrop-blur-md z-10">
            <h2 className="text-sm font-bold text-zinc-800">
              {sections.find((s) => s.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {sectionContent?.[activeTab] ?? (
              <p className="text-xs text-zinc-400">Coming soon...</p>
            )}
          </div>
        </div>

        {/* Primary Sidebar (Slim Icons on the far right) */}
        <LayoutGroup id={`primary-sidebar-desktop-${uid}`}>
          <div className="w-[84px] shrink-0 bg-zinc-50 flex flex-col items-center py-2 overflow-y-auto hide-scrollbar relative">
            {sections.map((section) => {
              const isActive = activeTab === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={cn(
                    "flex w-full flex-col items-center gap-1.5 py-3.5 transition-colors relative z-10",
                    isActive
                      ? "text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100/50",
                  )}
                >
                  {isActive && (
                    <>
                      <motion.div
                        layoutId="sidebar-bg"
                        className="absolute inset-0 bg-white shadow-[-2px_0_10px_rgba(0,0,0,0.02)] z-[-1]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute right-0 top-0 bottom-0 w-1 bg-orange-500 rounded-l-md z-10"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    </>
                  )}
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform",
                      isActive
                        ? cn("bg-linear-to-br text-white scale-105", section.gradient)
                        : "bg-white text-zinc-400 ring-1 ring-zinc-200",
                    )}
                  >
                    {section.icon}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] text-center leading-tight px-1",
                      isActive ? "font-bold" : "font-medium"
                    )}
                  >
                    {section.label}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </motion.div>

      {/* Mobile Tabs Layout (hidden on desktop) */}
      <div className="flex lg:hidden flex-col h-full bg-white">
        {/* Horizontal scrollable tab row */}
        <LayoutGroup id={`primary-sidebar-mobile-${uid}`}>
          <div className="flex overflow-x-auto border-b border-zinc-200/50 px-2 py-2 gap-1 bg-zinc-50/50 hide-scrollbar relative">
            {sections.map((section) => {
              const isActive = activeTab === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition-colors relative z-10",
                    isActive
                      ? "text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100/50",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobile-sidebar-bg"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm z-[-1]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md text-white shadow-sm transition-transform",
                      isActive
                        ? cn("bg-linear-to-br scale-100", section.gradient)
                        : "bg-zinc-200 text-zinc-400 scale-90",
                    )}
                  >
                    {section.icon}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      isActive ? "" : "font-medium",
                    )}
                  >
                    {section.label}
                  </span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>

        {/* Active section content area with smooth sliding transition */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0 px-5 py-4 h-max"
            >
              {sectionContent?.[activeTab] ?? (
                <p className="text-xs text-zinc-400">Coming soon...</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
