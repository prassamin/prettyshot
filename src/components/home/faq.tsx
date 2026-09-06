"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageCircleQuestion, Plus } from "lucide-react";
import { Disclosure, DisclosureGroup } from "@heroui/react";
import { useRouter } from "@/hooks/use-router";
import { APP_GITHUB_URL } from "@/config";

const EASE = [0.16, 1, 0.3, 1] as const;

const FAQS = [
  {
    id: "privacy",
    q: "Are my screenshots uploaded to a server?",
    a: "No. Images are processed entirely in your browser. Your screenshot never leaves your device unless you choose to enable cloud sync as a Pro user. You can close the tab at any point and your local designs are restored from this device.",
  },
  {
    id: "free",
    q: "What can I do on the free plan?",
    a: "Everything you need to make clean product shots: PNG exports up to 1080p, Safari and Chrome frames, solid/mesh/aurora backgrounds, auto palettes, annotations and text, standard aspect ratios, and autosave to this device. Free exports carry a small PrettyShot watermark.",
  },
  {
    id: "pro",
    q: "How does Lifetime Pro work?",
    a: "It is a single one-time payment, not a subscription. Pay once, and every Pro feature stays unlocked for the lifetime of the product: 4K and 8K exports, premium device frames, animation and video export, cloud sync, and watermark-free exports.",
  },
  {
    id: "trial",
    q: "Is there a trial before I pay?",
    a: "Yes. Every account gets a free trial with full access to Pro features, no card required. When it ends you simply fall back to the free plan, unless you decide to keep the lifetime license.",
  },
  {
    id: "device",
    q: "Does PrettyShot work on my device?",
    a: "It is a web app, so it runs anywhere with a modern browser: macOS, Windows, Linux, iPadOS, and even phones. Desktop is the best experience, and designs saved locally follow you on that device. Pro cloud sync carries them across browsers.",
  },
  {
    id: "export",
    q: "What formats and sizes can I export?",
    a: "Still images as PNG, JPEG, or WebP up to 8K, and animations as MP4 or WebM up to 4K. You can also copy a PNG straight to your clipboard for quick pastes into Slack, docs, or social media.",
  },
  {
    id: "animate",
    q: "What can I animate?",
    a: "Position, zoom, 3D tilt, shadows, backgrounds, borders, lighting and more, all on a real timeline with easing presets. The result exports as MP4 or WebM video, perfect for product demos and social posts.",
  },
  {
    id: "watermark",
    q: "Can I remove the watermark?",
    a: "Free exports include a subtle PrettyShot watermark in the corner. Upgrading to Lifetime Pro removes it from every export, still and video alike.",
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  return (
    <Disclosure
      id={`faq-${index}`}
      className="group rounded-2xl border border-border/70 bg-surface/40 transition-all duration-300 data-[expanded=true]:border-primary/25 data-[expanded=true]:bg-surface/70"
    >
      <Disclosure.Heading>
        <Disclosure.Trigger className="w-full px-6 py-5 text-left">
          <span className="flex w-full items-center gap-4">
            {/* index */}
            <span className="hidden font-mono text-xs text-muted-foreground/50 sm:block">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="flex-1 text-[15px] font-medium tracking-tight text-foreground/90">
              {q}
            </span>
            <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border/80 bg-surface-muted/60 text-muted-foreground transition-all duration-300 group-data-[expanded=true]:rotate-45 group-data-[expanded=true]:border-primary/40 group-data-[expanded=true]:bg-primary/10 group-data-[expanded=true]:text-primary">
              <Plus className="size-4" />
            </span>
          </span>
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body className="px-6 pb-6">
          <p className="border-l border-primary/20 pl-5 text-sm leading-relaxed text-muted-foreground">
            {a}
          </p>
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
}

export function Faq() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-background py-24 sm:py-32"
    >
      {/* ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -bottom-40 left-1/2 h-105 w-250 -translate-x-1/2 rounded-full bg-primary/25 blur-[150px]" />
        <div className="absolute bottom-1/3 -right-40 size-150 rounded-full bg-primary/15 blur-[150px]" />
        <div className="absolute -left-32 bottom-48 size-160 rounded-full bg-primary/15 blur-[160px]" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-5xl px-5">
        {/* header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="font-display text-sm font-medium tracking-tight">
              <span className="relative inline-block whitespace-nowrap px-[0.35em] py-[0.18em]">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-[0.3em] bg-primary/20"
                />
                <span className="relative text-primary">Questions</span>
              </span>
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
            className="font-display mt-5 text-[clamp(2.2rem,5vw,3.8rem)] font-medium leading-[1.05] tracking-[-0.04em] text-foreground"
          >
            Answers, before you ask.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground"
          >
            Everything about privacy, pricing and what the editor can do. Still
            curious? Ask on GitHub.
          </motion.p>
        </div>

        {/* list */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
          className="mt-14"
        >
          <DisclosureGroup
            allowsMultipleExpanded={false}
            defaultExpandedKeys={new Set(["faq-0"])}
            className="flex flex-col gap-3"
          >
            {FAQS.map((f, i) => (
              <FaqItem key={f.id} q={f.q} a={f.a} index={i} />
            ))}
          </DisclosureGroup>
        </motion.div>

        {/* contact */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
          className="mx-auto mt-12 flex max-w-xl items-center justify-center gap-2.5 text-sm text-muted-foreground"
        >
          <MessageCircleQuestion className="size-4 text-primary" />
          Something else on your mind?{" "}
          <button
            type="button"
            onClick={() => router.push(APP_GITHUB_URL, { blank: true })}
            className="font-medium text-foreground underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary"
          >
            Ask us anything
          </button>
        </motion.div>
      </div>
    </section>
  );
}
