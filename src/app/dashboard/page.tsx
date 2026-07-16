"use client";

import { useEditorStore } from "@/stores/editor-store";

import { useAppStore } from "@/stores/app-store";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Plus, 
  Monitor, 
  Layout, 
  ImageIcon,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { Twitter } from "@/components/icons/twitter";

export default function DashboardOverview() {
  const { user } = useAppStore();
  const router = useRouter();
  const [designs, setDesigns] = useState<any[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(true);

  useEffect(() => {
    if (!user || user.is_pro !== true) {
      setLoadingDesigns(false);
      return;
    }
    const fetchDesigns = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("designs")
        .select("id, name, updated_at, config")
        .order("updated_at", { ascending: false })
        .limit(4);
      
      setDesigns(data || []);
      setLoadingDesigns(false);
    };
    fetchDesigns();
  }, [user]);

  if (!user) return null;
  const isPro = user.is_pro === true;
  const firstName = user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "there";

  const templates = [
    { 
      name: "Blank Canvas", 
      icon: Plus, 
      color: "text-orange-600", 
      bg: "bg-orange-100/50", 
      hoverBg: "hover:bg-orange-50/50",
      border: "hover:border-orange-200",
      shadow: "hover:shadow-orange-500/10",
      desc: "Start from scratch" 
    },
    { 
      name: "macOS Window", 
      icon: Monitor, 
      color: "text-violet-600", 
      bg: "bg-violet-100/50", 
      hoverBg: "hover:bg-violet-50/50",
      border: "hover:border-violet-200", 
      shadow: "hover:shadow-violet-500/10",
      desc: "Classic desktop feel" 
    },
    { 
      name: "Browser Frame", 
      icon: Layout, 
      color: "text-rose-600", 
      bg: "bg-rose-100/50", 
      hoverBg: "hover:bg-rose-50/50",
      border: "hover:border-rose-200", 
      shadow: "hover:shadow-rose-500/10",
      desc: "Safari & Chrome UI" 
    },
    { 
      name: "Social Post", 
      icon: Twitter, 
      color: "text-sky-600", 
      bg: "bg-sky-100/50", 
      hoverBg: "hover:bg-sky-50/50",
      border: "hover:border-sky-200", 
      shadow: "hover:shadow-sky-500/10",
      desc: "Optimized for feeds" 
    },
  ];

  return (
    <div className="space-y-10 pb-10">
      {/* Header Area */}
      <motion.div 
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Overview
          </h1>
          <p className="mt-2 text-zinc-500 font-medium">
            Welcome back, <span className="bg-linear-to-r from-orange-600 to-rose-600 bg-clip-text text-transparent font-bold">{firstName}</span>. Let's create something beautiful today.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isPro && (
            <Button
              onPress={() => router.push("/checkout")}
              className="bg-zinc-900 text-white font-medium flex-1 sm:flex-none shadow-md shadow-zinc-900/10"
            >
              Upgrade
            </Button>
          )}
          <Button
            onPress={() => {
              useEditorStore.getState().reset();
              router.push("/editor");
            }}
            className="bg-linear-to-r from-orange-500 to-rose-500 text-white font-semibold px-6 shadow-lg shadow-rose-500/25 border border-white/20 flex-1 sm:flex-none transition-transform hover:scale-105"
            startContent={<Plus className="size-4" />}
          >
            New Mockup
          </Button>
        </div>
      </motion.div>

      {/* Templates Grid */}
      <motion.section
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Start from template</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template) => (
            <button
              key={template.name}
              onClick={() => {
                const store = useEditorStore.getState();
                store.reset();
                
                // Configure template presets
                if (template.name === "macOS Window") {
                  store.setDeviceFrame("macos");
                  store.setPadding(64);
                } else if (template.name === "Browser Frame") {
                  store.setDeviceFrame("windows");
                  store.setPadding(64);
                } else if (template.name === "Social Post") {
                  store.setAspectRatio(1);
                  store.setPadding(48);
                  store.setDeviceFrame("none");
                }
                
                const newId = crypto.randomUUID();
                store.setDesignId(newId);
                router.push(`/editor?id=${newId}`);
              }}
              className={`group flex flex-col items-start gap-4 rounded-2xl border border-zinc-200/60 bg-white p-5 text-left transition-all duration-300 hover:shadow-xl ${template.border} ${template.shadow} ${template.hoverBg}`}
            >
              <div className={`rounded-xl p-3 ${template.bg} ${template.color} transition-transform duration-500 group-hover:scale-110`}>
                <template.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">{template.name}</h3>
                <p className="text-xs text-zinc-500 mt-1 font-medium">{template.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Recent Designs (Empty State) */}
      <motion.section
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Recent designs</h2>
          {isPro && designs.length > 0 && (
            <Button size="sm" variant="light" onPress={() => router.push("/dashboard/designs")} className="text-zinc-500 font-medium">
              View all
            </Button>
          )}
        </div>
        
        {!isPro ? (
          <div className="relative flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200/80 bg-zinc-50/50 py-20 px-4 text-center overflow-hidden">
            <div className="absolute -top-32 -left-32 size-64 rounded-full bg-linear-to-br from-orange-200/30 via-rose-200/20 to-transparent blur-3xl" />
            <div className="absolute -bottom-32 -right-32 size-64 rounded-full bg-linear-to-tr from-violet-200/20 via-fuchsia-100/20 to-transparent blur-3xl" />
            <div className="relative z-10 flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-100 mb-5">
              <Monitor className="size-7 text-orange-400" />
            </div>
            <h3 className="relative z-10 text-base font-semibold text-zinc-900">Cloud Sync is a Pro feature</h3>
            <p className="relative z-10 mt-2 text-sm text-zinc-500 font-medium max-w-sm">
              Upgrade to Pro to automatically save all your mockups to the cloud and access them seamlessly from any device.
            </p>
            <Button
              onPress={() => router.push("/checkout")}
              className="relative z-10 mt-6 bg-zinc-900 text-white font-medium shadow-md shadow-zinc-900/10 transition-transform hover:scale-105"
            >
              Upgrade to Pro
            </Button>
          </div>
        ) : loadingDesigns ? (
          <div className="flex items-center justify-center py-20">
            <div className="size-6 animate-spin rounded-full border-2 border-zinc-200 border-t-orange-500" />
          </div>
        ) : designs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {designs.map((d) => {
              const thumbnail = d.config?.image;
              return (
                <div
                  key={d.id}
                  onClick={() => router.push(`/editor?id=${d.id}`)}
                  className="group relative flex flex-col rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/60 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 hover:ring-orange-200"
                >
                  <div className="aspect-[16/10] w-full relative overflow-hidden bg-zinc-50 border-b border-zinc-100/50">
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
                      <h3 className="font-semibold text-sm text-zinc-900 truncate group-hover:text-orange-600 transition-colors">{d.name || "Untitled Design"}</h3>
                      <p className="text-xs text-zinc-500 font-medium mt-0.5">
                        {new Date(d.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
          <div className="relative flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200/80 bg-zinc-50/50 py-20 px-4 text-center overflow-hidden">
          {/* Subtle vibrant blurs */}
          <div className="absolute -top-32 -left-32 size-64 rounded-full bg-linear-to-br from-orange-200/30 via-rose-200/20 to-transparent blur-3xl" />
          <div className="absolute -bottom-32 -right-32 size-64 rounded-full bg-linear-to-tr from-violet-200/20 via-fuchsia-100/20 to-transparent blur-3xl" />
          
          <div className="relative z-10 flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-100 mb-5">
            <ImageIcon className="size-7 text-zinc-300" />
            <div className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-rose-400 shadow-md shadow-orange-500/30">
              <Plus className="size-4" />
            </div>
          </div>
          <h3 className="relative z-10 text-base font-semibold text-zinc-900">No mockups yet</h3>
          <p className="relative z-10 mt-2 text-sm text-zinc-500 font-medium max-w-sm">
            You haven&apos;t created any designs recently. Start from a template above or create a completely blank canvas.
          </p>
          <Button
            onPress={() => {
              useEditorStore.getState().reset();
              router.push("/editor");
            }}
            variant="bordered"
            className="relative z-10 mt-6 border-zinc-200 bg-white font-medium shadow-sm hover:bg-zinc-50 transition-colors"
          >
            Create your first design
          </Button>
        </div>
        )}
      </motion.section>
    </div>
  );
}
