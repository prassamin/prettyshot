"use client";

import { useAppStore } from "@/stores/app-store";
import { Button } from "@heroui/react";
import { useRouter } from "@/hooks/use-router";
import {
  CreditCard,
  Crown,
  Timer,
  Loader2,
  Download,
  Receipt,
  Check,
  ArrowRight,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { generateInvoice, generateReceipt } from "./actions";
import { type Order } from "@polar-sh/sdk/models/components/order";
import { cn, isPro } from "@/lib/utils";

/* ─── Motion presets ──────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const PRO_FEATURES = [
  "4K & 8K exports",
  "Premium device frames",
  "Animation + video export",
  "Cloud sync",
  "Watermark removal",
];

const FREE_FEATURES = [
  "1080p PNG exports",
  "Basic frames & backgrounds",
  "Annotations & text",
  "Local autosave",
];

export function BillingPageView({ orders }: { orders: Array<Order> }) {
  const { user } = useAppStore();
  const router = useRouter();
  const pro = isPro(user);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleReceiptOrInvoiceDownload = async (
    id: string,
    type: "receipt" | "invoice",
  ) => {
    const fn = type === "receipt" ? generateReceipt : generateInvoice;
    try {
      setDownloadingId(id);
      const url = await fn(id);
      if (url) {
        window.open(url, "_blank");
      } else {
        console.error("Could not fetch receipt URL.");
      }
    } catch (error) {
      console.error("Failed to download receipt:", error);
    } finally {
      setDownloadingId(null);
    }
  };

  if (!user) return null;

  const isLifetime = pro.type === "pro";
  const isTrialing = pro.type === "trial";
  const paidOrders = orders.filter((o) => o.paid);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="relative pb-16"
    >
      {/* ─── Header ───────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="relative mb-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-[-5%] size-72 rounded-full bg-primary/8 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-[-5%] size-64 rounded-full bg-danger/8 blur-[90px]"
        />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface/60 px-3 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
            <ShieldCheck className="size-3 text-success" />
            License & payments
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Billing & License
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Manage your lifetime license, review what&apos;s included, and
            download receipts &amp; invoices.
          </p>
        </div>
      </motion.div>

      {/* ─── Current plan card ────────────────────────────────── */}
      <motion.section variants={fadeUp} className="mb-10">
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm">
          {/* Ambient tint by state */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -right-20 -top-24 size-72 rounded-full blur-[90px]",
              isLifetime
                ? "bg-success/8"
                : isTrialing
                  ? "bg-warning/10"
                  : "bg-primary/8",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute -bottom-24 -left-20 size-72 rounded-full blur-[90px]",
              isLifetime
                ? "bg-primary/6"
                : isTrialing
                  ? "bg-danger/6"
                  : "bg-danger/6",
            )}
          />

          <div className="relative p-6 sm:p-8">
            {/* Plan header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-xl border shadow-sm",
                    isLifetime
                      ? "border-success/25 bg-success/10 text-success"
                      : isTrialing
                        ? "border-warning/25 bg-warning/10 text-warning"
                        : "border-border/80 bg-surface-muted/80 text-muted-foreground",
                  )}
                >
                  {isLifetime ? (
                    <Crown className="size-6" />
                  ) : isTrialing ? (
                    <Timer className="size-6" />
                  ) : (
                    <CreditCard className="size-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {isLifetime
                      ? "Lifetime Pro"
                      : isTrialing
                        ? "Pro Trial Active"
                        : "Free Plan"}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {isTrialing && user.trial_ends_at
                      ? `Trial ends ${new Date(user.trial_ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
                      : `Licensed to ${user.email}`}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset",
                  isLifetime
                    ? "bg-success/10 text-success ring-success/25"
                    : isTrialing
                      ? "bg-warning/10 text-warning ring-warning/25"
                      : "bg-surface-muted text-muted-foreground ring-border/60",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isLifetime
                      ? "bg-success"
                      : isTrialing
                        ? "bg-warning"
                        : "bg-muted-foreground/50",
                  )}
                />
                {isLifetime ? "Active" : isTrialing ? "Trialing" : "Free"}
              </span>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {isLifetime
                ? "You have full access to every premium feature — forever. One payment, no recurring charges, no subscription to cancel."
                : isTrialing
                  ? "You currently have full temporary access to every premium feature. Lock in your lifetime license now so you don’t lose access when the trial ends."
                  : "You’re on the free plan — everything you need to make great mockups. Upgrade once to unlock the full studio forever."}
            </p>

            {/* Feature chips */}
            <div className="mt-6 flex flex-wrap gap-2">
              {(isLifetime || isTrialing ? PRO_FEATURES : FREE_FEATURES).map(
                (feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground/80"
                  >
                    <Check className="size-3 text-success" />
                    {feature}
                  </span>
                ),
              )}
            </div>

            {/* Upgrade / manage CTA */}
            {!isLifetime && (
              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-surface-muted/30 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">
                    Lifetime access for{" "}
                    <span className="font-bold text-foreground">$29</span>{" "}
                    <span className="text-muted-foreground/60">
                      — pay once, yours forever
                    </span>
                  </p>
                </div>
                <Button
                  onPress={() => router.push("/checkout", { external: true })}
                  className="group/cta h-9 cursor-pointer rounded-xl bg-linear-to-r from-primary to-danger px-4 text-xs font-bold text-foreground shadow-md shadow-danger-soft-hover transition-all hover:shadow-lg hover:shadow-danger/30 active:scale-[0.98]"
                >
                  Upgrade to Lifetime Pro
                  <ArrowRight className="ml-1.5 size-3.5 transition-transform duration-200 group-hover/cta:translate-x-0.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ─── Invoice history (Pro only) ───────────────────────── */}
      {isLifetime && (
        <motion.section variants={fadeUp}>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Receipt className="size-3.5" />
            </span>
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              Invoice history
            </h2>
            <span className="rounded-full border border-border/70 bg-surface-muted/60 px-2 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
              {paidOrders.length}
            </span>
          </div>

          {paidOrders.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm">
              {/* Header row (desktop) */}
              <div className="hidden grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border/60 bg-surface-muted/30 px-5 py-2.5 sm:grid">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70">
                  Date
                </span>
                <span className="w-24 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70">
                  Amount
                </span>
                <span className="w-28 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70">
                  Receipt
                </span>
              </div>

              <div className="divide-y divide-border/50">
                {paidOrders.map((order, i) => {
                  const hasReceipt = !!order?.receiptNumber;
                  const hasInvoice = !!order?.isInvoiceGenerated;
                  const canDownload = hasReceipt || hasInvoice;
                  const isFreeOrder = !canDownload;
                  const discountPct =
                    order.discountAmount > 0 && order.subtotalAmount > 0
                      ? Math.round(
                          (order.discountAmount / order.subtotalAmount) * 100,
                        )
                      : 0;

                  return (
                    <motion.div
                      key={order?.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.04 * i }}
                      className="group grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted/20 sm:grid-cols-[1fr_auto_auto] sm:gap-4"
                    >
                      {/* Date */}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          {new Date(order?.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Lifetime Pro license
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="w-auto text-right sm:w-24">
                        {discountPct > 0 ? (
                          <>
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-xs font-bold text-foreground">
                                ${(order.totalAmount / 100).toFixed(2)}
                              </span>
                              <span className="rounded bg-success-soft px-1 py-px text-[9px] font-bold text-success">
                                -{discountPct}%
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 line-through">
                              ${(order.subtotalAmount / 100).toFixed(2)}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs font-bold text-foreground">
                            ${(order?.totalAmount / 100).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Download action */}
                      <div className="flex w-auto items-center justify-end sm:w-28">
                        {order?.paid ? (
                          <Button
                            size="sm"
                            isDisabled={!canDownload}
                            onPress={() => {
                              if (hasReceipt) {
                                handleReceiptOrInvoiceDownload(
                                  order?.id,
                                  "receipt",
                                );
                              } else if (hasInvoice) {
                                handleReceiptOrInvoiceDownload(
                                  order?.id,
                                  "invoice",
                                );
                              }
                            }}
                            className={cn(
                              "h-7 cursor-pointer rounded-lg px-2.5 text-[11px] font-semibold",
                              isFreeOrder
                                ? "cursor-not-allowed opacity-40"
                                : "bg-surface-tertiary text-foreground transition-colors hover:bg-primary/15 hover:text-primary",
                            )}
                          >
                            {downloadingId === order?.id ? (
                              <Loader2 className="mr-1 size-3 animate-spin" />
                            ) : (
                              <Download className="mr-1 size-3" />
                            )}
                            {hasInvoice ? "Invoice" : "Receipt"}
                          </Button>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-danger ring-1 ring-inset ring-danger/25">
                            Unpaid
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* No invoices */
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/80 bg-surface/40 px-6 py-14 text-center">
              <div
                aria-hidden
                className="absolute -left-16 -top-20 size-48 rounded-full bg-primary/8 blur-3xl"
              />
              <div className="relative flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-surface text-muted-foreground shadow-lg">
                <FileText className="size-5" />
              </div>
              <h3 className="relative mt-3 text-sm font-bold text-foreground">
                No invoices yet
              </h3>
              <p className="relative mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Your receipts and invoices will appear here after your first
                purchase.
              </p>
            </div>
          )}
        </motion.section>
      )}
    </motion.div>
  );
}
