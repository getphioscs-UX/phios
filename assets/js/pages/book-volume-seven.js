import { getLocale, onLocaleChange, t } from '../i18n.js';
import {bookRoute,canonicalPartsForBook,loadSevenVolumeBooks,loadSevenVolumeParts,resolveSevenVolumeBookCover} from '../web-production/public-surface-data-seven.js';
import { buildCkaEntryHref, ckaEntryLabel } from '../knowledge/cka-entry-links.js';

const root = document.querySelector('[data-wpr-book-volume]');
const bookId = document.body.dataset.bookId || root?.dataset.bookId || 'book-7';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function partMarkup(part, locale) {
  const title = part.title?.[locale] || part.title?.en || `Part ${part.number}`;
  return `
    <article class="wpr-part-card">
      <span class="wpr-part-card__number">${String(part.number).padStart(2, '0')}</span>
      <div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(t(`knowledge.production.partState.${part.content_status || 'architecture-only'}`))}</p></div>
    </article>
  `;
}

async function render() {
  if (!root) return;
  const locale = getLocale();
  try {
    const [booksRegistry, partsRegistry] = await Promise.all([
      loadSevenVolumeBooks(),
      loadSevenVolumeParts()
    ]);
    const book = booksRegistry.books.find(item => item.book_id === bookId);
    if (!book) throw new Error('WPR_BOOK_NOT_FOUND');

    const canonicalRoute = bookRoute(bookId);
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.append(canonicalLink);
    }
    canonicalLink.href = new URL(canonicalRoute, window.location.origin).href;

    const title = book.title?.[locale] || book.title?.en || bookId;
    const subtitle = book.subtitle?.[locale] || book.subtitle?.en || '';
    const parts = canonicalPartsForBook(book, partsRegistry);
    const cover = await resolveSevenVolumeBookCover(bookId);
    document.title = `${title} — PHI OS`;
    document.documentElement.lang = locale;

    const heroVisual = cover
      ? `<img src="${escapeHtml(cover.src)}" alt="" loading="eager">`
      : `<span class="wpr-volume-fallback wpr-volume-fallback--hero" aria-hidden="true"><span>Φ</span><strong>${String(book.volume).padStart(2,'0')}</strong></span>`;

    const crossVolume = book.cross_volume_sections?.includes('part-0-core-language')
      ? `<div class="wpr-cross-volume"><span>00</span><div><strong>${escapeHtml(partsRegistry.part_0.title?.[locale] || partsRegistry.part_0.title?.en)}</strong><p>${escapeHtml(t('knowledge.production.crossVolume'))}</p></div></div>`
      : '';

    const bookOneActions = bookId === 'book-1'
      ? `<a class="knowledge-action knowledge-action--primary" href="/checkout">${escapeHtml(t('knowledge.production.bookOnePurchase'))}</a>
         <a class="knowledge-action" href="/book-one-preview">${escapeHtml(t('knowledge.production.bookOnePreview'))}</a>`
      : bookId === 'book-5'
        ? `<a class="knowledge-action knowledge-action--primary" href="#book-parts">${escapeHtml(locale==='zh-Hans'?'阅读《世界如何分化》':'Read World Differentiation')}</a>`
        : `<span class="wpr-status">${escapeHtml(t('knowledge.production.futureVolumeBoundary'))}</span>`;
    const askHref = buildCkaEntryHref({
      entrySurface: 'BOOK',
      contextType: 'CANONICAL_VOLUME',
      contextId: book.book_id,
      bookCode: book.book_id,
      contextLabel: title,
      contextSummary: subtitle,
      readingPath: `${canonicalRoute}#book-parts`,
      relatedKnowledgeRef: parts.map(part => `P${part.number}`).join(',')
    });
    const askLabel = ckaEntryLabel('BOOK', locale);
    const atlasAction = bookId === 'book-5'
      ? `<a class="knowledge-action knowledge-action--primary" href="#atlas">${escapeHtml(locale==='zh-Hans'?'探索文明图谱':'Explore Civilization Atlas')}</a>`
      : '';

    const persistentAtlas = bookId === 'book-5' ? document.querySelector('[data-civilization-atlas-root]') : null;
    if (persistentAtlas && root.contains(persistentAtlas)) root.insertAdjacentElement('afterend', persistentAtlas);

    root.innerHTML = `
      <section class="knowledge-hero wpr-book-hero wpr-volume-${escapeHtml(book.volume)}">
        <div class="knowledge-shell wpr-book-hero__grid">
          <div>
            <p class="knowledge-eyebrow">${escapeHtml(t('knowledge.production.volume', { volume: book.volume }))}</p>
            <h1>${escapeHtml(title)}</h1>
            <p class="knowledge-hero__lead">${escapeHtml(subtitle)}</p>
            <p>${escapeHtml(t('knowledge.production.registryLed'))}</p>
            <div class="knowledge-actions">${bookOneActions}${atlasAction}<a class="knowledge-action" href="${escapeHtml(askHref)}" data-cka-contextual-entry="BOOK">${escapeHtml(askLabel)}</a><a class="knowledge-action" href="/books/">${escapeHtml(locale==='zh-Hans'?'查看全部七册':'All seven volumes')}</a></div>
          </div>
          <figure class="wpr-book-cover"><div>${heroVisual}</div><figcaption>${escapeHtml(t('knowledge.production.coverBoundary'))}</figcaption></figure>
        </div>
      </section>
      <section class="knowledge-section knowledge-section--paper" id="book-parts">
        <div class="knowledge-shell">
          <p class="knowledge-eyebrow">${escapeHtml(t('knowledge.production.architectureEyebrow'))}</p>
          <h2>${escapeHtml(t('knowledge.production.architectureTitle', { count: parts.length }))}</h2>
          ${crossVolume}
          <div class="wpr-parts-grid">${parts.map(part => partMarkup(part, locale)).join('')}</div>
          <p class="knowledge-boundary">${escapeHtml(t('knowledge.production.ownershipBoundary'))}</p>
        </div>
      </section>
    `;

    if (persistentAtlas) {
      const hero = root.querySelector('.wpr-book-hero');
      if (hero) hero.insertAdjacentElement('afterend', persistentAtlas);
    }
  } catch {
    root.innerHTML = `<section class="knowledge-section"><div class="knowledge-shell"><p>${escapeHtml(t('knowledge.production.sourceUnavailable'))}</p></div></section>`;
  }
}

onLocaleChange(render);
render();
