"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import {
  APP_NAME,
  APP_GITHUB_URL,
  DEVELOPED_BY,
  DEVELOPED_BY_URL,
} from "@/config";
import { Github } from "./icons/github";
import { Twitter } from "./icons/twitter";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Editor", href: "/editor" },
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub", href: APP_GITHUB_URL, external: true },
      {
        label: "Report a Bug",
        href: `${APP_GITHUB_URL}/issues`,
        external: true,
      },
      {
        label: "Request Feature",
        href: `${APP_GITHUB_URL}/issues`,
        external: true,
      },
    ],
  },
];

export function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <footer className="relative overflow-hidden bg-zinc-950">
      {/* Top separator line */}
      <div className="absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-linear-to-r from-transparent via-white/10 to-transparent" />

      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -bottom-40 left-1/4 size-125 rounded-full bg-orange-900/8 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 size-125 rounded-full bg-violet-900/8 blur-[120px]" />
      </div>

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-6xl px-5 pt-16 pb-8"
      >
        {/* Main grid */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <Image src="/prettyshot.svg" alt="" width={32} height={25} priority />
              <span className="text-lg font-bold tracking-tight text-white">
                {APP_NAME}
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-500">
              Make your screenshots look stunning in seconds. Free, open source,
              and runs entirely in your browser. No signup.
            </p>

            {/* Social icons */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href={APP_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex size-10 items-center justify-center rounded-xl bg-white/4 ring-1 ring-white/6 transition-all duration-300 hover:bg-white/8 hover:ring-white/12"
                aria-label="GitHub"
              >
                <Github className="size-4 text-zinc-500 transition-colors group-hover:text-white" />
              </a>
              <a
                href="https://x.com/imprassamin"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex size-10 items-center justify-center rounded-xl bg-white/4 ring-1 ring-white/6 transition-all duration-300 hover:bg-white/8 hover:ring-white/12"
                aria-label="Twitter"
              >
                <Twitter className="size-4 text-zinc-500 transition-colors group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-xs font-bold tracking-widest text-zinc-400 uppercase">
                {group.title}
              </h3>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors duration-200 hover:text-white"
                      >
                        {link.label}
                        <svg
                          className="size-3 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-60"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M7 17L17 7M17 7H7M17 7v10"
                          />
                        </svg>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-500 transition-colors duration-200 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 border-t border-white/6 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-zinc-600">
              &copy; {new Date().getFullYear()} {APP_NAME}. Open source under
              MIT.
            </p>

            <p className="inline-flex items-center gap-1.5 text-xs text-zinc-600">
              Made with
              <Heart className="size-3 text-rose-500" fill="currentColor" />
              by{" "}
              <a
                href={DEVELOPED_BY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-zinc-400 transition-colors hover:text-white"
              >
                {DEVELOPED_BY}
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
