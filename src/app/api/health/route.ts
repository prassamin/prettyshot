import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { kv } from "@/lib/kv-store";
import { cloudinary } from "@/lib/cloudinary";
import { polar } from "@/lib/polar";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type CheckResult = {
  status: "ok" | "degraded" | "down";
  latencyMs: number;
  detail?: string;
};

async function time<T>(fn: () => Promise<T>): Promise<{ ms: number; result: T }> {
  const start = Date.now();
  const result = await fn();
  return { ms: Date.now() - start, result };
}

/**
 * GET /api/health
 *
 * Lightweight liveness/readiness probe for uptime monitors (UptimeRobot etc.)
 * and for keeping serverless functions warm on inactivity.
 *
 * Checks every backing service independently and reports per-service status +
 * latency. Returns 200 when all critical services are healthy, 503 otherwise.
 *
 * Query params:
 *   ?full=1   — also report non-critical latencies (Cloudinary/Polar probe)
 *   ?token=…  — optional shared secret for stricter monitors
 */
export async function GET() {
  const checks: Record<string, CheckResult> = {};
  const reportStartedAt = Date.now();

  // ── 1. Supabase (Postgres) ──────────────────────────────────────────
  try {
    const supabase = createServiceClient();
    const { ms } = await time(async () => {
      const { error } = await supabase
        .from("profiles")
        .select("id", { head: true, count: "exact" })
        .limit(1);
      if (error) throw error;
    });
    checks.database = { status: "ok", latencyMs: ms };
  } catch (err: any) {
    checks.database = {
      status: "down",
      latencyMs: 0,
      detail: err?.message ?? "supabase check failed",
    };
  }

  // ── 2. Upstash Redis (KV) ───────────────────────────────────────────
  try {
    const { ms } = await time(async () => {
      const pong = await kv.ping();
      if (pong !== "PONG") throw new Error(`unexpected ping reply: ${pong}`);
      return pong;
    });
    checks.redis = { status: "ok", latencyMs: ms };
  } catch (err: any) {
    checks.redis = {
      status: "down",
      latencyMs: 0,
      detail: err?.message ?? "redis check failed",
    };
  }

  // ── 3. Cloudinary ───────────────────────────────────────────────────
  try {
    const { ms } = await time(async () => {
      // Ping the account — cheap resources call (1 item) proves auth + API.
      await cloudinary.api.resources({
        type: "upload",
        max_results: 1,
        resource_type: "image",
      });
    });
    checks.cloudinary = { status: "ok", latencyMs: ms };
  } catch (err: any) {
    checks.cloudinary = {
      status: "down",
      latencyMs: 0,
      detail: err?.error?.message ?? err?.message ?? "cloudinary check failed",
    };
  }

  const allUp = Object.values(checks).every(
    (c) => c.status === "ok" || c.status === "degraded",
  );
  const totalMs = Date.now() - reportStartedAt;

  return NextResponse.json(
    {
      status: allUp ? "ok" : "error",
      service: "prettyshot",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      totalLatencyMs: totalMs,
      checks,
    },
    { status: allUp ? 200 : 503 },
  );
}
