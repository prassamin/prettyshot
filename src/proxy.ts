import { NextRequest, NextResponse } from "next/server";
import { CURRENT_URL_HEADER, ORIGIN_HEADER } from "./config";

export default async function proxy(request: NextRequest) {
  const hostHeader =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const fullUrl = `${proto}://${hostHeader}${request.nextUrl.pathname}`;
  const origin = `${proto}://${hostHeader}`;
  const headers = new Headers(request.headers);
  headers.set(ORIGIN_HEADER, origin);
  headers.set(CURRENT_URL_HEADER, fullUrl);

  return NextResponse.next({ request, headers });
}
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
