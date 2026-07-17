"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { createOAuth } from "@/lib/supabase/auth";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAppStore } from "@/stores/app-store";

export default function LoginPageView() {
  const [isLoading, setIsLoading] = useState(false);
  const { url } = useAppStore();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      console.log(
        "url",
        `${window.location.origin}/auth/callback/${url.search}`,
      );
      await createOAuth("google", {
        redirectTo: `${window.location.origin}/auth/callback/${url.search}`,
      });
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#faf8f6] p-4 sm:p-8">
      {/* Animated Mesh Gradient Background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "linear-gradient(135deg, #fb923c, #f472b6, #a78bfa, #60a5fa, #fb923c)",
            backgroundSize: "400% 400%",
            animation: "loginGradient 15s ease infinite",
          }}
        />
        {/* Noise overlay for texture */}
        <div
          className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
        className="relative z-10 w-full max-w-5xl"
      >
        {/* Glow behind the window */}
        <div className="absolute -inset-10 rounded-[3rem] bg-white/20 blur-3xl" />

        {/* The macOS Window Mockup */}
        <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] backdrop-blur-2xl ring-1 ring-black/5 sm:rounded-[2rem]">
          {/* macOS Title Bar */}
          <div className="flex items-center justify-between border-b border-white/40 bg-white/40 px-4 py-3 backdrop-blur-md">
            <div className="flex gap-2">
              <div className="size-3 rounded-full bg-[#ff5f57] shadow-inner shadow-white/50" />
              <div className="size-3 rounded-full bg-[#febc2e] shadow-inner shadow-white/50" />
              <div className="size-3 rounded-full bg-[#28c840] shadow-inner shadow-white/50" />
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-white/50 px-3 py-1 text-[11px] font-semibold text-zinc-500 shadow-sm">
              {url?.host}
            </div>
            <div className="w-16" /> {/* Spacer for symmetry */}
          </div>

          {/* Window Content - Split Layout */}
          <div className="flex flex-col md:flex-row">
            {/* Left Side: Brand & Value Prop */}
            <div className="relative flex w-full flex-col justify-between border-r border-white/30 bg-linear-to-br from-white/40 to-transparent p-10 md:w-5/12 lg:p-14">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 transition-transform"
                >
                  <div className="flex size-10 p-1.5 items-center justify-center rounded-xl bg-zinc-900 shadow-lg shadow-zinc-900/20">
                    <img src="/prettyshot.svg" alt="logo" />
                  </div>
                  <span className="text-2xl font-bold tracking-tight text-zinc-900">
                    PrettyShot
                  </span>
                </Link>

                <h2 className="mt-12 text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-4xl">
                  Turn boring <br /> screenshots <br /> into{" "}
                  <span className="bg-linear-to-r from-orange-500 via-rose-500 to-violet-500 bg-clip-text text-transparent">
                    masterpieces.
                  </span>
                </h2>

                <p className="mt-6 text-sm font-medium text-zinc-500">
                  Join thousands of creators making their apps look stunning in
                  seconds. No complex software required.
                </p>
              </div>

              {/* Little floating UI element for decoration */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mt-12 hidden w-fit rounded-2xl border border-white/50 bg-white/80 p-3 shadow-xl md:block"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-linear-to-br from-violet-400 to-fuchsia-400" />
                  <div>
                    <div className="h-2 w-16 rounded-full bg-zinc-200" />
                    <div className="mt-1.5 h-2 w-10 rounded-full bg-zinc-100" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Side: Login Actions */}
            <div className="flex w-full flex-col justify-center bg-white/30 p-10 md:w-7/12 lg:p-16">
              <div className="mx-auto w-full max-w-sm">
                <div className="mb-10 text-center">
                  <h3 className="mb-2 text-2xl font-bold text-zinc-900">
                    Welcome Back
                  </h3>
                  <p className="text-sm font-medium text-zinc-500">
                    Sign in to access your saved styles, view your history, and
                    manage your account.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="group relative h-14 w-full overflow-hidden rounded-2xl bg-zinc-900 font-semibold text-white shadow-xl shadow-zinc-900/10 transition-all hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-2xl"
                  onPress={handleGoogleLogin}
                  isDisabled={isLoading}
                >
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full transition-transform duration-1000 group-hover:translate-x-full" />
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-white p-1.5 shadow-sm">
                        <svg
                          className="size-full"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      </div>
                      <span className="text-base tracking-wide">
                        Continue with Google
                      </span>
                    </div>
                  )}
                </Button>

                <div className="mt-10 flex items-center gap-4">
                  <div className="h-px flex-1 bg-zinc-200" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    Secure
                  </span>
                  <div className="h-px flex-1 bg-zinc-200" />
                </div>

                <p className="mt-8 text-center text-xs font-medium leading-relaxed text-zinc-400">
                  We care about your privacy. By continuing, you agree to our{" "}
                  <br />
                  <Link
                    href="/terms"
                    className="text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-900"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        @keyframes loginGradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}
