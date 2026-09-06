"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import {
  Brush,
  Cloud,
  Crop,
  Download,
  Layers,
  Move3d,
  Palette,
  Smartphone,
  Type,
  Video,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ─── mouse-follow spotlight card ─── */

function SpotlightCard({
  children,
  className = "",
  onMouseMove,
  onMouseLeave,
  spot,
}: {
  children: React.ReactNode;
  className?: string;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  spot?: { x: number; y: number };
}) {
  return (
    <div
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={
        {
          "--spot-x": `${spot?.x ?? 50}%`,
          "--spot-y": `${spot?.y ?? 0}%`,
        } as React.CSSProperties
      }
      className={`group relative overflow-hidden rounded-3xl border border-border/70 bg-surface/40 p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/25 hover:bg-surface/80 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] ${className}`}
    >
      {/* gradient sheen layer */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(160deg, rgba(249,115,22,0.07) 0%, transparent 45%)",
        }}
      />
      {/* spotlight (set per-card) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(500px circle at var(--spot-x, 50%) var(--spot-y, 0%), rgba(249,115,22,0.08), transparent 55%)",
        }}
      />
      {/* top hairline */}
      <div
        aria-hidden
        className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-white/8 to-transparent transition-all duration-500 group-hover:via-primary/40"
      />
      {/* soft corner glow orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 -right-12 size-28 rounded-full bg-primary/4 blur-2xl transition-all duration-500 group-hover:bg-primary/9"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

function CardBody({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Palette;
  title: string;
  body: string;
}) {
  return (
    <>
      <div className="flex items-start gap-4">
        <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl border border-border/70 bg-linear-to-br from-surface-tertiary/80 to-surface-muted text-foreground/80 shadow-sm transition-all duration-300 group-hover:border-primary/30 group-hover:text-primary">
          <Icon className="size-5" strokeWidth={1.7} />
          {/* tiny hover glow behind icon */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 30%, rgba(249,115,22,0.18), transparent)",
            }}
          />
        </span>
        <div>
          <h3 className="text-[16px] font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {body}
          </p>
        </div>
      </div>
    </>
  );
}

/* ─── feature cards data ─── */

type Feature = {
  icon: typeof Palette;
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    icon: Palette,
    title: "Backgrounds",
    body: "Solid, linear, mesh and aurora backdrops. Auto palettes sampled straight from your screenshot.",
  },
  {
    icon: Smartphone,
    title: "Frames",
    body: "Real iPhone, MacBook and iPad frames, plus Safari and Chrome windows with an editable address bar.",
  },
  {
    icon: Layers,
    title: "Grain & lighting",
    body: "Physical film grain, soft shadows and directional light. Frames feel like objects, not files.",
  },
  {
    icon: Move3d,
    title: "Tilt & depth",
    body: "Rotate in 3D, control perspective and shadow angle. A flat capture becomes a prop.",
  },
  {
    icon: Type,
    title: "Text & annotations",
    body: "Labels, callouts, arrows and freehand ink. Every element stays editable after you draw it.",
  },
  {
    icon: Crop,
    title: "Crop & multi-shot",
    body: "Pixel-crop any shot, then compose two or three screenshots into one canvas for stories.",
  },
  {
    icon: Video,
    title: "Animation",
    body: "A real timeline with easing and clips. Animate zoom, tilt, shadow or the background itself.",
  },
  {
    icon: Download,
    title: "Export everything",
    body: "PNG, WebP, JPEG and video. From a quick clipboard copy up to 8K stills and 4K motion.",
  },
  {
    icon: Cloud,
    title: "Cloud autosave",
    body: "Free designs live on your device. Pro designs sync to the cloud and follow you anywhere.",
  },
  {
    icon: Brush,
    title: "Textures & overlays",
    body: "A library of shadow textures and gradient overlays to place on top of or behind the shot.",
  },
];

/* ─── section ─── */

export function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const [spots, setSpots] = useState<Record<number, { x: number; y: number }>>(
    {},
  );

  const trackSpot =
    (index: number) => (e: React.MouseEvent<HTMLDivElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setSpots((prev) => ({
        ...prev,
        [index]: {
          x: ((e.clientX - r.left) / r.width) * 100,
          y: ((e.clientY - r.top) / r.height) * 100,
        },
      }));
    };

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-background py-24 sm:py-32"
    >
      {/* ambient — quiet, no top glow (keeps the join seamless with the
          transformation section above) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 left-1/2 h-100 w-210 -translate-x-1/2 rounded-full bg-primary/25 blur-[160px]" />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "radial-gradient(var(--border) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)",
          }}
        />
      </div>

      <div ref={ref} className="relative mx-auto max-w-6xl px-5">
        {/* header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-display text-sm font-medium tracking-tight">
            <span className="relative inline-block whitespace-nowrap px-[0.35em] py-[0.18em]">
              <span
                aria-hidden
                className="absolute inset-0 rounded-[0.3em] bg-primary/20"
              />
              <span className="relative text-primary">What&apos;s inside</span>
            </span>
          </span>
          <h2 className="font-display mt-5 text-[clamp(2.2rem,5vw,3.8rem)] font-medium leading-[1.05] tracking-[-0.04em] text-foreground">
            A studio, built for{" "}
            <span className="relative inline-block whitespace-nowrap px-[0.18em]">
              <span
                aria-hidden
                className="absolute inset-x-0 top-[12%] bottom-[6%] rounded-[0.2em] bg-primary/20"
              />
              <span className="relative text-primary">screenshots.</span>
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Every tool exists for one job: taking a plain capture and making it
            look built.
          </p>
        </div>

        {/* grid */}
        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: (i % 3) * 0.07, ease: EASE }}
            >
              <SpotlightCard
                spot={spots[i]}
                onMouseMove={trackSpot(i)}
                onMouseLeave={() =>
                  setSpots((prev) => {
                    const next = { ...prev };
                    delete next[i];
                    return next;
                  })
                }
              >
                <CardBody icon={f.icon} title={f.title} body={f.body} />
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
