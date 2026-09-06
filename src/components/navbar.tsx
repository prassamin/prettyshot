"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { Button, Avatar, Dropdown } from "@heroui/react";
import { Github } from "@/components/icons/github";
import {
  LogOut,
  Sparkles,
  CreditCard,
  Zap,
  Home,
  PanelsRightBottomIcon,
  LayoutGrid,
  Tag,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME, APP_GITHUB_URL } from "@/config";
import { useRouter } from "@/hooks/use-router";
import { useAppStore } from "@/stores/app-store";
import { isPro } from "@/lib/utils";

const navLinks: { label: string; href: string }[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const mobileLinkIcons: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  "#features": LayoutGrid,
  "#pricing": Tag,
  "#faq": HelpCircle,
};

function SpotlightNav({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const spotlightY = useSpring(mouseY, { stiffness: 300, damping: 30 });
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY],
  );

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className="relative"
    >
      {/* Spotlight glow following cursor */}
      {hovering && (
        <motion.div
          className="pointer-events-none absolute -inset-px z-0 overflow-hidden rounded-2xl"
          style={{ opacity: hovering ? 1 : 0 }}
        >
          <motion.div
            className="absolute size-50 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: spotlightX,
              top: spotlightY,
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--primary) 14%, transparent) 0%, color-mix(in oklab, var(--primary) 7%, transparent) 40%, transparent 70%)",
            }}
          />
        </motion.div>
      )}
      {children}
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { user, setUser } = useAppStore();
  const pro = isPro(user);
  const supabase = createClient();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on outside click or Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!headerRef.current?.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 right-0 left-0 z-50"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ y: -30, opacity: 0, filter: "blur(10px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="pt-4"
        >
          <SpotlightNav>
            {/* Animated rotating gradient border */}
            <div
              className="absolute -inset-px z-0 overflow-hidden rounded-2xl"
              style={{
                background: scrolled
                  ? "linear-gradient(var(--navbar-border-angle, 0deg), color-mix(in oklab, var(--primary) 40%, transparent), color-mix(in oklab, var(--primary) 18%, transparent), color-mix(in oklab, var(--primary) 8%, transparent), color-mix(in oklab, var(--primary) 40%, transparent))"
                  : "linear-gradient(var(--navbar-border-angle, 0deg), color-mix(in oklab, var(--foreground) 9%, transparent), color-mix(in oklab, var(--foreground) 4%, transparent), color-mix(in oklab, var(--foreground) 9%, transparent))",
                animation: "rotateBorder 6s linear infinite",
              }}
            />

            <nav
              className={`relative z-10 flex items-center justify-between rounded-2xl px-3 py-2 transition-all duration-500 sm:px-5 sm:py-2.5 ${
                scrolled
                  ? "bg-background/85 shadow-xl shadow-black/50 backdrop-blur-2xl"
                  : "bg-background/60 backdrop-blur-xl"
              }`}
            >
              {/* Logo */}
              <Link href="/" className="group relative flex items-center gap-2">
                <Image
                  src="/prettyshot.svg"
                  alt=""
                  width={28}
                  height={22}
                  priority
                />
                <span className="text-base leading-tight font-bold tracking-tight text-foreground sm:text-lg">
                  {APP_NAME}
                </span>
              </Link>

              {/* Desktop nav */}
              <div className="hidden items-center gap-0.5 md:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group relative px-4 py-2"
                  >
                    <span className="relative z-10 text-sm font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
                      {link.label}
                    </span>
                    {/* Hover pill bg */}
                    <span className="absolute inset-0 scale-75 rounded-xl bg-foreground/6 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
                    {/* Bottom indicator dot */}
                    <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 scale-0 rounded-full bg-linear-to-r from-primary to-primary/60 transition-transform duration-300 group-hover:scale-100" />
                  </Link>
                ))}

                {/* Separator */}
                <div className="mx-2.5 h-5 w-px bg-linear-to-b from-transparent via-border to-transparent" />

                {/* GitHub star button */}
                <a
                  href={APP_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-muted-foreground transition-all duration-200 hover:text-foreground"
                  aria-label="Star on GitHub"
                >
                  <span className="absolute inset-0 scale-75 rounded-xl bg-foreground/6 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
                  <Github size={17} className="relative z-10" />
                </a>

                {/* Separator */}
                <div className="mx-2.5 h-5 w-px bg-linear-to-b from-transparent via-border to-transparent" />

                {/* CTA or Profile */}
                {user ? (
                  <Dropdown>
                    <Dropdown.Trigger>
                      <Avatar
                        className="transition-transform"
                        color={pro.isActive ? "warning" : "default"}
                        size="sm"
                      >
                        <Avatar.Image src={user.user_metadata?.avatar_url} />
                        <Avatar.Fallback>
                          {user.email?.charAt(0).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar>
                    </Dropdown.Trigger>
                    <Dropdown.Popover placement="bottom end">
                      <Dropdown.Menu
                        aria-label="User menu actions"
                        className="w-64 p-2"
                        onAction={(key) => {
                          if (key === "upgrade")
                            if (pro.isActive)
                              return router.push("/dashboard/billing");
                          router.push("/checkout", { external: true });
                          if (key === "editor") router.push("/editor");
                          if (key === "dashboard") router.push("/dashboard");
                          if (key === "logout") {
                            supabase.auth.signOut().then(() => {
                              setUser(null);
                              router.push("/");
                            });
                          }
                        }}
                      >
                        <Dropdown.Item
                          id="profile"
                          textValue="Profile"
                          className="p-0 mb-2 opacity-100 data-[hover=true]:bg-transparent"
                        >
                          <div className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-surface-muted/40 p-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[14px] font-bold text-foreground">
                                {user.user_metadata?.full_name || "My Account"}
                              </span>
                              <span className="text-[13px] font-medium text-muted-foreground truncate max-w-35">
                                {user.email}
                              </span>
                            </div>
                            <Avatar
                              size="sm"
                              className="shrink-0 shadow-sm ring-1 ring-border/60"
                            >
                              <Avatar.Image
                                src={user.user_metadata?.avatar_url}
                              />
                              <Avatar.Fallback>
                                {user.email?.charAt(0).toUpperCase()}
                              </Avatar.Fallback>
                            </Avatar>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item
                          id="dashboard"
                          textValue="Dashboard"
                          className="p-0 rounded-xl mb-1 data-[hover=true]:bg-foreground/6"
                        >
                          <div className="flex w-full items-center gap-2.5 px-3 py-2 cursor-pointer">
                            <Home
                              className="size-4.5 text-muted-foreground shrink-0"
                              strokeWidth={1.8}
                            />
                            <span className="text-[14px] font-medium text-foreground">
                              Dashboard
                            </span>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item
                          id="editor"
                          textValue="Open Editor"
                          className="p-0 rounded-xl mb-1 data-[hover=true]:bg-foreground/6"
                        >
                          <div className="flex w-full items-center gap-2.5 px-3 py-2 cursor-pointer">
                            <PanelsRightBottomIcon
                              className="size-4.5 text-muted-foreground shrink-0"
                              strokeWidth={1.8}
                            />
                            <span className="text-[14px] font-medium text-foreground">
                              Open Editor
                            </span>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item
                          id="upgrade"
                          textValue="Subscription"
                          className="p-0 rounded-xl mb-1 data-[hover=true]:bg-foreground/6"
                        >
                          <div className="flex w-full items-center justify-between px-3 py-2 cursor-pointer">
                            <div className="flex items-center gap-2.5">
                              <CreditCard
                                className="size-4.5 text-muted-foreground shrink-0"
                                strokeWidth={1.8}
                              />
                              <span className="text-[14px] font-medium text-foreground">
                                Subscription
                              </span>
                            </div>
                            {pro.type === "pro" ? (
                              <span className="flex items-center gap-1 rounded bg-success-soft px-2 py-0.5 text-[10px] font-bold tracking-widest text-success">
                                <Zap className="size-3 fill-current" />
                                PRO
                              </span>
                            ) : pro.type === "trial" ? (
                              <span className="flex items-center gap-1 rounded bg-accent-soft px-2 py-0.5 text-[10px] font-bold tracking-widest text-primary">
                                <Sparkles className="size-3" />
                                Trial
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold tracking-widest text-primary">
                                <Sparkles className="size-3" />
                                UPGRADE
                              </span>
                            )}
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item
                          id="logout"
                          textValue="Sign out"
                          className="p-0 rounded-xl data-[hover=true]:bg-foreground/6 mt-1 text-danger border-y border-danger-soft bg-danger/5 hover:bg-danger/10"
                        >
                          <div className="flex w-full items-center gap-2.5 px-3 py-2 cursor-pointer">
                            <LogOut
                              className="size-4.5 shrink-0"
                              strokeWidth={1.8}
                            />
                            <span className="text-[14px] font-medium">
                              Sign out
                            </span>
                          </div>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                ) : (
                  <div className="group relative">
                    {/* Outer glow on hover */}
                    <div className="absolute -inset-1.5 rounded-2xl bg-linear-to-r from-primary via-primary/60 to-accent-soft opacity-0 blur-xl transition-all duration-500 group-hover:opacity-50" />
                    <Button
                      onPress={() => router.push("/login")}
                      variant="primary"
                      size="sm"
                      className="relative overflow-hidden bg-foreground font-semibold text-background shadow-lg shadow-foreground/10 transition-shadow duration-300 hover:shadow-xl hover:shadow-foreground/20"
                    >
                      {/* Shimmer sweep */}
                      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-foreground/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <span className="relative z-10">Log in</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="relative flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl text-muted-foreground transition-colors hover:bg-foreground/6 md:hidden"
                aria-label="Toggle menu"
              >
                <span
                  className={`h-0.5 w-5 transform rounded-full bg-current transition-all duration-300 ${
                    mobileOpen ? "translate-y-2 rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                    mobileOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`h-0.5 w-5 transform rounded-full bg-current transition-all duration-300 ${
                    mobileOpen ? "-translate-y-2 -rotate-45" : ""
                  }`}
                />
              </button>
            </nav>
          </SpotlightNav>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="relative mt-2"
              >
                {/* Border */}
                <div className="absolute -inset-px rounded-3xl bg-linear-to-b from-border/80 to-border/30" />
                <div className="relative overflow-hidden rounded-3xl bg-background/95 p-3 shadow-2xl shadow-black/60 backdrop-blur-2xl">
                  {/* top sheen */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-foreground/10 to-transparent"
                  />

                  {/* Logged-in mini profile */}
                  {user && (
                    <div className="mb-2 flex items-center gap-3 rounded-2xl border border-border/70 bg-surface-muted/40 p-3">
                      <Avatar
                        size="sm"
                        className="shrink-0 shadow-sm ring-1 ring-border/60"
                      >
                        <Avatar.Image src={user.user_metadata?.avatar_url} />
                        <Avatar.Fallback>
                          {user.email?.charAt(0).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-foreground">
                          {user.user_metadata?.full_name || "My Account"}
                        </p>
                        <p className="truncate text-[12px] text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[9px] font-bold tracking-widest ${
                          pro.type === "pro"
                            ? "bg-success/15 text-success"
                            : pro.type === "trial"
                              ? "bg-accent-soft text-primary"
                              : "bg-border/50 text-muted-foreground"
                        }`}
                      >
                        {pro.type === "pro"
                          ? "PRO"
                          : pro.type === "trial"
                            ? "TRIAL"
                            : "FREE"}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-0.5 p-1">
                    {/* Section label */}
                    <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold tracking-[0.14em] text-muted-foreground/60 uppercase">
                      {user ? "Explore" : "Menu"}
                    </p>

                    {navLinks.map((link, i) => {
                      const Icon = mobileLinkIcons[link.href] ?? ChevronRight;
                      return (
                        <motion.div
                          key={link.href}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 + 0.08 }}
                        >
                          <Link
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-foreground/6"
                          >
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/70 bg-surface-muted/50 text-muted-foreground transition-colors group-hover:text-foreground">
                              <Icon className="size-4" strokeWidth={1.8} />
                            </span>
                            <span className="flex-1 text-[14px] font-medium text-foreground/90">
                              {link.label}
                            </span>
                            <ChevronRight className="size-4 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
                          </Link>
                        </motion.div>
                      );
                    })}

                    {/* GitHub */}
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: navLinks.length * 0.05 + 0.1 }}
                    >
                      <a
                        href={APP_GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-foreground/6"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border/70 bg-surface-muted/50 text-muted-foreground transition-colors group-hover:text-foreground">
                          <Github className="size-4" />
                        </span>
                        <span className="flex-1 text-[14px] font-medium text-foreground/90">
                          GitHub
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </a>
                    </motion.div>
                  </div>

                  {/* Footer */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22 }}
                    className="p-1"
                  >
                    <div className="mb-2.5 mt-1 h-px bg-linear-to-r from-transparent via-border to-transparent" />
                    {user ? (
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          fullWidth
                          className="bg-foreground font-semibold text-background"
                          onPress={() => {
                            router.push("/dashboard");
                            setMobileOpen(false);
                          }}
                        >
                          <Home className="size-4" />
                          Dashboard
                        </Button>
                        <Button
                          variant="primary"
                          fullWidth
                          className="border border-danger/40 bg-danger/10 font-semibold text-danger"
                          onPress={() => {
                            supabase.auth.signOut().then(() => {
                              setUser(null);
                              setMobileOpen(false);
                              router.push("/");
                            });
                          }}
                        >
                          <LogOut className="size-4" />
                          Sign out
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="primary"
                        fullWidth
                        className="bg-foreground font-semibold text-background"
                        onPress={() => {
                          router.push("/login");
                          setMobileOpen(false);
                        }}
                      >
                        Log in
                      </Button>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </header>
  );
}
