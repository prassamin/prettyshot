import { NextRequest, NextResponse } from "next/server";
import { Polar } from "@polar-sh/sdk";
import { createClient } from "@supabase/supabase-js";
import { getOrigin } from "@/lib/url";

// Use the Service Role Key because we are bypassing RLS to update the user's profile securely on the backend
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  // Polar might append it as checkout_id or checkoutId depending on the exact SDK version
  const checkoutId = url.searchParams.get("checkout_id") || url.searchParams.get("checkoutId") || url.searchParams.get("id");
  const origin = await getOrigin();
  const fallbackRedirect = NextResponse.redirect(`${origin}/editor`);

  if (!checkoutId) {
    console.error("No checkout ID found in Polar callback.");
    return fallbackRedirect;
  }

  try {
    const polar = new Polar({
      accessToken: process.env.POLAR_ACCESS_TOKEN!,
      server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
    });

    // 1. Fetch the checkout details from Polar's server securely
    const checkout = await polar.checkouts.get({ id: checkoutId });

    // 2. Verify that the checkout actually succeeded
    if (checkout.status === "succeeded" || checkout.status === "confirmed") {
      const userId = checkout.metadata?.supabase_user_id;
      
      if (userId) {
        // 3. Update the Supabase profile securely
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ is_pro: true, polar_order_id: checkout.id })
          .eq("id", userId);

        if (error) {
          console.error("Failed to update user profile to Pro:", error);
        } else {
          console.log(`Successfully upgraded user ${userId} to PRO via Checkout ID exchange!`);
        }
      } else {
        console.error("No Supabase User ID found in checkout metadata!");
      }
    } else {
      console.log("Checkout is not in a succeeded state. Current state:", checkout.status);
    }

    // 4. Finally, redirect the user back to the editor with a success parameter to show the confetti/toast!
    return NextResponse.redirect(`${origin}/editor?success=true`);
  } catch (error) {
    console.error("Error validating Polar checkout:", error);
    return fallbackRedirect;
  }
}
