"use client";

import * as React from "react";
import { toast } from "@heroui/react";

import { revokeObjectUrl } from "@/editor/lib/blob-registry";
import { readImageFileAsDataUrl } from "@/editor/lib/image-resize";
import { useEditorEngine } from "@/editor/lib/engine";
import { MAX_FILE_SIZE } from "@/config";

const DOWNSCALE_BYTE_LIMIT = MAX_FILE_SIZE;

function readRawImageFile(file: File, onSuccess: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      onSuccess(reader.result);
    }
  };
  reader.onerror = () => {
    toast.danger("Failed to read image file");
  };
  reader.readAsDataURL(file);
}

export interface CanvasDropzoneOptions {
  setScreenshot: (src: string) => void;
  setSlotImage: (slotId: string, src: string) => void;
  onNaturalDimsReset: () => void;
}

/**
 * Handles canvas file intake through drag-and-drop, system clipboard pasting,
 * and direct file inputs with automatic image downscaling and memory cleanup.
 */
export function useCanvasDropzone({
  setScreenshot,
  setSlotImage,
  onNaturalDimsReset,
}: CanvasDropzoneOptions) {
  const selectedSlotId = useEditorEngine((s) => s.selectedSlotId);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const setMainScreenshotImage = React.useCallback(
    (src: string) => {
      const currentScreenshot = useEditorEngine.getState().present.screenshot;
      if (currentScreenshot && currentScreenshot !== src) {
        revokeObjectUrl(currentScreenshot);
      }
      setScreenshot(src);
      onNaturalDimsReset();
    },
    [setScreenshot, onNaturalDimsReset],
  );

  const handleImageFile = React.useCallback(
    (src: string) => {
      if (selectedSlotId) {
        setSlotImage(selectedSlotId, src);
        return;
      }
      setMainScreenshotImage(src);
    },
    [selectedSlotId, setMainScreenshotImage, setSlotImage],
  );

  const readFile = React.useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.danger("Please drop a valid image file");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.danger("Image size must be less than 10MB");
        return;
      }

      void readImageFileAsDataUrl(file, {
        downscaleAbove: DOWNSCALE_BYTE_LIMIT,
        maxDimension: 2400,
      })
        .then((dataUrl) => handleImageFile(dataUrl))
        .catch((error) => {
          console.error(
            "Optimized image processing failed, falling back to raw read:",
            error,
          );
          readRawImageFile(file, handleImageFile);
        });
    },
    [handleImageFile],
  );

  // System clipboard listener for Cmd+V / Ctrl+V image pasting
  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      for (const item of clipboardItems) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        readFile(file);
        e.preventDefault();
        break;
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [readFile]);

  const dropHandlers = {
    /** Only file drags activate the dropzone — text-selection drags (which
     *  can start mid-annotation) must never trigger the uploader. */
    onDragOver: (e: React.DragEvent) => {
      const types = e.dataTransfer?.types;
      if (!types || !Array.from(types).includes("Files")) return;
      e.preventDefault();
      setIsDragOver(true);
    },
    onDragLeave: () => setIsDragOver(false),
    onDrop: (e: React.DragEvent) => {
      const droppedFile = e.dataTransfer?.files?.[0];
      if (!droppedFile) return;
      e.preventDefault();
      setIsDragOver(false);
      readFile(droppedFile);
    },
  };

  return {
    isDragOver,
    readFile,
    dropHandlers,
    setMainScreenshotImage,
    handleImageFile,
  };
}
