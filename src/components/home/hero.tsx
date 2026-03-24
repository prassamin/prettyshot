"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  Sparkles,
  Download,
  Palette,
  Layers,
  MousePointerClick,
  ArrowRight,
  Zap,
  Heart,
} from "lucide-react";
import { Button } from "@heroui/react";
import { useRouter } from "@bprogress/next";

/* ─── animation helpers ─── */

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const wordPop: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
  },
});

const float = (delay: number, y: number) => ({
  y: [0, y, 0],
  transition: {
    duration: 4 + delay,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay,
  },
});

/* ─── floating decorative shapes ─── */

function FloatingShapes() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Warm gradient orbs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -right-32 size-[500px] rounded-full bg-linear-to-br from-orange-200/50 via-rose-200/40 to-transparent blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -20, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-40 -left-32 size-[450px] rounded-full bg-linear-to-tr from-violet-200/40 via-fuchsia-100/30 to-transparent blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/2 size-[350px] -translate-x-1/2 rounded-full bg-linear-to-br from-amber-100/40 to-pink-100/30 blur-3xl"
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.3]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #d4d4d8 0.6px, transparent 0.6px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Small floating accent shapes */}
      <motion.div
        animate={float(0, -12)}
        className="absolute top-[18%] left-[8%] size-3 rounded-full bg-linear-to-br from-orange-300 to-rose-300 opacity-60"
      />
      <motion.div
        animate={float(1, -10)}
        className="absolute top-[25%] right-[12%] size-2 rounded-full bg-linear-to-br from-violet-300 to-fuchsia-300 opacity-50"
      />
      <motion.div
        animate={float(0.5, -8)}
        className="absolute top-[60%] left-[15%] size-2.5 rotate-45 rounded-sm bg-linear-to-br from-amber-300 to-orange-300 opacity-40"
      />
      <motion.div
        animate={float(1.5, -14)}
        className="absolute top-[45%] right-[8%] size-3.5 rounded-full bg-linear-to-br from-rose-300 to-pink-300 opacity-40 blur-[1px]"
      />
      <motion.div
        animate={float(2, -10)}
        className="absolute bottom-[30%] left-[25%] size-2 rotate-12 rounded-sm bg-linear-to-br from-blue-300 to-violet-300 opacity-30"
      />
      <motion.div
        animate={float(0.8, -16)}
        className="absolute top-[15%] left-[45%] text-orange-300/40"
      >
        <Sparkles className="size-4" />
      </motion.div>
      <motion.div
        animate={float(1.2, -12)}
        className="absolute bottom-[35%] right-[18%] text-rose-300/30"
      >
        <Heart className="size-3.5" />
      </motion.div>
    </div>
  );
}

/* ─── interactive mockup with tilt ─── */

function MockScreenshot() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(springY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-4, 4]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl [perspective:1200px]">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY }}
        initial={{ opacity: 0, y: 60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        {/* Glow behind the card */}
        <div className="absolute -inset-4 rounded-[2rem] bg-linear-to-br from-orange-300/30 via-rose-300/20 to-violet-300/30 blur-2xl" />

        {/* Gradient background (the beautification layer) */}
        <div className="relative rounded-2xl p-5 shadow-2xl shadow-rose-300/20 sm:rounded-3xl sm:p-8 md:p-10">
          {/* Animated gradient bg */}
          <div
            className="absolute inset-0 rounded-2xl sm:rounded-3xl"
            style={{
              background:
                "linear-gradient(135deg, #fb923c, #f472b6, #a78bfa, #60a5fa, #fb923c)",
              backgroundSize: "400% 400%",
              animation: "heroGradient 8s ease infinite",
            }}
          />
          {/* Noise overlay */}
          <div
            className="absolute inset-0 rounded-2xl opacity-[0.12] sm:rounded-3xl"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Browser mockup */}
          <div className="relative overflow-hidden rounded-xl shadow-2xl sm:rounded-2xl">
            {/* Title bar */}
            <div className="flex items-center gap-2 bg-zinc-900 px-4 py-3">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-[#ff5f57] shadow-sm shadow-red-500/30" />
                <div className="size-3 rounded-full bg-[#febc2e] shadow-sm shadow-yellow-500/30" />
                <div className="size-3 rounded-full bg-[#28c840] shadow-sm shadow-green-500/30" />
              </div>
              <div className="ml-4 flex-1">
                <div className="mx-auto flex h-6 max-w-[200px] items-center justify-center rounded-lg bg-zinc-800 text-[11px] font-medium text-zinc-400">
                  <span className="mr-1 text-emerald-400">●</span>
                  prettyshot.app
                </div>
              </div>
              <div className="w-[60px]" />
            </div>

            {/* Content area — a richer mock dashboard */}
            <div className="bg-white p-4 sm:p-6 md:p-8">
              {/* Top bar */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-linear-to-br from-violet-500 to-fuchsia-500" />
                  <div>
                    <div className="h-3.5 w-24 rounded bg-zinc-200" />
                    <div className="mt-1.5 h-2.5 w-16 rounded bg-zinc-100" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-7 w-16 rounded-lg bg-zinc-100" />
                  <div className="h-7 w-7 rounded-lg bg-linear-to-br from-orange-400 to-rose-400" />
                </div>
              </div>

              {/* Stats row */}
              <div className="mb-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
                  <div className="mb-2 h-2.5 w-12 rounded bg-zinc-200" />
                  <div className="h-5 w-16 rounded bg-linear-to-r from-emerald-200 to-emerald-100" />
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
                  <div className="mb-2 h-2.5 w-10 rounded bg-zinc-200" />
                  <div className="h-5 w-14 rounded bg-linear-to-r from-blue-200 to-blue-100" />
                </div>
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
                  <div className="mb-2 h-2.5 w-14 rounded bg-zinc-200" />
                  <div className="h-5 w-12 rounded bg-linear-to-r from-violet-200 to-violet-100" />
                </div>
              </div>

              {/* Content rows */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-6 rounded-md bg-orange-100" />
                  <div className="h-3.5 flex-1 rounded bg-zinc-100" />
                  <div className="h-5 w-14 rounded-full bg-emerald-100 text-center text-[9px] font-medium leading-5 text-emerald-600">
                    Active
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-6 rounded-md bg-blue-100" />
                  <div className="h-3.5 w-3/4 rounded bg-zinc-100" />
                  <div className="h-5 w-14 rounded-full bg-amber-100 text-center text-[9px] font-medium leading-5 text-amber-600">
                    Pending
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-6 rounded-md bg-violet-100" />
                  <div className="h-3.5 w-2/3 rounded bg-zinc-100" />
                  <div className="h-5 w-14 rounded-full bg-emerald-100 text-center text-[9px] font-medium leading-5 text-emerald-600">
                    Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating badges */}
        <motion.div
          initial={{ opacity: 0, scale: 0, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{
            delay: 1.2,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="absolute -top-4 -right-2 z-10 sm:-top-5 sm:-right-6"
        >
          <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-2 text-xs font-semibold shadow-xl shadow-orange-200/40 ring-1 ring-orange-100">
            <div className="flex size-5 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-rose-400">
              <Sparkles className="size-3 text-white" />
            </div>
            <span className="bg-linear-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
              Beautified!
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0, x: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{
            delay: 1.4,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="absolute -bottom-3 -left-2 z-10 sm:-bottom-5 sm:-left-6"
        >
          <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-2 text-xs font-semibold shadow-xl shadow-violet-200/40 ring-1 ring-violet-100">
            <Download className="size-3.5 text-emerald-500" />
            <span className="text-zinc-700">Export 4K</span>
            <Zap className="size-3 text-amber-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 1.6,
            type: "spring",
            stiffness: 200,
            damping: 15,
          }}
          className="absolute -right-2 bottom-12 z-10 hidden sm:-right-8 sm:block"
        >
          <div className="flex items-center gap-1.5 rounded-2xl bg-white px-3 py-2 text-xs font-semibold shadow-xl shadow-blue-100/40 ring-1 ring-blue-100">
            <Palette className="size-3.5 text-violet-500" />
            <span className="text-zinc-600">Custom BG</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── feature pills ─── */

const featurePills = [
  {
    icon: Palette,
    label: "Gradient Backgrounds",
    color: "from-orange-500 to-rose-500",
  },
  {
    icon: Layers,
    label: "Device Frames",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    icon: MousePointerClick,
    label: "One-Click Export",
    color: "from-blue-500 to-cyan-500",
  },
];

/* ─── hero ─── */

export function Hero() {
  const router = useRouter();

  const headlineWords = ["Make", "your", "screenshots"];
  const gradientWords = ["look", "stunning"];

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#faf8f6] pt-28 sm:pt-32">
      <FloatingShapes />

      <div className="relative mx-auto max-w-6xl px-5">
        {/* Text content */}
        <div className="mx-auto max-w-3xl pb-10 text-center sm:pb-14 md:pb-16">
          {/* Pill badge */}
          <motion.div
            variants={fadeUp(0)}
            initial="hidden"
            animate="visible"
            className="mb-7 inline-flex items-center gap-2.5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-zinc-600 shadow-lg shadow-orange-100/30 ring-1 ring-zinc-200/50 backdrop-blur-sm sm:text-sm"
          >
            <span className="relative flex size-5 items-center justify-center rounded-full bg-linear-to-r from-orange-400 to-rose-400 shadow-sm shadow-orange-300/40">
              <Zap className="size-2.5 text-white" strokeWidth={3} />
              <span className="absolute inset-0 animate-ping rounded-full bg-orange-400/30" />
            </span>
            Free &amp; open source
          </motion.div>

          {/* Headline — word by word */}
          <motion.h1
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="text-4xl font-extrabold leading-[1.08] tracking-tight text-zinc-900 sm:text-6xl md:text-7xl"
          >
            {headlineWords.map((word) => (
              <motion.span
                key={word}
                variants={wordPop}
                className="mr-[0.28em] inline-block"
              >
                {word}
              </motion.span>
            ))}
            <br className="sm:hidden" />
            {gradientWords.map((word) => (
              <motion.span
                key={word}
                variants={wordPop}
                className="mr-[0.28em] inline-block bg-linear-to-r from-orange-500 via-rose-500 to-violet-500 bg-clip-text text-transparent"
                style={{
                  backgroundSize: "200% 100%",
                  animation: "heroTextShimmer 4s ease infinite",
                }}
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp(0.6)}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-6 max-w-lg text-base leading-relaxed font-medium text-zinc-400 sm:mt-7 sm:text-lg md:text-xl"
          >
            Drop any screenshot, pick a style, and export a
            <span className="text-zinc-600"> beautiful image </span>
            in seconds. Zero signup, totally free.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp(0.8)}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
          >
            <div className="group relative">
              {/* CTA glow */}
              <div className="absolute -inset-2 rounded-2xl bg-linear-to-r from-orange-400 via-rose-400 to-violet-500 opacity-40 blur-xl transition-all duration-500 group-hover:opacity-60" />
              <Button
                size="lg"
                variant="primary"
                className="relative bg-zinc-900 px-8 font-bold text-white shadow-2xl shadow-zinc-900/30 transition-shadow duration-300 hover:shadow-3xl"
                onPress={() => router.push("/editor")}
              >
                <Sparkles className="size-4" />
                Start beautifying
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Button>
            </div>

            <Button
              size="lg"
              variant="outline"
              className="bg-white/80 font-semibold text-zinc-700 shadow-sm backdrop-blur-sm"
              onPress={() => {
                document
                  .getElementById("features")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See how it works
            </Button>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            variants={fadeUp(1)}
            initial="hidden"
            animate="visible"
            className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-10 sm:gap-3"
          >
            {featurePills.map((pill) => (
              <div
                key={pill.label}
                className="flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-2 text-xs font-medium text-zinc-600 shadow-sm ring-1 ring-zinc-100 backdrop-blur-sm"
              >
                <div
                  className={`flex size-5 items-center justify-center rounded-full bg-linear-to-r ${pill.color}`}
                >
                  <pill.icon
                    className="size-2.5 text-white"
                    strokeWidth={2.5}
                  />
                </div>
                {pill.label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Screenshot mockup */}
        <div className="pb-16 sm:pb-24">
          <MockScreenshot />
        </div>
      </div>

      {/* Keyframes */}
      <style jsx global>{`
        @keyframes heroGradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          25% {
            background-position: 100% 50%;
          }
          50% {
            background-position: 100% 0%;
          }
          75% {
            background-position: 0% 100%;
          }
        }
        @keyframes heroTextShimmer {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </section>
  );
}
