import {
  getLocale,
  onLocaleChange,
  t
} from '../i18n.js';
import { LIBRARY_RESOURCES } from '../knowledge/catalog.js';

const search = document.querySelector('#library-search');
const category = document.querySelector('#library-category');
const status = document.querySelector('#library-status');
const grid = document.querySelector('[data-library-grid]');
const results = document.querySelector('[data-library-results]');
const empty = document.querySelector('[data-library-empty]');

const CATEGORY_KEYS = Object.freeze({
  research: 'knowledge.library.research',
  books: 'knowledge.library.books',
  atlas: 'knowledge.library.atlas',
  figures: 'knowledge.library.figures',
  glossary: 'knowledge.library.glossary',
  downloads: 'knowledge.library.downloads'
});

const STATUS_KEYS = Object.freeze({
  available: 'knowledge.common.available',
  preview: 'knowledge.common.preview',
  development: 'knowledge.common.development',
  later: 'knowledge.common.later'
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function render() {
  const locale = getLocale();
  const query = String(search?.value || '').trim().toLocaleLowerCase(locale);
  const selectedCategory = category?.value || 'all';
  const selectedStatus = status?.value || 'all';

  const visible = LIBRARY_RESOURCES.filter(resource => {
    const localizedTitle = resource.title[locale] || resource.title.en;
    const localizedDescription = resource.description[locale] || resource.description.en;
    const searchText = `${localizedTitle} ${localizedDescription} ${resource.category}`.toLocaleLowerCase(locale);

    return (
      (selectedCategory === 'all' || resource.category === selectedCategory) &&
      (selectedStatus === 'all' || resource.status === selectedStatus) &&
      (!query || searchText.includes(query))
    );
  });

  grid.innerHTML = visible.map(resource => `
    <article class="knowledge-card" data-resource-id="${escapeHtml(resource.id)}">
      <div class="knowledge-card__meta">
        <span class="knowledge-chip">${escapeHtml(t(CATEGORY_KEYS[resource.category]))}</span>
        <span class="knowledge-status knowledge-status--${escapeHtml(resource.status)}">${escapeHtml(t(STATUS_KEYS[resource.status]))}</span>
      </div>
      <h2>${escapeHtml(resource.title[locale] || resource.title.en)}</h2>
      <p>${escapeHtml(resource.description[locale] || resource.description.en)}</p>
      <p><a href="${escapeHtml(resource.href)}">${escapeHtml(t('knowledge.common.open'))}</a></p>
    </article>
  `).join('');

  results.textContent = t('knowledge.library.results', { count: visible.length });
  empty.hidden = visible.length !== 0;
}

[search, category, status].forEach(control => {
  control?.addEventListener('input', render);
  control?.addEventListener('change', render);
});

onLocaleChange(render);
render();
