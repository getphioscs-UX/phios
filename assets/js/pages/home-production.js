import { getLocale, onLocaleChange, t } from '../i18n.js';
import { loadPublishedArticles } from '../knowledge/published-content.js';
import {
  alignedFiguresForBook,
  bookRoute,
  figurePublicSrc,
  loadCanonicalBooks,
  loadCanonicalParts,
  loadFigureRegistry,
  resolveBookCover
} from '../web-production/public-surface-data.js';

const booksRoot = document.querySelector('[data-wpr-home-books]');
const visualsRoot = document.querySelector('[data-wpr-home-visuals]');
const knowledgePulse = document.querySelector('[data-wpr-home-knowledge-pulse]');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function bookCard(book, locale) {
  const cover = await resolveBookCover(book.book_id, { surface: 'HOME', locale, variant: 'CARD' })
    || await resolveBookCover(book.book_id, { surface: 'HOME', locale });
  const title = book.title?.[locale] || book.title?.en || book.book_id;
  const subtitle = book.subtitle?.[locale] || book.subtitle?.en || '';
  const volume = String(book.volume).padStart(2, '0');
  const visual = cover
    ? `<img src="${escapeHtml(cover.src)}" alt="" loading="lazy"${cover.width ? ` width="${cover.width}"` : ''}${cover.height ? ` height="${cover.height}"` : ''}>`
    : `<span class="wpr-volume-fallback" aria-hidden="true"><span>Φ</span><strong>${volume}</strong></span>`;

  return `
    <a class="wpr-book-card wpr-volume-${escapeHtml(book.volume)}" href="${escapeHtml(bookRoute(book.book_id))}">
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

async function render() {
  if (!booksRoot) return;
  const locale = getLocale();
  try {
    const [booksRegistry, partsRegistry, figuresRegistry, articles] = await Promise.all([
      loadCanonicalBooks(),
      loadCanonicalParts(),
      loadFigureRegistry(),
      loadPublishedArticles(locale).catch(() => [])
    ]);

    booksRoot.innerHTML = (await Promise.all(
      booksRegistry.books
        .slice()
        .sort((a, b) => a.volume - b.volume)
        .map(book => bookCard(book, locale))
    )).join('');

    const bookOne = booksRegistry.books.find(book => book.book_id === 'book-1');
    const figures = alignedFiguresForBook(bookOne, figuresRegistry, partsRegistry)
      .slice(0, 3);

    if (visualsRoot) {
      visualsRoot.innerHTML = figures.map(figure => {
        const src = figurePublicSrc(figure);
        const title = figure.title?.[locale] || figure.title?.en || figure.figure_number;
        return `
          <a class="wpr-visual-card" href="/figure?id=${encodeURIComponent(figure.figure_id)}">
            ${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy">` : ''}
            <span><strong>${escapeHtml(title)}</strong><small>Figure ${escapeHtml(figure.figure_number)}</small></span>
          </a>
        `;
      }).join('');
    }

    if (knowledgePulse) {
      knowledgePulse.textContent = t('discover.production.knowledgePulse', {
        articles: articles.length,
        figures: alignedFiguresForBook(bookOne, figuresRegistry, partsRegistry).length,
        parts: partsRegistry.parts.length
      });
    }
  } catch {
    booksRoot.innerHTML = `<p class="wpr-production-state">${escapeHtml(t('discover.production.sourceUnavailable'))}</p>`;
    if (visualsRoot) visualsRoot.innerHTML = '';
  }
}

onLocaleChange(render);
render();
