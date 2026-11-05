// Cloudflare 2026-09-04: Total Upload is uncompressed; gzip is informational.
// https://developers.cloudflare.com/changelog/post/2026-09-04-increased-worker-size-limit/
export const MAX_WORKER_UNCOMPRESSED_BYTES = 64 * 1024 * 1024;
export const WORKER_SIZE_WARNING_BYTES = 48 * 1024 * 1024;
export const MAX_PAGES_STATIC_ASSET_BYTES = 25 * 1024 * 1024;

export function assessWorkerSize({uncompressedBytes, gzipBytes = 0}) {
  for (const value of [uncompressedBytes, gzipBytes]) {
    if (!Number.isSafeInteger(value) || value < 0) throw new TypeError('WORKER_SIZE_INVALID');
  }
  return Object.freeze({
    status: uncompressedBytes > MAX_WORKER_UNCOMPRESSED_BYTES ? 'WORKER_SIZE_PLATFORM_FAIL' : 'WORKER_SIZE_PLATFORM_PASS',
    warning: uncompressedBytes > WORKER_SIZE_WARNING_BYTES ? 'WORKER_SIZE_WARNING' : null,
    gzipStatus: 'WORKER_GZIP_INFORMATIONAL_ONLY',
    uncompressedBytes, gzipBytes,
    maximumBytes: MAX_WORKER_UNCOMPRESSED_BYTES,
    warningBytes: WORKER_SIZE_WARNING_BYTES
  });
}

export function pagesFileSizeAllowed(relativePath, bytes) {
  if (!Number.isSafeInteger(bytes) || bytes < 0) throw new TypeError('PAGES_FILE_SIZE_INVALID');
  return relativePath === '_worker.js'
    ? assessWorkerSize({uncompressedBytes: bytes}).status === 'WORKER_SIZE_PLATFORM_PASS'
    : bytes <= MAX_PAGES_STATIC_ASSET_BYTES;
}
