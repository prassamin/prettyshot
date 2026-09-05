import { v2 as cloudinary, TransformationOptions } from "cloudinary";

const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
const apiSecret = (process.env.CLOUDINARY_API_SECRET || "").trim();

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export { cloudinary };

export type CloudinaryUploadSignature = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  type: "upload" | "authenticated";
  context?: string;
};

export type CloudinaryAssetType = "upload" | "authenticated";
export type CloudinaryResourceType = "image" | "raw" | "video | auto";

/* ────────────────────────────── Signing ────────────────────────────── */

/**
 * Creates an HMAC signature for direct client-to-Cloudinary upload with optional contextual metadata.
 */
export function createUploadSignature(
  folder = "prettyshot/backgrounds",
  type: CloudinaryAssetType = "upload",
  context?: string,
  clientTimestamp?: number,
  extraParams?: Record<string, string | number | boolean>,
): CloudinaryUploadSignature {
  const timestamp = clientTimestamp || Math.round(new Date().getTime() / 1000);
  const paramsToSign: Record<string, string | number | boolean> = {
    folder,
    timestamp,
    ...extraParams,
  };

  if (type === "authenticated") {
    paramsToSign.type = "authenticated";
  }

  if (context) {
    paramsToSign.context = context;
  }

  const secret = (process.env.CLOUDINARY_API_SECRET || "").trim();
  const key = (process.env.CLOUDINARY_API_KEY || "").trim();
  const cloud = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();

  if (!secret) {
    throw new Error("CLOUDINARY_API_SECRET environment variable is missing.");
  }

  // Cloudinary direct upload endpoint validates using SHA-1 signature version 1
  const signature = cloudinary.utils.api_sign_request(paramsToSign, secret);

  return {
    signature,
    timestamp,
    apiKey: key,
    cloudName: cloud,
    folder,
    type: type || "upload",
    context,
  };
}

/* ────────────────────────────── URLs ────────────────────────────── */

/**
 * Generates an on-the-fly transformed thumbnail URL for any Cloudinary asset.
 */
export function getCloudinaryThumbnailUrl(
  publicIdOrUrl: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    type?: CloudinaryAssetType;
  } = {},
): string {
  if (!publicIdOrUrl) return "";

  const {
    width = 300,
    height = 200,
    crop = "fill",
    type = publicIdOrUrl.includes("premium") ? "authenticated" : "upload",
  } = options;

  const isAuth = type === "authenticated";

  return cloudinary.url(publicIdOrUrl, {
    type,
    sign_url: isAuth,
    transformation: [
      {
        width,
        height,
        crop,
        fetch_format: "auto",
        quality: "auto",
      },
    ],
    secure: true,
  });
}

/**
 * Generates an HMAC-signed temporary URL for authenticated / Pro assets (expires after N seconds).
 */
export function getSignedCloudinaryUrl(
  publicId: string,
  expiresInSeconds = 60,
  options: {
    format?: string;
    attachment?: boolean;
    transformations?: TransformationOptions;
  } = {},
): string {
  if (!publicId) return "";

  const match = publicId.match(/\.([a-zA-Z0-9]+)$/);
  const ext = match ? match[1] : undefined;
  const format = options.format || ext || "webp";
  const cleanPublicId = ext ? publicId.replace(/\.[a-zA-Z0-9]+$/, "") : publicId;

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  return cloudinary.utils.private_download_url(cleanPublicId, format, {
    type: "authenticated",
    expires_at: expiresAt,
    attachment: options.attachment ?? false,
    resource_type: "image",
  });
}

/**
 * Builds a direct delivery URL for a public asset.
 */
export function getCloudinaryUrl(
  publicId: string,
  type: CloudinaryAssetType = "upload",
  resourceType: CloudinaryResourceType = "image",
): string {
  return cloudinary.url(publicId, {
    type,
    resource_type: resourceType,
    secure: true,
  });
}

/* ────────────────────────────── Context ────────────────────────────── */

/**
 * Updates or adds contextual key-value metadata to an existing Cloudinary asset.
 */
export async function updateCloudinaryAssetContext(
  publicId: string,
  context: Record<string, string | boolean>,
  type: CloudinaryAssetType = "upload",
) {
  const contextString = Object.entries(context)
    .map(([k, v]) => `${k}=${v}`)
    .join("|");

  return cloudinary.uploader.add_context(contextString, [publicId], {
    type,
    resource_type: "image",
  });
}

/* ────────────────────────────── Delete ────────────────────────────── */

/**
 * Deletes a single asset.
 */
export async function deleteCloudinaryAsset(
  publicId: string,
  type: CloudinaryAssetType = "upload",
  resourceType: CloudinaryResourceType = "image",
) {
  return cloudinary.uploader.destroy(publicId, {
    type,
    resource_type: resourceType,
    invalidate: true,
  });
}

/**
 * Deletes ALL assets under a folder prefix (recursively), across asset types.
 * Optionally removes the folder itself afterward.
 */
export async function deleteCloudinaryFolder(
  folderPath: string,
  options: {
    deleteFolder?: boolean;
    assetTypes?: CloudinaryAssetType[];
    resourceTypes?: CloudinaryResourceType[];
  } = {},
) {
  const {
    deleteFolder = false,
    assetTypes = ["upload", "authenticated"],
    resourceTypes = ["image", "raw"],
  } = options;

  const prefix = folderPath.endsWith("/") ? folderPath : `${folderPath}/`;

  for (const type of assetTypes) {
    for (const resourceType of resourceTypes) {
      try {
        await cloudinary.api.delete_resources_by_prefix(prefix, {
          type,
          resource_type: resourceType,
          invalidate: true,
        });
      } catch (error) {
        console.error(
          `deleteCloudinaryFolder: failed to delete ${type}/${resourceType} under ${prefix}:`,
          error,
        );
      }
    }
  }

  if (deleteFolder) {
    try {
      await cloudinary.api.delete_folder(folderPath);
    } catch (error) {
      console.error(
        `deleteCloudinaryFolder: failed to delete folder ${folderPath}:`,
        error,
      );
    }
  }
}

/* ────────────────────────────── Upload ────────────────────────────── */

/**
 * Uploads a JSON object as a raw file to a folder. Returns the public_id.
 */
export async function uploadCloudinaryJson(
  folder: string,
  publicId: string,
  data: Record<string, unknown>,
  options: { type?: CloudinaryAssetType; overwrite?: boolean } = {},
): Promise<string> {
  const { type = "upload", overwrite = true } = options;

  const publicIdWithExt = publicId.endsWith(".json")
    ? publicId
    : `${publicId}.json`;

  await cloudinary.uploader.upload(
    `data:application/json;base64,${Buffer.from(JSON.stringify(data, null, 2)).toString("base64")}`,
    {
      folder,
      public_id: publicIdWithExt,
      resource_type: "raw",
      overwrite,
      type,
      invalidate: true,
    },
  );

  return `${folder.replace(/\/$/, "")}/${publicIdWithExt}`;
}

/**
 * Reads a raw JSON file from Cloudinary. Returns null if missing/invalid.
 * Uses the asset's version in the URL so the CDN never serves a stale copy,
 * and signs the URL when the asset is authenticated (pro / locked).
 */
export async function readCloudinaryJson(
  publicId: string,
  options: { type?: CloudinaryAssetType } = {},
): Promise<Record<string, unknown> | null> {
  const { type = "upload" } = options;
  try {
    // Bump version to bypass Cloudinary's CDN cache for this file
    const info = await cloudinary.api.resource(publicId, {
      resource_type: "raw",
      type,
    });
    const url = cloudinary.url(publicId, {
      secure: true,
      type,
      resource_type: "raw",
      version: info.version,
      // Authenticated assets return 401 unless the URL is HMAC-signed
      sign_url: type === "authenticated",
    });
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/* ────────────────────────────── List ────────────────────────────── */

/**
 * Lists all sub-folders directly under a folder.
 */
export async function listCloudinaryFolders(folderPath: string) {
  const res = await cloudinary.api.sub_folders(folderPath);
  return (res.folders ?? []).map((f: { name: string }) => f.name);
}

/**
 * Lists assets under a prefix with mixed types.
 */
export async function listCloudinaryAssets(
  prefix: string,
  options: { maxResults?: number } = {},
): Promise<string[]> {
  const { maxResults = 500 } = options;
  const out: string[] = [];
  for (const type of ["upload", "authenticated"] as const) {
    for (const resourceType of ["image", "raw"] as const) {
      try {
        const res = await cloudinary.api.resources({
          type,
          prefix,
          resource_type: resourceType,
          max_results: maxResults,
        });
        out.push(
          ...(res.resources ?? []).map((r: { public_id: string }) => r.public_id),
        );
      } catch {
        // ignore listing errors
      }
    }
  }
  return out;
}