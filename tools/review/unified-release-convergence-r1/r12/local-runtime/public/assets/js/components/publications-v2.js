import { currentLocale } from '../public-shell-v2.js';
const INDEX_URL = '/content/knowledge/public/retrieval/publications.json';
const copy = {
  'zh-Hans': { empty: '暂时没有可显示的文章。', more: '查看全部文章', featured: '精选文章', article: '文章' },
  en: { empty: 'No published articles are available yet.', more: 'View all articles', featured: 'Featured articles', article: 'Article' }
};
function c(){ return copy[currentLocale()] || copy.en; }
function uniqueNodeCodes(records) {
  const seen = new Set();
  const ordered = [];
  for (const record of records) {
    if (!seen.has(record.nodeCode)) {
      seen.add(record.nodeCode);
      ordered.push(record.nodeCode);
    }
  }
  return ordered;
}
async function fetchArticle(locale, nodeCode) {
  const response = await fetch(`/content/knowledge/public/authority/articles/${locale}/${nodeCode}.json`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('ARTICLE_FETCH_FAILED');
  const payload = await response.json();
  return payload.article || null;
}
function renderCard(article, locale) {
  const href = article.href || '/articles';
  return `
    <a class="puxr-article" href="${href}">
      <small><span>${c().article}</span><span>${locale === 'zh-Hans' ? '中文' : 'EN'}</span></small>
      <h3>${article.title || ''}</h3>
      <p>${article.summary || ''}</p>
    </a>
  `;
}
async function populate(root) {
  const locale = currentLocale();
  root.innerHTML = `<div class="puxr-empty">Loading…</div>`;
  try {
    const res = await fetch(INDEX_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('PUBLICATIONS_INDEX_FAILED');
    const payload = await res.json();
    const records = (payload.records || []).filter(record => record.locale === locale && record.status === 'published');
    const nodeCodes = uniqueNodeCodes(records).slice(0, Number(root.dataset.puxrPublicationsLimit || 6));
    const articles = (await Promise.all(nodeCodes.map(code => fetchArticle(locale, code).catch(() => null)))).filter(Boolean);
    if (!articles.length) {
      root.innerHTML = `<div class="puxr-empty">${c().empty}</div>`;
      return;
    }
    root.innerHTML = articles.map(article => renderCard(article, locale)).join('');
  } catch {
    root.innerHTML = `<div class="puxr-empty">${c().empty}</div>`;
  }
}
async function boot() {
  const roots = [...document.querySelectorAll('[data-puxr-publications]')];
  await Promise.all(roots.map(populate));
}
window.addEventListener('puxr:localechange', () => { void boot(); });
void boot();
