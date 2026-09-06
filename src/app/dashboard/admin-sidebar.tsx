"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Image as ImageIcon, Frame as FrameIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const adminNav = [
  {
    name: "Backgrounds",
    href: "/dashboard/admin/backgrounds",
    icon: ImageIcon,
  },
  {
    name: "Frames",
    href: "/dashboard/admin/frames",
    icon: FrameIcon,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-y-0 left-20 w-56 border-r border-border/60 bg-surface-muted/40 backdrop-blur-md z-40 hidden md:flex flex-col"
    >
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-border/60">
        <span className="font-bold tracking-tight text-sm text-foreground">
          Admin Settings
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {adminNav.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname.startsWith(item.href) &&
              item.href !== "/dashboard/admin");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-surface-muted text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-surface-muted/60 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-primary",
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}