"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Sparkles, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─── data ─── */

const pairs = [
  {
    before: "/screenshots/ss-1.png",
    after: "/screenshots/ss-1-beautified.png",
    label: "Landing Page",
    bw: 1864, bh: 926, aw: 2613, ah: 1470,
  },
  {
    before: "/screenshots/ss-2.png",
    after: "/screenshots/ss-2-beautified.png",
    label: "Analytics Dashboard",
    bw: 1165, bh: 624, aw: 2613, ah: 1578,
  },
  {
    before: "/screenshots/ss-4.png",
    after: "/screenshots/ss-4-beautified.png",
    label: "Product Page",
    bw: 1862, bh: 924, aw: 2613, ah: 1470,
  },
  {
    before: "/screenshots/ss-3.png",
    after: "/screenshots/ss-3-beautified.png",
    label: "GitHub Activity",
    bw: 929, bh: 184, aw: 2613, ah: 1470,
  },
];

/* ─── desktop stacked cards ─── */

function StackedCards({
  images,
  activeIndex,
  onSelect,
  type,
}: {
  images: { src: string; w: number; h: number; label: string }[];
  activeIndex: number;
  onSelect: (i: number) => void;
  type: "before" | "after";
}) {
  const total = images.length;
  const isAfter = type === "after";

  return (
    <div className="relative w-full" style={{ aspectRatio: "16/10" }}>
      {images.map((img, i) => {
        const diff = i - activeIndex;
        const absDiff = Math.abs(diff);
        const isActive = i === activeIndex;

        const rotate = diff === 0 ? 0 : diff * 4;
        const fanDirection = isAfter ? 1 : -1;
        const translateX = diff === 0 ? 0 : diff * 18 * fanDirection;
        const translateY = absDiff * 8;
        const scale = isActive ? 1 : Math.max(0.88, 1 - absDiff * 0.035);
        const zIndex = total + 1 - absDiff;
        const opacity = absDiff > 2 ? 0 : isActive ? 1 : 0.7;
        const brightness = isActive ? 1 : 0.6;

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className="absolute inset-0 cursor-pointer border-0 bg-transparent p-0"
            style={{
              zIndex,
              opacity,
              filter: `brightness(${brightness})`,
              transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
              transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
              transformOrigin: isAfter ? "60% 90%" : "40% 90%",
            }}
          >
            <div
              className="h-full w-full overflow-hidden rounded-2xl ring-1 sm:rounded-3xl"
              style={{
                boxShadow: isActive
                  ? isAfter
                    ? "0 25px 80px -15px rgba(251,146,60,0.2), 0 10px 30px -10px rgba(0,0,0,0.4)"
                    : "0 25px 80px -15px rgba(0,0,0,0.4)"
                  : "0 10px 40px -10px rgba(0,0,0,0.3)",
                borderColor: isActive && isAfter
                  ? "rgba(251,146,60,0.15)"
                  : "rgba(255,255,255,0.06)",
              }}
            >
              {!isAfter ? (
                <div className="relative flex h-full items-center justify-center bg-zinc-100/75">
                  <Image
                    src={img.src}
                    alt={img.label}
                    width={img.w}
                    height={img.h}
                    className="block h-auto max-h-[85%] w-auto max-w-[90%] rounded-lg object-contain"
                    style={{ boxShadow: "0 4px 20px -4px rgba(0,0,0,0.1)" }}
                  />
                  {isActive && (
                    <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 shadow-sm backdrop-blur-sm">
                      <span className="text-[11px] font-bold text-zinc-600">{img.label}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-full w-full">
                  <Image
                    src={img.src}
                    alt={img.label}
                    width={img.w}
                    height={img.h}
                    className="block h-full w-full object-cover"
                  />
                  {isActive && (
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm">
                      <span className="text-[11px] font-bold text-orange-300">{img.label}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ─── mobile: before/after toggle card ─── */

function MobileCard({
  pair,
  showAfter,
}: {
  pair: (typeof pairs)[0];
  showAfter: boolean;
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl ring-1 ring-white/[0.08]" style={{ aspectRatio: "16/10" }}>
      {/* Before */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-zinc-100 transition-all duration-500"
        style={{ opacity: showAfter ? 0 : 1, transform: showAfter ? "scale(0.95)" : "scale(1)" }}
      >
        <Image
          src={pair.before}
          alt={`${pair.label} — original`}
          width={pair.bw}
          height={pair.bh}
          className="block h-auto max-h-[85%] w-auto max-w-[90%] rounded-lg object-contain"
          style={{ boxShadow: "0 4px 20px -4px rgba(0,0,0,0.1)" }}
          quality={90}
        />
      </div>

      {/* After */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{ opacity: showAfter ? 1 : 0, transform: showAfter ? "scale(1)" : "scale(1.05)" }}
      >
        <Image
          src={pair.after}
          alt={`${pair.label} — beautified`}
          width={pair.aw}
          height={pair.ah}
          className="block h-full w-full object-cover"
          quality={90}
        />
      </div>

      {/* Badge */}
      <div className="absolute top-3 left-3 z-10">
        <div
          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md transition-all duration-300"
          style={{
            backgroundColor: showAfter ? "rgba(251,146,60,0.2)" : "rgba(255,255,255,0.15)",
            color: showAfter ? "#fdba74" : "rgba(0,0,0,0.5)",
            border: showAfter ? "1px solid rgba(251,146,60,0.3)" : "1px solid rgba(0,0,0,0.08)",
          }}
        >
          {showAfter ? "After" : "Before"}
        </div>
      </div>
    </div>
  );
}

/* ─── gallery section ─── */

export function Gallery() {
  const [active, setActive] = useState(0);
  const [mobileShowAfter, setMobileShowAfter] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  // Desktop: GSAP scroll-driven
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    if (!mql.matches) return;

    const wrapper = sectionRef.current;
    const pinEl = pinRef.current;
    if (!wrapper || !pinEl) return;

    const total = pairs.length;

    const st = ScrollTrigger.create({
      trigger: wrapper,
      start: "top top",
      end: `+=${total * 80}%`,
      pin: pinEl,
      pinSpacing: true,
      scrub: true,
      onUpdate: (self) => {
        const index = Math.min(total - 1, Math.floor(self.progress * total));
        setActive(index);
      },
    });

    return () => st.kill();
  }, []);

  const beforeImages = pairs.map((p) => ({ src: p.before, w: p.bw, h: p.bh, label: p.label }));
  const afterImages = pairs.map((p) => ({ src: p.after, w: p.aw, h: p.ah, label: p.label }));

  return (
    <div ref={sectionRef} className="relative overflow-hidden bg-zinc-950">
      {/* ═══ Desktop layout (md+) ═══ */}
      <div
        ref={pinRef}
        className="relative hidden h-dvh flex-col justify-center bg-zinc-950 px-5 md:flex"
      >
        {/* Ambient blurs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-linear-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute -top-40 left-1/4 size-[600px] rounded-full bg-violet-900/15 blur-[140px]" />
          <div className="absolute -bottom-40 right-1/4 size-[600px] rounded-full bg-orange-900/10 blur-[140px]" />
        </div>
        <div className="mx-auto w-full max-w-6xl">
          {/* Heading */}
          <div className="mb-12 text-center lg:mb-16">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 text-xs font-semibold text-white/50 ring-1 ring-white/[0.08]">
              <Sparkles className="size-3 text-orange-400" />
              Before & After
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              From plain to{" "}
              <span className="bg-linear-to-r from-orange-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
                stunning
              </span>
            </h2>
          </div>

          {/* Column labels */}
          <div className="mb-5 grid grid-cols-[1fr_80px_1fr] items-end lg:grid-cols-[1fr_100px_1fr]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Before</span>
              <p className="text-[13px] text-zinc-600">Raw screenshot</p>
            </div>
            <div />
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-widest text-orange-400/80">After</span>
              <p className="text-[13px] text-zinc-600">Polished screenshot</p>
            </div>
          </div>

          {/* Stacks */}
          <div className="grid grid-cols-[1fr_80px_1fr] items-center lg:grid-cols-[1fr_100px_1fr]">
            <StackedCards images={beforeImages} activeIndex={active} onSelect={setActive} type="before" />
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-orange-500/10 ring-1 ring-orange-500/20 lg:size-12">
                <ArrowRight className="size-5 text-orange-400 lg:size-6" />
              </div>
              <span className="hidden text-center text-xs font-semibold italic leading-tight text-orange-400/60 lg:block">
                presentation<br />ready
              </span>
            </div>
            <StackedCards images={afterImages} activeIndex={active} onSelect={setActive} type="after" />
          </div>

          {/* Dots */}
          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              {pairs.map((pair, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`View ${pair.label}`}
                  className="group relative"
                >
                  <div
                    className="rounded-full transition-all duration-500"
                    style={{
                      width: active === i ? 36 : 10,
                      height: 10,
                      backgroundColor: active === i ? "#fb923c" : "rgba(255,255,255,0.12)",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Mobile layout (<md) ═══ */}
      <div className="relative bg-zinc-950 px-5 py-16 md:hidden">
        {/* Ambient blurs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-linear-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute -top-40 left-1/4 size-[600px] rounded-full bg-violet-900/15 blur-[140px]" />
          <div className="absolute -bottom-40 right-1/4 size-[600px] rounded-full bg-orange-900/10 blur-[140px]" />
        </div>
        <div className="mx-auto max-w-lg">
          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/50 ring-1 ring-white/[0.08]">
              <Sparkles className="size-3 text-orange-400" />
              Before & After
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              From plain to{" "}
              <span className="bg-linear-to-r from-orange-400 via-rose-400 to-violet-400 bg-clip-text text-transparent">
                stunning
              </span>
            </h2>
          </div>

          {/* Before/After toggle */}
          <div className="mb-5 flex items-center justify-center">
            <div className="flex rounded-full bg-white/[0.06] p-1 ring-1 ring-white/[0.08]">
              <button
                onClick={() => setMobileShowAfter(false)}
                className="rounded-full px-4 py-1.5 text-xs font-bold transition-all"
                style={{
                  backgroundColor: !mobileShowAfter ? "rgba(255,255,255,0.12)" : "transparent",
                  color: !mobileShowAfter ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              >
                Before
              </button>
              <button
                onClick={() => setMobileShowAfter(true)}
                className="rounded-full px-4 py-1.5 text-xs font-bold transition-all"
                style={{
                  backgroundColor: mobileShowAfter ? "#fb923c" : "transparent",
                  color: mobileShowAfter ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              >
                After
              </button>
            </div>
          </div>

          {/* Card */}
          <MobileCard pair={pairs[active]} showAfter={mobileShowAfter} />

          {/* Dots */}
          <div className="mt-5 flex items-center justify-center gap-2">
            {pairs.map((pair, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`View ${pair.label}`}
              >
                <div
                  className="rounded-full transition-all duration-500"
                  style={{
                    width: active === i ? 28 : 8,
                    height: 8,
                    backgroundColor: active === i ? "#fb923c" : "rgba(255,255,255,0.12)",
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
