"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Maximize, Frame, Layers3, RotateCw, ChevronDown, Monitor, Stamp } from "lucide-react";
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="h-full overflow-y-auto"
    >
      <div className="border-b border-zinc-200/50 px-5 py-3">
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
  );
}
