"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Beat = {
  key: string;
  title: string;
  body: string;
  count: number;
};

const BEATS: Beat[] = [
  {
    key: "background",
    title: "Add a mesh background",
    body: "An emerald mesh gradient appears behind your screenshot, tuned to the colors already in the shot.",
    count: 1,
  },
  {
    key: "frame",
    title: "Frame it in a MacBook",
    body: "A real MacBook frame wraps around it. Your image becomes the laptop screen, with true geometry.",
    count: 2,
  },
  {
    key: "tilt",
    title: "Give it depth",
    body: "The whole laptop tilts in 3D. A flat capture becomes a physical prop.",
    count: 3,
  },
  {
    key: "adjust",
    title: "Tune the backdrop",
    body: "Adjustments bring the whole backdrop to life with richer saturation and contrast.",
    count: 4,
  },
];

// Final color adjustment (editor backdrop adjustments: saturation 1.5x,
// contrast 1.15x — applied to the backdrop layer like the editor does).
const FINAL_FILTER = "saturate(1.5) contrast(1.15)";

// Real mesh preset (index 1) from the editor's own presets file — emerald
// mesh on #0a1210 (buildMeshComposite at presets.ts:53).
const MESH_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' preserveAspectRatio='xMidYMid slice'%3E%3Cdefs%3E%3CradialGradient id='m0' cx='30%25' cy='25%25' r='55%25'%3E%3Cstop offset='0%25' stop-color='%2334d399' stop-opacity='0.85'/%3E%3Cstop offset='100%25' stop-color='%2334d399' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='m1' cx='75%25' cy='70%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%232dd4bf' stop-opacity='0.85'/%3E%3Cstop offset='100%25' stop-color='%232dd4bf' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='m2' cx='50%25' cy='45%25' r='42%25'%3E%3Cstop offset='0%25' stop-color='%23a3e635' stop-opacity='0.85'/%3E%3Cstop offset='100%25' stop-color='%23a3e635' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='%230a1210'/%3E%3Crect width='100%25' height='100%25' fill='url(%23m0)'/%3E%3Crect width='100%25' height='100%25' fill='url(%23m1)'/%3E%3Crect width='100%25' height='100%25' fill='url(%23m2)'/%3E%3C/svg%3E\") center / cover no-repeat";

const FRAME_PATH = "/macbook_frame.png";
const FRAME_W = 2048;
const FRAME_H = 1237;

// Exact editor geometry for the MacBook frame (from the admin metadata).
const GEOMETRY = {
  aspectRatio: "2048 / 1237",
  screen: {
    aspectRatio: "1660 / 1089",
    scale: 0.795,
    offsetX: 0,
    offsetY: -6,
    borderRadius: 28,
  },
};

export function Transformation() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeBeat, setActiveBeat] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;
    const mql = window.matchMedia("(min-width: 768px)");
    if (!mql.matches) return;

    const ctx = gsap.context(() => {
      // Hide layers only when the pinned scroll story is active (desktop).
      // On mobile / no-JS the final composed shot shows statically instead.
      gsap.set("[data-layer-bg]", {
        autoAlpha: 1,
        scale: 1,
        filter: FINAL_FILTER,
      });
      gsap.set("[data-layer-plain]", { autoAlpha: 1 });
      gsap.set("[data-layer-framedscreen]", { autoAlpha: 1 });
      gsap.set("[data-layer-frame]", { autoAlpha: 1, y: 0, scale: 1 });
      gsap.set("[data-layer-tilt]", {
        rotateX: 15,
        rotateY: 19,
        transformPerspective: 1000,
      });
      const reset = () => {
        gsap.set("[data-layer-bg]", {
          autoAlpha: 0,
          scale: 1.25,
          filter: "saturate(1) contrast(1)",
        });
        gsap.set("[data-layer-plain]", { autoAlpha: 1 });
        gsap.set("[data-layer-framedscreen]", { autoAlpha: 0 });
        gsap.set("[data-layer-frame]", { autoAlpha: 0, y: 40, scale: 0.92 });
        gsap.set("[data-layer-tilt]", {
          rotateX: 0,
          rotateY: 0,
          transformPerspective: 1000,
        });
      };
      reset();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: "top top",
          end: "+=320%",
          scrub: 0.6,
          pin: stage,
          anticipatePin: 1,
        },
      });

      // mesh background slides in under the image
      tl.fromTo(
        "[data-layer-bg]",
        { autoAlpha: 0, scale: 1.25 },
        { autoAlpha: 1, scale: 1, ease: "power2.out", duration: 1 },
        "+=0.1",
      );

      // device frame drops in around the image: the plain raw fades into
      // the framed screen (mat + blur fill) while the MacBook wraps it
      tl.fromTo(
        "[data-layer-frame]",
        { autoAlpha: 0, y: 40, scale: 0.92 },
        { autoAlpha: 1, y: 0, scale: 1, ease: "power3.out", duration: 1 },
        "+=0.2",
      );
      tl.fromTo(
        "[data-layer-framedscreen]",
        { autoAlpha: 0 },
        { autoAlpha: 1, ease: "power2.out", duration: 0.7 },
        "<+0.1",
      );
      tl.to("[data-layer-plain]", { autoAlpha: 0, duration: 0.4 }, "<+0.1");

      // tilt — rotateX 15deg, rotateY 19deg (matches the showcase config)
      tl.fromTo(
        "[data-layer-tilt]",
        { rotateX: 0, rotateY: 0, transformPerspective: 1000 },
        { rotateX: 15, rotateY: 19, ease: "power2.inOut", duration: 1 },
        "+=0.2",
      );

      // backdrop adjustments — saturate(1.5) contrast(1.15) on the
      // background, exactly like the editor applies Adjust to the backdrop
      tl.fromTo(
        "[data-layer-bg]",
        { filter: "saturate(1) contrast(1)" },
        { filter: FINAL_FILTER, ease: "power2.inOut", duration: 0.9 },
        "+=0.1",
      );

      ScrollTrigger.create({
        trigger: wrap,
        start: "top top",
        end: "+=320%",
        scrub: true,
        onUpdate: (self) => {
          const idx = Math.min(
            BEATS.length - 1,
            Math.floor(self.progress * BEATS.length),
          );
          setActiveBeat(idx);
        },
      });
    }, wrap);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="transformation"
      ref={wrapRef}
      className="relative bg-background"
    >
      <div ref={stageRef} className="relative md:h-dvh md:overflow-hidden">
        {/* ambient */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 h-125 w-225 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[160px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-16 pt-30aq sm:pt-20 pb-20 md:flex md:h-full md:flex-col md:items-center md:justify-center not-sm:mt-30 md:-mt-10 md:pt-0 md:pb-0 lg:flex-row lg:gap-16">
          {/* ══ STAGE ══ */}
          <div className="flex w-full max-w-2xl flex-1 items-center justify-center py-10 md:py-0">
            {/* The stage box is sized to the laptop frame. The screenshot is
                projected exactly like the editor: a centered child box with
                the screen aspect, scaled by `screen.scale` and offset by
                `screen.offsetY`, clipped by the screen radius. */}
            {/* Outer stage: sized to the frame. Mesh bg stays flat here. */}
            <div
              className="relative w-full max-w-155"
              style={{ aspectRatio: "2048 / 1237" }}
            >
              {/* mesh background — appears UNDER the image, padded around it */}
              <div
                data-layer-bg
                className="absolute -inset-x-[7%] -inset-y-[16%] rounded-[1.5rem] md:rounded-[2.5rem]"
                style={{
                  background: MESH_BG,
                  boxShadow: "0 30px 90px -20px rgba(0,0,0,0.7)",
                }}
              />

              {/* Tilt applies only to the device + its screen, not the bg.
                  Base class = final pose (rotateX 15 / rotateY 19). On
                  desktop GSAP overrides inline to animate through the story;
                  on mobile this static final pose is what shows. */}
              <div
                data-layer-tilt
                className="absolute inset-0"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* 2a. THE raw screenshot — plain, no box, no fill, shown
                    from the start until the device frame appears. Its width
                    equals the screen content width so the crossfade to the
                    framed version is seamless. Hidden on mobile where the
                    final composed shot shows statically. */}
                <div className="pointer-events-none absolute inset-0 z-0 hidden items-center justify-center md:flex">
                  <div
                    data-layer-plain
                    className="relative overflow-hidden"
                    style={{
                      width: `${GEOMETRY.screen.scale * 100}%`,
                      aspectRatio: "16 / 9",
                      transform: `translateY(${GEOMETRY.screen.offsetY}%)`,
                    }}
                  >
                    <Image
                      src="/raw.png"
                      alt="The raw screenshot"
                      width={1920}
                      height={1080}
                      priority
                      className="pointer-events-none block h-full w-full object-contain select-none"
                    />
                  </div>
                </div>

                {/* 2b. Framed version — appears with the MacBook (beat 2):
                    black screen mat + contained image + blurred color fill. */}
                <div
                  data-layer-framedscreen
                  className="pointer-events-none absolute inset-0 z-1 flex items-center justify-center"
                >
                  <div
                    className="relative w-full overflow-clip"
                    style={{
                      aspectRatio: GEOMETRY.screen.aspectRatio,
                      borderRadius: `${(GEOMETRY.screen.borderRadius / 1660) * 100}%`,
                      transform: `scale(${GEOMETRY.screen.scale}) translateY(${GEOMETRY.screen.offsetY}%)`,
                    }}
                  >
                    {/* Blurred backdrop — fills the screen around the contained
                        image, exactly like the editor's contain fit. Kept
                        bright/saturated so the color bleed is clearly visible. */}
                    <Image
                      src="/raw.png"
                      alt=""
                      width={1920}
                      height={1080}
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover select-none"
                      style={{
                        filter: "blur(28px) brightness(1.25) saturate(1.4)",
                        transform: "scale(1.18)",
                      }}
                    />
                    {/* Sharp contained image — never cropped */}
                    <Image
                      src="/raw.png"
                      alt="The raw screenshot"
                      width={1920}
                      height={1080}
                      priority
                      className="pointer-events-none relative z-10 block h-full w-full object-contain select-none"
                    />
                  </div>
                </div>

                {/* device frame — the macbook wraps around the raw image */}
                <div data-layer-frame className="absolute inset-0 z-2">
                  <img
                    src={FRAME_PATH}
                    alt="MacBook frame"
                    width={FRAME_W}
                    height={FRAME_H}
                    className="block h-auto w-full select-none"
                    draggable={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ══ BEAT LABELS (right) ══ */}
          <div className="w-full lg:max-w-md md:max-w-xl shrink-0 lg:pl-4 mt-25 sm:mt-18 md:mt-0">
            {/* Label — hero highlight style */}
            <div className="mb-6 font-display text-base font-medium tracking-tight">
              <span className="relative inline-block whitespace-nowrap px-[0.50em] py-[0.18em]">
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-[0.3em] bg-primary/20"
                />
                <span className="relative text-primary">Transformation</span>
              </span>
            </div>

            {/* Desktop: active-beat swap */}
            <div className="relative min-h-52 block">
              {BEATS.map((b, i) => (
                <div
                  key={b.key}
                  className={`transition-all duration-500 ${
                    i === activeBeat
                      ? "relative opacity-100"
                      : "absolute inset-0 opacity-0"
                  }`}
                >
                  <h3 className="font-display text-2xl font-medium tracking-[-0.02em] text-foreground sm:text-3xl">
                    {b.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop progress dots */}
            <div className="mt-0 lg:mt-8 items-center gap-2 flex">
              {BEATS.map((b, i) => (
                <span
                  key={b.key}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === activeBeat ? "w-8 bg-primary" : "w-3 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
