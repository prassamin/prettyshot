"use server";

import { createServerClient, createServiceClient } from "@/lib/supabase/server";
import {
  AuthError,
  ForbiddenError,
  ServerError,
} from "@/lib/errors";
import {
  cloudinary,
  createUploadSignature,
  getCloudinaryThumbnailUrl,
  updateCloudinaryAssetContext,
  deleteCloudinaryAsset,
  type CloudinaryUploadSignature,
  type CloudinaryAssetType,
} from "@/lib/cloudinary";
import { CloudinaryResponse } from "@/types/cloudinary";

export type Background = {
  id: string;
  category: "mesh" | "image";
  name: string;
  thumbnail: string;
  url: string | null;
  is_free: boolean;
};

export type PremiumAssetResponse = {
  url?: string;
  cssValue?: string;
};

/**
 * Fetches all backgrounds directly from Cloudinary using contextual metadata.
 * Returns direct CDN URLs for free assets and thumbnails.
 */
export async function getBackgrounds(): Promise<Background[]> {
  try {
    const [freeResult, premiumUploadResult, premiumAuthResult] =
      await Promise.all([
        cloudinary.api
          .resources({
            type: "upload",
            resource_type: "image",
            prefix: "prettyshot/backgrounds/",
            context: true,
            max_results: 500,
          })
          .catch((err) => {
            console.warn("Cloudinary free backgrounds fetch error:", err);
            return { resources: [] };
          }) as unknown as CloudinaryResponse,
        cloudinary.api
          .resources({
            type: "upload",
            resource_type: "image",
            prefix: "prettyshot/premium-backgrounds/",
            context: true,
            max_results: 500,
          })
          .catch((err) => {
            console.warn(
              "Cloudinary premium upload backgrounds fetch error:",
              err,
            );
            return { resources: [] };
          }) as unknown as CloudinaryResponse,
        cloudinary.api
          .resources({
            type: "authenticated",
            resource_type: "image",
            prefix: "prettyshot/premium-backgrounds/",
            context: true,
            max_results: 500,
          })
          .catch((err) => {
            console.warn(
              "Cloudinary premium auth backgrounds fetch error:",
              err,
            );
            return { resources: [] };
          }) as unknown as CloudinaryResponse,
      ]);

    const resourceMap = new Map<string, any>();

    for (const r of freeResult.resources || []) {
      resourceMap.set(r.public_id, { ...r, _isFree: true });
    }
    for (const r of premiumUploadResult.resources || []) {
      resourceMap.set(r.public_id, { ...r, _isFree: false });
    }
    for (const r of premiumAuthResult.resources || []) {
      if (!resourceMap.has(r.public_id)) {
        resourceMap.set(r.public_id, { ...r, _isFree: false });
      }
    }

    const allResources = Array.from(resourceMap.values());

    // Sort by free first, then by creation date
    allResources.sort((a, b) => {
      if (a._isFree !== b._isFree) return a._isFree ? -1 : 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    return allResources.map((r) => {
      const custom = r.context?.custom || {};
      const name =
        custom.name ||
        r.public_id.split("/").pop()?.replace(/[-_]/g, " ") ||
        "Background";
      const category = (custom.category as "mesh" | "image") || "mesh";
      const isFree =
        custom.is_free !== undefined
          ? custom.is_free === "true" || custom.is_free === true
          : r._isFree !== undefined
            ? r._isFree
            : !r.public_id.includes("premium");

      const thumbUrl = getCloudinaryThumbnailUrl(r.public_id, {
        width: 300,
        height: 200,
        crop: "fill",
        type: "upload",
      });

      const directUrl =
        r.secure_url || cloudinary.url(r.public_id, { secure: true });

      return {
        id: r.public_id,
        name,
        category,
        is_free: isFree,
        thumbnail: thumbUrl,
        url: directUrl,
      };
    });
  } catch (error) {
    console.error("Failed to fetch backgrounds from Cloudinary:", error);
    return [];
  }
}

/**
 * Returns permanent access URL for a background asset.
 */
export async function getPremiumAsset(
  publicId: string,
): Promise<PremiumAssetResponse | null> {
  if (!publicId) return null;

  if (publicId.startsWith("http")) return { url: publicId };
  return { url: cloudinary.url(publicId, { secure: true }) };
}

export async function getPremiumAssetByPath(storagePath: string) {
  return getPremiumAsset(storagePath);
}

/**
 * Generates an upload signature with contextual metadata for direct browser-to-Cloudinary upload.
 */
export async function getCloudinaryUploadSignature(data: {
  name: string;
  category: "mesh" | "image";
  isFree: boolean;
}): Promise<CloudinaryUploadSignature> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { ADMIN_EMAILS } = await import("@/config");
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new ForbiddenError();
  }

  const folder = data.isFree
    ? "prettyshot/backgrounds"
    : "prettyshot/premium-backgrounds";
  const type: CloudinaryAssetType = "upload";
  const context = `name=${data.name}|category=${data.category}|is_free=${data.isFree}`;

  return createUploadSignature(folder, type, context);
}

/**
 * Updates asset metadata stored in Cloudinary context.
 */
export async function updateBackground(
  publicId: string,
  data: { name: string; category: string; is_free: boolean },
) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { ADMIN_EMAILS } = await import("@/config");
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new ForbiddenError();
  }

  const type = publicId.includes("premium") ? "authenticated" : "upload";

  try {
    await updateCloudinaryAssetContext(
      publicId,
      {
        name: data.name,
        category: data.category,
        is_free: String(data.is_free),
      },
      type,
    );
    return { success: true };
  } catch (err: any) {
    console.error("Failed to update background context:", err);
    throw new ServerError(
      "Failed to update background metadata: " + err.message,
    );
  }
}

/**
 * Deletes an asset permanently from Cloudinary.
 */
export async function deleteBackground(publicId: string) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { ADMIN_EMAILS } = await import("@/config");
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new ForbiddenError();
  }

  const type = publicId.includes("premium") ? "authenticated" : "upload";

  try {
    await deleteCloudinaryAsset(publicId, type);
    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete background from Cloudinary:", err);
    throw new ServerError("Failed to delete background: " + err.message);
  }
}

/**
 * Fetches user's uploaded custom background images from Cloudinary.
 */
export async function getUserBackgroundImages(): Promise<
  Array<Omit<Background, "is_free" | "category" | "name">>
> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) return [];

    const result: CloudinaryResponse = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: `prettyshot/users/${user.id}/bg/`,
      max_results: 30,
      sort_by: ["created_at", "desc"],
    });

    return (result.resources || []).map((r) => {
      const thumbUrl = getCloudinaryThumbnailUrl(r.public_id, {
        width: 300,
        height: 200,
        crop: "fill",
        type: "upload",
      });
      return {
        id: r.public_id,
        url: r.secure_url,
        thumbnail: thumbUrl,
      };
    });
  } catch (error) {
    console.error("Failed to fetch user backgrounds from Cloudinary:", error);
    return [];
  }
}

/**
 * Generates an upload signature for a user to directly upload images to their Cloudinary folder.
 * Bypasses Next.js server payload limit and keeps API secret protected.
 */
export async function getUserUploadSignature(
  clientTimestamp?: number,
): Promise<CloudinaryUploadSignature> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new AuthError("You must be logged in to upload images.");
  }

  const folder = `prettyshot/users/${user.id}/bg`;
  return createUploadSignature(folder, "upload", undefined, clientTimestamp);
}

/**
 * Returns signed upload URLs for a new background asset + thumbnail.
 * @adminOnly
 */
export async function getUploadUrls(
  assetFileName: string,
  thumbnailFileName: string,
  isFree: boolean,
) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { ADMIN_EMAILS } = await import("@/config");
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error("Admin access only.");
  }

  const uuid = crypto.randomUUID();
  const adminSupabase = createServiceClient();

  const thumbExt = thumbnailFileName.split(".").pop();
  const thumbPath = `bg-thumbnails/${uuid}-thumb.${thumbExt}`;

  const { data: thumbData, error: thumbError } = await adminSupabase.storage
    .from("prettyshot")
    .createSignedUploadUrl(thumbPath);

  if (thumbError || !thumbData)
    throw new Error("Thumb URL: " + thumbError?.message);

  const assetExt = assetFileName.split(".").pop();
  const assetPathName = `${uuid}-asset.${assetExt}`;
  const assetBucket = isFree ? "prettyshot" : "premium-assets";
  const assetPath = isFree ? `backgrounds/${assetPathName}` : assetPathName;

  const { data: assetData, error: assetError } = await adminSupabase.storage
    .from(assetBucket)
    .createSignedUploadUrl(assetPath);

  if (assetError || !assetData)
    throw new Error("Asset URL: " + assetError?.message);

  return {
    uuid,
    thumbUploadToken: thumbData.token,
    thumbPath,
    assetUploadToken: assetData.token,
    assetPath,
    assetBucket,
  };
}

/**
 * Persists the uploaded background row into Supabase.
 * @adminOnly
 */
export async function saveBackgroundMetadata(
  id: string,
  name: string,
  category: "mesh" | "image",
  isFree: boolean,
  thumbPath: string,
  assetPath: string,
) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { ADMIN_EMAILS } = await import("@/config");
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new Error("Admin access only.");
  }

  const adminSupabase = createServiceClient();

  const { data: thumbPublicData } = adminSupabase.storage
    .from("prettyshot")
    .getPublicUrl(thumbPath);
  const thumbnailUrl = thumbPublicData.publicUrl;

  let storagePath = assetPath;
  if (isFree) {
    const { data: publicData } = adminSupabase.storage
      .from("prettyshot")
      .getPublicUrl(assetPath);
    storagePath = publicData.publicUrl;
  }

  const { error } = await adminSupabase.from("backgrounds").insert({
    id,
    name,
    category,
    thumbnail_url: thumbnailUrl,
    storage_path: storagePath,
    is_free: isFree,
  });

  if (error)
    throw new Error("Failed to insert into database: " + error.message);
  return { success: true };
}
