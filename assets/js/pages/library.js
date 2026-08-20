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
import { buildCkaEntryHref, ckaEntryLabel } from '../knowledge/cka-entry-links.js';

const search = document.querySelector('#library-search');
const category = document.querySelector('#library-category');
const status = document.querySelector('#library-status');
const partFilter = document.querySelector('#library-part');
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
    description: localized(book.subtitle, locale),
    parts: (book.parts || []).map(number => `P${number}`),
    askContext: {
      contextType: 'CANONICAL_VOLUME',
      bookCode: book.book_id,
      contextLabel: localized(book.title, locale),
      contextSummary: localized(book.subtitle, locale),
      readingPath: `${bookRoute(book.book_id)}#book-parts`
    }
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
      description: article.summary,
      parts: article.publicationContext?.partCode ? [article.publicationContext.partCode] : [],
      askContext: {
        contextType: 'PUBLISHED_ARTICLE',
        articleCode: article.nodeCode,
        bookCode: article.publicationContext?.bookCode,
        partCode: article.publicationContext?.partCode,
        contextLabel: article.title,
        contextSummary: article.summary,
        relatedKnowledgeRef: article.nodeCode
      }
    })),
    {
      id: 'knowledge-access',
      category: 'articles',
      status: 'available',
      href: '/knowledge-search',
      title: locale === 'zh-Hans' ? '询问 PHI OS Knowledge' : 'Ask PHI OS Knowledge',
      description: locale === 'zh-Hans'
        ? 'Ask 用于理解知识；Search 与 Library 用于查找、浏览和发现，两者不会合并成重复产品。'
        : 'Ask is for understanding knowledge; Search and Library are for finding, browsing and discovery without becoming duplicate products.'
    },
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
  const selectedPart = partFilter?.value || 'all';
  const visible = resources.filter(resource => {
    const searchable = `${resource.title} ${resource.description} ${resource.category}`.toLocaleLowerCase(locale);
    return (selectedCategory === 'all' || resource.category === selectedCategory)
      && (selectedStatus === 'all' || resource.status === selectedStatus)
      && (selectedPart === 'all' || (resource.parts || []).includes(selectedPart))
      && (!query || searchable.includes(query));
  });

  grid.innerHTML = visible.map(resource => {
    const askHref = buildCkaEntryHref({
      entrySurface: 'LIBRARY',
      contextId: resource.id,
      contextLabel: resource.title,
      contextSummary: resource.description,
      ...(resource.askContext || {})
    });
    const openLabel = resource.category === 'figures'
      ? (locale === 'zh-Hans' ? '查看 Figure' : 'View figure')
      : ['articles', 'books', 'research'].includes(resource.category)
        ? (locale === 'zh-Hans' ? '阅读' : 'Read')
        : t('knowledge.common.open');
    return `
    <article class="knowledge-card" data-resource-id="${escapeHtml(resource.id)}">
      <div class="knowledge-card__meta">
        <span class="knowledge-chip">${escapeHtml(t(CATEGORY_KEYS[resource.category]))}</span>
        <span class="knowledge-status knowledge-status--${escapeHtml(resource.status)}">${escapeHtml(t(STATUS_KEYS[resource.status]))}</span>
      </div>
      <h2>${escapeHtml(resource.title)}</h2>
      <p>${escapeHtml(resource.description)}</p>
      <p class="knowledge-actions">
        <a href="${escapeHtml(resource.href)}">${escapeHtml(openLabel)}</a>
        <a href="${escapeHtml(askHref)}" data-cka-contextual-entry="LIBRARY">${escapeHtml(ckaEntryLabel('KNOWLEDGE', locale))}</a>
      </p>
    </article>
  `;
  }).join('');

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

const initialQuery = new URLSearchParams(location.search).get('query');
if (initialQuery && search) search.value = initialQuery.slice(0, 160);

[search, category, status, partFilter].forEach(control => {
  control?.addEventListener('input', render);
  control?.addEventListener('change', render);
});
onLocaleChange(loadAndRender);
loadAndRender();
