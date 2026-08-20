const DEFAULT_REGISTRY_URL = '/content/registry/public-assets.json';
const DEFAULT_CONFIG_URL = '/api/public-asset-config';
const VERIFIED_PATTERN = /^verified(?:$|[-_])/i;

export class PublicAssetResolutionError extends Error {
  constructor(code, message = code, details = {}) {
    super(message);
    this.name = 'PublicAssetResolutionError';
    this.code = code;
    this.details = details;
  }
}

export function normalizePublicAssetBaseUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  let url;
  try { url = new URL(raw); } catch { throw new PublicAssetResolutionError('PUBLIC_ASSET_BASE_URL_INVALID'); }
  if (url.protocol !== 'https:') throw new PublicAssetResolutionError('PUBLIC_ASSET_BASE_URL_INVALID');
  if (url.username || url.password || url.search || url.hash) throw new PublicAssetResolutionError('PUBLIC_ASSET_BASE_URL_INVALID');
  return url.toString().replace(/\/$/, '');
}

export function normalizePublicAssetObjectKey(value) {
  const key = String(value ?? '').trim();
  if (!key || key.startsWith('/') || key.includes('\\') || key.includes('?') || key.includes('#')) {
    throw new PublicAssetResolutionError('PUBLIC_ASSET_OBJECT_KEY_INVALID');
  }
  const parts = key.split('/');
  if (parts.some(part => part === '.' || part === '..')) throw new PublicAssetResolutionError('PUBLIC_ASSET_OBJECT_KEY_INVALID');
  return key;
}

function encodedObjectKey(key) {
  const trailingSlash = key.endsWith('/');
  const encoded = key.split('/').filter((part, index, all) => !(trailingSlash && index === all.length - 1)).map(encodeURIComponent).join('/');
  return trailingSlash ? `${encoded}/` : encoded;
}

export function isAssetVerificationRenderable(verification) {
  return VERIFIED_PATTERN.test(String(verification ?? ''));
}

export function findPublicAsset(registry, assetCode) {
  if (!registry || registry.bucket !== 'phios-public-assets' || !Array.isArray(registry.assets)) {
    throw new PublicAssetResolutionError('PUBLIC_ASSET_REGISTRY_INVALID');
  }
  const code = String(assetCode ?? '').trim();
  const asset = registry.assets.find(item => item.asset_code === code);
  if (!asset) throw new PublicAssetResolutionError('PUBLIC_ASSET_NOT_FOUND', 'Public asset is not registered.', { assetCode: code });
  return asset;
}

function chooseVariant(asset, variantCode = 'ORIGINAL') {
  const code = String(variantCode || 'ORIGINAL').toUpperCase();
  if (code === 'ORIGINAL') return { code: 'ORIGINAL', object_key: asset.object_key, format: asset.format, verification: asset.verification, width: asset.width ?? null, height: asset.height ?? null };
  const variants = Array.isArray(asset.variants) ? asset.variants : [];
  const variant = variants.find(item => String(item.code ?? '').toUpperCase() === code);
  if (!variant) throw new PublicAssetResolutionError('PUBLIC_ASSET_VARIANT_NOT_REGISTERED', 'Requested asset variant is not registered.', { assetCode: asset.asset_code, variant: code });
  return { ...variant, code };
}

function buildSrcset(baseUrl, asset) {
  const variants = Array.isArray(asset.variants) ? asset.variants : [];
  return variants
    .filter(item => item && item.object_key && Number.isFinite(Number(item.width)) && isAssetVerificationRenderable(item.verification ?? asset.verification))
    .map(item => `${baseUrl}/${encodedObjectKey(normalizePublicAssetObjectKey(item.object_key))} ${Number(item.width)}w`)
    .join(', ') || null;
}

export function resolvePublicAsset({ registry, assetCode, publicBaseUrl, variant = 'ORIGINAL', surface = null, locale = null, density = 1 } = {}) {
  const baseUrl = normalizePublicAssetBaseUrl(publicBaseUrl);
  if (!baseUrl) throw new PublicAssetResolutionError('PUBLIC_ASSET_BASE_URL_UNAVAILABLE');
  const asset = findPublicAsset(registry, assetCode);
  const selected = chooseVariant(asset, variant);
  const objectKey = normalizePublicAssetObjectKey(selected.object_key);
  const isGroup = objectKey.endsWith('/');
  if (isGroup) throw new PublicAssetResolutionError('PUBLIC_ASSET_GROUP_REQUIRES_OBJECT_MEMBER', 'Asset group cannot be rendered as a concrete object.', { assetCode });
  const verification = selected.verification ?? asset.verification;
  const renderable = isAssetVerificationRenderable(verification);
  const url = `${baseUrl}/${encodedObjectKey(objectKey)}`;
  return {
    assetCode: asset.asset_code,
    category: asset.category,
    family: asset.family ?? null,
    objectKey,
    contentType: asset.content_type ?? null,
    canonicalFormat: asset.format ?? null,
    variant: selected.code,
    surface,
    locale,
    density,
    src: url,
    srcset: buildSrcset(baseUrl, asset),
    sizes: selected.sizes ?? null,
    width: selected.width ?? null,
    height: selected.height ?? null,
    aspectRatio: selected.width && selected.height ? Number(selected.width) / Number(selected.height) : null,
    loading: selected.loading ?? 'lazy',
    fetchPriority: selected.fetchPriority ?? 'auto',
    renderable,
    deliveryState: renderable ? 'VERIFIED_RENDERABLE' : 'UPSTREAM_VERIFICATION_REQUIRED',
    verification,
    sourceReference: 'content/registry/public-assets.json'
  };
}

export async function fetchPublicAssetRegistry({ fetchImpl = fetch, registryUrl = DEFAULT_REGISTRY_URL } = {}) {
  const response = await fetchImpl(registryUrl, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new PublicAssetResolutionError('PUBLIC_ASSET_REGISTRY_INVALID');
  return response.json();
}

export async function fetchPublicAssetConfig({ fetchImpl = fetch, configUrl = DEFAULT_CONFIG_URL } = {}) {
  const response = await fetchImpl(configUrl, { headers: { Accept: 'application/json' } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success || !payload.publicAssetBaseUrl) throw new PublicAssetResolutionError('PUBLIC_ASSET_BASE_URL_UNAVAILABLE');
  return payload;
}

export async function resolvePublicAssetForWeb(assetCode, options = {}) {
  const registry = options.registry ?? await fetchPublicAssetRegistry(options);
  const registryBase = normalizePublicAssetBaseUrl(registry.public_base_url);
  let configBase = null;
  if (!registryBase) {
    const config = options.publicConfig ?? await fetchPublicAssetConfig(options);
    configBase = normalizePublicAssetBaseUrl(config.publicAssetBaseUrl);
  } else if (options.publicConfig?.publicAssetBaseUrl) {
    configBase = normalizePublicAssetBaseUrl(options.publicConfig.publicAssetBaseUrl);
    if (configBase !== registryBase) throw new PublicAssetResolutionError('PUBLIC_ASSET_BASE_URL_CONFLICT');
  }
  return resolvePublicAsset({ registry, assetCode, publicBaseUrl: registryBase ?? configBase, variant: options.variant, surface: options.surface, locale: options.locale, density: options.density });
}
