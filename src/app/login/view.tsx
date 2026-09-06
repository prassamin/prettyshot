"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { createOAuth } from "@/lib/supabase/auth";
import { Heart, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useAppStore } from "@/stores/app-store";
import { APP_NAME, DEVELOPED_BY, DEVELOPED_BY_URL } from "@/config";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function LoginPageView() {
  const [isLoading, setIsLoading] = useState(false);
  const { url } = useAppStore();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await createOAuth("google", {
        redirectTo: `${window.location.origin}/auth/callback/${url.search}`,
      });
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 size-150 rounded-full bg-primary/6 blur-[160px]" />
        <div className="absolute right-[-10%] bottom-[-20%] size-175 rounded-full bg-primary/4 blur-[170px]" />
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "radial-gradient(var(--border) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            maskImage:
              "radial-gradient(ellipse 60% 50% at 50% 40%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(ellipse 60% 50% at 50% 40%, black, transparent)",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-16 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="w-full max-w-4xl"
        >
          {/* Glass window */}
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-surface/40 shadow-2xl shadow-black/50 backdrop-blur-2xl">
            {/* top hairline */}
            <div
              aria-hidden
              className="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-foreground/10 to-transparent"
            />

            <div className="grid md:grid-cols-2">
              {/* ── Left: brand panel ── */}
              <div className="relative flex flex-col justify-between overflow-hidden border-border/60 p-8 md:border-r md:p-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-24 -left-24 size-64 rounded-full bg-primary/10 blur-[90px]"
                />

                <Link
                  href="/"
                  className="relative inline-flex w-fit items-center gap-2.5 transition-opacity hover:opacity-80"
                >
                  <span className="grid size-9 place-items-center rounded-xl border border-border/70 bg-surface-muted/70">
                    <Image
                      src="/prettyshot.svg"
                      alt=""
                      width={22}
                      height={18}
                    />
                  </span>
                  <span className="font-display text-lg font-medium tracking-tight text-foreground">
                    {APP_NAME}
                  </span>
                </Link>

                <div className="relative mt-14">
                  <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.08] tracking-[-0.03em] text-foreground">
                    Every screenshot{" "}
                    <span className="relative inline-block whitespace-nowrap px-[0.18em]">
                      <span
                        aria-hidden
                        className="absolute inset-x-0 top-[12%] bottom-[6%] rounded-[0.2em] bg-primary/20"
                      />
                      <span className="relative text-primary">
                        deserves to be
                      </span>
                    </span>{" "}
                    remembered.
                  </h1>
                  <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                    Sign in to save your designs, sync across devices, and keep
                    your work with you anywhere.
                  </p>

                  <ul className="mt-8 space-y-3">
                    {[
                      "Cloud sync for all your designs",
                      "Lifetime Pro license management",
                      "Your work stays private, always",
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2.5 text-[13.5px] text-muted-foreground"
                      >
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/12 text-primary">
                          <ShieldCheck className="size-3" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* ── Right: auth panel ── */}
              <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14">
                <div className="mx-auto w-full max-w-sm flex flex-col justify-around h-full">
                  <div>
                    <span className="font-display text-sm font-medium tracking-tight">
                      <span className="relative inline-block whitespace-nowrap px-[0.35em] py-[0.18em]">
                        <span
                          aria-hidden
                          className="absolute inset-0 rounded-[0.3em] bg-primary/20"
                        />
                        <span className="relative text-primary">
                          Welcome back
                        </span>
                      </span>
                    </span>

                    <h2 className="font-display mt-5 text-3xl font-medium tracking-[-0.03em] text-foreground">
                      Sign in to {APP_NAME}
                    </h2>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                      Use your Google account to continue. No passwords to
                      remember.
                    </p>
                  </div>

                  <div>
                    <Button
                      size="lg"
                      className="group relative mt-8 h-13 w-full overflow-hidden rounded-xl border border-border/70 bg-surface-muted/50 font-semibold text-foreground shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-muted active:scale-[0.98]"
                      onPress={handleGoogleLogin}
                      isDisabled={isLoading}
                    >
                      {/* sheen on hover */}
                      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-foreground/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                      {isLoading ? (
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                      ) : (
                        <span className="relative flex items-center justify-center gap-3">
                          <svg className="size-5" viewBox="0 0 24 24">
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
                          Continue with Google
                        </span>
                      )}
                    </Button>

                    <p className="mt-8 text-center text-[11px] leading-relaxed text-muted-foreground/70">
                      By continuing, you agree to our{" "}
                      <Link
                        href="/terms"
                        className="text-foreground/80 underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-foreground/80 underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground/60 inline-flex items-center gap-1.5 justify-center w-full">
            Made with
            <Heart className="size-3 text-danger" fill="currentColor" />
            by
            <a
              href={DEVELOPED_BY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              {DEVELOPED_BY}
            </a>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
