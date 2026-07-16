"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ImagePlus } from "lucide-react";
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
    <div className="flex h-auto w-full flex-1 items-center justify-center p-4 sm:p-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl cursor-pointer border-2 border-dashed transition-all duration-300 ${
          dragging
            ? "border-orange-400 bg-orange-400/10 scale-[1.02]"
            : "border-zinc-400/40 bg-white/20 hover:bg-white/40"
        }`}
      >
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200/50">
            <ImagePlus className="size-6 text-zinc-500" strokeWidth={1.5} />
          </div>

          <div className="text-center">
            <h3 className="text-base font-semibold text-zinc-800">
              {dragging ? "Drop to upload" : "Upload Screenshot"}
            </h3>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              Drag & drop, paste, or click to browse
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 border border-zinc-200 bg-white font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            Select Image
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
