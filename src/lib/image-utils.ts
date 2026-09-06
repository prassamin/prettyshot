import { getDesignUploadSignature } from "@/app/actions/design-upload";
import { MAX_FILE_SIZE } from "@/config";

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

const memoryUploadCache = new Map<string, string>();
const inFlightUploads = new Map<string, Promise<string>>();
const deletedOrPendingDeletion = new Set<string>();

/**
 * Compresses an image to WebP, hashes it, and uploads it to Cloudinary via a
 * signed direct upload. Returns the public URL of the image.
 *
 * The hash doubles as the Cloudinary `public_id`, so re-uploading the same
 * image is an idempotent overwrite — effectively deduplicated.
 */
export async function uploadImageDeduplicated(
  dataUrl: string,
  designId?: string,
): Promise<string> {
  // If it's already an uploaded URL, just return it
  if (dataUrl.startsWith("http")) return dataUrl;

  const cacheKey = designId ? `${designId}:${dataUrl}` : dataUrl;
  const cached =
    memoryUploadCache.get(cacheKey) || memoryUploadCache.get(dataUrl);
  if (cached) return cached;

  if (inFlightUploads.has(cacheKey)) {
    return inFlightUploads.get(cacheKey)!;
  }

  const uploadPromise = (async () => {
    // Compress to WebP
    const webpDataUrl = await compressToWebP(dataUrl, 0.8);
    const blob = dataURLtoBlob(webpDataUrl);
    if (blob.size > MAX_FILE_SIZE) {
      throw new Error("Image size exceeds the 10MB limit.");
    }

    // Hash it to generate a unique public_id
    const hash = await hashBlob(blob);
    const hashKey = designId ? `${designId}:${hash}` : hash;

    const hashCached =
      memoryUploadCache.get(hashKey) || memoryUploadCache.get(hash);
    if (hashCached) {
      memoryUploadCache.set(cacheKey, hashCached);
      return hashCached;
    }

    if (inFlightUploads.has(hashKey)) {
      return inFlightUploads.get(hashKey)!;
    }

    const publicId = hash;

    // Get signed upload parameters from the server (folder is scoped to the user and design project)
    const clientTimestamp = Math.floor(Date.now() / 1000);
    const uploadParams = await getDesignUploadSignature(
      clientTimestamp,
      publicId,
      designId,
    );

    // Direct upload to Cloudinary CDN
    const uploadFormData = new FormData();
    uploadFormData.append("file", blob);
    uploadFormData.append("api_key", uploadParams.apiKey);
    uploadFormData.append("timestamp", clientTimestamp.toString());
    uploadFormData.append("signature", uploadParams.signature);
    uploadFormData.append("folder", uploadParams.folder);
    uploadFormData.append("public_id", publicId);
    uploadFormData.append("overwrite", "true");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${uploadParams.cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadFormData,
      },
    );

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }

    const secureUrl = data.secure_url as string;
    memoryUploadCache.set(dataUrl, secureUrl);
    memoryUploadCache.set(cacheKey, secureUrl);
    memoryUploadCache.set(hash, secureUrl);
    memoryUploadCache.set(hashKey, secureUrl);

    return secureUrl;
  })();

  inFlightUploads.set(cacheKey, uploadPromise);
  uploadPromise.finally(() => {
    inFlightUploads.delete(cacheKey);
  });

  return uploadPromise;
}

/**
 * Deletes an old user design asset from Cloudinary in the background.
 */
export async function deleteDesignAsset(
  urlOrPublicId: string,
): Promise<boolean> {
  if (!urlOrPublicId) return false;
  if (deletedOrPendingDeletion.has(urlOrPublicId)) return true;
  deletedOrPendingDeletion.add(urlOrPublicId);

  try {
    const { deleteDesignAssetAction } =
      await import("@/app/actions/design-upload");
    const res = await deleteDesignAssetAction(urlOrPublicId);
    return res.success;
  } catch (err) {
    console.warn("Failed to delete design asset:", err);
    return false;
  }
}

/**
 * Replaces an existing screenshot/asset by uploading the new image and deleting the old
 * Cloudinary asset concurrently in parallel.
 *
 * Guaranteed safe: If the new image has the same hash as the old asset, it will NOT delete it.
 */
export async function replaceImageDeduplicated(
  newDataUrl: string,
  oldUrlOrPublicId?: string | null,
  designId?: string,
): Promise<string> {
  // If it's already an uploaded URL, return it
  if (newDataUrl.startsWith("http")) return newDataUrl;

  // Check memory cache first
  const cached = memoryUploadCache.get(newDataUrl);
  if (cached && cached === oldUrlOrPublicId) {
    return cached;
  }

  // Compress & hash newDataUrl to know its public_id before doing anything
  const webpDataUrl = await compressToWebP(newDataUrl, 0.8);
  const blob = dataURLtoBlob(webpDataUrl);
  const newHash = await hashBlob(blob);

  // If the old asset contains the exact same hash, NEVER delete it!
  const isSameAsset =
    oldUrlOrPublicId &&
    (oldUrlOrPublicId.includes(newHash) ||
      memoryUploadCache.get(newHash) === oldUrlOrPublicId ||
      cached === oldUrlOrPublicId);

  const shouldDeleteOld =
    !isSameAsset &&
    oldUrlOrPublicId &&
    typeof oldUrlOrPublicId === "string" &&
    oldUrlOrPublicId.startsWith("http") &&
    oldUrlOrPublicId.includes("cloudinary.com");

  const uploadTask = uploadImageDeduplicated(newDataUrl, designId);
  const deleteTask = shouldDeleteOld
    ? deleteDesignAsset(oldUrlOrPublicId)
    : Promise.resolve(true);

  const [newUrl] = await Promise.all([uploadTask, deleteTask]);
  return newUrl;
}
