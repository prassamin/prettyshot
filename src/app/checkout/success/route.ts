import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUrl, getOrigin } from "@/lib/url";
import { polar } from "@/lib/polar";

export async function GET() {
  const currentUrl = await getCurrentUrl();
  const url = new URL(currentUrl);

  const checkoutId = url.searchParams.get("checkout_id");
  const next = url.searchParams.get("next");
  const origin = await getOrigin();
  const fallbackRedirect = NextResponse.redirect(`${origin}/editor`);

  if (!checkoutId) {
    console.error("No checkout ID found in Polar callback.");
    return fallbackRedirect;
  }

  try {
    // Fetch the checkout details from Polar's server securely
    const checkout = await polar.checkouts.get({ id: checkoutId });

    // Verify that the checkout actually succeeded
    if (checkout.status === "succeeded" || checkout.status === "confirmed") {
      const userId = checkout.externalCustomerId;

      if (userId) {
        // Update the Supabase profile securely. Uses the stateless service-role
        // client (no user JWT) so the `protect_profile_fields` trigger — which
        // reverts is_pro/polar_order_id/trial_ends_at whenever
        // auth.role() = 'authenticated' — does NOT undo this server-side write.
        const admin = createServiceClient();
        const { error } = await admin
          .from("profiles")
          .update({ is_pro: true, polar_order_id: checkout.id })
          .eq("id", userId);

        if (error) {
          console.error("Failed to update user profile to Pro:", error);
        }
      } else {
        console.error("No Supabase User ID found in checkout!");
      }
    } else {
      console.log(
        "Checkout is not in a succeeded state. Current state:",
        checkout.status,
      );
    }

    // Finally, redirect the user back to the editor with a success parameter to show the confetti/toast!
    const redirectUrl = next?.startsWith("/")
      ? `${origin}${next}`
      : next?.startsWith("https://") || next?.startsWith("https://")
        ? next
        : `${origin}/dashboard`;

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error validating Polar checkout:", error);
    return fallbackRedirect;
  }
}
