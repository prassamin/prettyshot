"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  Check,
  Copy,
  Download,
  ImagePlus,
} from "lucide-react";
import { Button } from "@heroui/react";
import { useEditorStore } from "@/stores/editor-store";
import { captureElement, downloadImage, copyToClipboard } from "@/lib/export";
import { AspectRatioDropdown } from "./aspect-ratio-dropdown";

export function EditorTopbar() {
  const {
    imageName,
    image,
    clearImage,
    exportFormat,
    exportScale,
    setExportFormat,
    setExportScale,
  } = useEditorStore();

  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [outputInfo, setOutputInfo] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* estimate output dimensions & file size */
  useEffect(() => {
    if (!open) return;
    const el = document.getElementById("capture-area");
    if (!el) return;

    const w = Math.round(el.offsetWidth * exportScale);
    const h = Math.round(el.offsetHeight * exportScale);
    setOutputInfo({ width: w, height: h });
  }, [open, exportFormat, exportScale]);

  const handleDownload = useCallback(async () => {
    const el = document.getElementById("capture-area");
    if (!el) return;
    setExporting(true);
    try {
      const { exportFormat, exportScale, imageName } =
        useEditorStore.getState();
      const dataUrl = await captureElement(el, {
        format: exportFormat,
        scale: exportScale,
      });
      downloadImage(dataUrl, imageName, exportFormat);
    } finally {
      setExporting(false);
      setOpen(false);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    const el = document.getElementById("capture-area");
    if (!el) return;
    try {
      const { exportScale } = useEditorStore.getState();
      const dataUrl = await captureElement(el, {
        format: "png",
        scale: exportScale,
      });
      await copyToClipboard(dataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may not be available
    }
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-30 flex items-center justify-between border-b border-zinc-200/60 bg-white/70 px-4 py-3 backdrop-blur-xl sm:px-6"
    >
      {/* Left — Back to home */}
      <Link
        href="/"
        className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-100/80"
      >
        <ArrowLeft className="size-4 text-zinc-400 transition-all duration-300 group-hover:-translate-x-0.5 group-hover:text-zinc-700" />
      </Link>

      {/* Center — aspect ratio & filename */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        <span className="hidden text-sm font-medium text-zinc-400 sm:block">
          {imageName || "Untitled"}
        </span>
        <div className="hidden h-4 w-px bg-zinc-200 sm:block" />
        <AspectRatioDropdown />
      </div>

      {/* Right — actions */}
      {image && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <Button
            variant="ghost"
            size="sm"
            onPress={clearImage}
            className="font-semibold text-zinc-500"
          >
            <ImagePlus className="size-4" />
            <span className="hidden sm:inline">New</span>
          </Button>

          {/* Export button + dropdown */}
          <div ref={dropdownRef} className="relative">
            <div className="group relative">
              <div className="absolute -inset-1.5 rounded-2xl bg-linear-to-r from-orange-400 via-rose-400 to-violet-500 opacity-0 blur-lg transition-all duration-500 group-hover:opacity-50" />
              <Button
                variant="primary"
                size="sm"
                onPress={() => setOpen((v) => !v)}
                className="relative overflow-hidden bg-linear-to-r from-orange-500 via-rose-500 to-violet-500 font-semibold text-white shadow-lg shadow-rose-500/20"
              >
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Download className="relative z-10 size-4" />
                <span className="relative z-10">Export</span>
                <ChevronDown
                  className={`relative z-10 size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </Button>
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl shadow-zinc-900/15"
                >
                  {/* Format */}
                  <div className="mb-3">
                    <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                      Format
                    </span>
                    <div className="mt-1.5 flex gap-1.5">
                      {(["png", "jpg"] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setExportFormat(fmt)}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-bold uppercase transition-all ${
                            exportFormat === fmt
                              ? "bg-linear-to-r from-orange-500 to-rose-500 text-white shadow-sm"
                              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scale */}
                  <div className="mb-4">
                    <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                      Scale
                    </span>
                    <div className="mt-1.5 flex gap-1.5">
                      {([1, 2, 3] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setExportScale(s)}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all ${
                            exportScale === s
                              ? "bg-linear-to-r from-orange-500 to-rose-500 text-white shadow-sm"
                              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                          }`}
                        >
                          {s}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Output dimensions */}
                  {outputInfo && (
                    <div className="mb-3 flex items-center justify-center rounded-xl bg-zinc-50 px-3 py-2">
                      <div className="text-center">
                        <div className="text-[10px] font-medium text-zinc-400">
                          Output
                        </div>
                        <div className="text-xs font-bold text-zinc-600">
                          {outputInfo.width} × {outputInfo.height}px
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  <div className="mb-3 h-px bg-linear-to-r from-transparent via-zinc-200 to-transparent" />

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={handleDownload}
                      disabled={exporting}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                    >
                      <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-orange-400 to-rose-400 text-white shadow-sm">
                        <Download className="size-4" />
                      </div>
                      <div className="text-left">
                        <div>{exporting ? "Exporting..." : "Download"}</div>
                        <div className="text-[10px] font-medium text-zinc-400">
                          Save as {exportFormat.toUpperCase()} at {exportScale}x
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-400 to-indigo-500 text-white shadow-sm">
                        {copied ? (
                          <Check className="size-4" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </div>
                      <div className="text-left">
                        <div>{copied ? "Copied!" : "Copy to Clipboard"}</div>
                        <div className="text-[10px] font-medium text-zinc-400">
                          PNG at {exportScale}x scale
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
