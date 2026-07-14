import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { CURRENT_URL_HEADER, ORIGIN_HEADER } from "./config";

export async function proxy(request: NextRequest) {
  const hostHeader =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const fullUrl = `${proto}://${hostHeader}${request.nextUrl.pathname}${request.nextUrl.search}`;
  const origin = `${proto}://${hostHeader}`;
  const headers = new Headers(request.headers);
  headers.set(ORIGIN_HEADER, origin);
  headers.set(CURRENT_URL_HEADER, fullUrl);

  const supabaseResponse = await updateSession(request);

  // If updateSession returned a redirect (e.g. for ?code= oauth exchange), return it immediately!
  if (supabaseResponse.status >= 300 && supabaseResponse.status < 400) {
    return supabaseResponse;
  }

  const response = NextResponse.next({
    request: {
      headers: headers,
    },
  });

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
