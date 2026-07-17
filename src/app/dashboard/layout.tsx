"use client";

import { useAppStore } from "@/stores/app-store";
import { usePathname } from "next/navigation";
import { useRouter } from "@/hooks/use-router";
import { useEffect, useState } from "react";
import { Loader2, Menu } from "lucide-react";
import { Sidebar, navigation } from "./sidebar";
import { AdminSidebar } from "./admin-sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@heroui/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAppStore();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdminRoute = pathname.startsWith("/dashboard/admin");

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Auto-collapse sidebar when entering admin routes, auto-expand when leaving
  useEffect(() => {
    if (isAdminRoute) {
      setIsCollapsed(true);
    } else {
      setIsCollapsed(false);
    }
  }, [isAdminRoute]);

  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      router.push("/login");
    } else {
      setLoading(false);
    }
  }, [user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="size-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-sm md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isAdminRoute={isAdminRoute}
      />

      <AnimatePresence>
        {isAdminRoute && <AdminSidebar />}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isCollapsed
            ? isAdminRoute
              ? "md:pl-76" // 80px (main) + 224px (admin)
              : "md:pl-20"
            : "md:pl-64"
        }`}
      >
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="md:hidden sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur-xl">
          <Button
            isIconOnly
            size="sm"
            className="text-zinc-500"
            variant="ghost"
            onPress={() => setIsSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <span className="text-zinc-900 font-semibold">
            {navigation.find((n) => n.href === pathname)?.name || "Overview"}
          </span>
        </header>

        {/* Page Content */}
        <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full flex-1">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
