import { getLocale, onLocaleChange, t } from '../i18n.js';
import {
  figureHasCanonicalBookOwnership,
  figurePublicSrc,
  loadCanonicalParts,
  loadFigureRegistry
} from '../web-production/public-surface-data.js';

const container = document.querySelector('[data-figure-detail]');
const id = new URLSearchParams(window.location.search).get('id');
let figure;
let englishCaptions = {};
let partsRegistry = null;

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function render() {
  if (!figure || !figureHasCanonicalBookOwnership(figure, partsRegistry)) {
    container.innerHTML = `<p>${escapeHtml(t('knowledge.figures.notFound'))}</p>`;
    return;
  }
  const locale = getLocale();
  const title = figure.title?.[locale] || figure.title?.en || figure.figure_number;
  const caption = locale === 'en' ? englishCaptions[figure.figure_id] || figure.purpose : figure.purpose;
  const src = figurePublicSrc(figure);
  document.title = `${title} — PHI OS`;
  container.innerHTML = `
    ${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" width="720" height="1023">` : ''}
    <article>
      <p class="knowledge-eyebrow">Figure ${escapeHtml(figure.figure_number)} · Part ${escapeHtml(figure.part)}</p>
      <h1>${escapeHtml(title)}</h1>
      <h2>${escapeHtml(t('knowledge.figures.caption'))}</h2>
      <p>${escapeHtml(caption)}</p>
      <p><strong>${escapeHtml(t('knowledge.figures.related'))}:</strong> ${escapeHtml(figure.chapter)}</p>
      <p><a class="knowledge-action" href="/books/reality-formation">${escapeHtml(t('knowledge.common.bookOne'))}</a></p>
    </article>`;
}

Promise.all([
  loadFigureRegistry(),
  loadCanonicalParts(),
  fetch('/content/knowledge/figure-captions-en.json').then(response => response.json())
]).then(([registry, parts, translation]) => {
  figure = registry.figures.find(item => item.figure_id === id);
  partsRegistry = parts;
  englishCaptions = translation.captions;
  render();
});
onLocaleChange(render);
