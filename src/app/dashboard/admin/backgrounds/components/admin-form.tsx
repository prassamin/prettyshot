"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/react";
import { getUploadUrls, saveBackgroundMetadata } from "@/app/actions/backgrounds";
import { createClient } from "@/lib/supabase/client";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";

export function AdminForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [category, setCategory] = useState<"mesh" | "image">("mesh");
  const [isFree, setIsFree] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) setSelectedFile(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
    }
  };

  // Helper to generate a small thumbnail from an image file
  const generateThumbnail = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No canvas context"));

        // Resize proportionally, max dimension 200px
        const maxSize = 200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height *= maxSize / width));
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width *= maxSize / height));
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Canvas to Blob failed"));
            const thumbFile = new File(
              [blob],
              `thumb_${file.name.replace(/\.[^/.]+$/, "")}.webp`,
              {
                type: "image/webp",
              },
            );
            resolve(thumbFile);
          },
          "image/webp",
          0.8,
        );
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const mainFile = selectedFile;

      if (!mainFile) {
        throw new Error("You must upload an image for this asset.");
      }

      // Add the isFree state to formData
      formData.set("is_free", isFree.toString());

      // We have an image, it is a high-res asset
      const thumbFile = await generateThumbnail(mainFile);

      const { 
        uuid, 
        thumbUploadToken, 
        thumbPath, 
        assetUploadToken, 
        assetPath, 
        assetBucket 
      } = await getUploadUrls(mainFile.name, thumbFile.name, isFree);

      const supabase = createClient();
      
      const { error: thumbUploadError } = await supabase.storage
        .from("prettyshot")
        .uploadToSignedUrl(thumbPath, thumbUploadToken, thumbFile);
      
      if (thumbUploadError) throw new Error("Thumbnail upload failed: " + thumbUploadError.message);

      const { error: assetUploadError } = await supabase.storage
        .from(assetBucket)
        .uploadToSignedUrl(assetPath, assetUploadToken, mainFile);
        
      if (assetUploadError) throw new Error("Asset upload failed: " + assetUploadError.message);

      await saveBackgroundMetadata(
        uuid, 
        formData.get("name") as string, 
        category, 
        isFree, 
        thumbPath, 
        assetPath, 
        assetBucket
      );

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
      setSelectedFile(null);
      setIsFree(false);
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-3 p-4 text-sm font-medium text-rose-600 bg-rose-50 rounded-xl border border-rose-200/50">
          <AlertCircle className="size-5 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200/50">
          <CheckCircle2 className="size-5 shrink-0" />
          Successfully uploaded premium background.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2.5">
          <label className="text-sm font-medium text-zinc-800">
            Asset Name
          </label>
          <input
            name="name"
            required
            type="text"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-sm font-medium transition-all focus:bg-white focus:border-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-500/10 placeholder:text-zinc-400"
            placeholder="e.g. Neon Horizon"
          />
        </div>

        <div className="space-y-2.5">
          <label className="text-sm font-medium text-zinc-800">Category</label>
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-sm font-medium transition-all focus:bg-white focus:border-zinc-500 focus:outline-none focus:ring-4 focus:ring-zinc-500/10"
          >
            <option value="mesh">Mesh Background</option>
            <option value="image">Photographic / Image</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
        <input
          type="checkbox"
          id="is_free"
          checked={isFree}
          onChange={(e) => setIsFree(e.target.checked)}
          className="size-5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
        />
        <div>
          <label
            htmlFor="is_free"
            className="text-sm font-semibold text-zinc-800 cursor-pointer"
          >
            Mark as Free Asset
          </label>
          <p className="text-xs text-zinc-500 mt-0.5">
            Free assets are available to all users without a Pro subscription.
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <label className="text-sm font-medium text-zinc-800">
          Source Image
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-colors ${
            isDragging
              ? "border-zinc-500 bg-zinc-100"
              : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) setSelectedFile(e.target.files[0]);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center py-8 text-center pointer-events-none">
            {selectedFile ? (
              <div className="flex flex-col items-center gap-3">
                <div className="size-20 rounded-lg overflow-hidden shadow-sm ring-1 ring-black/5">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Click, drop, or paste to replace
                  </p>
                </div>
              </div>
            ) : (
              <>
                <UploadCloud className="size-8 text-zinc-400 mb-3" />
                <p className="text-sm font-medium text-zinc-700">
                  Click, drag & drop, or paste image
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Upload the high-res file. Thumbnail is auto-generated.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        isDisabled={loading}
        className="w-full h-12 rounded-xl bg-zinc-900 text-white font-medium hover:bg-zinc-800"
      >
        {loading ? "Uploading..." : "Upload Asset"}
      </Button>
    </form>
  );
}
