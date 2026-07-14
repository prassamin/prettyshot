import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";

// We use the Service Role Key here because webhooks run on the backend 
// and need permission to bypass Row Level Security (RLS) to update the user's profile.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onOrderCreated: async (payload) => {
    console.log("Order created:", payload.id);
    
    // Grab the supabase_user_id we injected into the metadata during checkout
    const supabaseUserId = payload.metadata?.supabase_user_id;

    if (!supabaseUserId) {
      console.error("No Supabase User ID found in order metadata!");
      return;
    }

    // Update the user's profile to make them a Pro user
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_pro: true, polar_order_id: payload.id })
      .eq("id", supabaseUserId);

    if (error) {
      console.error("Failed to update user profile:", error);
    } else {
      console.log(`Successfully upgraded user ${supabaseUserId} to PRO!`);
    }
  },
});
