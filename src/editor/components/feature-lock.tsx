"use client";

import * as React from "react";
import { Lock, Crown } from "lucide-react";
import { useRouter } from "@/hooks/use-router";
import { cn } from "@/lib/utils";
import { useFeatureGate } from "@/hooks/use-feature-gate";
import { FEATURE_DESCRIPTIONS, type FeatureId } from "@/config/features";
import { Tooltip } from "@/components/tooltip";
import { useAppStore } from "@/stores/app-store";

/**
 * Unified gate UI size scale. Every gate component accepts `size` and adapts:
 *  - "xs"  → tiny lock glyph (inline text, list rows)
 *  - "sm"  → small PRO badge (asset tiles, thumbnails, compact controls)
 *  - "md"  → standard badge / small pill (default — panels, buttons)
 *  - "lg"  → large upgrade CTA (empty-state overlays, big locked sections)
 */
export type GateSize = "xs" | "sm" | "md" | "lg";

const iconSize: Record<GateSize, string> = {
  xs: "size-2.5",
  sm: "size-3",
  md: "size-3.5",
  lg: "size-4",
};

const badgeClass: Record<GateSize, string> = {
  xs: "px-1 py-px text-[7px] gap-0.5",
  sm: "px-1.5 py-0.5 text-[8px] gap-1",
  md: "px-2 py-0.5 text-[9px] gap-1",
  lg: "px-3 py-1 text-[11px] gap-1.5",
};

const pillClass: Record<GateSize, string> = {
  xs: "px-1 py-0.5 text-[8px] gap-0.5",
  sm: "px-1.5 py-0.5 text-[9px] gap-1",
  md: "px-2.5 py-1 text-[10px] gap-1.5",
  lg: "px-4 py-2 text-xs gap-2",
};

/**
 * "PRO" badge — the tier marker. Renders a crown + label at any size.
 * Use on tiles, thumbnails, rows and controls to mark paid content.
 */
export function ProBadge({
  className,
  size = "md",
  label = "Pro",
}: {
  className?: string;
  size?: GateSize;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-linear-to-r from-primary to-danger font-bold uppercase tracking-wide text-foreground shadow-sm",
        badgeClass[size],
        className,
      )}
    >
      <Crown className={iconSize[size]} />
      {label}
    </span>
  );
}

/**
 * Locked-state marker — a lock glyph, optionally with text.
 * Use inside a locked tile/row to show "this is locked" without an overlay.
 */
export function LockBadge({
  className,
  size = "sm",
  label,
  icon,
  onUpgrade,
}: {
  className?: string;
  size?: GateSize;
  icon?: boolean;
  /** Optional text next to the lock (e.g. "Pro" / "Locked"). */
  label?: string;
  /** When provided, the badge becomes a clickable upgrade trigger. */
  onUpgrade?: () => void;
}) {
  const content = (
    <>
      {icon && <Lock className={iconSize[size]} />}
      {label ? <span>{label}</span> : null}
    </>
  );
  const cls = cn(
    "inline-flex shrink-0 items-center rounded-full font-bold uppercase tracking-wide",
    badgeClass[size],
    onUpgrade
      ? "cursor-pointer bg-linear-to-r from-primary to-danger text-foreground shadow-sm transition-transform hover:scale-105 active:scale-95"
      : "bg-overlay/80 text-foreground",
    className,
  );
  return onUpgrade ? (
    <button type="button" onClick={onUpgrade} className={cls}>
      {content}
    </button>
  ) : (
    <span className={cls}>{content}</span>
  );
}

/**
 * Upgrade CTA pill — the clickable "Upgrade to Pro" trigger.
 * Use as the overlay CTA on locked panels, or standalone.
 */
export function UpgradePill({
  className,
  size = "md",
  icon,
  label = "Upgrade to Pro",
}: {
  className?: string;
  size?: GateSize;
  icon?: boolean;
  label?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/checkout", { external: true })}
      className={cn(
        "inline-flex cursor-pointer items-center rounded-full bg-linear-to-r from-primary to-danger font-bold text-foreground shadow-lg transition-transform hover:scale-105 active:scale-95",
        pillClass[size],
        className,
      )}
    >
      {icon && <Lock className={iconSize[size]} />}
      {label}
    </button>
  );
}

/**
 * Wraps any feature UI with an automatic gate:
 *  - unlocked → renders children as-is
 *  - locked   → renders children blurred + disabled-looking, with a lock
 *    overlay + upgrade CTA on top (sized by `size`).
 *
 * Use it to lock whole panels / cards / controls in one line.
 */
export function FeatureLock({
  featureId,
  children,
  className,
  isLocked,
  icon = true,
  blur = true,
  blurSize = 1,
  size = "md",
  overlay = "pill",
}: {
  /** The feature this UI belongs to. */
  featureId?: FeatureId;
  /** Whether the feature is locked. */
  isLocked?: boolean;
  children: React.ReactNode;
  className?: string;
  icon?: boolean;
  /** Blur the locked content (default true). */
  blur?: boolean;
  /** Blur strength (default 3px). */
  blurSize?: number;
  /** Size of the lock UI shown when locked. */
  size?: GateSize;
  /** Locked overlay style: "pill" (CTA button) or "badge" (PRO marker). */
  overlay?: "pill" | "badge";
}) {
  // Hooks must run unconditionally (Rules of Hooks).
  const { isLocked: isLockedFn } = useFeatureGate();
  const router = useRouter();
  const { user } = useAppStore();
  const gatedRef = React.useRef<HTMLDivElement | null>(null);

  // No gate configured → render children as-is.
  if (!featureId && isLocked === undefined) return <>{children}</>;

  const locked = isLocked ?? isLockedFn(featureId as FeatureId);

  // Block every interaction aimed at the locked subtree, from the parent —
  // children need zero changes. Two layers:
  //   1. native capture listeners on the gated wrapper (beat React delegation)
  //   2. a document-level capture guard so relocated children stay blocked
  //      (checks the `data-gated` ancestry marker)
  //
  // On an "intent" event (click / pointer-down / key press) the user is also
  // sent to the upgrade flow once — anonymous users to login, free users to
  // checkout. The redirect fires once per locked instance so spam-clicking
  // the area doesn't bounce the tab repeatedly.
  const redirectedRef = React.useRef(false);
  const blockerRef = React.useRef<(e: Event) => void>(() => {});
  blockerRef.current = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (redirectedRef.current) return;
    const intent =
      e.type === "click" ||
      e.type === "pointerdown" ||
      e.type === "mousedown" ||
      e.type === "keydown";
    if (!intent) return;

    redirectedRef.current = true;
    if (user) {
      router.push("/checkout", { external: true });
    } else {
      router.push("/login", { auth: true, next: "/checkout" });
    }
  };

  React.useEffect(() => {
    if (!locked) return;
    const el = gatedRef.current;
    const block = blockerRef.current;
    const events = [
      "click",
      "pointerdown",
      "mousedown",
      "keydown",
      "contextmenu",
      "dblclick",
      "dragstart",
      "submit",
      "focusin",
    ] as const;
    const onDoc = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-gated]")) block(e);
    };
    events.forEach((type) => el?.addEventListener(type, block, true));
    events.forEach((type) => document.addEventListener(type, onDoc, true));
    return () => {
      events.forEach((type) => el?.removeEventListener(type, block, true));
      events.forEach((type) => document.removeEventListener(type, onDoc, true));
    };
  }, [locked]);

  if (!locked) return <>{children}</>;

  const goUpgrade = () => router.push("/checkout", { external: true });
  const description =
    featureId != null ? (FEATURE_DESCRIPTIONS[featureId] ?? null) : null;

  const lockEl =
    overlay === "pill" ? (
      <UpgradePill icon={icon} size={size} />
    ) : (
      <LockBadge icon={icon} size={size} label="Pro" onUpgrade={goUpgrade} />
    );

  return (
    <div
      onClick={goUpgrade}
      className={cn("relative w-full h-full cursor-pointer", className)}
    >
      <div
        ref={gatedRef}
        aria-hidden
        data-gated=""
        style={{
          filter: `blur(${!blur ? 0 : blurSize}px) saturate(${blur ? 50 : 0}%)`,
        }}
        className={cn("pointer-events-none select-none", blur && `opacity-55`)}
      >
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        {description ? (
          <Tooltip content={description} noDelay placement="top">
            {lockEl}
          </Tooltip>
        ) : (
          lockEl
        )}
      </div>
    </div>
  );
}
