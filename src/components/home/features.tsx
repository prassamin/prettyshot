"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Sparkles,
  Palette,
  Sun,
  Layers3,
  Move3D,
  ImageDown,
  Copy,
  Ratio,
} from "lucide-react";

const features = [
  {
    icon: Palette,
    title: "Gradient Backgrounds",
    description: "12 handcrafted gradients, mesh images, solid colors, or upload your own.",
    gradient: "from-orange-400 to-rose-500",
    accent: "#fb923c",
  },
  {
    icon: Layers3,
    title: "Rich Shadows",
    description: "7 shadow presets with full color picker. Match any brand or vibe.",
    gradient: "from-violet-400 to-purple-500",
    accent: "#a78bfa",
  },
  {
    icon: Sun,
    title: "Noise Texture",
    description: "Add grain to your backgrounds for that premium, tactile feel.",
    gradient: "from-amber-400 to-orange-500",
    accent: "#f59e0b",
  },
  {
    icon: Move3D,
    title: "3D Perspective",
    description: "Tilt, rotate, and angle your screenshots for dynamic hero shots.",
    gradient: "from-pink-400 to-rose-500",
    accent: "#f472b6",
  },
  {
    icon: Ratio,
    title: "Aspect Ratios",
    description: "Auto, 16:9, 4:3, 1:1, or 9:16. Perfect for any platform.",
    gradient: "from-cyan-400 to-blue-500",
    accent: "#22d3ee",
  },
  {
    icon: ImageDown,
    title: "HD Export",
    description: "PNG or JPG at 1×, 2×, or 3× scale. Retina-ready, every time.",
    gradient: "from-emerald-400 to-teal-500",
    accent: "#34d399",
  },
  {
    icon: Copy,
    title: "Clipboard Copy",
    description: "One click to copy. Paste straight into Slack, Notion, or Twitter.",
    gradient: "from-sky-400 to-indigo-500",
    accent: "#38bdf8",
  },
  {
    icon: Sparkles,
    title: "Zero Signup",
    description: "No account, no email, no BS. Open the editor and start creating.",
    gradient: "from-fuchsia-400 to-pink-500",
    accent: "#e879f9",
  },
];

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.6,
        delay: (index % 4) * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative"
    >
      <div className="relative h-full overflow-hidden rounded-2xl bg-zinc-900 p-6 ring-1 ring-white/6 transition-all duration-500 hover:ring-white/12">
        {/* Hover gradient overlay */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${feature.accent}12 0%, transparent 70%)`,
          }}
        />

        {/* Icon */}
        <div
          className={`relative mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-linear-to-br ${feature.gradient}`}
          style={{ boxShadow: `0 6px 20px -4px ${feature.accent}50` }}
        >
          <Icon className="size-5 text-white" strokeWidth={2} />
        </div>

        {/* Content */}
        <h3 className="relative mb-1.5 text-base font-bold text-white">
          {feature.title}
        </h3>
        <p className="relative text-sm leading-relaxed text-zinc-400">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

export function Features() {
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-100px" });

  return (
    <section id="features" className="relative overflow-hidden bg-zinc-950 py-24 sm:py-32">
      {/* Ambient */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-linear-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute top-1/3 -left-40 size-125 rounded-full bg-violet-900/15 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-40 size-125 rounded-full bg-orange-900/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5">
        {/* Heading */}
        <motion.div
          ref={headingRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/6 px-3.5 py-1.5 text-xs font-semibold text-white/50 ring-1 ring-white/8">
            <Sparkles className="size-3 text-orange-400" />
            Features
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Everything you need,{" "}
            <span className="bg-linear-to-r from-orange-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
              nothing you don&apos;t
            </span>
          </h2>

          <p className="mt-4 text-base font-medium text-zinc-500 sm:text-lg">
            Powerful features that make your screenshots stand out — all in the browser.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
