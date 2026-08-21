import { getLocale, onLocaleChange } from '../i18n.js';
import { resolvePublicAssetForWeb } from '../runtime/web-production/asset-resolver.js';

const REGISTRY_URL = '/content/web-production/pxr/registries/pxr-public-surface-registry-v1.json';
const STYLESHEET_URL = '/assets/css/pxr-public-experience.css';
const HIGH_RISK_TERMS = [
  /Canonical Registry/gi,
  /Canonical Part Registry/gi,
  /Public Base/gi,
  /Asset Verification/gi,
  /\bfail-closed\b/gi,
  /\bproduction candidate\b/gi,
  /\bWPR\b/g,
  /\bHPC2\b/g,
  /\bCKA\b/g,
  /\bMCD\b/g,
  /\bKAP\b/g,
  /\bR2\b/g
];
const RAW_STATE_PATTERN = /\b(?:Storage|Reconstruction|Persistence|Interpretation|Execution|Authority)\s+allowed\s*:\s*(?:true|false)\b/i;
const SECONDARY_INTERNAL_PATTERN = /\b(?:governed|canonical|entitlement|eligibility)\b|\bMethod\b|\bprojection(?:s)?\b/i;
const RAW_CODE_PATTERN = /\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b/g;
const RAW_CODE_TEST = /\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b/;
const SKIP_SANITIZE = 'script,style,code,pre,kbd,samp,[data-pxr-technical-ok]';
let registryPromise = null;
let observer = null;

function ensureStylesheet() {
  if (document.querySelector(`link[href="${STYLESHEET_URL}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLESHEET_URL;
  link.dataset.pxr = 'PXR-P1-P2';
  document.head.append(link);
}

function normalizePath(value = window.location.pathname) {
  let path = String(value || '/').split('?')[0].replace(/\.html$/i, '');
  if (path.length > 1) path = path.replace(/\/+$/, '');
  return path || '/';
}

function routeMatches(route, path) {
  const expected = normalizePath(route);
  return expected === path;
}

async function loadRegistry() {
  if (!registryPromise) {
    registryPromise = fetch(REGISTRY_URL, { headers: { Accept: 'application/json' } })
      .then(response => {
        if (!response.ok) throw new Error('PXR_SURFACE_REGISTRY_UNAVAILABLE');
        return response.json();
      })
      .then(payload => {
        if (payload?.status !== 'ACTIVE_PUBLIC_PRESENTATION_SUCCESSOR' || !Array.isArray(payload.surfaces)) {
          throw new Error('PXR_SURFACE_REGISTRY_INVALID');
        }
        return payload;
      });
  }
  return registryPromise;
}

function surfaceFor(registry, pathname = window.location.pathname) {
  const path = normalizePath(pathname);
  return registry.surfaces.find(surface => (surface.routes || []).some(route => routeMatches(route, path))) || null;
}

function localeText(record) {
  const locale = getLocale();
  return record?.[locale] || record?.en || '';
}

function hideTechnicalSections(surface) {
  for (const selector of surface?.hideSelectors || []) {
    document.querySelectorAll(selector).forEach(node => {
      node.dataset.pxrHidden = 'true';
      node.setAttribute('aria-hidden', 'true');
    });
  }
}

function applyCopyOverrides(surface) {
  for (const item of surface?.copyOverrides || []) {
    const value = localeText(item);
    if (!value) continue;
    document.querySelectorAll(item.selector).forEach(node => {
      if (node.matches('label') && node.querySelector('input,select,textarea')) {
        const control = node.querySelector('input,select,textarea');
        node.replaceChildren(control, document.createTextNode(` ${value}`));
      } else {
        node.textContent = value;
      }
      node.dataset.pxrCopy = 'true';
    });
  }
}

function customerSafeText(value) {
  let text = String(value || '');
  text = text
    .replace(/\bprofessional authority\b/gi, 'professional responsibility')
    .replace(/\bknowledge authority\b/gi, 'published knowledge')
    .replace(/\bcanonical authority\b/gi, 'current structure')
    .replace(/\bauthority\b/gi, 'responsibility')
    .replace(/\bgoverned\b/gi, 'carefully bounded')
    .replace(/\bcanonical\b/gi, 'current')
    .replace(/\bentitlement\b/gi, 'access')
    .replace(/\beligibility\b/gi, 'readiness')
    .replace(/\bMethod\b/g, 'analysis')
    .replace(/\bprojections\b/gi, 'views')
    .replace(/\bprojection\b/gi, 'view');
  const replacements = [
    [/Canonical Registry/gi, 'published structure'],
    [/Canonical Part Registry/gi, 'book structure'],
    [/Public Base/gi, 'public asset source'],
    [/Asset Verification/gi, 'asset availability'],
    [/\bfail-closed\b/gi, 'stops safely'],
    [/\bproduction candidate\b/gi, 'preview'],
    [/\bWPR\b/g, 'PHI OS'],
    [/\bHPC2\b/g, 'PHI OS'],
    [/\bCKA\b/g, 'PHI OS'],
    [/\bMCD\b/g, 'PHI OS'],
    [/\bKAP\b/g, 'PHI OS'],
    [/\bR2\b/g, 'asset storage']
  ];
  for (const [pattern, replacement] of replacements) text = text.replace(pattern, replacement);
  return text;
}

function sanitizeLeaf(element) {
  if (!(element instanceof HTMLElement)) return;
  if (element.closest(SKIP_SANITIZE)) return;
  if (element.children.length > 0 && !element.matches('label,summary,button,a')) return;
  const raw = element.textContent || '';
  if (!raw.trim()) return;
  const risky = RAW_STATE_PATTERN.test(raw) || SECONDARY_INTERNAL_PATTERN.test(raw) || RAW_CODE_TEST.test(raw) || HIGH_RISK_TERMS.some(pattern => {
    pattern.lastIndex = 0;
    return pattern.test(raw);
  }) || /\bauthority\b/i.test(raw);
  if (!risky) return;

  if (RAW_STATE_PATTERN.test(raw)) {
    element.dataset.pxrHidden = 'true';
    element.setAttribute('aria-hidden', 'true');
    return;
  }
  let safe = customerSafeText(raw);
  safe = safe.replace(RAW_CODE_PATTERN, token => token.toLowerCase().replaceAll('_', ' '));
  if (safe !== raw) {
    element.textContent = safe;
    element.dataset.pxrSanitized = 'true';
  }
}

function sanitizeTechnicalLanguage(root = document.body) {
  if (!root) return;
  if (root instanceof HTMLElement) sanitizeLeaf(root);
  root.querySelectorAll?.('p,span,strong,em,small,dt,dd,li,h1,h2,h3,h4,h5,h6,label,summary,button,a').forEach(sanitizeLeaf);
}

function storySectionExists(surfaceCode) {
  return document.querySelector(`[data-pxr-visual-story="${surfaceCode}"]`);
}

function createStoryCard(spec, resolved, index) {
  const figure = document.createElement('figure');
  figure.className = 'pxr-visual-story__card';
  figure.dataset.pxrVisualAsset = spec.assetCode;

  const media = document.createElement('div');
  media.className = 'pxr-visual-story__media';
  const image = document.createElement('img');
  image.src = resolved.src;
  image.alt = localeText(spec.title);
  image.loading = index === 0 ? 'eager' : 'lazy';
  image.decoding = 'async';
  if (resolved.srcset) image.srcset = resolved.srcset;
  if (resolved.sizes) image.sizes = resolved.sizes;
  media.append(image);

  const copy = document.createElement('figcaption');
  copy.className = 'pxr-visual-story__copy';
  const heading = document.createElement('h3');
  heading.textContent = localeText(spec.title);
  const caption = document.createElement('p');
  caption.textContent = localeText(spec.caption);
  copy.append(heading, caption);
  figure.append(media, copy);
  return figure;
}

async function renderStoryFigures(surface) {
  if (!surface?.storyFigures?.length || storySectionExists(surface.surfaceCode)) return;
  const main = document.querySelector('main');
  if (!main) return;

  const resolved = [];
  for (const spec of surface.storyFigures) {
    try {
      const asset = await resolvePublicAssetForWeb(spec.assetCode, { surface: `PXR:${surface.surfaceCode}` });
      if (asset?.renderable) resolved.push([spec, asset]);
    } catch {
      // No technical verification state is exposed to the public page.
    }
  }
  if (!resolved.length) return;

  const section = document.createElement('section');
  section.className = 'pxr-visual-story';
  section.dataset.pxrVisualStory = surface.surfaceCode;
  section.setAttribute('aria-label', getLocale() === 'zh-Hans' ? '视觉说明' : 'Visual explanation');
  const eyebrow = document.createElement('p');
  eyebrow.className = 'pxr-visual-story__eyebrow';
  eyebrow.textContent = getLocale() === 'zh-Hans' ? '看见结构' : 'See the structure';
  const grid = document.createElement('div');
  grid.className = 'pxr-visual-story__grid';
  resolved.forEach(([spec, asset], index) => grid.append(createStoryCard(spec, asset, index)));
  section.append(eyebrow, grid);

  const firstSection = main.querySelector(':scope > section');
  if (firstSection) firstSection.insertAdjacentElement('afterend', section);
  else main.prepend(section);
}

function updateStoryLocale(surface) {
  const section = storySectionExists(surface?.surfaceCode);
  if (!section) return;
  section.setAttribute('aria-label', getLocale() === 'zh-Hans' ? '视觉说明' : 'Visual explanation');
  const eyebrow = section.querySelector('.pxr-visual-story__eyebrow');
  if (eyebrow) eyebrow.textContent = getLocale() === 'zh-Hans' ? '看见结构' : 'See the structure';
  const specs = new Map((surface.storyFigures || []).map(spec => [spec.assetCode, spec]));
  section.querySelectorAll('[data-pxr-visual-asset]').forEach(card => {
    const spec = specs.get(card.dataset.pxrVisualAsset);
    if (!spec) return;
    const title = localeText(spec.title);
    const image = card.querySelector('img');
    if (image) image.alt = title;
    const heading = card.querySelector('h3');
    if (heading) heading.textContent = title;
    const caption = card.querySelector('figcaption p');
    if (caption) caption.textContent = localeText(spec.caption);
  });
}

function observePublicMutations() {
  observer?.disconnect();
  observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) sanitizeTechnicalLanguage(node);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export async function initializePxrPublicExperience() {
  if (!document.body) return { state: 'NO_BODY' };
  const isPublic = document.body.classList.contains('public-page') ||
    document.body.classList.contains('knowledge-page') ||
    document.body.dataset.publicSection;
  if (!isPublic) return { state: 'NOT_PUBLIC_SURFACE' };

  ensureStylesheet();
  document.documentElement.dataset.pxr = 'ACTIVE';
  document.documentElement.dataset.pxrHeroPolicy = 'FULL_SURFACE';
  document.documentElement.dataset.pxrIconPolicy = 'TRANSITIONAL_SUPPRESSED_PENDING_REPLACEMENT';

  const registry = await loadRegistry();
  const surface = surfaceFor(registry);
  if (surface) {
    document.documentElement.dataset.pxrSurface = surface.surfaceCode;
    hideTechnicalSections(surface);
    applyCopyOverrides(surface);
    await renderStoryFigures(surface);
  }
  sanitizeTechnicalLanguage(document.body);
  observePublicMutations();

  onLocaleChange(() => {
    if (!surface) return;
    queueMicrotask(() => {
      hideTechnicalSections(surface);
      applyCopyOverrides(surface);
      updateStoryLocale(surface);
      sanitizeTechnicalLanguage(document.body);
    });
  });

  return { state: 'READY', surfaceCode: surface?.surfaceCode || null };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const run = () => initializePxrPublicExperience().catch(() => {
    document.documentElement.dataset.pxr = 'FAIL_CLOSED';
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else void run();
}
