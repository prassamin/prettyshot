import { LOCAL_INDEX_DB_NAME } from "@/config";
import { get, set, del, createStore } from "idb-keyval";

/**
 * Local (IndexedDB) persistence for designs, keyed by design id.
 *
 * Free / anonymous users don't get cloud sync — their canvas is saved only in
 * the browser under `design:{designId}`, so a refresh (or returning
 * to the same /editor/{id} URL on this device) restores exactly where they
 * left off.
 */

const store = createStore(LOCAL_INDEX_DB_NAME, "designs");

const PREFIX = "design:";

/**
 * Cookie carrying the ids of this device's recent local-only designs, so the
 * server-side /editor entry can jump back to the last one (or list them).
 * Path-scoped to /editor and capped to keep the cookie small.
 */
export const LOCAL_DESIGNS_COOKIE = "prettyshot_local_designs";
export const MAX_LOCAL_DESIGNS = 15;

export function localDesignKey(designId: string, prefix = PREFIX): string {
  return `${prefix}${designId}`;
}

function readCookieIds(): string[] {
  try {
    const raw = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith(`${LOCAL_DESIGNS_COOKIE}=`));
    if (!raw) return [];
    const value = decodeURIComponent(raw.split("=").slice(1).join("="));
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function writeCookieIds(ids: string[]): void {
  const value = encodeURIComponent(JSON.stringify(ids));
  // 1 year, scoped to /editor so it never travels on unrelated requests.
  document.cookie = `${LOCAL_DESIGNS_COOKIE}=${value}; path=/editor; max-age=31536000; samesite=lax`;
}

/**
 * Record a design as one of this device's recent local designs. The id is
 * moved to the front and duplicates are dropped; the array is capped.
 */
export function rememberLocalDesign(designId: string): void {
  try {
    const ids = readCookieIds().filter((id) => id !== designId);
    ids.unshift(designId);
    writeCookieIds(ids.slice(0, MAX_LOCAL_DESIGNS));
  } catch {
    // cookies may be blocked — local save is best-effort
  }
}

/** The most recently opened local design id, or null. */
export function getLastLocalDesignId(): string | null {
  return readCookieIds()[0] ?? null;
}

/** All recent local design ids on this device, oldest last. */
export function getLocalDesignIds(): string[] {
  return readCookieIds();
}

export async function saveDesignLocally(
  designId: string,
  config: unknown,
): Promise<void> {
  await set(localDesignKey(designId), config, store);
}

export async function loadDesignLocally<T = unknown>(
  designId: string,
): Promise<T | null> {
  return (await get(localDesignKey(designId), store)) ?? null;
}

/**
 * Remove a design id from this device's recent local designs cookie.
 */
export function forgetLocalDesign(designId: string): void {
  try {
    const ids = readCookieIds().filter((id) => id !== designId);
    writeCookieIds(ids);
  } catch {
    // cookies may be blocked
  }
}

export async function deleteDesignLocally(designId: string): Promise<void> {
  forgetLocalDesign(designId);
  await del(localDesignKey(designId), store);
}
