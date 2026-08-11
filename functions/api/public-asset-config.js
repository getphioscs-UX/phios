const HTTPS_URL = /^https:\/\/[^\s]+$/i;

function normalize(value) {
  const raw = String(value ?? '').trim();
  if (!raw || !HTTPS_URL.test(raw)) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
    return url.toString().replace(/\/$/, '');
  } catch { return null; }
}

export function onRequestGet({ env = {} }) {
  const publicAssetBaseUrl = normalize(env.PHIOS_PUBLIC_ASSET_BASE_URL);
  if (!publicAssetBaseUrl) {
    return Response.json({ success: false, code: 'PUBLIC_ASSET_BASE_URL_UNAVAILABLE', deliveryState: 'FAIL_CLOSED' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  return Response.json({
    success: true,
    publicAssetBaseUrl,
    source: 'PHIOS_PUBLIC_ASSET_BASE_URL',
    registryVersion: '1.0.0',
    deliveryState: 'CONFIGURED_NOT_UPSTREAM_VERIFICATION_AUTHORITY'
  }, { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' } });
}
