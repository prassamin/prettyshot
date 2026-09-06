"use server";

import { cloudinary, deleteCloudinaryFolder } from "@/lib/cloudinary";
import { ForbiddenError } from "@/lib/errors";
import { createServerClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import {
  kv,
  framesCategoryKey,
  framesCategoryFramesKey,
  framesFrameKey,
  FRAMES_CATEGORIES_INDEX_KEY,
} from "@/lib/kv-store";

import type { FrameKind } from "@/editor/property-panel/sections/frame/types";
import { slugify } from "@/lib/utils";

export type FrameGeometry = {
  aspectRatio: string;
  screen: {
    aspectRatio: string;
    scale: number;
    offsetX?: number;
    offsetY?: number;
    borderRadius: number;
  };
};

export type FrameVariantInfo = {
  id: string;
  frameUrl: string | null;
  thumbUrl: string | null;
  framePublicId?: string | null;
  thumbPublicId?: string | null;
  frameType?: "upload" | "authenticated";
};

export type FrameInfo = {
  id: string;
  name: string;
  isFree: boolean;
  supportsOrientation?: boolean;
  kind?: FrameKind;
  defaultVariant: string | null;
  colors: Record<string, string>;
  geometry: FrameGeometry | null;
  variants: FrameVariantInfo[];
};

export type FrameCategoryInfo = {
  id: string;
  label: string;
  iconUrl: string | null;
  frames: FrameInfo[];
};

const FRAMES_ROOT = "prettyshot/frames";

let lastAdminCheck = 0;
let lastAdminUser: { id: string; email?: string } | null = null;

async function getAdminUser() {
  // Short-TTL in-memory cache: admin email is stable, avoids a Supabase
  // round-trip on every signature request.
  const now = Date.now();
  if (lastAdminUser && now - lastAdminCheck < 60_000) {
    return lastAdminUser;
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { ADMIN_EMAILS } = await import("@/config");
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    throw new ForbiddenError("Admin access only.");
  }

  lastAdminCheck = now;
  lastAdminUser = user;
  return user;
}

export type FrameFileUploadSpec = {
  key: string;
  folder: string;
  publicId: string;
  resourceType: "image" | "raw";
  type: "upload" | "authenticated";
};

export type FrameUploadSignature = {
  key: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId: string;
  resourceType: "image" | "raw";
  type: "upload" | "authenticated";
};

export async function getFrameUploadSignatures(
  specs: FrameFileUploadSpec[],
  clientTimestamp?: number,
): Promise<FrameUploadSignature[]> {
  await getAdminUser();

  // Timestamp MUST come from the client so the signed params exactly match
  // the upload request moment (Cloudinary rejects stale/expired signatures).
  const timestamp = clientTimestamp ?? Math.round(new Date().getTime() / 1000);

  return specs.map((spec) => {
    const paramsToSign: Record<string, string | number> = {
      folder: spec.folder,
      public_id: spec.publicId,
      timestamp,
    };

    if (spec.type === "authenticated") {
      paramsToSign.type = "authenticated";
    }
    // NOTE: resource_type must NOT be signed — Cloudinary's upload
    // signature excludes it (derived from the endpoint URL). Verified
    // empirically: signing it yields "Invalid Signature" (401).

    const secret = (process.env.CLOUDINARY_API_SECRET || "").trim();
    const apiKey = (process.env.CLOUDINARY_API_KEY || "").trim();
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
    const signature = cloudinary.utils.api_sign_request(paramsToSign, secret);

    return {
      key: spec.key,
      signature,
      timestamp: paramsToSign.timestamp as number,
      apiKey,
      cloudName,
      folder: spec.folder,
      publicId: spec.publicId,
      resourceType: spec.resourceType,
      type: spec.type,
    };
  });
}

async function fetchCatalogUncached(): Promise<FrameCategoryInfo[]> {
  try {
    // Images: both upload (free) + authenticated (pro) types.
    const [freeImages, proImages] = await Promise.all([
      cloudinary.api.resources({
        type: "upload",
        prefix: `${FRAMES_ROOT}/`,
        resource_type: "image",
        max_results: 500,
      }),
      cloudinary.api.resources({
        type: "authenticated",
        prefix: `${FRAMES_ROOT}/`,
        resource_type: "image",
        max_results: 500,
      }),
    ]);

    const categories = new Map<string, FrameCategoryInfo>();

    const processAsset = (
      asset: { public_id: string },
      type: "upload" | "authenticated",
    ) => {
      const parts = asset.public_id.split("/");
      if (parts.length < 4) return;

      const [fRoot, fFrames, categoryId, ...rest] = parts;
      if (fRoot !== "prettyshot" || fFrames !== "frames") return;

      let category = categories.get(categoryId);
      if (!category) {
        category = {
          id: categoryId,
          label: humanize(categoryId),
          iconUrl: null,
          frames: [],
        };
        categories.set(categoryId, category);
      }

      // Icon asset: prettyshot/frames/{cat}/icon -> parts length 4
      if (
        (parts.length === 4 && rest[0].toLowerCase().startsWith("icon")) ||
        (rest.length === 1 && rest[0].toLowerCase().startsWith("icon"))
      ) {
        category.iconUrl = cloudinary.url(asset.public_id, {
          type,
          secure: true,
        });
        return;
      }

      // Frame asset: prettyshot/frames/{cat}/{frame}/{variant}/{fileKey}
      if (rest.length < 3) return;
      const [frameId, variantId, fileKey] = rest;
      if (
        !variantId ||
        !fileKey ||
        (fileKey !== "frame" && fileKey !== "thumb")
      )
        return;
      let frame = category.frames.find((f) => f.id === frameId);

      if (!frame) {
        frame = {
          id: frameId,
          name: humanize(frameId),
          isFree: true,
          supportsOrientation: false,
          kind: "phone",
          defaultVariant: null,
          colors: {},
          geometry: null,
          variants: [],
        };
        category.frames.push(frame);
      }

      let variant = frame.variants.find((v) => v.id === variantId);
      if (!variant) {
        variant = {
          id: variantId,
          frameUrl: null,
          thumbUrl: null,
          framePublicId: null,
          thumbPublicId: null,
        };
        frame.variants.push(variant);
      }

      const url = cloudinary.url(asset.public_id, {
        type,
        secure: true,
        transformation: [{ fetch_format: "auto", quality: "auto" }],
      });
      if (fileKey === "frame") {
        variant.frameUrl = url;
        variant.framePublicId = asset.public_id;
        variant.frameType = type;
      } else {
        variant.thumbUrl = url;
        variant.thumbPublicId = asset.public_id;
      }
    };

    for (const asset of freeImages.resources ?? []) {
      processAsset(asset, "upload");
    }
    for (const asset of proImages.resources ?? []) {
      processAsset(asset, "authenticated");
    }

    // Sort: categories by id, frames by id, variants by id
    for (const category of categories.values()) {
      category.frames.sort((a, b) => a.id.localeCompare(b.id));
      for (const frame of category.frames) {
        frame.variants.sort((a, b) => a.id.localeCompare(b.id));
      }
    }

    return [...categories.values()].sort((a, b) => a.id.localeCompare(b.id));
  } catch (error) {
    console.error("Failed to fetch frames catalog:", error);
    return [];
  }
}

export const getFramesCatalog = unstable_cache(
  async () => readFramesCatalog(),
  ["cloudinary-frames-cache"],
  { revalidate: 3600, tags: ["frames"] },
);

/** Uncached catalog fetch — for the admin panel where instant freshness matters. */
export const getFramesCatalogUncached = async () => {
  // Admin route: always rescan Cloudinary so freshly uploaded frames appear
  // immediately. KV is only trusted for rich metadata (names, geometry,
  // colors, default variants, pro status), which we overlay onto the scan.
  const scanned = await fetchCatalogUncached();
  if (scanned.length === 0) return scanned;

  const merged = await Promise.all(
    scanned.map(async (cat) => {
      const kvCat = await kv.get<KvCategory>(framesCategoryKey(cat.id));
      if (kvCat) {
        cat.label = kvCat.label;
        cat.iconUrl = kvCat.iconUrl;
      }
      for (const frame of cat.frames) {
        const kvFrame = await kv.get<FrameInfo>(framesFrameKey(frame.id));
        if (kvFrame) {
          frame.name = kvFrame.name;
          frame.isFree = kvFrame.isFree;
          frame.supportsOrientation = kvFrame.supportsOrientation ?? false;
          frame.defaultVariant = kvFrame.defaultVariant;
          frame.colors = kvFrame.colors ?? {};
          frame.geometry = kvFrame.geometry ?? null;
        }
      }
      return cat;
    }),
  );

  await writeKvCatalog(merged);
  return merged;
};

/* ── KV entity helpers ────────────────────────────────── */

type KvCategory = { id: string; label: string; iconUrl: string | null };

/**
 * Reads the catalog tree from per-entity KV keys.
 * Returns null when the index is absent (first run / wiped).
 */
async function readKvCatalog(): Promise<FrameCategoryInfo[] | null> {
  try {
    const ids = (await kv.get<string[]>(FRAMES_CATEGORIES_INDEX_KEY)) ?? [];
    if (!ids.length) return null;

    const categories: FrameCategoryInfo[] = [];
    for (const catId of ids) {
      const cat = await kv.get<KvCategory>(framesCategoryKey(catId));
      if (!cat) continue;
      const frameIds =
        (await kv.get<string[]>(framesCategoryFramesKey(catId))) ?? [];
      const frames: FrameInfo[] = [];
      for (const frameId of frameIds) {
        const frame = await kv.get<FrameInfo>(framesFrameKey(frameId));
        if (frame) frames.push(frame);
      }
      frames.sort((a, b) => a.id.localeCompare(b.id));
      categories.push({ ...cat, frames });
    }
    categories.sort((a, b) => a.id.localeCompare(b.id));
    return categories;
  } catch (error) {
    console.error("readKvCatalog failed:", error);
    return null;
  }
}

/**
 * Persists a scanned catalog into per-entity KV keys.
 */
async function writeKvCatalog(catalog: FrameCategoryInfo[]): Promise<void> {
  await kv.set(
    FRAMES_CATEGORIES_INDEX_KEY,
    catalog.map((c) => c.id),
  );
  for (const cat of catalog) {
    await kv.set(framesCategoryKey(cat.id), {
      id: cat.id,
      label: cat.label,
      iconUrl: cat.iconUrl,
    });
    await kv.set(
      framesCategoryFramesKey(cat.id),
      cat.frames.map((f) => f.id),
    );
    for (const frame of cat.frames) {
      await kv.set(framesFrameKey(frame.id), frame);
    }
  }
}

/**
 * Reads the catalog from Upstash KV. If absent (first run / cache wiped),
 * rebuilds it from Cloudinary and seeds KV.
 */
async function readFramesCatalog(): Promise<FrameCategoryInfo[]> {
  const cached = await readKvCatalog();
  if (cached) return cached;

  const catalog = await fetchCatalogUncached();
  await writeKvCatalog(catalog);
  return catalog;
}

/**
 * Rebuilds the catalog from Cloudinary and persists to KV while preserving
 * rich metadata already in KV (category labels/icons, frame names, colors,
 * geometry, default variants, pro status). Scanned variant URLs stay
 * authoritative — the scan is the only component that knows the real
 * asset structure after uploads/deletes/renames.
 */
export async function refreshFramesCatalog(): Promise<FrameCategoryInfo[]> {
  await getAdminUser();
  const catalog = await fetchCatalogUncached();

  for (const cat of catalog) {
    const kvCat = await kv.get<KvCategory>(framesCategoryKey(cat.id));
    if (kvCat) {
      cat.label = kvCat.label;
      cat.iconUrl = kvCat.iconUrl;
    }
    for (const frame of cat.frames) {
      const kvFrame = await kv.get<FrameInfo>(framesFrameKey(frame.id));
      if (kvFrame) {
        frame.name = kvFrame.name;
        frame.isFree = kvFrame.isFree;
        frame.supportsOrientation = kvFrame.supportsOrientation ?? false;
        frame.defaultVariant = kvFrame.defaultVariant;
        frame.colors = kvFrame.colors ?? {};
        frame.geometry = kvFrame.geometry ?? null;
      }
    }
  }

  await writeKvCatalog(catalog);
  return catalog;
}

/** Directly removes a frame from its category's KV keys. */
async function removeFrameFromKv(
  categoryId: string,
  frameId: string,
): Promise<void> {
  await kv.del(framesFrameKey(frameId));
  const ids =
    (await kv.get<string[]>(framesCategoryFramesKey(categoryId))) ?? [];
  await kv.set(
    framesCategoryFramesKey(categoryId),
    ids.filter((id) => id !== frameId),
  );
}

/** Creates a category entry in KV. */
async function upsertCategoryInKv(
  id: string,
  label: string,
  iconUrl: string | null,
): Promise<void> {
  const existing = await readKvCatalog();
  await kv.set(framesCategoryKey(id), { id, label, iconUrl });
  if (!existing || !existing.some((c) => c.id === id)) {
    const ids = (await kv.get<string[]>(FRAMES_CATEGORIES_INDEX_KEY)) ?? [];
    await kv.set(FRAMES_CATEGORIES_INDEX_KEY, [...ids, id]);
  }
}

/** Removes a category + its frames from KV entirely. */
async function deleteCategoryFromKv(id: string): Promise<void> {
  const frameIds = (await kv.get<string[]>(framesCategoryFramesKey(id))) ?? [];
  for (const frameId of frameIds) {
    await kv.del(framesFrameKey(frameId));
  }
  await kv.del(framesCategoryKey(id));
  await kv.del(framesCategoryFramesKey(id));
  const ids = (await kv.get<string[]>(FRAMES_CATEGORIES_INDEX_KEY)) ?? [];
  await kv.set(
    FRAMES_CATEGORIES_INDEX_KEY,
    ids.filter((catId) => catId !== id),
  );
}

export async function deleteFrame(
  categoryId: string,
  frameId: string,
): Promise<void> {
  await getAdminUser();

  const folderPath = `${FRAMES_ROOT}/${categoryId}/${frameId}`;

  await deleteCloudinaryFolder(folderPath, { deleteFolder: true });
  await removeFrameFromKv(categoryId, frameId);
}

export async function deleteVariant(
  categoryId: string,
  frameId: string,
  variantId: string,
): Promise<void> {
  await getAdminUser();

  const folderPath = `${FRAMES_ROOT}/${categoryId}/${frameId}/${variantId}`;

  // Remove the variant's image assets + the folder itself
  await deleteCloudinaryFolder(folderPath, { deleteFolder: true });

  const frame = await kv.get<FrameInfo>(framesFrameKey(frameId));
  if (frame) {
    frame.variants = frame.variants.filter((v) => v.id !== variantId);
    if (frame.defaultVariant === variantId) frame.defaultVariant = null;
    await kv.set(framesFrameKey(frameId), frame);
  }
}

function humanize(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

async function getFrameFromKv(
  categoryId: string,
  frameId: string,
): Promise<FrameInfo | null> {
  const frame = await kv.get<FrameInfo>(framesFrameKey(frameId));
  if (frame) return frame;
  // ensure it's indexed under the category (for frames created before this structure)
  await kv.set(
    framesFrameKey(frameId),
    {
      id: frameId,
      name: humanize(frameId),
      isFree: true,
      supportsOrientation: false,
      defaultVariant: null,
      colors: {},
      geometry: null,
      variants: [],
    },
    { nx: true },
  );
  const ids =
    (await kv.get<string[]>(framesCategoryFramesKey(categoryId))) ?? [];
  if (!ids.includes(frameId)) {
    await kv.set(framesCategoryFramesKey(categoryId), [...ids, frameId]);
  }
  return kv.get<FrameInfo>(framesFrameKey(frameId));
}

export async function setFrameDefaultVariant(
  categoryId: string,
  frameId: string,
  variantId: string,
) {
  await getAdminUser();

  try {
    const frame = await getFrameFromKv(categoryId, frameId);
    if (!frame) return;
    frame.defaultVariant = variantId;
    await kv.set(framesFrameKey(frameId), frame);
  } catch (error) {
    console.error("Failed to set default variant:", error);
  }
}

export type FrameVariantDraftInput = {
  id: string;
  name: string;
  hasFrame?: boolean;
  hasThumb?: boolean;
  existingFrameUrl?: string | null;
  existingThumbUrl?: string | null;
};

export type FrameMetadataPatch = {
  name?: string;
  is_free?: boolean;
  supports_orientation?: boolean;
  kind?: FrameKind;
  default_variant?: string | null;
  colors?: Record<string, string>;
  geometry?: FrameGeometry;
  variants?: FrameVariantDraftInput[];
};

export async function updateFrameMetadata(
  categoryId: string,
  frameId: string,
  patch: FrameMetadataPatch,
): Promise<void> {
  await getAdminUser();

  const frame = (await getFrameFromKv(categoryId, frameId)) ?? {
    id: frameId,
    name: frameId,
    isFree: true,
    supportsOrientation: false,
    defaultVariant: null,
    colors: {},
    geometry: null,
    variants: [],
  };

  if (patch.name !== undefined) frame.name = patch.name;
  if (patch.is_free !== undefined) frame.isFree = patch.is_free;
  if (patch.kind !== undefined) frame.kind = patch.kind;
  if (patch.supports_orientation !== undefined)
    frame.supportsOrientation = patch.supports_orientation;
  if (patch.default_variant !== undefined)
    frame.defaultVariant = patch.default_variant;
  if (patch.colors !== undefined) frame.colors = patch.colors;
  if (patch.geometry !== undefined) frame.geometry = patch.geometry;

  if (patch.variants !== undefined) {
    frame.variants = patch.variants
      .filter((v) => v.name.trim().length > 0)
      .map((v) => {
        const varName = v.name.trim();
        const framePid = `${FRAMES_ROOT}/${categoryId}/${frameId}/${varName}/frame`;
        const thumbPid = `${FRAMES_ROOT}/${categoryId}/${frameId}/${varName}/thumb`;

        const frameUrl = v.hasFrame
          ? cloudinary.url(framePid, {
              type: "upload",
              secure: true,
              transformation: [{ fetch_format: "auto", quality: "auto" }],
            })
          : (v.existingFrameUrl ?? null);

        const thumbUrl = v.hasThumb
          ? cloudinary.url(thumbPid, {
              type: "upload",
              secure: true,
              transformation: [{ fetch_format: "auto", quality: "auto" }],
            })
          : (v.existingThumbUrl ?? null);

        return {
          id: varName,
          frameUrl,
          thumbUrl,
          framePublicId: framePid,
          thumbPublicId: thumbPid,
          frameType: "upload",
        };
      });
  }

  await kv.set(framesFrameKey(frameId), frame);

  // Ensure category and global indexes contain this category & frame
  const catFrames =
    (await kv.get<string[]>(framesCategoryFramesKey(categoryId))) ?? [];
  if (!catFrames.includes(frameId)) {
    await kv.set(framesCategoryFramesKey(categoryId), [...catFrames, frameId]);
  }
  const allCatIds = (await kv.get<string[]>(FRAMES_CATEGORIES_INDEX_KEY)) ?? [];
  if (!allCatIds.includes(categoryId)) {
    await kv.set(FRAMES_CATEGORIES_INDEX_KEY, [...allCatIds, categoryId]);
  }
}

/**
 * Migrates existing variant images from one Cloudinary access type to another
 * (upload <-> authenticated) after a free/pro toggle in edit mode.
 * Assets live in separate Cloudinary namespaces per type, so each is
 * re-uploaded under the new type with the same public id, then destroyed
 * from the old type. Slots that were freshly uploaded (freshSlots) already
 * exist in the new type and are skipped.
 */
export async function migrateFrameVariantType(
  frameId: string,
  newType: "upload" | "authenticated",
  freshSlots: Record<string, { frame?: boolean; thumb?: boolean }> = {},
): Promise<void> {
  await getAdminUser();

  const frame = await kv.get<FrameInfo>(framesFrameKey(frameId));
  if (!frame) return;

  const oldType: "upload" | "authenticated" =
    newType === "upload" ? "authenticated" : "upload";
  const signUrl = newType === "authenticated";

  let changed = false;
  for (const variant of frame.variants) {
    const fresh = freshSlots[variant.id] ?? {};
    const slots: { key: "frame" | "thumb"; pid: string | null | undefined }[] =
      [
        { key: "frame", pid: variant.framePublicId },
        { key: "thumb", pid: variant.thumbPublicId },
      ];

    for (const slot of slots) {
      if (!slot.pid || fresh[slot.key]) continue;
      // Already hosted in the target namespace? (e.g. mixed types)
      if (slot.key === "frame" && variant.frameType === newType) continue;

      try {
        const srcUrl = cloudinary.url(slot.pid, {
          type: oldType,
          sign_url: oldType === "authenticated",
          secure: true,
        });

        // Cloudinary uploader accepts remote public/signed URLs directly
        await cloudinary.uploader.upload(srcUrl, {
          public_id: slot.pid,
          type: newType,
          overwrite: true,
        });
        await cloudinary.uploader.destroy(slot.pid, { type: oldType });
      } catch (error) {
        console.error("migrateFrameVariantType: failed for", slot.pid, error);
      }
    }

    if (variant.frameType !== newType) {
      if (!fresh.frame && variant.framePublicId) {
        variant.frameUrl = cloudinary.url(variant.framePublicId, {
          type: newType,
          sign_url: signUrl,
          secure: true,
          transformation: [{ fetch_format: "auto", quality: "auto" }],
        });
      }
      if (!fresh.thumb && variant.thumbPublicId) {
        variant.thumbUrl = cloudinary.url(variant.thumbPublicId, {
          type: newType,
          sign_url: signUrl,
          secure: true,
          transformation: [{ fetch_format: "auto", quality: "auto" }],
        });
      }
      variant.frameType = newType;
      changed = true;
    }
  }

  if (changed) {
    await kv.set(framesFrameKey(frameId), frame);
  }
}

export async function createCategory(options: {
  id: string;
  label?: string;
  icon?: string;
}): Promise<void> {
  await getAdminUser();

  const id = slugify(options.id);
  if (!id) throw new Error("Category id is required");

  await upsertCategoryInKv(id, options.label ?? humanize(id), null);
}

export async function renameCategory(
  id: string,
  newId: string,
  label?: string,
): Promise<void> {
  await getAdminUser();

  if (!id || !newId) return;

  const newSlug = slugify(newId);

  // If slug/ID is unchanged (e.g. only label casing changed like "Iphone" -> "iPhone")
  if (newSlug === id) {
    if (label) {
      const cat = await kv.get<KvCategory>(framesCategoryKey(id));
      if (cat) {
        await kv.set(framesCategoryKey(id), {
          ...cat,
          label: label.trim(),
        });
      }
    }
    return;
  }

  const fromPrefix = `${FRAMES_ROOT}/${id}/`;
  const toPrefix = `${FRAMES_ROOT}/${newSlug}/`;

  // Move every image asset from old to new prefix
  const [images, proImages] = await Promise.all([
    cloudinary.api.resources({
      type: "upload",
      prefix: fromPrefix,
      resource_type: "image",
      max_results: 500,
    }),
    cloudinary.api.resources({
      type: "authenticated",
      prefix: fromPrefix,
      resource_type: "image",
      max_results: 500,
    }),
  ]);

  const moveAsset = async (publicId: string) => {
    const newPublicId = publicId.replace(fromPrefix, toPrefix);
    try {
      await cloudinary.uploader.rename(publicId, newPublicId, {
        overwrite: true,
      });
    } catch (error) {
      console.error("Failed to move", publicId, error);
    }
  };

  await Promise.all([
    ...(images.resources ?? []).map((r: any) => moveAsset(r.public_id)),
    ...(proImages.resources ?? []).map((r: any) => moveAsset(r.public_id)),
  ]);

  // Move KV keys: category + its frame index + all frame keys (public ids must
  // be rewritten to the new prefix).
  const frameIds = (await kv.get<string[]>(framesCategoryFramesKey(id))) ?? [];
  const oldCat = await kv.get<KvCategory>(framesCategoryKey(id));
  await kv.del(framesCategoryKey(id));
  await kv.del(framesCategoryFramesKey(id));
  await kv.set(framesCategoryKey(newSlug), {
    id: newSlug,
    label: label ?? oldCat?.label ?? humanize(newSlug),
    iconUrl: oldCat?.iconUrl ?? null,
  });
  await kv.set(framesCategoryFramesKey(newSlug), frameIds);
  for (const frameId of frameIds) {
    const frame = await kv.get<FrameInfo>(framesFrameKey(frameId));
    if (!frame) continue;
    const moved = {
      ...frame,
      variants: frame.variants.map((v) => ({
        ...v,
        framePublicId: v.framePublicId?.replace(fromPrefix, toPrefix) ?? null,
        thumbPublicId: v.thumbPublicId?.replace(fromPrefix, toPrefix) ?? null,
        frameUrl: v.frameUrl?.replace(fromPrefix, toPrefix) ?? null,
        thumbUrl: v.thumbUrl?.replace(fromPrefix, toPrefix) ?? null,
      })),
    };
    await kv.set(framesFrameKey(frameId), moved);
  }

  // Update the categories index: replace id with newSlug
  const ids = (await kv.get<string[]>(FRAMES_CATEGORIES_INDEX_KEY)) ?? [];
  await kv.set(
    FRAMES_CATEGORIES_INDEX_KEY,
    ids.map((catId) => (catId === id ? newSlug : catId)),
  );
}

export async function deleteCategory(id: string): Promise<void> {
  await getAdminUser();

  const idParts = id.split("/");
  if (idParts.length !== 1) throw new Error("Invalid category");

  await deleteCloudinaryFolder(`${FRAMES_ROOT}/${id}`, {
    deleteFolder: true,
  });
  await deleteCategoryFromKv(id);
}

export async function updateCategoryIcon(
  id: string,
  iconDataUrl: string,
): Promise<void> {
  await getAdminUser();

  await cloudinary.uploader.upload(iconDataUrl, {
    folder: `${FRAMES_ROOT}/${id}`,
    public_id: "icon",
    resource_type: "image",
    type: "upload",
    overwrite: true,
    invalidate: true,
  });

  const cat = await kv.get<KvCategory>(framesCategoryKey(id));
  const iconUrl = cloudinary.url(`${FRAMES_ROOT}/${id}/icon`, {
    secure: true,
    type: "upload",
    transformation: [{ width: 48, height: 48, crop: "fill" }],
  });
  await kv.set(framesCategoryKey(id), {
    id,
    label: cat?.label ?? humanize(id),
    iconUrl,
  });
}
