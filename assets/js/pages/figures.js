import { getLocale, onLocaleChange, t } from '../i18n.js';
import {
  figureHasCanonicalBookOwnership,
  figurePublicSrc,
  loadCanonicalParts,
  loadFigureRegistry
} from '../web-production/public-surface-data.js';

const filter = document.querySelector('#figure-part');
const grid = document.querySelector('[data-figure-grid]');
const results = document.querySelector('[data-figure-results]');
let figures = [];
let englishCaptions = {};
let partsRegistry = null;

const requestedPart = new URLSearchParams(window.location.search).get('part');
if (filter && ['0', '1', '2', '3', '4'].includes(requestedPart)) filter.value = requestedPart;

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function render() {
  const locale = getLocale();
  const part = filter?.value || 'all';
  const visible = figures
    .filter(figure => figureHasCanonicalBookOwnership(figure, partsRegistry))
    .filter(figure => part === 'all' || String(figure.part) === part);

  grid.innerHTML = visible.map(figure => {
    const caption = locale === 'en' ? englishCaptions[figure.figure_id] || figure.purpose : figure.purpose;
    const title = figure.title?.[locale] || figure.title?.en || figure.figure_number;
    const src = figurePublicSrc(figure);
    return `
      <article class="figure-card">
        ${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" width="720" height="1023" loading="lazy">` : ''}
        <div class="figure-card__body">
          <div class="knowledge-card__meta"><span class="knowledge-chip">Figure ${escapeHtml(figure.figure_number)}</span><span class="knowledge-chip">Part ${escapeHtml(figure.part)}</span></div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(caption)}</p>
          <a href="/figure?id=${encodeURIComponent(figure.figure_id)}">${escapeHtml(t('knowledge.figures.open'))}</a>
        </div>
      </article>`;
  }).join('');
  results.textContent = t('knowledge.figures.result', { count: visible.length });
}

Promise.all([
  loadFigureRegistry(),
  loadCanonicalParts(),
  fetch('/content/knowledge/figure-captions-en.json').then(response => response.json())
]).then(([registry, parts, translation]) => {
  figures = registry.figures.filter(figure => Number(figure.book) === 1);
  partsRegistry = parts;
  englishCaptions = translation.captions;
  render();
});

filter?.addEventListener('change', render);
onLocaleChange(render);
