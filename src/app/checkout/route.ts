import { createServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Checkout } from "@polar-sh/nextjs";
import { POLAR_ACCESS_TOKEN, POLAR_PRODUCT_ID } from "@/config/env";
import { getOrigin } from "@/lib/url";

export const GET = async (request: NextRequest) => {
  const origin = await getOrigin();
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=/checkout`);
  }

  // We dynamically inject the required query parameters so you don't have to put them in your frontend buttons!
  const url = new URL(request.url);

  // Inject the Product ID (required by Polar's Checkout handler)
  url.searchParams.set("products", POLAR_PRODUCT_ID);

  // Inject User info and Metadata
  url.searchParams.set("customerEmail", user.email || "");
  url.searchParams.set(
    "metadata",
    JSON.stringify({ supabase_user_id: user.id }),
  );

  // Create a spoofed request containing our new query parameters
  const modifiedRequest = new NextRequest(url, request);

  console.log(POLAR_ACCESS_TOKEN);
  // Let Polar's native Next.js handler do the rest using our spoofed request
  const polarHandler = Checkout({
    accessToken: POLAR_ACCESS_TOKEN,
    successUrl: `${origin}/checkout/success`,
    returnUrl: `${origin}/`,
    server: process.env.NODE_ENV === "production" ? undefined : "sandbox",
    theme: "dark",
    includeCheckoutId: true,
  });

  return polarHandler(modifiedRequest);
};
