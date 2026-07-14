import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  POLAR_ACCESS_TOKEN: z.string().min(1),
  NEXT_PUBLIC_POLAR_PRODUCT_ID: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success && typeof window === "undefined") {
  throw new Error(
    `❌ Invalid env: ${JSON.parse(parsed.error.message)[0].message}`,
  );
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN ?? "";
export const POLAR_PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID ?? "";
