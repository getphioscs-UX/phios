import {
  getLocale,
  onLocaleChange,
  t
} from '../i18n.js';

const container = document.querySelector('[data-figure-detail]');
const id = new URLSearchParams(window.location.search).get('id');
let figure;
let englishCaptions = {};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function render() {
  if (!figure) {
    container.innerHTML = `<p>${escapeHtml(t('knowledge.figures.notFound'))}</p>`;
    return;
  }

  const locale = getLocale();
  const title = figure.title[locale] || figure.title.en;
  const caption = locale === 'en'
    ? englishCaptions[figure.figure_id] || figure.purpose
    : figure.purpose;
  document.title = `${title} — PHI OS`;
  container.innerHTML = `
    <img src="/assets/images/figures/book-1/web/${escapeHtml(figure.figure_number)}.webp" alt="${escapeHtml(title)}" width="720" height="1023">
    <article>
      <p class="knowledge-eyebrow">Figure ${escapeHtml(figure.figure_number)} · Part ${escapeHtml(figure.part)}</p>
      <h1>${escapeHtml(title)}</h1>
      <h2>${escapeHtml(t('knowledge.figures.caption'))}</h2>
      <p>${escapeHtml(caption)}</p>
      <p><strong>${escapeHtml(t('knowledge.figures.related'))}:</strong> ${escapeHtml(figure.chapter)}</p>
      <p><a class="knowledge-action" href="/book-one#book-parts">${escapeHtml(t('knowledge.common.bookOne'))}</a></p>
    </article>
  `;
}

Promise.all([
  fetch('/content/registry/figures.json').then(response => response.json()),
  fetch('/content/knowledge/figure-captions-en.json').then(response => response.json())
]).then(([registry, translation]) => {
    figure = registry.figures.find(item => item.figure_id === id);
    englishCaptions = translation.captions;
    render();
  });

onLocaleChange(render);
