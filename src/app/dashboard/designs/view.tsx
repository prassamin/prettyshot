"use client";

import { useAppStore } from "@/stores/app-store";
import { Button } from "@heroui/react";
import { useRouter } from "@/hooks/use-router";
import { ImageIcon, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useEditorStore } from "@/stores/editor-store";
import { isPro } from "@/lib/utils";

interface AllDesignsPageProps {
  designs: {
    id: string;
    name: string;
    updated_at: string;
    config: Record<string, any>;
  }[];
}

export default function AllDesignsPageView({ designs }: AllDesignsPageProps) {
  const { user } = useAppStore();
  const router = useRouter();
  const pro = isPro(user);

  if (!user) return null;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-row sm:items-center justify-between gap-6 mb-8">
          <h1 className="text-2xl font-bold text-zinc-900">My Designs</h1>
          <Button
            onPress={() => {
              useEditorStore.getState().reset();
              router.push("/editor");
            }}
            className="bg-linear-to-r from-orange-500 to-rose-500 text-white font-semibold px-6 shadow-lg shadow-rose-500/25 border border-white/20 transition-transform hover:scale-105"
          >
            New Mockup
          </Button>
        </div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {!pro.isActive ? (
            <div className="relative flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200/80 bg-zinc-50/50 py-24 px-4 text-center overflow-hidden">
              <div className="absolute -top-32 -left-32 size-64 rounded-full bg-linear-to-br from-orange-200/30 via-rose-200/20 to-transparent blur-3xl" />
              <div className="absolute -bottom-32 -right-32 size-64 rounded-full bg-linear-to-tr from-violet-200/20 via-fuchsia-100/20 to-transparent blur-3xl" />
              <div className="relative z-10 flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-100 mb-5">
                <ImageIcon className="size-7 text-orange-400" />
              </div>
              <h3 className="relative z-10 text-lg font-semibold text-zinc-900">
                Cloud Sync is a Pro feature
              </h3>
              <p className="relative z-10 mt-2 text-sm text-zinc-500 font-medium max-w-sm">
                Upgrade to Pro to automatically save all your mockups to the
                cloud and access them seamlessly from any device.
              </p>
              <Button
                onPress={() => router.push("/checkout", { external: true })}
                className="relative z-10 mt-6 bg-zinc-900 text-white font-medium shadow-md shadow-zinc-900/10 transition-transform hover:scale-105"
              >
                Upgrade to Pro
              </Button>
            </div>
          ) : designs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {designs.map((d) => {
                const thumbnail = d.config?.image;
                return (
                  <div
                    key={d.id}
                    onClick={() => router.push(`/editor?id=${d.id}`)}
                    className="group relative flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 hover:ring-orange-200"
                  >
                    <div className="aspect-16/10 w-full relative overflow-hidden bg-zinc-50 border-b border-zinc-100/50">
                      {thumbnail && thumbnail.startsWith("http") ? (
                        <>
                          <div
                            className="absolute inset-0 bg-cover bg-center blur-2xl opacity-40 transform scale-125 transition-transform duration-700 group-hover:scale-150"
                            style={{ backgroundImage: `url(${thumbnail})` }}
                          />
                          <img
                            src={thumbnail}
                            alt={d.name}
                            className="relative z-10 w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105 drop-shadow-md"
                          />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-linear-to-br from-orange-100/80 via-rose-50 to-violet-100/80 flex items-center justify-center transition-transform duration-700 group-hover:scale-105">
                          <ImageIcon className="size-8 text-orange-300/80" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-linear-to-t from-zinc-900/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20" />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white relative z-20">
                      <div className="flex flex-col min-w-0 pr-4">
                        <h3 className="font-semibold text-sm text-zinc-900 truncate group-hover:text-orange-600 transition-colors">
                          {d.name || "Untitled Design"}
                        </h3>
                        <p className="text-xs text-zinc-500 font-medium mt-0.5">
                          {new Date(d.updated_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0 flex items-center justify-center size-8 rounded-full bg-orange-50 text-orange-600 transform translate-x-2 group-hover:translate-x-0">
                        <ChevronRight className="size-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200/80 bg-zinc-50/50 py-24 px-4 text-center overflow-hidden">
              <div className="absolute -top-32 -left-32 size-64 rounded-full bg-linear-to-br from-orange-200/30 via-rose-200/20 to-transparent blur-3xl" />
              <div className="absolute -bottom-32 -right-32 size-64 rounded-full bg-linear-to-tr from-violet-200/20 via-fuchsia-100/20 to-transparent blur-3xl" />

              <div className="relative z-10 flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-100 mb-5">
                <ImageIcon className="size-7 text-zinc-300" />
              </div>
              <h3 className="relative z-10 text-lg font-semibold text-zinc-900">
                It&apos;s pretty empty here
              </h3>
              <p className="relative z-10 mt-2 text-sm text-zinc-500 font-medium max-w-sm">
                You haven&apos;t created any designs yet. Click the button above
                to get started!
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
