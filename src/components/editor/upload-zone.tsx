"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, Clipboard, Upload } from "lucide-react";
import { Button } from "@heroui/react";
import { useEditorStore } from "@/stores/editor-store";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function UploadZone() {
  const setImage = useEditorStore((s) => s.setImage);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImage(reader.result, file.name);
        }
      };
      reader.readAsDataURL(file);
    },
    [setImage],
  );

  /* ─── drag & drop ─── */

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  /* ─── clipboard paste ─── */

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === "file" && ACCEPTED_TYPES.includes(item.type)) {
          const file = item.getAsFile();
          if (file) processFile(file);
          break;
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [processFile]);

  /* ─── file picker ─── */

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-lg px-4"
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative"
      >
        {/* Animated dashed border */}
        <div
          className={`absolute -inset-px rounded-3xl transition-all duration-500 ${
            dragging
              ? "bg-linear-to-br from-orange-400 via-rose-400 to-violet-500 opacity-100"
              : "bg-linear-to-br from-zinc-300/50 via-zinc-200/30 to-zinc-300/50 opacity-100"
          }`}
          style={{
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "xor",
            WebkitMaskComposite: "xor",
            padding: "2px",
          }}
        />

        {/* Glow behind on drag */}
        <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-4 rounded-[2rem] bg-linear-to-br from-orange-400/20 via-rose-400/15 to-violet-500/20 blur-2xl"
            />
          )}
        </AnimatePresence>

        <div
          className={`relative flex flex-col items-center gap-5 rounded-3xl px-8 py-14 text-center transition-all duration-500 sm:py-16 ${
            dragging ? "bg-orange-50/80 scale-[1.02]" : "bg-white/50"
          }`}
        >
          {/* Icon */}
          <motion.div
            animate={
              dragging
                ? { scale: 1.15, rotate: -6, y: -4 }
                : { scale: 1, rotate: 0, y: 0 }
            }
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <div
              className={`flex size-20 items-center justify-center rounded-3xl shadow-xl transition-all duration-500 ${
                dragging
                  ? "bg-linear-to-br from-orange-400 via-rose-400 to-violet-500 shadow-rose-300/40"
                  : "bg-linear-to-br from-orange-100 via-rose-50 to-violet-100 shadow-orange-200/30"
              }`}
            >
              <ImagePlus
                className={`size-9 transition-colors duration-500 ${
                  dragging ? "text-white" : "text-orange-400"
                }`}
                strokeWidth={1.5}
              />
            </div>
          </motion.div>

          {/* Text */}
          <div>
            <motion.p
              className="text-lg font-bold text-zinc-700"
              animate={dragging ? { scale: 1.05 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {dragging
                ? "Drop it like it's hot!"
                : "Drop your screenshot here"}
            </motion.p>
            <p className="mt-1.5 text-sm font-medium text-zinc-400">
              PNG, JPG, or WebP - up to any size
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Button
              variant="primary"
              size="md"
              onPress={() => fileInputRef.current?.click()}
              className="bg-linear-to-r from-orange-500 via-rose-500 to-violet-500 font-semibold text-white shadow-lg shadow-rose-400/20"
            >
              <Upload className="size-4" />
              Browse Files
            </Button>

            <div className="flex items-center gap-2 rounded-full bg-zinc-100/80 px-4 py-2 text-xs font-semibold text-zinc-400">
              <Clipboard className="size-3.5" />
              <span>
                Paste{" "}
                <kbd className="rounded bg-zinc-200/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                  ⌘V
                </kbd>
              </span>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </motion.div>
  );
}
