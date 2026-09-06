"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Check, Flame } from "lucide-react";
import { useRouter } from "@/hooks/use-router";
import { FREE_FEATURES, PRO_FEATURES } from "@/config/features";

const EASE = [0.16, 1, 0.3, 1] as const;

function PlanCard({
  name,
  tagline,
  price,
  priceNote,
  blurb,
  groups,
  cta,
  onCta,
  highlighted = false,
  delay = 0,
}: {
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  blurb: string;
  groups: string[];
  cta: string;
  onCta: () => void;
  highlighted?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={`relative flex flex-col rounded-3xl p-8 ${
        highlighted
          ? "border border-primary/30 bg-surface/70 shadow-[0_0_80px_-20px_rgba(249,115,22,0.25)] lg:-my-4 lg:pt-12 lg:pb-8"
          : "border border-border/70 bg-surface/40"
      }`}
    >
      {highlighted && (
        <>
          {/* top hairline */}
          <div
            aria-hidden
            className="absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent"
          />
          {/* badge */}
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-linear-to-r from-primary to-primary/80 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg shadow-primary/25">
            <Flame className="size-3" />
            Most popular
          </span>
        </>
      )}

      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-medium tracking-tight text-foreground">
            {name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{tagline}</p>
        </div>
      </div>

      {/* price */}
      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="font-display text-5xl font-medium tracking-[-0.03em] text-foreground">
          {price}
        </span>
        <span className="text-sm text-muted-foreground">{priceNote}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {blurb}
      </p>

      {/* features */}
      <ul className="mt-7 space-y-2.5">
        {groups.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[13px]">
            <span
              className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${
                highlighted
                  ? "bg-primary/15 text-primary"
                  : "bg-border/40 text-muted-foreground"
              }`}
            >
              <Check className="size-2.5" />
            </span>
            <span className="leading-snug text-foreground/85">{f}</span>
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      {/* CTA */}
      <div
        className={`relative mt-8 ${
          highlighted ? "p-px rounded-xl" : ""
        }`}
      >
        {highlighted && (
          <>
            {/* soft static glow (no animation) */}
            <div
              aria-hidden
              className="absolute -inset-1 rounded-2xl bg-primary/20 opacity-60 blur-lg"
            />
            {/* travelling ray around the border */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
              style={{
                background:
                  "conic-gradient(from var(--navbar-border-angle, 0deg), rgba(249,115,22,0) 0deg, rgba(249,115,22,0.15) 60deg, rgba(249,115,22,0.95) 80deg, #fb923c 90deg, rgba(249,115,22,0.3) 100deg, rgba(249,115,22,0) 140deg)",
                WebkitMask:
                  "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                animation: "rotateBorder 3s linear infinite",
              }}
            />
          </>
        )}
        <button
          type="button"
          onClick={onCta}
          className={`group relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-[15px] font-semibold transition-all duration-200 active:scale-[0.98] ${
            highlighted
              ? "bg-background text-foreground ring-1 ring-primary/40 hover:ring-primary/70 hover:shadow-[0_0_44px_-6px_rgba(249,115,22,0.6)]"
              : "border border-border/80 bg-surface-muted/50 text-foreground/85 hover:border-border hover:bg-surface-muted"
          }`}
        >
          {highlighted && (
            <>
              {/* warm fill so the orbiting ray reads */}
              <span
                aria-hidden
                className="absolute inset-0 bg-linear-to-r from-primary/15 via-primary/5 to-primary/15"
              />
              {/* subtle hover sheen only */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-primary/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </>
          )}
          <span className="relative z-10 inline-flex items-center gap-2">
            {cta}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </button>
      </div>
    </motion.div>
  );
}

export function Pricing() {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-background py-24 sm:py-32"
    >
      {/* ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 h-120 w-240 -translate-x-1/2 rounded-full bg-primary/5 blur-[160px]" />
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
                <span className="relative text-primary">Simple pricing</span>
              </span>
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.05, ease: EASE }}
            className="font-display mt-5 text-[clamp(2.2rem,5vw,3.8rem)] font-medium leading-[1.05] tracking-[-0.04em] text-foreground"
          >
            Pay once. Own it forever.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease: EASE }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground"
          >
            Start free, no signup. Upgrade to Lifetime Pro when you&apos;re
            ready. One payment, no subscription.
          </motion.p>
        </div>

        {/* plans */}
        <div className="mt-14 grid items-start gap-4 md:grid-cols-2 lg:gap-6">
          <PlanCard
            name="Free"
            tagline="For trying it out"
            price="$0"
            priceNote="forever"
            blurb="A real editor, not a demo. Enough to make your first screenshots look sharp."
            groups={FREE_FEATURES}
            cta="Start creating"
            onCta={() => router.push("/editor")}
            delay={0.05}
          />
          <PlanCard
            name="Pro"
            tagline="For people who ship"
            price="$29"
            priceNote="one-time · lifetime"
            blurb="Everything unlocked, one payment. Built for makers who put screenshots in front of people every week."
            groups={PRO_FEATURES}
            cta="Get Lifetime Pro"
            onCta={() => router.push("/checkout", { external: true })}
            highlighted
            delay={0.12}
          />
        </div>

        {/* trial note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.25, ease: EASE }}
          className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-2 text-center text-sm text-muted-foreground"
        >
          Not sure yet? Every account gets a free Pro trial. No card required.
        </motion.p>
      </div>
    </section>
  );
}
