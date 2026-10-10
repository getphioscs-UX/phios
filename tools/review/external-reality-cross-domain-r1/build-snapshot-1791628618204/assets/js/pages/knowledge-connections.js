import {
  getLocale,
  onLocaleChange,
  t
} from '../i18n.js';
import {
  articleHref,
  loadPublishedArticles
} from '../knowledge/published-content.js';

const grids = [...document.querySelectorAll('[data-knowledge-article-grid]')];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cardMarkup(article) {
  return `
    <article class="knowledge-card knowledge-article-card">
      <span class="knowledge-chip">${escapeHtml(t('knowledge.articles.published'))}</span>
      <h3>${escapeHtml(article.title)}</h3>
      <p>${escapeHtml(article.summary)}</p>
      <a href="${escapeHtml(articleHref(article))}">${escapeHtml(t('knowledge.articles.read'))}</a>
    </article>
  `;
}

async function render() {
  if (!grids.length) return;

  try {
    const articles = await loadPublishedArticles(getLocale());

    grids.forEach(grid => {
      const limit = Number.parseInt(grid.dataset.limit || '3', 10);
      const requestedNodes = (grid.dataset.nodes || '')
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
      const selected = requestedNodes.length
        ? articles.filter(article => requestedNodes.includes(article.nodeCode))
        : articles;

      grid.innerHTML = selected
        .slice(0, Number.isFinite(limit) ? limit : 3)
        .map(cardMarkup)
        .join('');
      grid.closest('[data-knowledge-article-section]')?.toggleAttribute(
        'hidden',
        selected.length === 0
      );
    });
  } catch {
    grids.forEach(grid => {
      grid.innerHTML = '';
      grid.closest('[data-knowledge-article-section]')?.setAttribute('hidden', '');
    });
  }
}

onLocaleChange(render);
render();
