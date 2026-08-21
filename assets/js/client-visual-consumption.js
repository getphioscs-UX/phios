import {
  fetchPublicAssetConfig,
  fetchPublicAssetRegistry,
  normalizePublicAssetBaseUrl,
  resolvePublicAsset
} from './runtime/web-production/asset-resolver.js';

const CONSUMER_MAP_URL = '/content/web-production/registries/client-visual-consumer-map-v1.json';
const STYLESHEET_URL = '/assets/css/client-visual-consumption.css';
const VISUAL_READY_EVENT = 'phios:client-visual-ready';
let initializationPromise = null;

export function normalizeClientVisualPath(value) {
  let path = String(value || '/').trim();
  try {
    path = new URL(path, 'https://phios.invalid').pathname;
  } catch {
    path = '/';
  }
  path = path.replace(/\.html$/i, '');
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
}

export function routePatternMatches(pattern, pathname) {
  const normalizedPattern = normalizeClientVisualPath(String(pattern || '').replace(/\*$/, ''));
  const normalizedPath = normalizeClientVisualPath(pathname);
  if (String(pattern || '').endsWith('*')) {
    return normalizedPath === normalizedPattern || normalizedPath.startsWith(`${normalizedPattern}/`);
  }
  return normalizedPath === normalizedPattern;
}

export function matchClientVisualRecord(consumerMap, pathname) {
  const records = Array.isArray(consumerMap?.records) ? consumerMap.records : [];
  const normalizedPath = normalizeClientVisualPath(pathname);
  const exact = records.find(record => (record.routes || []).some(route => !String(route).endsWith('*') && routePatternMatches(route, normalizedPath)));
  if (exact) return exact;
  return records.find(record => (record.routes || []).some(route => String(route).endsWith('*') && routePatternMatches(route, normalizedPath))) || null;
}

function ensureStylesheet() {
  if (document.querySelector(`link[href="${STYLESHEET_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLESHEET_URL;
  link.dataset.clientVisualConsumption = 'PART-H.5';
  document.head.append(link);
}

async function fetchConsumerMap(fetchImpl = fetch) {
  const response = await fetchImpl(CONSUMER_MAP_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('CLIENT_VISUAL_CONSUMER_MAP_UNAVAILABLE');
  const payload = await response.json();
  if (payload?.status !== 'ACTIVE_ADDITIVE_CLIENT_VISUAL_CONSUMPTION_SUCCESSOR' || !Array.isArray(payload.records)) {
    throw new Error('CLIENT_VISUAL_CONSUMER_MAP_INVALID');
  }
  return payload;
}

async function createAssetContext(fetchImpl = fetch) {
  const registry = await fetchPublicAssetRegistry({ fetchImpl });
  let publicBaseUrl = normalizePublicAssetBaseUrl(registry.public_base_url);
  if (!publicBaseUrl) {
    const config = await fetchPublicAssetConfig({ fetchImpl });
    publicBaseUrl = normalizePublicAssetBaseUrl(config.publicAssetBaseUrl);
  }
  return { registry, publicBaseUrl };
}

function resolveForSurface(assetCode, surfaceCode, context) {
  if (!assetCode) return null;
  return resolvePublicAsset({
    registry: context.registry,
    publicBaseUrl: context.publicBaseUrl,
    assetCode,
    surface: surfaceCode
  });
}

function imageForResolved(resolved, className, { eager = false } = {}) {
  const image = document.createElement('img');
  image.className = className;
  image.alt = '';
  image.decoding = 'async';
  image.loading = eager ? 'eager' : (resolved.loading || 'lazy');
  if (eager) image.fetchPriority = 'high';
  else if (resolved.fetchPriority) image.fetchPriority = resolved.fetchPriority;
  if (resolved.srcset) image.srcset = resolved.srcset;
  if (resolved.sizes) image.sizes = resolved.sizes;
  if (resolved.width) image.width = resolved.width;
  if (resolved.height) image.height = resolved.height;
  image.src = resolved.src;
  image.dataset.clientVisualAssetCode = resolved.assetCode;
  image.dataset.clientVisualDeliveryState = resolved.deliveryState;
  return image;
}

function iconRail(record, context, { embedded = false } = {}) {
  const codes = Array.isArray(record?.icons?.assetCodes) ? record.icons.assetCodes : [];
  const rail = document.createElement('div');
  rail.className = `client-visual-icon-rail${embedded ? ' client-visual-icon-rail--embedded' : ''}`;
  rail.dataset.clientVisualIconRail = record.surfaceCode;
  rail.setAttribute('aria-hidden', 'true');

  let renderedCount = 0;
  for (const assetCode of codes) {
    let resolved;
    try {
      resolved = resolveForSurface(assetCode, record.surfaceCode, context);
    } catch {
      continue;
    }
    if (!resolved?.renderable) continue;
    const tile = document.createElement('span');
    tile.className = 'client-visual-icon-tile';
    tile.dataset.clientVisualIcon = assetCode;
    tile.append(imageForResolved(resolved, 'client-visual-icon-image'));
    rail.append(tile);
    renderedCount += 1;
  }

  rail.dataset.clientVisualRenderedIconCount = String(renderedCount);
  return renderedCount ? rail : null;
}

function knownManagedHeroTarget(record) {
  const code = record?.hero?.assetCode;
  if (!code) return null;
  if (record.surfaceCode === 'HOME') return document.querySelector(`[data-hpc2-hero="${code}"]`);
  if (record.surfaceCode === 'LIBRARY') return document.querySelector(`[data-bfr-library-hero="${code}"]`);
  return document.querySelector(`[data-client-visual-hero="${code}"]`);
}

function hydrateManagedHero(record, context) {
  const target = knownManagedHeroTarget(record);
  if (!target || !record?.hero?.assetCode) return false;
  let resolved;
  try {
    resolved = resolveForSurface(record.hero.assetCode, record.surfaceCode, context);
  } catch {
    target.dataset.clientVisualState = 'RESOLUTION_FAILED';
    return false;
  }
  if (!resolved?.renderable) {
    target.dataset.clientVisualState = 'UPSTREAM_VERIFICATION_REQUIRED';
    return false;
  }

  let image = target.matches('img') ? target : target.querySelector('img');
  if (!image) {
    image = document.createElement('img');
    target.append(image);
  }
  image.className = `${image.className || ''} client-visual-managed-hero-image`.trim();
  image.alt = '';
  image.decoding = 'async';
  image.loading = 'eager';
  image.fetchPriority = 'high';
  if (resolved.srcset) image.srcset = resolved.srcset;
  image.src = resolved.src;
  image.dataset.clientVisualAssetCode = resolved.assetCode;
  target.removeAttribute('hidden');
  target.dataset.clientVisualState = 'VERIFIED_RENDERABLE';
  return true;
}

function insertIconRailForManagedSurface(record, context, managedTarget) {
  const rail = iconRail(record, context, { embedded: true });
  if (!rail) return 0;
  const section = managedTarget?.closest('section');
  const host = section?.querySelector('.public-container, .knowledge-shell') || section || managedTarget?.parentElement;
  if (!host || host.querySelector(`[data-client-visual-icon-rail="${record.surfaceCode}"]`)) return 0;
  host.append(rail);
  return Number(rail.dataset.clientVisualRenderedIconCount || 0);
}

function createMasthead(record, context) {
  const main = document.querySelector('main');
  if (!main || !record?.hero?.assetCode) return { heroRendered: false, iconCount: 0 };
  if (document.querySelector(`[data-client-visual-masthead="${record.surfaceCode}"]`)) {
    return { heroRendered: true, iconCount: 0 };
  }

  let resolved;
  try {
    resolved = resolveForSurface(record.hero.assetCode, record.surfaceCode, context);
  } catch {
    document.documentElement.dataset.clientVisualHeroState = 'RESOLUTION_FAILED';
    return { heroRendered: false, iconCount: 0 };
  }
  if (!resolved?.renderable) {
    document.documentElement.dataset.clientVisualHeroState = 'UPSTREAM_VERIFICATION_REQUIRED';
    return { heroRendered: false, iconCount: 0 };
  }

  const section = document.createElement('section');
  section.className = 'client-visual-masthead';
  section.dataset.clientVisualMasthead = record.surfaceCode;
  section.dataset.clientVisualHero = record.hero.assetCode;
  section.setAttribute('aria-hidden', 'true');

  const figure = document.createElement('figure');
  figure.className = 'client-visual-masthead__figure';
  figure.append(imageForResolved(resolved, 'client-visual-masthead__image', { eager: true }));
  section.append(figure);

  const rail = iconRail(record, context);
  const iconCount = rail ? Number(rail.dataset.clientVisualRenderedIconCount || 0) : 0;
  if (rail) section.append(rail);

  main.insertAdjacentElement('beforebegin', section);
  return { heroRendered: true, iconCount };
}

function createStandaloneIconSignature(record, context) {
  const main = document.querySelector('main');
  if (!main || document.querySelector(`[data-client-visual-signature="${record.surfaceCode}"]`)) return 0;
  const rail = iconRail(record, context);
  if (!rail) return 0;
  const section = document.createElement('section');
  section.className = 'client-visual-signature';
  section.dataset.clientVisualSignature = record.surfaceCode;
  section.setAttribute('aria-hidden', 'true');
  section.append(rail);
  main.insertAdjacentElement('beforebegin', section);
  return Number(rail.dataset.clientVisualRenderedIconCount || 0);
}

async function replaceTextBrandWithVerifiedLogo(selector, assetCode, context, className) {
  const targets = [...document.querySelectorAll(selector)];
  if (!targets.length) return 0;
  let resolved;
  try {
    resolved = resolveForSurface(assetCode, 'BRANDING', context);
  } catch {
    return 0;
  }
  if (!resolved?.renderable) return 0;

  let count = 0;
  await Promise.all(targets.map(target => new Promise(resolve => {
    if (target.querySelector(`[data-client-brand-logo="${assetCode}"]`)) {
      count += 1;
      resolve();
      return;
    }
    const image = imageForResolved(resolved, className, { eager: true });
    image.dataset.clientBrandLogo = assetCode;
    const loaded = () => {
      target.replaceChildren(image);
      target.classList.add('is-client-logo-ready');
      target.dataset.clientBrandState = 'VERIFIED_RENDERABLE';
      count += 1;
      resolve();
    };
    image.addEventListener('load', loaded, { once: true });
    image.addEventListener('error', () => resolve(), { once: true });
  })));
  return count;
}

async function hydrateAdditionalBranding(context) {
  const footerCount = await replaceTextBrandWithVerifiedLogo(
    '.public-footer .public-brand',
    'LOGO-010',
    context,
    'client-brand-logo client-brand-logo--footer'
  );
  const professionalCount = await replaceTextBrandWithVerifiedLogo(
    '.professional-workspace-header .professional-workspace-brand',
    'LOGO-003',
    context,
    'client-brand-logo client-brand-logo--professional'
  );
  return footerCount + professionalCount;
}

function markDestinationUpgrade(record) {
  if (!record.destinationVisualUpgrade) return;
  document.body.classList.add('client-visual-destination-upgraded');
  document.body.dataset.clientVisualDestinationUpgrade = 'PART-H.5';
  const main = document.querySelector('main');
  if (main) main.dataset.clientVisualDestinationComposition = 'CANONICAL_HERO_PLUS_PRESERVED_V8_CONTENT';
}

function dispatchReady(detail) {
  try {
    window.dispatchEvent(new CustomEvent(VISUAL_READY_EVENT, { detail }));
  } catch {
    // Non-critical observability only.
  }
}

export async function initializeClientVisualConsumption({ fetchImpl = fetch, pathname = window.location.pathname } = {}) {
  ensureStylesheet();
  const [consumerMap, context] = await Promise.all([
    fetchConsumerMap(fetchImpl),
    createAssetContext(fetchImpl)
  ]);
  const record = matchClientVisualRecord(consumerMap, pathname);
  if (!record) {
    document.documentElement.dataset.clientVisualConsumption = 'NO_REGISTERED_SURFACE';
    return { state: 'NO_REGISTERED_SURFACE', record: null };
  }
  if (record.visualState === 'NONE_BY_DESIGN') {
    document.documentElement.dataset.clientVisualConsumption = 'NONE_BY_DESIGN';
    document.documentElement.dataset.clientVisualSurface = record.surfaceCode;
    return { state: 'NONE_BY_DESIGN', record };
  }

  markDestinationUpgrade(record);
  let heroRendered = false;
  let iconCount = 0;

  if (record.hero.mode === 'EXISTING_MANAGED') {
    const target = knownManagedHeroTarget(record);
    heroRendered = hydrateManagedHero(record, context);
    iconCount = insertIconRailForManagedSurface(record, context, target);
  } else if (record.hero.mode === 'AUTO_MASTHEAD') {
    const result = createMasthead(record, context);
    heroRendered = result.heroRendered;
    iconCount = result.iconCount;
  } else {
    iconCount = createStandaloneIconSignature(record, context);
  }

  const brandingCount = await hydrateAdditionalBranding(context);
  const state = record.hero.assetCode && !heroRendered ? 'FAIL_CLOSED_HERO_NOT_RENDERED' : 'READY';
  document.documentElement.dataset.clientVisualConsumption = state;
  document.documentElement.dataset.clientVisualSurface = record.surfaceCode;
  document.documentElement.dataset.clientVisualHeroRendered = String(heroRendered);
  document.documentElement.dataset.clientVisualIconCount = String(iconCount);
  document.documentElement.dataset.clientVisualBrandingCount = String(brandingCount);

  const detail = { state, surfaceCode: record.surfaceCode, heroRendered, iconCount, brandingCount };
  dispatchReady(detail);
  return { ...detail, record };
}

export function scheduleClientVisualConsumption() {
  if (initializationPromise) return initializationPromise;
  const run = () => initializeClientVisualConsumption().catch(error => {
    document.documentElement.dataset.clientVisualConsumption = 'FAIL_CLOSED';
    document.documentElement.dataset.clientVisualError = error?.message || 'CLIENT_VISUAL_CONSUMPTION_FAILED';
    return { state: 'FAIL_CLOSED', error };
  });

  if (document.readyState === 'loading') {
    initializationPromise = new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', () => resolve(run()), { once: true });
    }).then(value => value);
  } else {
    initializationPromise = Promise.resolve().then(run);
  }
  return initializationPromise;
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  scheduleClientVisualConsumption();
}
