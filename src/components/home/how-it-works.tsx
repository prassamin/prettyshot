"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Upload, Palette, Download, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Drop your screenshot",
    description:
      "Drag & drop, paste from clipboard, or pick a file. PNG, JPG, WebP — we take them all.",
    gradient: "from-orange-400 to-rose-500",
    glow: "bg-orange-500/20",
    accent: "#fb923c",
  },
  {
    icon: Palette,
    number: "02",
    title: "Make it beautiful",
    description:
      "Pick a gradient, mesh, or solid background. Add shadow, noise, perspective tilt — go wild.",
    gradient: "from-violet-400 to-fuchsia-500",
    glow: "bg-violet-500/20",
    accent: "#a78bfa",
  },
  {
    icon: Download,
    number: "03",
    title: "Export & share",
    description:
      "Download as PNG or JPG at up to 3× resolution. Copy to clipboard. Share everywhere.",
    gradient: "from-cyan-400 to-blue-500",
    glow: "bg-cyan-500/20",
    accent: "#22d3ee",
  },
];

function StepCard({
  step,
  index,
}: {
  step: (typeof steps)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        delay: index * 0.15,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative"
    >
      {/* Hover glow */}
      <div
        className={`absolute -inset-4 rounded-3xl ${step.glow} opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100`}
      />

      <div className="relative overflow-hidden rounded-3xl border border-zinc-200/60 bg-white p-8 transition-all duration-500 group-hover:border-zinc-200 group-hover:shadow-xl">
        {/* Step number watermark */}
        <span
          className="absolute -right-2 -top-6 text-[120px] font-black leading-none select-none"
          style={{ color: `${step.accent}10` }}
        >
          {step.number}
        </span>

        {/* Icon */}
        <div
          className={`relative mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-linear-to-br ${step.gradient} shadow-lg`}
          style={{ boxShadow: `0 8px 30px -4px ${step.accent}40` }}
        >
          <Icon className="size-6 text-white" strokeWidth={2} />
        </div>

        {/* Content */}
        <h3 className="mb-2 text-xl font-bold text-zinc-900">{step.title}</h3>
        <p className="text-sm leading-relaxed text-zinc-500">
          {step.description}
        </p>

        {/* Bottom line accent */}
        <div className="mt-6 h-1 w-12 rounded-full bg-linear-to-r opacity-0 transition-all duration-500 group-hover:w-20 group-hover:opacity-100"
          style={{ backgroundImage: `linear-gradient(to right, ${step.accent}, transparent)` }}
        />
      </div>
    </motion.div>
  );
}

export function HowItWorks() {
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-100px" });

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#faf8f6] py-24 sm:py-32">
      {/* Decorative */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/4 -left-40 size-125 rounded-full bg-orange-100/50 blur-[100px]" />
        <div className="absolute -bottom-20 right-0 size-100 rounded-full bg-violet-100/40 blur-[100px]" />
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
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-500 shadow-sm ring-1 ring-zinc-200/80">
            <Sparkles className="size-3 text-orange-400" />
            How it works
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
            Three steps to{" "}
            <span className="bg-linear-to-r from-orange-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">
              screenshot perfection
            </span>
          </h2>

          <p className="mt-4 text-base font-medium leading-relaxed text-zinc-500 sm:text-lg">
            No account needed. Just results.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>

        {/* Connecting line (desktop) */}
        <div className="pointer-events-none absolute top-[62%] left-1/2 hidden -translate-x-1/2 sm:block">
          <div className="h-px w-[60%] bg-linear-to-r from-transparent via-zinc-300/50 to-transparent" />
        </div>
      </div>
    </section>
  );
}
