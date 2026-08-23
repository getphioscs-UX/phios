import { fetchPublicAssetRegistry, resolvePublicAsset, resolvePublicAssetForWeb, normalizePublicAssetBaseUrl } from './asset-resolver.js';

const POINTER_URL = '/content/web-production/registries/current-client-visual-registry.json';
let pointerPromise;
let clientRegistryPromise;

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`PX2_FETCH_FAILED:${url}`);
  return response.json();
}
async function currentPointer() {
  if (!pointerPromise) pointerPromise = fetchJson(POINTER_URL);
  return pointerPromise;
}
async function clientVisualRegistry() {
  if (!clientRegistryPromise) {
    clientRegistryPromise = currentPointer().then(pointer => fetchJson(pointer.currentRegistryPath));
  }
  return clientRegistryPromise;
}
function clientEntry(registry, code) {
  return registry.assets?.find(asset => asset.sequence === code || asset.assetCode === code || asset.legacyAssetCode === code) || null;
}
export async function resolveUnifiedPublicVisual(code, options = {}) {
  try {
    return await resolvePublicAssetForWeb(code, options);
  } catch (primaryError) {
    const [clientRegistry, publicRegistry] = await Promise.all([clientVisualRegistry(), fetchPublicAssetRegistry()]);
    const entry = clientEntry(clientRegistry, code);
    if (!entry?.r2?.objectKey || entry.r2.remoteVerified !== true) throw primaryError;
    const base = normalizePublicAssetBaseUrl(publicRegistry.public_base_url);
    if (!base) throw primaryError;
    return resolvePublicAsset({
      registry: {
        bucket: 'phios-public-assets',
        assets: [{
          asset_code: code,
          category: String(entry.assetType || 'visual').toLowerCase(),
          family: entry.family || entry.assetType || null,
          object_key: entry.r2.objectKey,
          format: String(entry.productionSpec?.productionFormat || entry.canonicalFormat || 'webp').toLowerCase(),
          content_type: entry.productionSpec?.productionFormat === 'SVG' ? 'image/svg+xml' : 'image/webp',
          verification: 'verified-client-visual-registry-v1',
          width: entry.productionSpec?.width || entry.masterSize?.width || null,
          height: entry.productionSpec?.height || entry.masterSize?.height || null
        }]
      },
      assetCode: code,
      publicBaseUrl: base,
      surface: options.surface || null,
      locale: options.locale || null
    });
  }
}
export async function hydrateUnifiedPublicVisuals(root = document) {
  const images = [...root.querySelectorAll('img[data-px2-asset]')];
  await Promise.all(images.map(async image => {
    const holder = image.closest('[data-px2-visual]') || image;
    try {
      const asset = await resolveUnifiedPublicVisual(image.dataset.px2Asset, { surface: image.dataset.px2Surface || document.body.dataset.px2Surface || 'PUBLIC_V2' });
      if (!asset?.renderable) throw new Error('PX2_ASSET_NOT_RENDERABLE');
      image.src = asset.src;
      if (asset.srcset) image.srcset = asset.srcset;
      if (asset.sizes) image.sizes = asset.sizes;
      if (asset.width) image.width = asset.width;
      if (asset.height) image.height = asset.height;
      holder.dataset.assetStatus = 'ready';
    } catch {
      holder.dataset.assetStatus = 'unavailable';
    }
  }));
}
