"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import {
  APP_NAME,
  APP_GITHUB_URL,
  DEVELOPED_BY,
  DEVELOPED_BY_URL,
} from "@/config";
import { Github } from "./icons/github";
import { Twitter } from "./icons/twitter";

const EASE = [0.16, 1, 0.3, 1] as const;

const LINK_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Editor", href: "/editor" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Open Source",
    links: [
      { label: "GitHub", href: APP_GITHUB_URL, external: true },
      {
        label: "Report a Bug",
        href: `${APP_GITHUB_URL}/issues`,
        external: true,
      },
      {
        label: "Request a Feature",
        href: `${APP_GITHUB_URL}/issues`,
        external: true,
      },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
    ],
  },
];

const SOCIALS = [
  { label: "GitHub", href: APP_GITHUB_URL, Icon: Github },
  { label: "X / Twitter", href: "https://x.com/prassami", Icon: Twitter },
];

export function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <footer className="relative overflow-hidden bg-background">
      {/* ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* top warm wash behind the CTA band */}
        <div className="absolute -top-40 left-1/2 h-105 w-250 -translate-x-1/2 rounded-full bg-primary/25 blur-[150px]" />
        {/* left body glow */}
        <div className="absolute top-1/3 -left-40 size-150 rounded-full bg-primary/15 blur-[150px]" />
        {/* bottom-right bloom */}
        <div className="absolute -right-32 -bottom-48 size-160 rounded-full bg-primary/15 blur-[160px]" />
      </div>

      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: EASE }}
        className="relative mx-auto max-w-6xl px-5 pt-20 sm:pt-24"
      >
        {/* ── Big brand CTA band ── */}
        <div className="flex flex-col items-start justify-between gap-8 pb-16">
          <div>
            <h2 className="font-display max-w-2xl text-[clamp(2rem,5vw,3.4rem)] font-medium leading-[1.08] tracking-[-0.03em] text-foreground">
              Every screenshot deserves{" "}
              <span className="relative inline-block whitespace-nowrap px-[0.18em]">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-[12%] bottom-[6%] rounded-[0.2em] bg-primary/20"
                />
                <span className="relative text-primary">to be remembered.</span>
              </span>
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Free to start, no signup. Upgrade when you&apos;re ready. One
              payment, lifetime access.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/editor"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-7 text-[15px] font-semibold text-background transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            >
              Open the editor
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* ── Link grid ── */}
        <div className="grid gap-x-8 gap-y-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand column */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image
                src="/prettyshot.svg"
                alt=""
                width={30}
                height={24}
                priority
              />
              <span className="font-display text-lg font-medium tracking-tight text-foreground">
                {APP_NAME}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The screenshot studio for makers. Frame, light and export
              screenshots that look like product shots — all in the browser.
            </p>

            {/* Socials */}
            <div className="mt-6 flex items-center gap-2.5">
              {SOCIALS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-xl border border-border/70 bg-surface/40 text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {LINK_GROUPS.map((group, gi) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + gi * 0.08, ease: EASE }}
            >
              <h3 className="text-[11px] font-bold tracking-[0.14em] text-muted-foreground/60 uppercase">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
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
                        className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="h-px w-full bg-muted-foreground/10"/>

        {/* ── Bottom bar ── */}
        <div className="flex flex-col items-center justify-between gap-4 py-4 sm:flex-row">
          <p className="text-xs text-muted-foreground/70">
            &copy; {new Date().getFullYear()} {APP_NAME}. Open source under MIT
            license.
          </p>

          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70">
            Made with
            <Heart className="size-3 text-danger" fill="currentColor" />
            by{" "}
            <a
              href={DEVELOPED_BY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              {DEVELOPED_BY}
            </a>
          </p>
        </div>
      </motion.div>
    </footer>
  );
}
