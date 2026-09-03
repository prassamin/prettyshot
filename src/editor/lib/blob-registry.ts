/**
 * Blob Registry — In-memory lifecycle manager for Object URLs and raw Blobs.
 *
 * Maps browser-generated `blob:` URLs back to their original `Blob` binary
 * payloads for synchronous project export, bundling, and deterministic memory
 * cleanup.
 */

const objectUrlBlobs = new Map<string, Blob>();

/**
 * Creates an Object URL for a given Blob and registers it in the registry.
 */
export function registerObjectUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  objectUrlBlobs.set(url, blob);
  return url;
}

/**
 * Retrieves the underlying Blob associated with an Object URL if registered.
 */
export function getBlobForObjectUrl(
  src: string | null | undefined,
): Blob | null {
  if (!src) return null;
  return objectUrlBlobs.get(src) ?? null;
}

/**
 * Revokes the Object URL and removes its Blob from the registry to prevent memory leaks.
 */
export function revokeObjectUrl(src: string | null | undefined): void {
  if (!src || !objectUrlBlobs.has(src)) return;
  objectUrlBlobs.delete(src);
  URL.revokeObjectURL(src);
}
