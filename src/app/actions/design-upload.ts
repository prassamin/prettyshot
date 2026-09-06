"use server";

import { createServerClient } from "@/lib/supabase/server";
import { AuthError } from "@/lib/errors";
import {
  createUploadSignature,
  type CloudinaryUploadSignature,
} from "@/lib/cloudinary";

/**
 * Returns a signed Cloudinary upload payload for a design image (screenshot /
 * slot / asset). The browser uploads the data URL directly to Cloudinary's
 * CDN under `prettyshot/users/{userId}/designs`.
 */
export async function getDesignUploadSignature(
  clientTimestamp?: number,
  publicId?: string,
  designId?: string,
): Promise<CloudinaryUploadSignature> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    throw new AuthError("You must be logged in to upload images.");
  }

  const folder = designId
    ? `prettyshot/users/${user.id}/designs/${designId}`
    : `prettyshot/users/${user.id}/designs`;
  const extraParams: Record<string, string | boolean> = {};
  if (publicId) {
    extraParams.public_id = publicId;
    extraParams.overwrite = true;
  }

  return createUploadSignature(
    folder,
    "upload",
    undefined,
    clientTimestamp,
    extraParams,
  );
}

/**
 * Deletes an old/replaced image asset belonging to the authenticated user from Cloudinary.
 */
export async function deleteDesignAssetAction(
  publicIdOrUrl: string,
): Promise<{ success: boolean; error?: string }> {
  if (!publicIdOrUrl) return { success: false };

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  let publicId = publicIdOrUrl;
  if (publicIdOrUrl.includes("res.cloudinary.com")) {
    const parts = publicIdOrUrl.split("/image/upload/");
    if (parts[1]) {
      // Remove version prefix (e.g. v12345/) and file extension
      const withoutVersion = parts[1].replace(/^v\d+\//, "");
      publicId = withoutVersion.replace(/\.[a-zA-Z0-9]+$/, "");
    }
  }

  // Security guard: Ensure users can only delete assets inside their own user folder
  if (!publicId.startsWith(`prettyshot/users/${user.id}/`)) {
    return { success: false, error: "Unauthorized asset delete" };
  }

  try {
    const { deleteCloudinaryAsset } = await import("@/lib/cloudinary");
    await deleteCloudinaryAsset(publicId, "upload");
    return { success: true };
  } catch (err: any) {
    console.warn("Failed to delete design asset from Cloudinary:", err);
    return { success: false, error: err?.message };
  }
}
