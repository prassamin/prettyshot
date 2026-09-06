import { Redis } from "@upstash/redis";

const url = (process.env.UPSTASH_STORE_REDIS_REST_URL || "").trim();
const token = (process.env.UPSTASH_STORE_REDIS_REST_TOKEN || "").trim();

export const kv = new Redis({ url, token });

/* ── Frames keys ─────────────────────────────────────── */

export const FRAMES_CATEGORIES_INDEX_KEY = "prettyshot:frames:categories";

export const framesCategoryKey = (id: string) =>
  `prettyshot:frames:category:${id}`;

export const framesCategoryFramesKey = (id: string) =>
  `prettyshot:frames:category:${id}:frames`;

export const framesFrameKey = (id: string) =>
  `prettyshot:frames:frame:${id}`;