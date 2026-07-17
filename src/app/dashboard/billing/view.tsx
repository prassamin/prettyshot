"use client";
"use client";

import { useAppStore } from "@/stores/app-store";
import { Button, Chip } from "@heroui/react";
import { useRouter } from "@/hooks/use-router";
import { CreditCard, Crown, Loader2 } from "lucide-react";
import { useState } from "react";
import { generateInvoice, generateReceipt } from "./actions";
import { type Order } from "@polar-sh/sdk/models/components/order";
import { cn, isPro } from "@/lib/utils";

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
      console.error(url);
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

  return (
    <div className="max-w-5xl space-y-10">
      {/* Header */}
      <div className="border-b border-zinc-200/80 pb-5">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
          Billing & License
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Manage your lifetime license, view features, and download past
          receipts.
        </p>
      </div>

      {/* Section: Current Plan */}
      <div className="flex flex-col gap-5 pb-10 border-b border-zinc-200/80">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Current Plan
          </h2>
          <p className="mt-1 text-sm text-zinc-500 leading-relaxed max-w-xl">
            Your current license tier and its associated features.
          </p>
        </div>

        <div>
          <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
            {pro.type === "pro" ? (
              <>
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-orange-50 border border-orange-100">
                        <Crown className="size-6 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">
                          Lifetime Pro
                        </h3>
                        <p className="text-sm text-zinc-500 mt-0.5">
                          Licensed to {user.email}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold tracking-wide text-emerald-700 ring-1 ring-inset ring-emerald-600/20 uppercase self-start sm:self-auto">
                      Active
                    </span>
                  </div>

                  <p className="text-sm text-zinc-600 leading-relaxed mb-6 max-w-xl">
                    You have full access to all premium features forever. This
                    includes 4K high-res exports, advanced 3D perspective tilts,
                    custom watermarks, and Cloud Sync. No recurring charges or
                    subscriptions.
                  </p>
                </div>
              </>
            ) : pro.type === "trial" ? (
              <>
                <div className="p-6 sm:p-8 bg-linear-to-br from-orange-50/50 to-rose-50/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-orange-100 border border-orange-200">
                        <Crown className="size-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">
                          Pro Trial Active
                        </h3>
                        <p className="text-sm text-zinc-500 mt-0.5">
                          Trial ends on{" "}
                          {new Date(user.trial_ends_at!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-orange-700 ring-1 ring-inset ring-orange-600/20 uppercase self-start sm:self-auto">
                      Trialing
                    </span>
                  </div>

                  <p className="text-sm text-zinc-600 leading-relaxed mb-6 max-w-xl">
                    You currently have full temporary access to all premium
                    features. Secure your lifetime license now so you don&apos;t
                    lose access to Cloud Sync, 4K exports, and custom watermarks
                    when the trial expires.
                  </p>
                </div>
                <div className="bg-orange-50/80 border-t border-orange-100/50 px-6 py-4 sm:px-8 flex items-center justify-between">
                  <div className="text-sm text-orange-800">
                    Lifetime access for{" "}
                    <span className="font-semibold text-orange-950">$29</span>
                  </div>
                  <Button
                    onPress={() => router.push("/checkout", { external: true })}
                    className="bg-linear-to-r from-orange-500 to-rose-500 text-white font-medium shadow-md shadow-orange-500/20 rounded-xl px-6"
                  >
                    Upgrade to Lifetime Pro
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-100/80 border border-zinc-200/80">
                        <CreditCard className="size-6 text-zinc-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">
                          Free Plan
                        </h3>
                        <p className="text-sm text-zinc-500 mt-0.5">
                          Basic access for {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 leading-relaxed mb-6 max-w-xl">
                    You are currently using the free version. Upgrade to a
                    lifetime license to unlock 4K exports, advanced 3D
                    perspective tilts, Cloud Sync, and custom watermarks.
                  </p>
                </div>
                <div className="bg-zinc-50/50 border-t border-zinc-100 px-6 py-4 sm:px-8 flex items-center justify-between">
                  <div className="text-sm text-zinc-500">
                    Lifetime access for{" "}
                    <span className="font-semibold text-zinc-900">$29</span>
                  </div>
                  <Button
                    onPress={() => router.push("/checkout", { external: true })}
                    className="bg-zinc-900 text-white font-medium hover:bg-zinc-800 shadow-sm rounded-xl px-6"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Section: Invoice History (Pro Only) */}
      {pro.type === "pro" && (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">
              Invoice History
            </h2>
            <p className="mt-1 text-sm text-zinc-500 leading-relaxed max-w-xl">
              View and download your past invoices and receipts.
            </p>
          </div>
          <div>
            <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-zinc-200/80">
                <thead className="bg-zinc-50/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                    >
                      Amount
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                    >
                      Plan
                    </th>
                    <th scope="col" className="relative px-6 py-3.5">
                      <span className="sr-only">Download</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-zinc-200/80">
                  {orders.length > 0 ? (
                    orders.map((order) => {
                      const hasReceipt = !!order?.receiptNumber;
                      const hasInvoice = !!order?.isInvoiceGenerated;
                      const canDownload = hasReceipt || hasInvoice;
                      const isFreeOrder = !canDownload;

                      return (
                        <tr
                          key={order?.id}
                          className="hover:bg-zinc-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900">
                            {new Date(order?.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              {order?.discountAmount > 0 ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-zinc-900">
                                      ${(order.totalAmount / 100).toFixed(2)}
                                    </span>
                                    <span className="inline-flex items-center rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700">
                                      -
                                      {Math.round(
                                        (order.discountAmount /
                                          order.subtotalAmount) *
                                          100,
                                      )}
                                      %
                                    </span>
                                  </div>
                                  <span className="text-xs text-zinc-400 line-through mt-0.5">
                                    ${(order.subtotalAmount / 100).toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm font-medium text-zinc-900">
                                  ${(order?.totalAmount / 100).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">
                            Lifetime Pro
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {order?.paid ? (
                              <Chip
                                color={isFreeOrder ? "default" : "success"}
                                className={cn(
                                  isFreeOrder
                                    ? "cursor-not-allowed opacity-50"
                                    : "cursor-pointer",
                                )}
                                variant={"secondary"}
                                onClick={() => {
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
                              >
                                {downloadingId === order?.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : null}
                                <Chip.Label>Download</Chip.Label>
                              </Chip>
                            ) : (
                              <Chip color="danger">Unpaid</Chip>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-sm text-zinc-500"
                      >
                        No invoices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
