import {
  getLocale,
  onLocaleChange
} from '../i18n.js';
import { BOOK_ONE_PART_COPY } from '../knowledge/catalog.js';

const partsContainer = document.querySelector('[data-book-parts]');
const figuresContainer = document.querySelector('[data-book-selected-figures]');

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

function figureImage(number) {
  return `/assets/images/figures/book-1/web/${number}.webp`;
}

function render() {
  if (!manifest || !figures) return;
  const locale = getLocale();

  partsContainer.innerHTML = manifest.parts.map(part => {
    const copy = BOOK_ONE_PART_COPY[part.number];
    return `
      <article class="knowledge-part">
        <span class="knowledge-part__number">${String(part.number).padStart(2, '0')}</span>
        <div>
          <h3>${escapeHtml(part.title[locale] || part.title.en)}</h3>
          <p>${escapeHtml(copy.question[locale] || copy.question.en)}</p>
        </div>
        <p>${escapeHtml(copy.summary[locale] || copy.summary.en)}</p>
      </article>
    `;
  }).join('');

  const selected = ['figure-0a', 'figure-1a', 'figure-3a', 'figure-4d', 'figure-5e']
    .map(id => figures.find(figure => figure.figure_id === id))
    .filter(Boolean);

  figuresContainer.innerHTML = selected.map(figure => `
    <article class="figure-card">
      <img src="${figureImage(figure.figure_number)}" alt="${escapeHtml(figure.title[locale] || figure.title.en)}" width="720" height="1023" loading="lazy">
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
