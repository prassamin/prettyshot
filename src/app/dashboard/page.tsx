"use client";

import { useAppStore } from "@/stores/app-store";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Monitor, 
  Layout, 
  ImageIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Twitter } from "@/components/icons/twitter";

export default function DashboardOverview() {
  const { user } = useAppStore();
  const router = useRouter();

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
            onPress={() => router.push("/editor")}
            className="bg-linear-to-r from-orange-500 to-rose-500 text-white font-semibold px-6 shadow-lg shadow-rose-500/25 border border-white/20 flex-1 sm:flex-none transition-transform hover:scale-105"
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
              onClick={() => router.push("/editor")}
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
          <Button size="sm" className="text-zinc-500 font-medium hidden sm:flex">
            View all
          </Button>
        </div>
        
        <div className="relative flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200/80 bg-zinc-50/50 py-20 px-4 text-center overflow-hidden">
          {/* Subtle vibrant blurs */}
          <div className="absolute -top-32 -left-32 size-64 rounded-full bg-linear-to-br from-orange-200/30 via-rose-200/20 to-transparent blur-3xl" />
          <div className="absolute -bottom-32 -right-32 size-64 rounded-full bg-linear-to-tr from-violet-200/20 via-fuchsia-100/20 to-transparent blur-3xl" />
          
          <div className="relative z-10 flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-100 mb-5">
            <ImageIcon className="size-7 text-zinc-300" />
            <div className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-rose-400 shadow-md shadow-orange-500/30">
              <Plus className="size-4 text-white" />
            </div>
          </div>
          <h3 className="relative z-10 text-base font-semibold text-zinc-900">No mockups yet</h3>
          <p className="relative z-10 mt-2 text-sm text-zinc-500 font-medium max-w-sm">
            You haven&apos;t created any designs recently. Start from a template above or create a completely blank canvas.
          </p>
          <Button
            onPress={() => router.push("/editor")}
            variant="outline"
            className="relative z-10 mt-6 border-zinc-200 bg-white font-medium shadow-sm hover:bg-zinc-50 transition-colors"
          >
            Create your first design
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
