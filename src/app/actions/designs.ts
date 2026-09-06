"use server";

import { createServerClient } from "@/lib/supabase/server";
import { isPro } from "@/lib/utils";

export type SaveDesignResult = {
  success: boolean;
  error?: string;
};

/**
 * Server action to securely persist a design to the Supabase `designs` table.
 * Verifies authentication and active Pro / Trial status on the server.
 */
export async function saveDesignAction(
  designId: string,
  config: any,
): Promise<SaveDesignResult> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated." };
    }

    // Verify Pro or active trial from profiles table as well as user metadata
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro, trial_ends_at")
      .eq("id", user.id)
      .single();

    const userWithProfile = {
      ...user,
      is_pro: profile?.is_pro ?? user.user_metadata?.is_pro,
      trial_ends_at: profile?.trial_ends_at ?? user.user_metadata?.trial_ends_at,
    };

    const pro = isPro(userWithProfile);
    if (!pro.isActive) {
      return { success: false, error: "Cloud save is available for Pro users." };
    }

    const payload = {
      id: designId,
      user_id: user.id,
      name: config.name || "Untitled Design",
      config,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("designs").upsert(payload);
    if (error) {
      console.error("Server saveDesignAction upsert error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error("saveDesignAction unexpected error:", err);
    return { success: false, error: err?.message || "Internal server error" };
  }
}
