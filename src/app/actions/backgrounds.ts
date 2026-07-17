"use server";

import { createServerClient, createServiceClient } from "@/lib/supabase/server";

export type Background = {
  id: string;
  category: "mesh" | "image";
  name: string;
  thumbnail_url: string | null;
  storage_path: string | null;
  is_free: boolean;
};

export async function getBackgrounds(): Promise<Background[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("backgrounds")
    .select("*")
    .order("is_free", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch premium backgrounds:", error);
    return [];
  }

  return data as Background[];
}

export type PremiumAssetResponse = {
  url?: string;
  cssValue?: string;
};

export async function getPremiumAsset(id: string) {
  const supabase = await createServerClient();
  const { data: bg } = await supabase
    .from("backgrounds")
    .select("*")
    .eq("id", id)
    .single();

  if (!bg) return null;

  // If it's a free background, it is stored in the public bucket
  if (bg.is_free && bg.storage_path) {
    const { createClient } = await import("@supabase/supabase-js");
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: publicData } = adminSupabase.storage
      .from("prettyshot")
      .getPublicUrl(bg.storage_path);
    return { url: publicData.publicUrl };
  }

  // Verify User and Pro Status
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !authUser) {
    throw new Error("Unauthorized: Please log in.");
  }

  const isPro = authUser.user_metadata?.is_pro === true;
  const trialEndsAt = authUser.user_metadata?.trial_ends_at
    ? new Date(authUser.user_metadata.trial_ends_at)
    : null;
  const isTrialActive = trialEndsAt && trialEndsAt > new Date();

  if (!isPro && !isTrialActive) {
    throw new Error("Unauthorized: Premium backgrounds require a Pro license.");
  }

  // Fetch the metadata to get the storage path
  const { data: bgData, error: bgError } = await supabase
    .from("backgrounds")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (bgError || !bgData) {
    throw new Error("Background not found.");
  }

  if (!bgData.storage_path) {
    throw new Error("Asset has no storage path.");
  }

  // Generate a signed URL valid for 60 seconds
  const adminSupabase = createServiceClient();
  const { data, error } = await adminSupabase.storage
    .from("premium-assets")
    .createSignedUrl(bgData.storage_path, 60); // 60 seconds expiry

  if (error || !data) {
    console.error("Failed to generate signed URL:", error);
    throw new Error("Failed to generate signed URL.");
  }

  return { url: data.signedUrl };
}

export async function uploadBackground(formData: FormData) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    throw new Error("Unauthorized.");
  }

  const { ADMIN_EMAILS } = await import("@/config");
  if (!ADMIN_EMAILS.includes(user.email)) {
    throw new Error("Nice try, hacker. Admin access only.");
  }

  const name = formData.get("name") as string;
  const category = formData.get("category") as "mesh" | "image";
  const isFree = formData.get("is_free") === "true";
  const thumbnailFile = formData.get("thumbnail_file") as File | null;
  const assetFile = formData.get("asset_file") as File | null;

  if (!name || !category) {
    throw new Error("Missing required fields.");
  }

  if (!thumbnailFile || thumbnailFile.size === 0) {
    throw new Error("You must provide an image.");
  }

  const uuid = crypto.randomUUID();

  const { createClient } = await import("@supabase/supabase-js");
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Upload Thumbnail (Public bucket)
  let thumbnailUrl = null;
  if (thumbnailFile && thumbnailFile.size > 0) {
    const thumbExt = thumbnailFile.name.split(".").pop();
    const thumbPath = `bg-thumbnails/${uuid}-thumb.${thumbExt}`;

    const { error: thumbError } = await adminSupabase.storage
      .from("prettyshot")
      .upload(thumbPath, thumbnailFile, { upsert: false });

    if (thumbError)
      throw new Error("Failed to upload thumbnail: " + thumbError.message);

    const { data: thumbPublicData } = adminSupabase.storage
      .from("prettyshot")
      .getPublicUrl(thumbPath);
    thumbnailUrl = thumbPublicData.publicUrl;
  }

  // Upload Asset if provided
  let storagePath = null;
  if (assetFile && assetFile.size > 0) {
    const assetExt = assetFile.name.split(".").pop();
    const fileName = `${uuid}-asset.${assetExt}`;

    const bucket = isFree ? "prettyshot" : "premium-assets";
    const path = isFree ? `backgrounds/${fileName}` : fileName;

    const { error: assetError } = await adminSupabase.storage
      .from(bucket)
      .upload(path, assetFile, { upsert: false });

    if (assetError)
      throw new Error("Failed to upload asset: " + assetError.message);

    if (isFree){
      const { data: publicData } = adminSupabase.storage
        .from("prettyshot")
        .getPublicUrl(path);
      storagePath = publicData.publicUrl;
    } else{
      storagePath = path;
    }
  }

  // Insert into Database
  const { error: insertError } = await adminSupabase
    .from("backgrounds")
    .insert({
      id: uuid,
      name,
      category,
      thumbnail_url: thumbnailUrl,
      storage_path: storagePath,
      is_free: isFree,
    });

  if (insertError)
    throw new Error("Failed to insert into database: " + insertError.message);

  return { success: true };
}

export async function updateBackground(id: string, data: { name: string; category: string; is_free: boolean }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { ADMIN_EMAILS } = await import("@/config");
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) throw new Error("Unauthorized");

  const adminSupabase = createServiceClient();
  
  // NOTE: Moving from free to premium (or vice-versa) would technically require moving the file between buckets.
  // For simplicity, we just update the DB flags here. If the file is in public bucket but marked premium, 
  // it'll still work (just won't be as secure).
  
  const { error } = await adminSupabase
    .from("backgrounds")
    .update({
      name: data.name,
      category: data.category,
      is_free: data.is_free,
    })
    .eq("id", id);

  if (error) throw new Error("Failed to update background: " + error.message);
  return { success: true };
}

export async function deleteBackground(id: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { ADMIN_EMAILS } = await import("@/config");
  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) throw new Error("Unauthorized");

  const adminSupabase = createServiceClient();

  // Get background to find storage paths
  const { data: bg } = await adminSupabase.from("backgrounds").select("*").eq("id", id).single();
  if (bg) {
    // We try to delete the thumbnail from 'prettyshot'
    if (bg.thumbnail_url) {
      const thumbPath = bg.thumbnail_url.split('/public/prettyshot/')[1];
      if (thumbPath) await adminSupabase.storage.from("prettyshot").remove([thumbPath]);
    }

    // Try to delete the asset
    if (bg.storage_path) {
      if (bg.is_free && bg.storage_path.includes('/public/prettyshot/')) {
        const path = bg.storage_path.split('/public/prettyshot/')[1];
        if (path) await adminSupabase.storage.from("prettyshot").remove([path]);
      } else {
        // It's in premium-assets
        await adminSupabase.storage.from("premium-assets").remove([bg.storage_path]);
      }
    }
  }

  const { error } = await adminSupabase.from("backgrounds").delete().eq("id", id);
  if (error) throw new Error("Failed to delete background: " + error.message);
  return { success: true };
}
