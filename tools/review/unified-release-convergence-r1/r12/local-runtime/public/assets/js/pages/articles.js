import {
  getLocale,
  onLocaleChange,
  t
} from '../i18n.js';
import {
  articleHref,
  isArticleSaved,
  loadPublishedArticles
} from '../knowledge/published-content.js';

const grid = document.querySelector('[data-articles-grid]');
const status = document.querySelector('[data-articles-status]');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cardMarkup(article) {
  const saved = isArticleSaved(article.nodeCode);
  const roleKey = article.contentRole === 'canonical'
    ? 'knowledge.articles.canonicalChinese'
    : 'knowledge.articles.localizedEnglish';

  return `
    <article class="knowledge-card knowledge-article-card">
      <div class="knowledge-card__meta">
        <span class="knowledge-chip">${escapeHtml(t('knowledge.articles.published'))}</span>
        <span class="knowledge-article-card__role">${escapeHtml(t(roleKey))}</span>
      </div>
      <h2>${escapeHtml(article.title)}</h2>
      <p>${escapeHtml(article.summary)}</p>
      <div class="knowledge-article-card__footer">
        <a class="public-button public-button--secondary" href="${escapeHtml(articleHref(article))}">
          ${escapeHtml(t('knowledge.articles.read'))}
        </a>
        ${saved ? `<span class="knowledge-saved-state">${escapeHtml(t('knowledge.articles.saved'))}</span>` : ''}
      </div>
    </article>
  `;
}

async function render() {
  if (!grid) return;

  const locale = getLocale();
  status.textContent = t('knowledge.articles.loading');

  try {
    const articles = await loadPublishedArticles(locale);
    grid.innerHTML = articles.map(cardMarkup).join('');
    status.textContent = articles.length
      ? t('knowledge.articles.results', { count: articles.length })
      : t('knowledge.articles.empty');
  } catch {
    grid.innerHTML = '';
    status.textContent = t('knowledge.articles.loadError');
  }
}

onLocaleChange(render);
render();
