import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/config/env";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase server client with cookie-based session support.
 *
 * This client automatically reads and writes authentication cookies, allowing
 * Supabase Auth to identify the current user during server-side requests.
 *
 * Although it is initialized with the Service Role Key, it still participates
 * in the normal authentication flow by attaching the user's session from
 * cookies when available.
 *
 * ## Use this in
 * - Server Components
 * - Server Actions
 * - Route Handlers
 *
 * ## Do NOT use this in
 * - Client Components
 * - `unstable_cache()` or any cached function (cookies are request-specific)
 * - Background jobs or cron tasks
 *
 * ## Security
 * This client is created using the **Service Role Key**
 * (`SUPABASE_SERVICE_ROLE_KEY`), which bypasses Row Level Security (RLS).
 * Never expose this client or its credentials to the browser.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Creates a stateless Supabase admin client.
 *
 * Unlike `createServerClient()`, this client does **not** read or write
 * authentication cookies and does not attempt to identify a logged-in user.
 * It is intended for server-side operations that require full database access
 * regardless of the current request.
 *
 * Session persistence and automatic token refresh are disabled because this
 * client never represents an authenticated user.
 *
 * ## Use this in
 * - Background jobs
 * - Cron jobs
 * - Webhook handlers
 * - Admin API routes
 * - `unstable_cache()` or other cached server functions
 * - Database scripts and maintenance tasks
 *
 * ## Do NOT use this for
 * - User-authenticated requests
 * - Anything that depends on the current user's session
 *
 * ## Security
 * This client uses the **Service Role Key**
 * (`SUPABASE_SERVICE_ROLE_KEY`), which bypasses Row Level Security (RLS).
 * It must only be used in trusted server environments.
 */
export function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
