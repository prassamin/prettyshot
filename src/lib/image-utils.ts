import { createClient } from "@/lib/supabase/client";

/**
 * Converts a base64 Data URL to a highly compressed WebP Data URL
 */
export async function compressToWebP(dataUrl: string, quality = 0.8): Promise<string> {
  // If it's already a URL (e.g. from a previously saved design) or not base64, return it
  if (!dataUrl.startsWith("data:image")) return dataUrl;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Failed to get canvas context"));
      
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/webp", quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Converts a data URL to a Blob
 */
export function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/webp";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Generates a SHA-256 hash for a Blob (used for deduplication)
 */
export async function hashBlob(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Compresses an image to WebP, hashes it, and uploads it to Supabase if it doesn't exist.
 * Returns the public URL of the image.
 */
export async function uploadImageDeduplicated(dataUrl: string): Promise<string> {
  // If it's already an uploaded URL, just return it
  if (dataUrl.startsWith("http")) return dataUrl;

  // 1. Compress to WebP
  const webpDataUrl = await compressToWebP(dataUrl, 0.8);
  const blob = dataURLtoBlob(webpDataUrl);
  
  // 2. Hash it to generate a unique, content-addressable filename
  const hash = await hashBlob(blob);
  const fileName = `${hash}.webp`;
  
  const supabase = createClient();
  const bucket = supabase.storage.from("design-images");
  
  // 3. Attempt upload. upsert: false ensures we don't overwrite if it exists (saves a write operation).
  const { error } = await bucket.upload(fileName, blob, {
    contentType: "image/webp",
    upsert: false 
  });
  
  // Note: if error exists, it's highly likely a "Duplicate" error meaning the image is already uploaded.
  // We can safely ignore it and just return the public URL!
  if (error && (error as any).statusCode !== "409" && !error.message.includes("Duplicate")) {
    console.warn("Upload error (might be duplicate, proceeding anyway):", error);
  }
  
  // 4. Return Public URL
  const { data } = bucket.getPublicUrl(fileName);
  return data.publicUrl;
}
