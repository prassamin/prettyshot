import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { POLAR_PRODUCT_ID } from "@/config/env";
import { getOrigin } from "@/lib/url";
import { polar } from "@/lib/polar";

export const GET = async () => {
  const origin = await getOrigin();
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("is_pro")
    .eq("id", user?.id)
    .single();

  if (profiles?.is_pro) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=/checkout`);
  }
  console.log(user);
  // Let Polar's native Next.js handler do the rest using our spoofed request
  const polarHandler = await polar.checkouts.create({
    successUrl: `${origin}/checkout/success?next=/dashboard`,
    returnUrl: `${origin}/`,
    products: [POLAR_PRODUCT_ID],
    customerEmail: user.email,
    externalCustomerId: user.id,
  });

  return NextResponse.redirect(polarHandler.url);
};
