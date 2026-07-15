import { POLAR_ACCESS_TOKEN } from "@/config/env";
import { Polar } from "@polar-sh/sdk";

export const POLAR_API_ORIGIN = process.env.NODE_ENV !== "production" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh"

export const polar = new Polar({
  accessToken: POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});
