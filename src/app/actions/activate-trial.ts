"use server";

import { createServerClient } from "@/lib/supabase/server";

export async function activateFreeTrial() {
  const supabase = await createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if they already have a trial to prevent abuse
  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_ends_at, is_pro")
    .eq("id", user.id)
    .single();

  if (profile?.is_pro) {
    return { success: false, error: "You are already a Pro user" };
  }

  if (profile?.trial_ends_at) {
    return { success: false, error: "Trial has already been activated" };
  }

  // Set trial_ends_at to 1 day (24 hours) from now
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 1);

  const { error } = await supabase
    .from("profiles")
    .update({ trial_ends_at: trialEndsAt.toISOString() })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
