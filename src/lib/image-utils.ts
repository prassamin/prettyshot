import { createClient } from "@/lib/supabase/client";

/**
 * Converts a base64 Data URL to a highly compressed WebP Data URL
 */
export async function compressToWebP(
  dataUrl: string,
  quality = 0.8,
): Promise<string> {
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
export async function uploadImageDeduplicated(
  dataUrl: string,
  userId: string,
  folder: "default" | "bg" = "default",
): Promise<string> {
  // If it's already an uploaded URL, just return it
  if (dataUrl.startsWith("http")) return dataUrl;

  // Compress to WebP
  const webpDataUrl = await compressToWebP(dataUrl, 0.8);
  const blob = dataURLtoBlob(webpDataUrl);

  // Hash it to generate a unique filename
  const hash = await hashBlob(blob);
  const fileName = `${hash}.webp`;

  // Construct the path: design-images/{userId}/[bg/]{fileName}
  const subFolder = folder === "bg" ? "bg/" : "";
  const filePath = `design-images/${userId}/${subFolder}${fileName}`;

  const supabase = createClient();
  const bucket = supabase.storage.from("prettyshot");

  // Attempt upload. upsert: false ensures we don't overwrite if it exists.
  const { error } = await bucket.upload(filePath, blob, {
    contentType: "image/webp",
    upsert: false,
  });

  if (
    error &&
    (error as any).statusCode !== "409" &&
    !error.message.includes("Duplicate")
  ) {
    console.warn(
      "Upload error (might be duplicate, proceeding anyway):",
      error,
    );
  }

  // Return Public URL
  const { data } = bucket.getPublicUrl(filePath);
  return data.publicUrl;
}

export const getPublicUrl = (path: string, bucket: string = "prettyshot") => {
  if (path && path.startsWith("http")) return path;
  const supabase = createClient();
  return supabase.storage
    .from(bucket)
    .getPublicUrl(path).data.publicUrl;
};

/**
 * Deletes an image from the Supabase bucket given its public URL
 */
export async function deleteImageByUrl(publicUrl: string, bucket: string = "prettyshot"): Promise<void> {
  if (!publicUrl || !publicUrl.includes("supabase.co")) return;

  try {
    // The public URL format is typically: 
    // https://[projectId].supabase.co/storage/v1/object/public/[bucket]/[filePath]
    const urlParts = publicUrl.split(`/public/${bucket}/`);
    if (urlParts.length !== 2) return;

    const filePath = urlParts[1];
    const supabase = createClient();
    
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      console.error("Failed to delete old image:", error);
    }
  } catch (e) {
    console.error("Error deleting image:", e);
  }
}
