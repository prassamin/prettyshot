const cache = new Map<string, { url: string; expiresAt: number }>();

const URL_TTL_MS = 50_000; // 50s (signed URLs last 60s)

export function getCachedSignedUrl(id: string): string | null {
  const entry = cache.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(id);
    return null;
  }
  return entry.url;
}

export function setCachedSignedUrl(id: string, url: string): void {
  cache.set(id, { url, expiresAt: Date.now() + URL_TTL_MS });
}
