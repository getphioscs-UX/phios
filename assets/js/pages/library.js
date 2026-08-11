import { getLocale, onLocaleChange, t } from '../i18n.js';
import { articleHref, loadPublishedArticles } from '../knowledge/published-content.js';
import {
  alignedFiguresForBook,
  bookRoute,
  bookStatusKind,
  loadCanonicalBooks,
  loadCanonicalParts,
  loadFigureRegistry
} from '../web-production/public-surface-data.js';

const search = document.querySelector('#library-search');
const category = document.querySelector('#library-category');
const status = document.querySelector('#library-status');
const grid = document.querySelector('[data-library-grid]');
const results = document.querySelector('[data-library-results]');
const empty = document.querySelector('[data-library-empty]');

const CATEGORY_KEYS = Object.freeze({
  articles: 'knowledge.library.articles',
  research: 'knowledge.library.research',
  books: 'knowledge.library.books',
  atlas: 'knowledge.library.atlas',
  figures: 'knowledge.library.figures',
  glossary: 'knowledge.library.glossary',
  academy: 'knowledge.library.academy',
  downloads: 'knowledge.library.downloads'
});

const STATUS_KEYS = Object.freeze({
  published: 'knowledge.articles.published',
  available: 'knowledge.common.available',
  preview: 'knowledge.common.preview',
  development: 'knowledge.common.development',
  architecture: 'knowledge.common.architecture'
});

let resources = [];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function localized(value, locale) {
  return value?.[locale] || value?.en || '';
}

async function buildResources(locale) {
  const [booksRegistry, partsRegistry, figuresRegistry, articles] = await Promise.all([
    loadCanonicalBooks(),
    loadCanonicalParts(),
    loadFigureRegistry(),
    loadPublishedArticles(locale).catch(() => [])
  ]);

  const bookResources = booksRegistry.books.map(book => ({
    id: book.book_id,
    category: 'books',
    status: bookStatusKind(book),
    href: bookRoute(book.book_id),
    title: `${t('knowledge.production.volume', { volume: book.volume })} · ${localized(book.title, locale)}`,
    description: localized(book.subtitle, locale)
  }));

  const bookOne = booksRegistry.books.find(book => book.book_id === 'book-1');
  const alignedFigureCount = alignedFiguresForBook(bookOne, figuresRegistry, partsRegistry).length;

  return [
    ...articles.map(article => ({
      id: article.nodeCode,
      category: 'articles',
      status: 'published',
      href: articleHref(article),
      title: article.title,
      description: article.summary
    })),
    {
      id: 'reality-navigation-thesis',
      category: 'research',
      status: 'available',
      href: '/thesis',
      title: t('knowledge.production.thesisTitle'),
      description: t('knowledge.production.thesisCopy')
    },
    ...bookResources,
    {
      id: 'book-one-preview',
      category: 'books',
      status: 'preview',
      href: '/book-one-preview',
      title: t('knowledge.production.previewTitle'),
      description: t('knowledge.production.previewCopy')
    },
    {
      id: 'reality-atlas',
      category: 'atlas',
      status: 'available',
      href: '/explore',
      title: t('knowledge.production.atlasTitle'),
      description: t('knowledge.production.atlasCopy')
    },
    {
      id: 'book-one-figures',
      category: 'figures',
      status: 'available',
      href: '/figures',
      title: t('knowledge.production.figuresTitle'),
      description: t('knowledge.production.figuresCopy', { count: alignedFigureCount })
    },
    {
      id: 'book-one-glossary',
      category: 'glossary',
      status: 'available',
      href: '/glossary',
      title: t('knowledge.production.glossaryTitle'),
      description: t('knowledge.production.glossaryCopy')
    },
    {
      id: 'academy-discovery',
      category: 'academy',
      status: 'available',
      href: '/academy',
      title: t('knowledge.production.academyTitle'),
      description: t('knowledge.production.academyCopy')
    },
    {
      id: 'thesis-downloads',
      category: 'downloads',
      status: 'available',
      href: '/thesis#downloads',
      title: t('knowledge.production.downloadsTitle'),
      description: t('knowledge.production.downloadsCopy')
    }
  ];
}

function render() {
  if (!grid) return;
  const locale = getLocale();
  const query = String(search?.value || '').trim().toLocaleLowerCase(locale);
  const selectedCategory = category?.value || 'all';
  const selectedStatus = status?.value || 'all';
  const visible = resources.filter(resource => {
    const searchable = `${resource.title} ${resource.description} ${resource.category}`.toLocaleLowerCase(locale);
    return (selectedCategory === 'all' || resource.category === selectedCategory)
      && (selectedStatus === 'all' || resource.status === selectedStatus)
      && (!query || searchable.includes(query));
  });

  grid.innerHTML = visible.map(resource => `
    <article class="knowledge-card" data-resource-id="${escapeHtml(resource.id)}">
      <div class="knowledge-card__meta">
        <span class="knowledge-chip">${escapeHtml(t(CATEGORY_KEYS[resource.category]))}</span>
        <span class="knowledge-status knowledge-status--${escapeHtml(resource.status)}">${escapeHtml(t(STATUS_KEYS[resource.status]))}</span>
      </div>
      <h2>${escapeHtml(resource.title)}</h2>
      <p>${escapeHtml(resource.description)}</p>
      <p><a href="${escapeHtml(resource.href)}">${escapeHtml(t('knowledge.common.open'))}</a></p>
    </article>
  `).join('');

  results.textContent = t('knowledge.library.results', { count: visible.length });
  empty.hidden = visible.length !== 0;
}

async function loadAndRender() {
  try {
    resources = await buildResources(getLocale());
  } catch {
    resources = [];
  }
  render();
}

[search, category, status].forEach(control => {
  control?.addEventListener('input', render);
  control?.addEventListener('change', render);
});
onLocaleChange(loadAndRender);
loadAndRender();
