import {
  getLocale,
  onLocaleChange,
  t
} from '../i18n.js';

const search = document.querySelector('#glossary-search');
const status = document.querySelector('#glossary-status');
const grid = document.querySelector('[data-glossary-grid]');
const results = document.querySelector('[data-glossary-results]');
const empty = document.querySelector('[data-glossary-empty]');

let concepts = [];
let englishDefinitions = {};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function statusLabel(value) {
  return t(value === 'stable'
    ? 'knowledge.glossary.stable'
    : 'knowledge.glossary.provisional');
}

function render() {
  const locale = getLocale();
  const query = String(search?.value || '').trim().toLocaleLowerCase(locale);
  const state = status?.value || 'all';
  const visible = concepts.filter(concept => {
    const definition = locale === 'en'
      ? englishDefinitions[concept.id] || concept.definition
      : concept.definition;
    const haystack = `${concept.en} ${concept['zh-Hans']} ${definition} ${concept.part}`.toLocaleLowerCase(locale);
    return (
      (state === 'all' || concept.status === state) &&
      (!query || haystack.includes(query))
    );
  });

  grid.innerHTML = visible.map(concept => {
    const name = concept[locale] || concept.en;
    const definition = locale === 'en'
      ? englishDefinitions[concept.id] || concept.definition
      : concept.definition;
    return `
      <article class="glossary-card" id="term-${escapeHtml(concept.id)}">
        <div class="knowledge-card__meta">
          <span class="knowledge-status knowledge-status--${escapeHtml(concept.status)}">${escapeHtml(statusLabel(concept.status))}</span>
          <span class="knowledge-chip">${escapeHtml(t('knowledge.glossary.part', { part: concept.part }))}</span>
        </div>
        <h2>${escapeHtml(name)}</h2>
        <p class="glossary-card__definition">${escapeHtml(definition)}</p>
        <div class="glossary-card__meta">
          <a href="/book-one#book-parts">${escapeHtml(t('knowledge.glossary.relatedBook'))}</a>
          <a href="/explore#layer-${escapeHtml(concept.part)}">${escapeHtml(t('knowledge.glossary.relatedAtlas'))}</a>
        </div>
      </article>
    `;
  }).join('');

  results.textContent = t('knowledge.glossary.result', { count: visible.length });
  empty.hidden = visible.length !== 0;
}

Promise.all([
  fetch('/content/registry/concepts.json').then(response => response.json()),
  fetch('/content/knowledge/glossary-en.json').then(response => response.json())
]).then(([registry, translation]) => {
  concepts = registry.concepts.filter(concept => ['stable', 'provisional'].includes(concept.status));
  englishDefinitions = translation.definitions;
  render();
});

[search, status].forEach(control => {
  control?.addEventListener('input', render);
  control?.addEventListener('change', render);
});

onLocaleChange(render);
