import type { FrameCategoryInfo } from "@/app/actions/frames";

export type VariantDraft = {
  id: string;
  name: string;
  color: string;
  frame: File | null;
  thumb: File | null;
  preview: string | null;
  existingFrameUrl?: string | null;
  existingThumbUrl?: string | null;
};

export type EditingFrame = {
  categoryId: string;
  frame: FrameCategoryInfo["frames"][number];
};

export type FrameCreatorProps = {
  categories: FrameCategoryInfo[];
  onUploaded: () => void;
  editing: EditingFrame | null;
};

export type UploadSig = {
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

export type PendingUpload = {
  file: File;
  folder: string;
  publicId: string;
  resourceType: "image" | "raw";
  type: "upload" | "authenticated";
  key: string;
};