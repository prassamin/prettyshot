import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = await getOrigin()
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next || "/"}`);
    }
    console.log(error);
  }

  // Auth failed — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
}
