import {
  getLocale,
  onLocaleChange,
  t
} from '../i18n.js';
import {
  articleHref,
  isArticleSaved,
  loadPublishedArticleBySlug,
  loadPublishedArticles,
  toggleArticleSaved
} from '../knowledge/published-content.js';

const root = document.querySelector('[data-article-slug]');
const slug = root?.dataset.articleSlug || '';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function linkList(items = []) {
  return items.map(item => `
    <a class="knowledge-connection-link" href="${escapeHtml(item.href)}">
      ${escapeHtml(item.label)}
    </a>
  `).join('');
}

function articleMarkup(article, publishedArticles) {
  const related = publishedArticles.filter(candidate => (
    article.connections.relatedArticles.includes(candidate.nodeCode)
  ));
  const saved = isArticleSaved(article.nodeCode);

  return `
    <article class="knowledge-article">
      <header class="knowledge-article__header">
        <a class="knowledge-article__back" href="/articles">← ${escapeHtml(t('knowledge.articles.allArticles'))}</a>
        <p class="knowledge-eyebrow">${escapeHtml(t('knowledge.articles.published'))} · ${escapeHtml(article.nodeCode)}</p>
        <h1>${escapeHtml(article.title)}</h1>
        <p class="knowledge-article__answer">${escapeHtml(article.shortAnswer)}</p>
        <div class="knowledge-article__actions">
          <button class="public-button public-button--secondary" type="button" data-save-article data-node-code="${escapeHtml(article.nodeCode)}">
            ${escapeHtml(t(saved ? 'knowledge.articles.removeSave' : 'knowledge.articles.save'))}
          </button>
          <a class="public-button public-button--quiet" href="/book-one">${escapeHtml(t('knowledge.articles.viewBook'))}</a>
          <a class="public-button public-button--quiet" href="/explore">${escapeHtml(t('knowledge.articles.viewAtlas'))}</a>
        </div>
      </header>

      <div class="knowledge-article__layout">
        <div class="knowledge-article__body">
          ${article.sections.map(section => `
            <section>
              <h2>${escapeHtml(section.heading)}</h2>
              ${section.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}
            </section>
          `).join('')}
        </div>

        <aside class="knowledge-article__aside">
          <section>
            <p class="knowledge-eyebrow">${escapeHtml(t('knowledge.articles.keyConcepts'))}</p>
            <ul>
              ${article.keyConcepts.map(concept => `<li>${escapeHtml(concept)}</li>`).join('')}
            </ul>
          </section>
          <section>
            <p class="knowledge-eyebrow">${escapeHtml(t('knowledge.articles.source'))}</p>
            ${linkList(article.sourceReferences)}
          </section>
        </aside>
      </div>

      <section class="knowledge-boundary" aria-labelledby="article-boundary">
        <p class="knowledge-eyebrow">${escapeHtml(t('knowledge.articles.boundary'))}</p>
        <h2 id="article-boundary">${escapeHtml(t('knowledge.articles.boundaryTitle'))}</h2>
        <ul>
          ${article.knowledgeBoundary.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
        </ul>
      </section>

      ${related.length ? `
        <section class="knowledge-related" aria-labelledby="related-articles">
          <p class="knowledge-eyebrow">${escapeHtml(t('knowledge.articles.continueReading'))}</p>
          <h2 id="related-articles">${escapeHtml(t('knowledge.articles.related'))}</h2>
          <div class="knowledge-grid">
            ${related.map(candidate => `
              <article class="knowledge-card">
                <h3>${escapeHtml(candidate.title)}</h3>
                <p>${escapeHtml(candidate.summary)}</p>
                <a href="${escapeHtml(articleHref(candidate))}">${escapeHtml(t('knowledge.articles.read'))}</a>
              </article>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <nav class="knowledge-exit-grid" aria-label="${escapeHtml(t('knowledge.articles.nextRoutes'))}">
        ${linkList(article.connections.relatedBooks)}
        ${linkList(article.connections.relatedAtlasEntries)}
        ${linkList(article.connections.journeyEntryTopics)}
        <a class="knowledge-connection-link" href="/articles">${escapeHtml(t('knowledge.articles.leaveForNow'))}</a>
      </nav>
    </article>
  `;
}

function bindSave(article) {
  root.querySelector('[data-save-article]')?.addEventListener('click', event => {
    const saved = toggleArticleSaved(article.nodeCode);
    event.currentTarget.textContent = t(
      saved ? 'knowledge.articles.removeSave' : 'knowledge.articles.save'
    );
  });
}

async function render() {
  if (!root) return;

  root.setAttribute('aria-busy', 'true');

  try {
    const locale = getLocale();
    const [article, publishedArticles] = await Promise.all([
      loadPublishedArticleBySlug(slug, locale),
      loadPublishedArticles(locale)
    ]);

    if (!article) {
      root.innerHTML = `
        <div class="knowledge-empty-state">
          <h1>${escapeHtml(t('knowledge.articles.notFound'))}</h1>
          <a href="/articles">${escapeHtml(t('knowledge.articles.allArticles'))}</a>
        </div>
      `;
      return;
    }

    document.title = article.seo.title;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', article.seo.description);
    root.innerHTML = articleMarkup(article, publishedArticles);
    bindSave(article);
  } catch {
    root.innerHTML = `
      <div class="knowledge-empty-state">
        <h1>${escapeHtml(t('knowledge.articles.loadError'))}</h1>
        <a href="/articles">${escapeHtml(t('knowledge.articles.allArticles'))}</a>
      </div>
    `;
  } finally {
    root.removeAttribute('aria-busy');
  }
}

onLocaleChange(render);
render();
