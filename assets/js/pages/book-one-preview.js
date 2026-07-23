import {
  getLocale,
  onLocaleChange
} from '../i18n.js';
import { initializePreviewProgress } from '../knowledge/reading-progress.js';

const grammarContainer = document.querySelector('[data-reality-grammar]');
const figuresContainer = document.querySelector('[data-preview-figures]');
let manifest;
let figures;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function render() {
  if (!manifest || !figures) return;
  const locale = getLocale();

  grammarContainer.innerHTML = manifest.grammar.stages.map(stage => `
    <span class="knowledge-chip">${escapeHtml(stage.code)} · ${escapeHtml(stage[locale] || stage.en)}</span>
  `).join('');

  const selectedIds = ['figure-0a', 'figure-1a', 'figure-2a', 'figure-3a', 'figure-4d'];
  figuresContainer.innerHTML = selectedIds
    .map(id => figures.find(figure => figure.figure_id === id))
    .filter(Boolean)
    .map(figure => `
      <article class="figure-card">
        <img src="/assets/images/figures/book-1/web/${escapeHtml(figure.figure_number)}.webp" alt="${escapeHtml(figure.title[locale] || figure.title.en)}" width="720" height="1023" loading="lazy">
        <div class="figure-card__body">
          <span class="knowledge-chip">Figure ${escapeHtml(figure.figure_number)}</span>
          <h3>${escapeHtml(figure.title[locale] || figure.title.en)}</h3>
          <a href="/figure?id=${encodeURIComponent(figure.figure_id)}">${escapeHtml(figure.title[locale] || figure.title.en)}</a>
        </div>
      </article>
    `).join('');
}

Promise.all([
  fetch('/content/registry/book-1-manifest.json').then(response => response.json()),
  fetch('/content/registry/figures.json').then(response => response.json())
]).then(([bookManifest, figureRegistry]) => {
  manifest = bookManifest;
  figures = figureRegistry.figures;
  render();
});

onLocaleChange(render);
initializePreviewProgress();
