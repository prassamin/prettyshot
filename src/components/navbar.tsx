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
  LayoutTemplate,
  Sparkles,
  CreditCard,
  Zap,
  Home,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME, APP_GITHUB_URL } from "@/config";
import { useRouter } from "@bprogress/next";
import { useAppStore } from "@/stores/app-store";
import { isPro } from "@/lib/utils";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

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
                "radial-gradient(circle, rgba(251,146,60,0.12) 0%, rgba(244,63,94,0.08) 40%, transparent 70%)",
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

  return (
    <header className="fixed top-0 right-0 left-0 z-50">
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
                  ? "linear-gradient(var(--navbar-border-angle, 0deg), rgba(251,146,60,0.3), rgba(244,63,94,0.2), rgba(139,92,246,0.2), rgba(59,130,246,0.1), rgba(251,146,60,0.3))"
                  : "linear-gradient(var(--navbar-border-angle, 0deg), rgba(0,0,0,0.06), rgba(0,0,0,0.03), rgba(0,0,0,0.06))",
                animation: "rotateBorder 6s linear infinite",
              }}
            />

            <nav
              className={`relative z-10 flex items-center justify-between rounded-2xl px-3 py-2 transition-all duration-500 sm:px-5 sm:py-2.5 ${
                scrolled
                  ? "bg-white/75 shadow-xl shadow-zinc-900/4 backdrop-blur-2xl"
                  : "bg-white/60 backdrop-blur-xl"
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
                <span className="text-base leading-tight font-bold tracking-tight text-zinc-800 sm:text-lg">
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
                    <span className="relative z-10 text-sm font-medium text-zinc-500 transition-colors duration-200 group-hover:text-zinc-900">
                      {link.label}
                    </span>
                    {/* Hover pill bg */}
                    <span className="absolute inset-0 scale-75 rounded-xl bg-zinc-900/4 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
                    {/* Bottom indicator dot */}
                    <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 scale-0 rounded-full bg-linear-to-r from-orange-400 to-rose-400 transition-transform duration-300 group-hover:scale-100" />
                  </Link>
                ))}

                {/* Separator */}
                <div className="mx-2.5 h-5 w-px bg-linear-to-b from-transparent via-zinc-300 to-transparent" />

                {/* GitHub star button */}
                <a
                  href={APP_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-zinc-400 transition-all duration-200 hover:text-zinc-700"
                  aria-label="Star on GitHub"
                >
                  <span className="absolute inset-0 scale-75 rounded-xl bg-zinc-900/4 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
                  <Github size={17} className="relative z-10" />
                </a>

                {/* Separator */}
                <div className="mx-2.5 h-5 w-px bg-linear-to-b from-transparent via-zinc-300 to-transparent" />

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
                          if (key === "upgrade") router.push("/#pricing");
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
                          <div className="flex w-full items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[14px] font-bold text-zinc-900">
                                {user.user_metadata?.full_name || "My Account"}
                              </span>
                              <span className="text-[13px] font-medium text-zinc-500 truncate max-w-35">
                                {user.email}
                              </span>
                            </div>
                            <Avatar
                              size="sm"
                              className="shrink-0 shadow-sm ring-1 ring-zinc-200/50"
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
                          className="p-0 rounded-xl mb-1 data-[hover=true]:bg-zinc-100/80"
                        >
                          <div className="flex w-full items-center gap-2.5 px-3 py-2 cursor-pointer">
                            <Home
                              className="size-4.5 text-zinc-700 shrink-0"
                              strokeWidth={1.8}
                            />
                            <span className="text-[14px] font-medium text-zinc-800">
                              Dashboard
                            </span>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item
                          id="editor"
                          textValue="Open Editor"
                          className="p-0 rounded-xl mb-1 data-[hover=true]:bg-zinc-100/80"
                        >
                          <div className="flex w-full items-center gap-2.5 px-3 py-2 cursor-pointer">
                            <LayoutTemplate
                              className="size-4.5 text-zinc-700 shrink-0"
                              strokeWidth={1.8}
                            />
                            <span className="text-[14px] font-medium text-zinc-800">
                              Open Editor
                            </span>
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item
                          id="upgrade"
                          textValue="Subscription"
                          className="p-0 rounded-xl mb-1 data-[hover=true]:bg-zinc-100/80"
                        >
                          <div className="flex w-full items-center justify-between px-3 py-2 cursor-pointer">
                            <div className="flex items-center gap-2.5">
                              <CreditCard
                                className="size-4.5 text-zinc-700 shrink-0"
                                strokeWidth={1.8}
                              />
                              <span className="text-[14px] font-medium text-zinc-800">
                                Subscription
                              </span>
                            </div>
                            {pro.type === "pro" ? (
                              <span className="flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-green-700">
                                <Zap className="size-3 fill-current" />
                                PRO
                              </span>
                            ) : pro.type === "trial" ? (
                              <span className="flex items-center gap-1 rounded bg-cyan-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-cyan-700">
                                <Sparkles className="size-3" />
                                Trial
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded bg-fuchsia-100 px-2 py-0.5 text-[10px] font-bold tracking-widest text-fuchsia-700">
                                <Sparkles className="size-3" />
                                UPGRADE
                              </span>
                            )}
                          </div>
                        </Dropdown.Item>

                        <Dropdown.Item
                          id="logout"
                          textValue="Sign out"
                          className="p-0 rounded-xl data-[hover=true]:bg-zinc-100/80 mt-1 border-t border-zinc-100"
                        >
                          <div className="flex w-full items-center gap-2.5 px-3 py-2 cursor-pointer">
                            <LogOut
                              className="size-4.5 text-zinc-700 shrink-0"
                              strokeWidth={1.8}
                            />
                            <span className="text-[14px] font-medium text-zinc-800">
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
                    <div className="absolute -inset-1.5 rounded-2xl bg-linear-to-r from-orange-400 via-rose-400 to-violet-500 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-50" />
                    <Button
                      onPress={() => router.push("/login")}
                      variant="primary"
                      size="sm"
                      className="relative overflow-hidden bg-zinc-900 font-semibold text-white shadow-lg shadow-zinc-900/20 transition-shadow duration-300 hover:shadow-xl hover:shadow-zinc-900/30"
                    >
                      {/* Shimmer sweep */}
                      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <span className="relative z-10">Log in</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="relative flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl text-zinc-600 transition-colors hover:bg-zinc-100/80 md:hidden"
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
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="relative mt-2"
              >
                {/* Border */}
                <div className="absolute -inset-px rounded-2xl bg-linear-to-b from-zinc-200/60 to-zinc-200/30" />
                <div className="relative overflow-hidden rounded-2xl bg-white/80 p-4 shadow-2xl shadow-zinc-900/6 backdrop-blur-2xl">
                  <div className="flex flex-col gap-1">
                    {navLinks.map((link, i) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.1 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100/80 hover:text-zinc-900"
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <a
                        href={APP_GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100/80 hover:text-zinc-900"
                      >
                        <Github size={16} />
                        GitHub
                      </a>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="pt-2"
                    >
                      <div className="mb-3 h-px bg-linear-to-r from-transparent via-zinc-200 to-transparent" />
                      <Button
                        variant="primary"
                        fullWidth
                        className="bg-zinc-900 font-semibold text-white"
                        onPress={() => {
                          router.push(user ? "/editor" : "/login");
                          setMobileOpen(false);
                        }}
                      >
                        {user ? "Open Editor" : "Log in"}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </header>
  );
}
