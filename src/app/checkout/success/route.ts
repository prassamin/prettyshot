import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getCurrentUrl, getOrigin } from "@/lib/url";
import { polar } from "@/lib/polar";

export async function GET() {
  const supabase = await createServerClient()
  const currentUrl = await getCurrentUrl();
  const url = new URL(currentUrl);
  // Polar might append it as checkout_id or checkoutId depending on the exact SDK version
  const checkoutId =
    url.searchParams.get("checkout_id") ||
    url.searchParams.get("checkoutId") ||
    url.searchParams.get("id");
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
      const userId = checkout.metadata?.supabase_user_id;

      if (userId) {
        // Update the Supabase profile securely
        const { error } = await supabase
          .from("profiles")
          .update({ is_pro: true, polar_order_id: checkout.id })
          .eq("id", userId);

        if (error) {
          console.error("Failed to update user profile to Pro:", error);
        } else {
          console.log(
            `Successfully upgraded user ${userId} to PRO!`,
          );
        }
      } else {
        console.error("No Supabase User ID found in checkout metadata!");
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
        : "${origin}/dashboard";

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error validating Polar checkout:", error);
    return fallbackRedirect;
  }
}
