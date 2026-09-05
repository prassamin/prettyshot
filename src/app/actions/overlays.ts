"use server";

import { unstable_cache } from "next/cache";
import { cloudinary, getCloudinaryThumbnailUrl } from "@/lib/cloudinary";

export type Overlay = {
  id: number;
  name: string;
  url: string;
  thumbnail: string;
};

const FOLDER = "prettyshot/overlays";

async function fetchOverlaysFromCloudinary(): Promise<Overlay[]> {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: `${FOLDER}/`,
      max_results: 200,
      sort_by: ["public_id", "asc"],
    });

    return (result.resources || []).map((r: any, i: number) => {
      const thumb = getCloudinaryThumbnailUrl(r.public_id, {
        width: 300,
        height: 300,
        crop: "fill",
        type: "upload",
      });
      return {
        id: i + 1,
        name: `Overlay ${i + 1}`,
        url: r.secure_url,
        thumbnail: thumb,
      };
    });
  } catch (error) {
    console.error("Failed to fetch overlays from Cloudinary:", error);
    return [];
  }
}

export const getOverlays = unstable_cache(
  async () => fetchOverlaysFromCloudinary(),
  ["cloudinary-overlays-v3"],
  { revalidate: 3600, tags: ["overlays"] },
);
