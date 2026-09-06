"use client";

import * as React from "react";
import type { FrameKind } from "@/editor/property-panel/sections/frame/types";
import { toast } from "@heroui/react";

import {
  deleteVariant,
  getFrameUploadSignatures,
  updateFrameMetadata,
  type FrameCategoryInfo,
} from "@/app/actions/frames";
import {
  type EditingFrame,
  type PendingUpload,
  type UploadSig,
  type VariantDraft,
} from "./types";
import {
  colorForVariant,
  DEFAULT_GEOMETRY,
  detectGeometryFromFile,
} from "./utils";
import { slugify } from "@/lib/utils";
import { MAX_FILE_SIZE } from "@/config";

export function useFrameCreator(
  editing: EditingFrame | null,
  categories: FrameCategoryInfo[],
) {
  const [categoryId, setCategoryId] = React.useState("");
  const [isNewCategory, setIsNewCategory] = React.useState(false);
  const [categoryIcon, setCategoryIcon] = React.useState<File | null>(null);

  const [frameName, setFrameName] = React.useState("");
  const frameIdTouched = React.useRef(false);
  const [frameId, setFrameId] = React.useState("");
  const [isFree, setIsFree] = React.useState(true);
  const [kind, setKind] = React.useState<FrameKind>("phone");
  const [supportsOrientation, setSupportsOrientation] = React.useState(false);

  const [variants, setVariants] = React.useState<VariantDraft[]>([]);
  const [defaultVariantId, setDefaultVariantId] = React.useState("");
  const [geometry, setGeometry] = React.useState(DEFAULT_GEOMETRY);
  const [geometryOpen, setGeometryOpen] = React.useState(false);
  const [geometryDetecting, setGeometryDetecting] = React.useState(false);

  const [uploading, setUploading] = React.useState(false);
  const [progressMap, setProgressMap] = React.useState<Record<string, number>>({});
  const [done, setDone] = React.useState(false);
  const [removedVariants, setRemovedVariants] = React.useState<string[]>([]);

  const isEditing = !!editing;
  const categorySlug = isNewCategory ? slugify(categoryId) : categoryId;

  /* ── identity handlers ───────────────────────────────── */

  const handleNameChange = React.useCallback(
    (value: string) => {
      setFrameName(value);
      if (!frameIdTouched.current) setFrameId(slugify(value));
    },
    [],
  );

  const handleIdChange = React.useCallback((value: string) => {
    frameIdTouched.current = true;
    setFrameId(value);
  }, []);

  /* ── prefill (edit mode) ─────────────────────────────── */

  const applyEditForm = React.useCallback(() => {
    if (!editing) return;
    setRemovedVariants([]);
    setCategoryId(editing.categoryId);
    setIsNewCategory(false);
    setCategoryIcon(null);
    setFrameName(editing.frame.name);
    frameIdTouched.current = true;
    setFrameId(editing.frame.id);
    setIsFree(editing.frame.isFree);
    setKind((editing.frame.kind as FrameKind) || "phone");
    setSupportsOrientation(editing.frame.supportsOrientation ?? false);

    const defaultRawId =
      editing.frame.defaultVariant ?? editing.frame.variants[0]?.id ?? "";
    setDefaultVariantId(defaultRawId ? `e${defaultRawId}` : "");
    setGeometry(editing.frame.geometry ?? DEFAULT_GEOMETRY);
    setVariants(
      editing.frame.variants.map((v) => ({
        id: `e${v.id}`,
        name: v.id,
        color: colorForVariant(v.id, editing.frame.colors ?? {}),
        frame: null,
        thumb: null,
        preview: null,
        existingFrameUrl: v.frameUrl,
        existingThumbUrl: v.thumbUrl,
      })),
    );
    setDone(false);
    setProgressMap({});
  }, [editing]);

  const applyEditFormRef = React.useRef(applyEditForm);
  applyEditFormRef.current = applyEditForm;

  React.useEffect(() => {
    applyEditFormRef.current();
  }, [editing?.frame.id]);

  /* ── variants ────────────────────────────────────────── */

  const addVariant = () => {
    const id = `v${Date.now()}`;
    setVariants((prev) => [
      ...prev,
      { id, name: "", color: "#6b7280", frame: null, thumb: null, preview: null },
    ]);
    if (!defaultVariantId) setDefaultVariantId(id);
  };

  const patchVariant = (id: string, patch: Partial<VariantDraft>) => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));

    if (patch.frame && !geometryDetecting) {
      setGeometryDetecting(true);
      detectGeometryFromFile(
        patch.frame,
        (detected) => setGeometry(detected),
        () => setGeometryDetecting(false),
      );
    }
  };

  const removeVariant = (id: string) => {
    if (isEditing) {
      const v = variants.find((x) => x.id === id);
      if (v && v.name.trim()) {
        setRemovedVariants((prev) => [...prev, v.name.trim()]);
      }
    }
    setVariants((prev) => prev.filter((v) => v.id !== id));
    if (defaultVariantId === id) setDefaultVariantId("");
  };

  /* ── upload ──────────────────────────────────────────── */

  const uploadFile = (file: File, sig: UploadSig) => {
    return new Promise<void>((resolve, reject) => {
      const endpoint =
        sig.resourceType === "raw"
          ? `https://api.cloudinary.com/v1_1/${sig.cloudName}/raw/upload`
          : `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`;

      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgressMap((p) => ({ ...p, [sig.key]: (e.loaded / e.total) * 100 }));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload failed (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("Network error"));

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", String(sig.timestamp));
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);
      form.append("public_id", sig.publicId);
      if (sig.type === "authenticated") form.append("type", "authenticated");
      xhr.send(form);
    });
  };

  const runUpload = async (onUploaded: () => void) => {
    setUploading(true);
    setDone(false);
    setProgressMap({});

    const type: "upload" = "upload";
    const baseFolder = isEditing
      ? `prettyshot/frames/${editing!.categoryId}`
      : `prettyshot/frames/${categorySlug}`;

    const uploads: PendingUpload[] = [];

    if (!isEditing && isNewCategory && categoryIcon) {
      uploads.push({
        file: categoryIcon,
        folder: baseFolder,
        publicId: "icon",
        resourceType: "image",
        type: "upload",
        key: "category-icon",
      });
    }

    const meta = {
      name: frameName.trim() || frameId,
      is_free: isFree,
      kind,
      supports_orientation: supportsOrientation,
      default_variant: defaultVariantId
        ? (variants.find((v) => v.id === defaultVariantId)?.name.trim() ?? null)
        : null,
      colors: Object.fromEntries(
        variants
          .filter((v) => v.name.trim())
          .map((v) => [v.name.trim(), v.color]),
      ),
      geometry,
    };

    const freshSlots: Record<string, { frame?: boolean; thumb?: boolean }> = {};

    for (const v of variants) {
      const vFolder = `${baseFolder}/${frameId}/${v.name.trim()}`;
      if (v.frame) {
        freshSlots[v.name.trim()] = { ...freshSlots[v.name.trim()], frame: true };
        uploads.push({
          file: v.frame,
          folder: vFolder,
          publicId: "frame",
          resourceType: "image",
          type: "upload",
          key: `${v.id}-frame`,
        });
      }
      if (v.thumb) {
        freshSlots[v.name.trim()] = { ...freshSlots[v.name.trim()], thumb: true };
        uploads.push({
          file: v.thumb,
          folder: vFolder,
          publicId: "thumb",
          resourceType: "image",
          type: "upload",
          key: `${v.id}-thumb`,
        });
      }
    }

    for (const u of uploads) {
      if (u.file.size > MAX_FILE_SIZE) {
        toast.danger(`File ${u.file.name} exceeds 10MB limit`);
        setUploading(false);
        return;
      }
    }

    try {
      const clientTimestamp = Math.round(Date.now() / 1000);
      const specs = uploads.map((u) => ({
        key: u.key,
        folder: u.folder,
        publicId: u.publicId,
        resourceType: u.resourceType,
        type: u.type,
      }));
      const signatures = await getFrameUploadSignatures(specs, clientTimestamp);
      const sigByKey = new Map(signatures.map((s) => [s.key, s]));

      for (const u of uploads) {
        const sig = sigByKey.get(u.key);
        if (!sig) throw new Error(`Missing signature for ${u.key}`);
        await uploadFile(u.file, sig);
        setProgressMap((p) => ({ ...p, [u.key]: 100 }));
      }

      if (isEditing && removedVariants.length > 0) {
        for (const variantName of removedVariants) {
          try {
            await deleteVariant(editing!.categoryId, frameId, variantName);
          } catch (err) {
            console.error("Failed to delete removed variant:", variantName, err);
          }
        }
      }

      // Persist frame metadata (name, colors, geometry, default) to KV.
      // The Cloudinary scan only rebuilds structure from images, so we
      // write the rich metadata here.
      const categoryResolved = isEditing
        ? editing!.categoryId
        : categorySlug;
      try {
        await updateFrameMetadata(categoryResolved, frameId, {
          name: meta.name,
          is_free: meta.is_free,
          kind: meta.kind,
          supports_orientation: meta.supports_orientation,
          default_variant: meta.default_variant,
          colors: meta.colors,
          geometry: meta.geometry,
          variants: variants.map((v) => ({
            id: v.id,
            name: v.name.trim(),
            hasFrame: Boolean(v.frame),
            hasThumb: Boolean(v.thumb),
            existingFrameUrl: v.existingFrameUrl,
            existingThumbUrl: v.existingThumbUrl,
          })),
        });
      } catch (err) {
        console.error("Failed to persist frame metadata to KV:", err);
      }

      setDone(true);
      toast.success(
        isEditing ? "Frame updated successfully" : "Frame uploaded successfully",
      );
      onUploaded();
    } catch (e) {
      toast.danger(
        `Upload failed: ${e instanceof Error ? e.message : "unknown error"}`,
      );
    } finally {
      setUploading(false);
    }
  };

  /* ── reset / clear ───────────────────────────────────── */

  const clearForm = (onUploaded?: () => void) => {
    setCategoryId("");
    setIsNewCategory(false);
    setCategoryIcon(null);
    setFrameName("");
    frameIdTouched.current = false;
    setFrameId("");
    setIsFree(true);
    setSupportsOrientation(false);
    setVariants([]);
    setDefaultVariantId("");
    setGeometry(DEFAULT_GEOMETRY);
    setGeometryOpen(false);
    setDone(false);
    setProgressMap({});
    setRemovedVariants([]);
    // When in edit mode, exit back to create mode
    if (isEditing) onUploaded?.();
  };

  const totalFiles =
    variants.length * 2 + (isNewCategory && categoryIcon ? 1 : 0) + 1;

  const ready =
    categorySlug.length > 0 &&
    frameId.length > 0 &&
    (isEditing
      ? variants.length > 0 && variants.every((v) => v.name.trim())
      : variants.length > 0 &&
        variants.every((v) => v.name.trim() && v.frame && v.thumb)) &&
    !uploading;

  return {
    // state
    categories,
    categoryId,
    setCategoryId,
    isNewCategory,
    setIsNewCategory,
    categoryIcon,
    setCategoryIcon,
    frameName,
    handleNameChange,
    frameId,
    handleIdChange,
    isFree,
    setIsFree,
    kind,
    setKind,
    supportsOrientation,
    setSupportsOrientation,
    variants,
    addVariant,
    patchVariant,
    removeVariant,
    defaultVariantId,
    setDefaultVariantId,
    geometry,
    setGeometry,
    geometryOpen,
    setGeometryOpen,
    geometryDetecting,
    uploading,
    progressMap,
    done,
    totalFiles,
    ready,
    isEditing,
    editing,
    runUpload,
    clearForm,
    applyEditForm,
    categorySlug,
  };
}

export type FrameCreatorState = ReturnType<typeof useFrameCreator>;