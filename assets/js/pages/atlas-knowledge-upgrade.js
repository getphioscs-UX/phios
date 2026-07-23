import {
  getLocale,
  onLocaleChange,
  t
} from '../i18n.js';
import { BOOK_ONE_PART_COPY } from '../knowledge/catalog.js';

let manifest;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function ensureSection() {
  let section = document.querySelector('#m3b-atlas-guide');
  if (section) return section;

  section = document.createElement('section');
  section.id = 'm3b-atlas-guide';
  section.className = 'knowledge-section knowledge-section--paper';
  section.innerHTML = '<div class="knowledge-shell" data-atlas-knowledge-guide></div>';

  const returnSection = document.querySelector('.atlas-return');
  returnSection?.before(section);

  if (!document.querySelector('link[href="/assets/css/knowledge-release.css"]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/assets/css/knowledge-release.css';
    document.head.append(stylesheet);
  }

  return section;
}

function render() {
  if (!manifest) return;
  const locale = getLocale();
  const container = ensureSection().querySelector('[data-atlas-knowledge-guide]');

  container.innerHTML = `
    <div class="knowledge-section__heading">
      <div>
        <p class="knowledge-eyebrow">${escapeHtml(t('knowledge.common.free'))}</p>
        <h2>${escapeHtml(t('knowledge.atlasUpgrade.heading'))}</h2>
      </div>
      <p class="knowledge-section__copy">${escapeHtml(t('knowledge.atlasUpgrade.lead'))}</p>
    </div>
    <div class="knowledge-list">
      ${manifest.parts.map(part => {
        const copy = BOOK_ONE_PART_COPY[part.number];
        return `
          <article class="knowledge-part">
            <span class="knowledge-part__number">${String(part.number).padStart(2, '0')}</span>
            <div>
              <h3>${escapeHtml(copy.question[locale] || copy.question.en)}</h3>
              <p>${escapeHtml(copy.summary[locale] || copy.summary.en)}</p>
            </div>
            <div>
              <p>${escapeHtml(part.title[locale] || part.title.en)}</p>
              <p><a href="/figures?part=${encodeURIComponent(part.number)}">${escapeHtml(t('knowledge.atlasUpgrade.figures'))}</a></p>
            </div>
          </article>
        `;
      }).join('')}
    </div>
    <div class="knowledge-grid knowledge-grid--two">
      <article class="knowledge-card">
        <span class="knowledge-status knowledge-status--available">${escapeHtml(t('knowledge.atlasUpgrade.freeLabel'))}</span>
        <p>${escapeHtml(t('knowledge.atlasUpgrade.lead'))}</p>
      </article>
      <article class="knowledge-card">
        <span class="knowledge-status knowledge-status--preview">${escapeHtml(t('knowledge.atlasUpgrade.paidLabel'))}</span>
        <p><a href="/book-one">${escapeHtml(t('knowledge.atlasUpgrade.continue'))}</a></p>
      </article>
    </div>
  `;
}

fetch('/content/registry/book-1-manifest.json')
  .then(response => response.json())
  .then(bookManifest => {
    manifest = bookManifest;
    render();
  });

onLocaleChange(render);
