import { getLocale, onLocaleChange, t } from '../i18n.js';
import {
  bookRoute,
  canonicalPartsForBook,
  loadCanonicalBooks,
  loadCanonicalParts,
  resolveBookCover
} from '../web-production/public-surface-data.js';
import { buildCkaEntryHref, ckaEntryLabel } from '../knowledge/cka-entry-links.js';

const root = document.querySelector('[data-wpr-book-volume]');
const bookId = document.body.dataset.bookId || root?.dataset.bookId || 'book-1';

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
      loadCanonicalBooks(),
      loadCanonicalParts()
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
    const cover = await resolveBookCover(bookId, { surface: 'BOOK', locale, variant: 'HERO' })
      || await resolveBookCover(bookId, { surface: 'BOOK', locale });
    document.title = `${title} — PHI OS`;
    document.documentElement.lang = locale;

    const heroVisual = cover
      ? `<img src="${escapeHtml(cover.src)}" alt="" loading="eager">`
      : `<span class="wpr-volume-fallback wpr-volume-fallback--hero" aria-hidden="true"><span>Φ</span><strong>${String(book.volume).padStart(2,'0')}</strong></span>`;

    const crossVolume = book.cross_volume_sections?.includes('part-0-core-language')
      ? `<div class="wpr-cross-volume"><span>00</span><div><strong>${escapeHtml(partsRegistry.part_0.title?.[locale] || partsRegistry.part_0.title?.en)}</strong><p>${escapeHtml(t('knowledge.production.crossVolume'))}</p></div></div>`
      : '';

    const bookOneActions = Number(book.volume)<=4
      ? `<p>${locale==='zh-Hans'?'每册每个语言版本 RM89，中文与英文分别购买。购买后从个人书库下载对应语言的完整 PDF，并可经权限验证重新下载。网站整本阅读属于后续增值功能。':'RM89 per book, per language. Chinese and English are sold separately. Download the complete purchased PDF from your personal library, with verified re-downloads. Whole-book web reading is a later extra.'}</p>
         <a class="knowledge-action knowledge-action--primary" href="/account?product=COM-BOOK-0${book.volume}-ZH#commerce">${locale==='zh-Hans'?'选择中文 PDF · RM89':'Choose Chinese PDF · RM89'}</a>
         <a class="knowledge-action" href="/account?product=COM-BOOK-0${book.volume}-EN#commerce">${locale==='zh-Hans'?'选择英文 PDF · RM89':'Choose English PDF · RM89'}</a>
         <a class="knowledge-action" href="/account#commerce">${locale==='zh-Hans'?'我的书库与下载':'My library & downloads'}</a>`
      : bookId === 'book-1'
      ? `<a class="knowledge-action knowledge-action--primary" href="/checkout">${escapeHtml(t('knowledge.production.bookOnePurchase'))}</a>
         <a class="knowledge-action" href="/book-one-preview">${escapeHtml(t('knowledge.production.bookOnePreview'))}</a>`
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

    root.innerHTML = `
      <section class="knowledge-hero wpr-book-hero wpr-volume-${escapeHtml(book.volume)}">
        <div class="knowledge-shell wpr-book-hero__grid">
          <div>
            <p class="knowledge-eyebrow">${escapeHtml(t('knowledge.production.volume', { volume: book.volume }))}</p>
            <h1>${escapeHtml(title)}</h1>
            <p class="knowledge-hero__lead">${escapeHtml(subtitle)}</p>
            <p>${escapeHtml(t('knowledge.production.registryLed'))}</p>
            <div class="knowledge-actions">${bookOneActions}<a class="knowledge-action" href="${escapeHtml(askHref)}" data-cka-contextual-entry="BOOK">${escapeHtml(askLabel)}</a><a class="knowledge-action" href="/books">${escapeHtml(t('knowledge.production.allVolumes'))}</a></div>
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
  } catch {
    root.innerHTML = `<section class="knowledge-section"><div class="knowledge-shell"><p>${escapeHtml(t('knowledge.production.sourceUnavailable'))}</p></div></section>`;
  }
}

onLocaleChange(render);
render();
