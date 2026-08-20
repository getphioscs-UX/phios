import { getLocale, onLocaleChange, t } from '../i18n.js';
import {
  bookRoute,
  loadCanonicalBooks,
  resolveBookCover,
  resolveBookBranding
} from '../web-production/public-surface-data.js';

const grid = document.querySelector('[data-wpr-books-grid]');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function render() {
  if (!grid) return;
  const locale = getLocale();
  try {
    const registry = await loadCanonicalBooks();
    if (registry.books.length !== 5) throw new Error('WPR_FIVE_VOLUME_PROJECTION_REQUIRED');
    const cards = await Promise.all(registry.books.slice().sort((a,b) => a.volume-b.volume).map(async book => {
      const branding = await resolveBookBranding(book.book_id, { surface: 'BOOKS', locale });
      const cover = await resolveBookCover(book.book_id, { surface: 'BOOK', locale, variant: 'CARD' })
        || await resolveBookCover(book.book_id, { surface: 'BOOK', locale });
      const title = book.title?.[locale] || book.title?.en || book.book_id;
      const subtitle = book.subtitle?.[locale] || book.subtitle?.en || '';
      const visualAsset = branding || cover;
      const visual = visualAsset
        ? `<img src="${escapeHtml(visualAsset.src)}" alt="" loading="lazy" data-volume-identity="${branding ? 'branding' : 'cover-fallback'}">`
        : `<span class="wpr-volume-fallback" aria-hidden="true"><span>Φ</span><strong>${String(book.volume).padStart(2,'0')}</strong></span>`;
      return `
        <article class="wpr-volume-panel wpr-volume-${escapeHtml(book.volume)}">
          <a class="wpr-volume-panel__visual" href="${escapeHtml(bookRoute(book.book_id))}" data-canonical-book-code="${escapeHtml(book.bookCode)}">${visual}</a>
          <div>
            <p class="wpr-kicker">${escapeHtml(t('knowledge.production.volume', { volume: book.volume }))}</p>
            <h2><a href="${escapeHtml(bookRoute(book.book_id))}">${escapeHtml(title)}</a></h2>
            <p>${escapeHtml(subtitle)}</p>
            <p class="wpr-status">${escapeHtml(t(`knowledge.production.status.${book.status}`))}</p>
            <a class="knowledge-action" href="${escapeHtml(bookRoute(book.book_id))}">${escapeHtml(t('knowledge.production.openVolume'))}</a>
          </div>
        </article>
      `;
    }));
    grid.innerHTML = cards.join('');
  } catch {
    grid.innerHTML = `<p>${escapeHtml(t('knowledge.production.sourceUnavailable'))}</p>`;
  }
}

onLocaleChange(render);
render();
