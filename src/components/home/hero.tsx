"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, } from "lucide-react";
import { useRouter } from "@bprogress/next";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: EASE },
  }),
};

function Eyebrow() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-foreground/3 p-1 pr-3 text-xs font-medium text-foreground/50">
      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/25">
        PrettyShot v2
      </span>
      Screenshot studio
    </div>
  );
}

function Headline() {
  return (
    <h1 className="font-display text-[clamp(2.6rem,6.5vw,5rem)] font-medium leading-[1.03] tracking-[-0.04em] text-foreground">
      Every{" "}
      <span className="relative inline-block whitespace-nowrap px-[0.18em]">
        <span
          aria-hidden
          className="absolute inset-x-0 top-[12%] bottom-[6%] rounded-[0.2em] bg-primary/20"
        />
        <span className="relative text-primary">screenshot</span>
      </span>{" "}
      deserves to be{" "}
      <span className="relative inline-block whitespace-nowrap px-[0.18em]">
        <span
          aria-hidden
          className="absolute inset-x-0 top-[12%] bottom-[6%] rounded-[0.2em] bg-primary/20"
        />
        <span className="relative text-primary">remembered.</span>
      </span>
    </h1>
  );
}

function SubCopy() {
  return (
    <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed font-normal text-muted-foreground">
      Turn plain screenshots into polished product shots with device mockups,
      gradient backdrops, and film grain. All in the browser, in seconds.
    </p>
  );
}

function CTAs() {
  const router = useRouter();
  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => router.push("/editor")}
        className="group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl bg-foreground px-5 text-[15px] font-semibold text-background shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98]"
      >
        Start creating
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

/* ─── product showcase: real preview.png inside an editor-feel frame ─── */

function ProductShowcase() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 140, damping: 22 });
  const springY = useSpring(y, { stiffness: 140, damping: 22 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [2, -2]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-2, 2]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div className="relative mx-auto mt-20 w-full max-w-6xl perspective-distant">
      {/* soft underglow so the glass has something to catch */}
      <div
        aria-hidden
        className="absolute -inset-x-10 top-6 bottom-0 rounded-[2.5rem] bg-primary/10 blur-3xl"
      />

      <motion.div
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX, rotateY }}
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.4, ease: EASE }}
        className="relative"
      >
        {/* outer glass edge */}
        <div className="relative rounded-[1.75rem] bg-linear-to-b from-foreground/15 via-foreground/5 to-foreground/3 p-px shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)]">
          {/* specular top hairline */}
          <div
            aria-hidden
            className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-foreground/50 to-transparent"
          />

          {/* silver ray travelling continuously along the frame edge */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem] p-px"
            style={{
              background:
                "conic-gradient(from var(--navbar-border-angle, 0deg), rgba(255,255,255,0) 0deg, rgba(255,255,255,0.1) 14deg, rgba(255,255,255,0.9) 20deg, #ffffff 23deg, rgba(255,255,255,0.35) 28deg, rgba(255,255,255,0) 40deg)",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              animation: "rotateBorder 4s linear infinite",
            }}
          />

          {/* frosted pane holding the image */}
          <div className="relative rounded-[calc(1.75rem-1px)] bg-foreground/3 p-2.5 backdrop-blur-2xl sm:p-3">
            <div className="relative">
              <img
                src="/preview.png"
                alt="A screenshot framed with PrettyShot"
                className="block h-auto w-full object-cover rounded-[1.15rem]"
                style={{ filter: "saturate(1.25) contrast(1.1)" }}
              />
              {/* diagonal glass reflection */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-linear-to-br from-foreground/9 via-foreground/2 to-transparent rounded-[1.15rem]"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── hero ─── */

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background pt-36 pb-20 sm:pt-44">
      {/* Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-120 w-205 -translate-x-1/2 rounded-full bg-foreground/4 blur-[130px]" />
        <div className="absolute top-1/3 left-1/2 h-72 w-150 -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-5 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
        >
          <Eyebrow />
        </motion.div>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="mt-8"
        >
          <Headline />
        </motion.div>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
        >
          <SubCopy />
        </motion.div>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
        >
          <CTAs />
        </motion.div>
      </div>

      <div className="relative mx-auto max-w-5xl px-5">
        <ProductShowcase />
      </div>
    </section>
  );
}
