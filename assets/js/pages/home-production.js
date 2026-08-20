import { getLocale, onLocaleChange, t } from '../i18n.js';
import { loadPublishedArticles } from '../knowledge/published-content.js';
import {
  bookRoute,
  clientVisualRecord,
  loadCanonicalBooks,
  loadCanonicalParts,
  loadClientVisualRegistry,
  resolveBookCover,
  resolveCanonicalVisual
} from '../web-production/public-surface-data.js';

const booksRoot = document.querySelector('[data-wpr-home-books]');
const visualsRoot = document.querySelector('[data-wpr-home-visuals]');
const knowledgePulse = document.querySelector('[data-wpr-home-knowledge-pulse]');
const heroScene = document.querySelector('[data-hpc2-scene="H01"]');
const heroRoot = document.querySelector('[data-hpc2-hero="HERO-001"]');
const realityScene = document.querySelector('[data-hpc2-scene="H02"]');
const realityFigureRoot = realityScene?.querySelector('[data-hpc2-figure="FIG-054"]') || null;
const lensesScene = document.querySelector('[data-hpc2-scene="H03"]');
const lensesFigureRoot = lensesScene?.querySelector('[data-hpc2-figure="FIG-055"]') || null;
const phiosRuntimeScene = document.querySelector('[data-hpc2-scene="H04"]');
const phiosRuntimeFigureRoot = phiosRuntimeScene?.querySelector('[data-hpc2-figure="FIG-056"]') || null;
const FIVE_VOLUME_FIGURE = 'FIG-001';
const HOMEPAGE_SUCCESSOR_FIGURES = Object.freeze(['FIG-054', 'FIG-055', 'FIG-056', 'FIG-057']);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function resolvedImageMarkup(resolved, { alt = '', className = '', loading = null, fetchPriority = null } = {}) {
  if (!resolved) return '';
  const attrs = [
    `src="${escapeHtml(resolved.src)}"`,
    `alt="${escapeHtml(alt)}"`,
    `data-hpc2-resolved-asset="${escapeHtml(resolved.assetCode)}"`,
    `data-hpc2-object-key="${escapeHtml(resolved.objectKey || '')}"`,
    `data-hpc2-delivery-state="${escapeHtml(resolved.deliveryState)}"`
  ];
  if (className) attrs.push(`class="${escapeHtml(className)}"`);
  if (resolved.width) attrs.push(`width="${Number(resolved.width)}"`);
  if (resolved.height) attrs.push(`height="${Number(resolved.height)}"`);
  attrs.push(`loading="${escapeHtml(loading || resolved.loading || 'lazy')}"`);
  attrs.push(`fetchpriority="${escapeHtml(fetchPriority || resolved.fetchPriority || 'auto')}"`);
  if (resolved.srcset) attrs.push(`srcset="${escapeHtml(resolved.srcset)}"`);
  if (resolved.sizes) attrs.push(`sizes="${escapeHtml(resolved.sizes)}"`);
  return `<img ${attrs.join(' ')}>`;
}

async function renderAssetTarget(target, assetCode, locale, visualRegistry) {
  if (!target) return false;
  const metadata = clientVisualRecord(visualRegistry, assetCode);
  const resolved = await resolveCanonicalVisual(assetCode, { surface: 'HOME', locale });
  target.dataset.hpc2AssetState = resolved ? 'REMOTE_VERIFIED_RENDERED' : 'FAIL_CLOSED_NOT_RENDERED';
  if (!resolved) {
    target.replaceChildren();
    return false;
  }
  const decorative = target.dataset.hpc2Decorative !== 'false';
  const alt = decorative ? '' : (metadata?.title || metadata?.semanticName || assetCode);
  target.innerHTML = resolvedImageMarkup(resolved, {
    alt,
    className: target.dataset.hpc2ImageClass || '',
    loading: target.dataset.hpc2Loading || null,
    fetchPriority: target.dataset.hpc2FetchPriority || null
  });
  return true;
}

async function bookCard(book, locale) {
  const cover = await resolveBookCover(book.book_id, { surface: 'HOME', locale, variant: 'CARD' })
    || await resolveBookCover(book.book_id, { surface: 'HOME', locale });
  const title = book.title?.[locale] || book.title?.en || book.book_id;
  const subtitle = book.subtitle?.[locale] || book.subtitle?.en || '';
  const volume = String(book.volume).padStart(2, '0');
  const visual = cover
    ? resolvedImageMarkup(cover, { alt: '', loading: 'lazy' })
    : `<span class="wpr-volume-fallback" aria-hidden="true"><span>Φ</span><strong>${volume}</strong></span>`;

  return `
    <a class="wpr-book-card wpr-volume-${escapeHtml(book.volume)}" href="${escapeHtml(bookRoute(book.book_id))}" data-hpc2-cover-consumer="BOOK-${escapeHtml(book.volume)}-HARDCOVER">
      <span class="wpr-book-card__visual">${visual}</span>
      <span class="wpr-book-card__body">
        <span class="wpr-kicker">${escapeHtml(t('discover.production.volumeLabel', { volume }))}</span>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(subtitle)}</span>
        <small>${escapeHtml(t(`discover.production.bookStatus.${book.status}`))}</small>
      </span>
    </a>
  `;
}

async function renderSuccessorGallery(locale, visualRegistry) {
  if (!visualsRoot) return 0;
  const cards = await Promise.all(HOMEPAGE_SUCCESSOR_FIGURES.map(async assetCode => {
    const metadata = clientVisualRecord(visualRegistry, assetCode);
    const resolved = await resolveCanonicalVisual(assetCode, { surface: 'HOME', locale });
    if (!resolved) return '';
    const title = metadata?.title || metadata?.semanticName || assetCode;
    return `
      <a class="wpr-visual-card hpc2-visual-card" href="/figures" data-hpc2-gallery-asset="${escapeHtml(assetCode)}">
        ${resolvedImageMarkup(resolved, { alt: title, loading: 'lazy' })}
        <span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(assetCode)}</small></span>
      </a>
    `;
  }));
  visualsRoot.innerHTML = cards.join('');
  visualsRoot.dataset.hpc2GalleryState = cards.some(Boolean) ? 'REMOTE_VERIFIED_RENDERED' : 'FAIL_CLOSED_NOT_RENDERED';
  return cards.filter(Boolean).length;
}

async function render() {
  if (!booksRoot) return;
  const locale = getLocale();
  try {
    const [booksRegistry, partsRegistry, visualRegistry, articles] = await Promise.all([
      loadCanonicalBooks(),
      loadCanonicalParts(),
      loadClientVisualRegistry(),
      loadPublishedArticles(locale).catch(() => [])
    ]);

    const heroRendered = await renderAssetTarget(heroRoot, 'HERO-001', locale, visualRegistry);
    if (heroScene) {
      heroScene.dataset.hpc2SceneState = heroRendered
        ? 'H01_PRODUCTION_COMPOSED_REMOTE_VERIFIED_ASSET_RENDERED'
        : 'H01_FAIL_CLOSED_HERO_ASSET_NOT_RENDERED';
    }

    const realityFigureRendered = await renderAssetTarget(realityFigureRoot, 'FIG-054', locale, visualRegistry);
    if (realityScene) {
      realityScene.dataset.hpc2SceneState = realityFigureRendered
        ? 'H02_PRODUCTION_COMPOSED_REMOTE_VERIFIED_ASSET_RENDERED'
        : 'H02_FAIL_CLOSED_FIGURE_ASSET_NOT_RENDERED';
    }

    const lensesFigureRendered = await renderAssetTarget(lensesFigureRoot, 'FIG-055', locale, visualRegistry);
    if (lensesScene) {
      lensesScene.dataset.hpc2SceneState = lensesFigureRendered
        ? 'H03_PRODUCTION_COMPOSED_REMOTE_VERIFIED_ASSET_RENDERED'
        : 'H03_FAIL_CLOSED_FIGURE_ASSET_NOT_RENDERED';
    }

    const phiosRuntimeFigureRendered = await renderAssetTarget(phiosRuntimeFigureRoot, 'FIG-056', locale, visualRegistry);
    if (phiosRuntimeScene) {
      phiosRuntimeScene.dataset.hpc2SceneState = phiosRuntimeFigureRendered
        ? 'H04_PRODUCTION_COMPOSED_REMOTE_VERIFIED_ASSET_RENDERED'
        : 'H04_FAIL_CLOSED_FIGURE_ASSET_NOT_RENDERED';
    }

    booksRoot.innerHTML = (await Promise.all(
      booksRegistry.books
        .slice()
        .sort((a, b) => a.volume - b.volume)
        .map(book => bookCard(book, locale))
    )).join('');

    const staticTargets = [...document.querySelectorAll('[data-hpc2-figure], [data-hpc2-icon]')]
      .filter(target => target !== realityFigureRoot && target !== lensesFigureRoot && target !== phiosRuntimeFigureRoot);
    const staticResults = await Promise.all(staticTargets.map(target => {
      const assetCode = target.dataset.hpc2Figure || target.dataset.hpc2Icon;
      return renderAssetTarget(target, assetCode, locale, visualRegistry);
    }));

    const galleryCount = await renderSuccessorGallery(locale, visualRegistry);

    if (knowledgePulse) {
      knowledgePulse.textContent = t('discover.production.knowledgePulse', {
        articles: articles.length,
        figures: visualRegistry.assets.filter(record => record.assetType === 'FIGURE').length,
        parts: partsRegistry.parts.length
      });
      knowledgePulse.dataset.hpc2HeroRendered = String(heroRendered);
      knowledgePulse.dataset.hpc2RealityFigureRendered = String(realityFigureRendered);
      knowledgePulse.dataset.hpc2LensesFigureRendered = String(lensesFigureRendered);
      knowledgePulse.dataset.hpc2RuntimeFigureRendered = String(phiosRuntimeFigureRendered);
      knowledgePulse.dataset.hpc2StaticVisualsRendered = String(staticResults.filter(Boolean).length);
      knowledgePulse.dataset.hpc2SuccessorGalleryRendered = String(galleryCount);
    }
  } catch (error) {
    booksRoot.innerHTML = `<p class="wpr-production-state">${escapeHtml(t('discover.production.sourceUnavailable'))}</p>`;
    if (visualsRoot) visualsRoot.innerHTML = '';
    if (heroRoot) heroRoot.replaceChildren();
    if (realityFigureRoot) realityFigureRoot.replaceChildren();
    if (lensesFigureRoot) lensesFigureRoot.replaceChildren();
    if (phiosRuntimeFigureRoot) phiosRuntimeFigureRoot.replaceChildren();
    if (heroScene) heroScene.dataset.hpc2SceneState = 'H01_FAIL_CLOSED_HOME_SOURCE_ERROR';
    if (realityScene) realityScene.dataset.hpc2SceneState = 'H02_FAIL_CLOSED_HOME_SOURCE_ERROR';
    if (lensesScene) lensesScene.dataset.hpc2SceneState = 'H03_FAIL_CLOSED_HOME_SOURCE_ERROR';
    if (phiosRuntimeScene) phiosRuntimeScene.dataset.hpc2SceneState = 'H04_FAIL_CLOSED_HOME_SOURCE_ERROR';
    document.documentElement.dataset.hpc2HomeVisualError = error?.message || 'HPC2_PRE_HOME_VISUAL_ERROR';
  }
}

onLocaleChange(render);
render();
