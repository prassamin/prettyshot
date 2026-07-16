"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Maximize,
  Frame,
  Layers3,
  RotateCw,
  ChevronDown,
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

/* ─── accordion section ─── */

function AccordionSection({
  section,
  open,
  onToggle,
  children,
}: {
  section: Section;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-zinc-200/50 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-zinc-50/60"
      >
        <div
          className={cn(
            `flex size-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-white shadow-sm`,
            section.gradient,
          )}
        >
          {section.icon}
        </div>
        <span className="flex-1 text-sm font-semibold text-zinc-700">
          {section.label}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <ChevronDown className="size-4 text-zinc-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── sidebar ─── */

interface ControlsSidebarProps {
  sectionContent?: Record<string, React.ReactNode>;
}

export function ControlsSidebar({ sectionContent }: ControlsSidebarProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(["background", "frame", "padding"]),
  );

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const [activeMobileTab, setActiveMobileTab] = useState<string>("background");

  return (
    <>
      {/* Desktop Accordion Layout (hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="hidden lg:block h-full overflow-y-auto"
      >
        <div className="border-b border-zinc-200/50 px-5 py-3 sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <h2 className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
            Customize
          </h2>
        </div>

        {sections.map((section) => (
          <AccordionSection
            key={section.id}
            section={section}
            open={openSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          >
            {sectionContent?.[section.id] ?? (
              <p className="text-xs text-zinc-400">Coming soon...</p>
            )}
          </AccordionSection>
        ))}
      </motion.div>

      {/* Mobile Tabs Layout (hidden on desktop) */}
      <div className="flex lg:hidden flex-col h-full bg-white">
        {/* Horizontal scrollable tab row */}
        <div className="flex overflow-x-auto border-b border-zinc-200/50 px-2 py-2 gap-1 bg-zinc-50/50">
          {sections.map((section) => {
            const isActive = activeMobileTab === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveMobileTab(section.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl whitespace-nowrap transition-all duration-300",
                  isActive
                    ? "bg-white text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100/50",
                )}
              >
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

        {/* Active section content area with smooth sliding transition */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={activeMobileTab}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0 px-5 py-4 h-max"
            >
              {sectionContent?.[activeMobileTab] ?? (
                <p className="text-xs text-zinc-400">Coming soon...</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
