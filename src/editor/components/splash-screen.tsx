"use client";

import { motion } from "framer-motion";

/**
 * splash.
 *
 * A minimal, centered boot screen: the PrettyShot mark + wordmark over the
 * dark canvas, a thin indeterminate progress bar (the Figma-style sweep), and
 * a quiet status line. The exit is a soft fade + scale-down, handled by the
 * parent's AnimatePresence.
 */
export function SplashScreen() {
  return (
    <motion.div
      key="splash"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.985, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
      className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-background select-none"
      aria-label="Loading PrettyShot"
      role="status"
    >
      {/* Ambient brand glow behind the mark */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-[65%] rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-7">
        {/* Mark */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-2xl shadow-lg shadow-overlay/30">
            <img
              src="/prettyshot.svg"
              alt="PrettyShot"
              width={34}
              height={26}
              className="shrink-0"
            />
          </div>
          <span className="text-[17px] font-bold tracking-tight text-foreground">
            PrettyShot
          </span>
        </div>

        {/* Indeterminate progress — Figma-style thin sweep (CSS compositor driven, no JS freeze on reload) */}
        <div
          className="relative h-0.75 w-50 overflow-hidden rounded-full bg-surface-tertiary"
          aria-hidden
        >
          <div
            className="absolute inset-y-0 w-1/3 rounded-full bg-linear-to-r from-transparent via-primary to-transparent will-change-transform"
            style={{
              animation: "splashSweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
