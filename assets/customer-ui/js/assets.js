const REGISTRY_URL = '/content/customer-experience-rebuild/authority/customer-visual-asset-registry-v3.json';
const DARK_SURFACE_LOGO_MAP = Object.freeze({
  'LOGO-001': 'LOGO-008',
  'LOGO-003': 'LOGO-010',
  'LOGO-007': 'LOGO-008',
  'LOGO-009': 'LOGO-010'
});
const LIGHT_SURFACE_LOGO_MAP = Object.freeze({
  'LOGO-008': 'LOGO-001',
  'LOGO-010': 'LOGO-003'
});

let cache = null;

export async function customerAssetRegistry() {
  if (cache) return cache;
  const response = await fetch(REGISTRY_URL, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`CX_ASSET_REGISTRY_${response.status}`);
  cache = await response.json();
  return cache;
}

function deliveryFor(record) {
  const delivery = record?.delivery || {};
  return Object.freeze({
    loading: delivery.loading || 'lazy',
    decoding: delivery.decoding || 'async',
    fetchPriority: delivery.fetchPriority || 'auto'
  });
}

export function resolveCustomerAssetFromRegistry(registry, assetId) {
  const record = registry?.entries?.find(item => item.assetId === assetId);
  if (!record) throw new Error(`CX_ASSET_UNKNOWN:${assetId}`);
  if (record.available !== true || !record.publicUrl) throw new Error(`CX_ASSET_UNAVAILABLE:${assetId}`);
  return Object.freeze({ ...record, delivery: deliveryFor(record) });
}

export function resolveCustomerAssetRoleFromRegistry(registry, roleId) {
  const binding = registry?.roleBindings?.find(item => item.roleId === roleId);
  if (!binding) throw new Error(`CX_ASSET_ROLE_UNKNOWN:${roleId}`);
  if (binding.available !== true) throw new Error(`CX_ASSET_ROLE_UNAVAILABLE:${roleId}`);
  const asset = resolveCustomerAssetFromRegistry(registry, binding.assetId);
  return Object.freeze({ ...asset, roleId, binding: Object.freeze({ ...binding }) });
}

export async function resolveCustomerAsset(assetId) {
  return resolveCustomerAssetFromRegistry(await customerAssetRegistry(), assetId);
}

export async function resolveCustomerAssetRole(roleId) {
  return resolveCustomerAssetRoleFromRegistry(await customerAssetRegistry(), roleId);
}

function localizedUnavailableLabel(node) {
  if (node.dataset.cxAssetFallbackText) return node.dataset.cxAssetFallbackText;
  return String(document.documentElement.lang || '').toLowerCase().startsWith('zh')
    ? '视觉资源暂时无法显示'
    : 'Visual unavailable';
}

function fallbackFor(node) {
  const explicit = node.parentElement?.querySelector?.('[data-cx-asset-fallback]');
  if (explicit) return explicit;
  if (node.nextElementSibling?.hasAttribute?.('data-cx-asset-fallback')) return node.nextElementSibling;
  const fallback = document.createElement('span');
  fallback.dataset.cxAssetFallback = '';
  fallback.setAttribute('role', 'status');
  fallback.textContent = localizedUnavailableLabel(node);
  node.insertAdjacentElement('afterend', fallback);
  return fallback;
}

function applyImageDelivery(node, asset) {
  const delivery = asset.delivery || {};
  node.loading = delivery.loading || 'lazy';
  node.decoding = delivery.decoding || 'async';
  if ('fetchPriority' in node) node.fetchPriority = delivery.fetchPriority || 'auto';
  if (asset.width && !node.hasAttribute('width')) node.width = Number(asset.width);
  if (asset.height && !node.hasAttribute('height')) node.height = Number(asset.height);
}

async function loadImage(node, asset) {
  // Native lazy loading needs a layout box to intersect the viewport.
  // Hiding the image until load creates a deadlock for lazy R2 assets.
  node.hidden = false;
  node.removeAttribute('src');
  applyImageDelivery(node, asset);
  return new Promise((resolve, reject) => {
    const onLoad = () => { cleanup(); resolve(); };
    const onError = () => { cleanup(); reject(new Error(`CX_ASSET_IMAGE_LOAD_FAILED:${asset.assetId}`)); };
    const cleanup = () => {
      node.removeEventListener('load', onLoad);
      node.removeEventListener('error', onError);
    };
    node.addEventListener('load', onLoad, { once: true });
    node.addEventListener('error', onError, { once: true });
    node.src = asset.publicUrl;
    if (node.complete && node.naturalWidth > 0) {
      cleanup();
      resolve();
    }
  });
}

function revealFallback(node, fallback, error) {
  node.dataset.cxAssetState = 'unavailable';
  node.hidden = true;
  fallback.hidden = false;
  fallback.dataset.cxAssetState = 'unavailable';
  fallback.dataset.cxAssetError = error?.message || 'CX_ASSET_UNAVAILABLE';
}

function parseColorToRgba(value) {
  const source = String(value || '').trim();
  if (!source || source === 'transparent') return null;
  const match = source.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) return null;
  const parts = match[1].split(',').map(part => part.trim());
  if (parts.length < 3) return null;
  const [r, g, b] = parts.slice(0, 3).map(Number);
  const a = parts[3] == null ? 1 : Number(parts[3]);
  if ([r, g, b, a].some(Number.isNaN)) return null;
  return { r, g, b, a };
}

function relativeLuminance({ r, g, b }) {
  const normalize = channel => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const [rr, gg, bb] = [normalize(r), normalize(g), normalize(b)];
  return (0.2126 * rr) + (0.7152 * gg) + (0.0722 * bb);
}

function nearestOpaqueBackground(node) {
  let current = node?.parentElement || node;
  while (current) {
    const color = parseColorToRgba(getComputedStyle(current).backgroundColor);
    if (color && color.a > 0) return color;
    current = current.parentElement;
  }
  return parseColorToRgba(getComputedStyle(document.body).backgroundColor)
    || parseColorToRgba(getComputedStyle(document.documentElement).backgroundColor)
    || { r: 255, g: 255, b: 255, a: 1 };
}

function wantsAutoContrast(node) {
  return node.dataset.cxAssetAuto === 'contrast';
}

function selectContrastAwareLogo(assetId, node) {
  if (!wantsAutoContrast(node)) return assetId;
  const background = nearestOpaqueBackground(node);
  const darkSurface = relativeLuminance(background) < 0.24;
  if (darkSurface) return DARK_SURFACE_LOGO_MAP[assetId] || assetId;
  return LIGHT_SURFACE_LOGO_MAP[assetId] || assetId;
}

function resolveAssetIdentity(registry, node, roleId, assetId) {
  if (roleId && assetId) throw new Error(`CX_ASSET_BINDING_AMBIGUOUS:${roleId}:${assetId}`);
  if (roleId) {
    const roleAsset = resolveCustomerAssetRoleFromRegistry(registry, roleId);
    const finalAssetId = selectContrastAwareLogo(roleAsset.assetId, node);
    const finalAsset = finalAssetId === roleAsset.assetId
      ? roleAsset
      : Object.freeze({
          ...resolveCustomerAssetFromRegistry(registry, finalAssetId),
          roleId,
          binding: roleAsset.binding
        });
    return finalAsset;
  }
  if (assetId) {
    return resolveCustomerAssetFromRegistry(registry, selectContrastAwareLogo(assetId, node));
  }
  throw new Error('CX_ASSET_BINDING_MISSING');
}

async function resolveNodeAsset(node) {
  const registry = await customerAssetRegistry();
  return resolveAssetIdentity(registry, node, node.dataset.cxAssetRole, node.dataset.cxAsset);
}

export async function hydrateCustomerAssets(scope = document) {
  const nodes = [...scope.querySelectorAll('[data-cx-asset],[data-cx-asset-role]')];
  await Promise.all(nodes.map(async node => {
    const requested = node.dataset.cxAssetRole || node.dataset.cxAsset || '';
    const fallback = fallbackFor(node);
    fallback.hidden = true;
    try {
      const asset = await resolveNodeAsset(node);
      if (node instanceof HTMLImageElement) {
        await loadImage(node, asset);
        node.hidden = false;
      } else {
        node.style.setProperty('--cx-asset-url', `url("${asset.publicUrl}")`);
      }
      node.dataset.cxAssetState = 'ready';
      node.dataset.cxAssetType = asset.type;
      node.dataset.cxAssetResolvedId = asset.assetId;
    } catch (error) {
      revealFallback(node, fallback, error);
      console.warn('[CX asset]', requested, error.message);
    }
  }));
}
