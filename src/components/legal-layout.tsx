"use client";

import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

type LegalSection = {
  title: string;
  content: React.ReactNode;
};

export function LegalLayout({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  highlight,
  intro,
  lastUpdated,
  sections,
  footnote,
}: {
  eyebrow: string;
  eyebrowIcon: React.ComponentType<{ className?: string }>;
  title: string;
  highlight: string;
  intro: string;
  lastUpdated: Date;
  sections: LegalSection[];
  footnote: string;
}) {
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);

  // Scroll-spy: track which section is in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.index ?? 0,
            );
            setActive(idx);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (index: number) => {
    sectionRefs.current[index]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen relative bg-background text-foreground">
      <Navbar />
      {/* ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-40 left-1/2 h-105 w-250 -translate-x-1/2 rounded-full bg-primary/25 blur-[150px]" />
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden pt-36 pb-12 sm:pt-44 sm:pb-16">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-96 w-225 -translate-x-1/2 rounded-full bg-primary/6 blur-[150px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <EyebrowIcon className="size-3.5 text-primary" />
            {eyebrow}
          </div>
          <h1 className="font-display mt-6 text-[clamp(2.6rem,6vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.04em] text-foreground">
            {title}{" "}
            <span className="relative inline-block whitespace-nowrap px-[0.18em]">
              <span
                aria-hidden
                className="absolute inset-x-0 top-[12%] bottom-[6%] rounded-[0.2em] bg-primary/20"
              />
              <span className="relative text-primary">{highlight}</span>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            {intro}
          </p>
          <p className="mt-6 text-xs font-medium text-muted-foreground/60">
            Last updated:{" "}
            {lastUpdated.toLocaleString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Content + scroll-spy rail */}
      <div className="relative mx-auto max-w-5xl px-6 pb-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_180px]">
          {/* Document */}
          <div className="max-w-2xl">
            {sections.map((section, i) => (
              <div
                key={i}
                ref={(el) => {
                  sectionRefs.current[i] = el;
                }}
                data-index={i}
                className="scroll-mt-32 border-b border-border/40 py-8 first:pt-2 last:border-b-0"
              >
                <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
                  {section.title}
                </h2>
                <div className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {section.content}
                </div>
              </div>
            ))}

            <p className="mt-10 text-center text-sm text-muted-foreground/70">
              {footnote}
            </p>
          </div>

          {/* Scroll-spy rail (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="relative flex flex-col gap-0.5">
                {/* track */}
                <div
                  aria-hidden
                  className="absolute top-2 bottom-2 left-0.75 w-px bg-border/60"
                />
                {sections.map((section, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => scrollToSection(i)}
                    className="group relative flex items-center gap-3 py-1.5 pl-5 text-left"
                  >
                    {/* marker dot */}
                    <span
                      aria-hidden
                      className={`absolute left-0.75 size-1.75 -translate-x-1/2 rounded-full transition-all duration-300 ${
                        active === i
                          ? "bg-primary scale-125 shadow-[0_0_8px_rgba(249,115,22,0.5)]"
                          : "bg-border group-hover:bg-muted-foreground/50"
                      }`}
                    />
                    <span
                      className={`font-mono text-[10px] transition-colors duration-300 ${
                        active === i
                          ? "font-bold text-primary"
                          : "text-muted-foreground/50 group-hover:text-muted-foreground"
                      }`}
                    >
                      #{i + 1}
                    </span>
                    <span
                      className={`text-[13px] transition-colors duration-300 ${
                        active === i
                          ? "font-medium text-foreground"
                          : "text-muted-foreground/60 group-hover:text-muted-foreground"
                      }`}
                    >
                      {section.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  );
}
