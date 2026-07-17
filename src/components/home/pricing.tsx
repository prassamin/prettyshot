"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Zap } from "lucide-react";
import { Button } from "@heroui/react";
import { useRouter } from "@/hooks/use-router";
import { useAppStore } from "@/stores/app-store";
import { isPro } from "@/lib/utils";

export function Pricing() {
  const router = useRouter();
  const { user } = useAppStore();
  const pro = isPro(user);

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[#faf8f6] py-24 sm:py-32"
    >
      {/* Decorative Background Elements */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="absolute top-[20%] h-150 w-150 rounded-full bg-linear-to-br from-orange-200/40 via-rose-200/20 to-transparent blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] h-125 w-125 rounded-full bg-linear-to-tl from-violet-200/40 via-fuchsia-200/20 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100/50 px-3 py-1 text-sm font-semibold text-orange-600 ring-1 ring-orange-200"
          >
            <Sparkles className="size-4" />
            Simple Pricing
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl"
          >
            Pay once, use forever.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg font-medium text-zinc-500"
          >
            No recurring subscriptions. Keep the core features for free, or
            upgrade to Pro to unlock cloud assets and power-user tools.
          </motion.p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative flex flex-col rounded-3xl border border-zinc-200 bg-white/60 p-8 shadow-lg shadow-zinc-200/50 backdrop-blur-xl sm:p-10"
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-zinc-900">Community</h3>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                Perfect for occasional screenshots.
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight text-zinc-900">
                  $0
                </span>
                <span className="text-sm font-medium text-zinc-500">
                  / forever
                </span>
              </div>
            </div>

            <ul className="mb-10 flex flex-1 flex-col gap-4">
              {[
                "Zero signup required",
                "12 Basic Gradients & Solid Colors",
                "Standard HD Export (PNG/JPG)",
                "Basic 3D Perspective",
                "Local Storage only",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="flex size-5 items-center justify-center rounded-full bg-zinc-100">
                    <Check className="size-3 text-zinc-600" strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium text-zinc-600">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="w-full border-zinc-200 bg-white font-semibold text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-900"
              onPress={() => router.push("/editor")}
            >
              {pro.isActive && pro.type === "pro"
                ? "Open Editor"
                : "Start for free"}
            </Button>
          </motion.div>

          {/* Pro Tier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative flex flex-col rounded-3xl border border-rose-200 bg-white p-8 shadow-2xl shadow-rose-200/40 ring-1 ring-orange-100 sm:p-10"
          >
            {/* Glow effect */}
            <div className="absolute -inset-0.5 rounded-[2rem] bg-linear-to-br from-orange-400 via-rose-400 to-violet-500 opacity-20 blur-xl transition-opacity group-hover:opacity-30" />

            <div className="absolute -top-3 right-8">
              <div className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-orange-500 to-rose-500 px-3 py-1 text-xs font-bold text-white shadow-lg shadow-rose-500/30">
                <Zap className="size-3" fill="currentColor" />
                LIFETIME DEAL
              </div>
            </div>

            <div className="relative mb-8">
              <h3 className="text-2xl font-bold bg-linear-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent">
                PrettyShot Pro
              </h3>
              <p className="mt-2 text-sm font-medium text-zinc-500">
                For creators, founders, and power users.
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight text-zinc-900">
                  $29
                </span>
                <span className="text-sm font-medium text-zinc-500">
                  / one-time
                </span>
              </div>
            </div>

            <ul className="relative mb-10 flex flex-1 flex-col gap-4">
              <li className="flex items-center gap-3">
                <div className="flex size-5 items-center justify-center rounded-full bg-rose-100">
                  <Check className="size-3 text-rose-600" strokeWidth={3} />
                </div>
                <span className="text-sm font-semibold text-zinc-800">
                  Everything in Free, plus:
                </span>
              </li>
              {[
                "No watermarks",
                "Cloud Sync & Preset Saving",
                "Premium Mesh Gradients Library",
                "Custom 3D Device Mockups (Mac, Phone)",
                "Batch Export (Process up to 20 at once)",
                "Ultra 4K & SVG Export Options",
                "Priority Email Support",
                "All future Pro features & updates",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="flex size-5 items-center justify-center rounded-full bg-rose-100">
                    <Check className="size-3 text-rose-600" strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium text-zinc-600">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="relative w-full overflow-hidden bg-zinc-900 font-bold text-white shadow-xl shadow-zinc-900/20 transition-transform hover:-translate-y-0.5 hover:shadow-2xl disabled:opacity-80 disabled:hover:translate-y-0 disabled:hover:shadow-xl disabled:cursor-not-allowed"
              isDisabled={pro.isActive && pro.type === "pro"}
              onPress={() =>
                (!pro.isActive || pro.type !== "pro") &&
                router.push("/login", { auth: true, next: "/checkout" })
              }
            >
              {(!pro.isActive || pro.type !== "pro") && (
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-1000 hover:translate-x-full" />
              )}
              {pro.isActive && pro.type === "pro"
                ? "Pro Unlocked"
                : "Get Pro Access"}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
