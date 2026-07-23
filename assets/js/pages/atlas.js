import {
  initializeI18n,
  onLocaleChange,
  t
} from '../i18n.js';

initializeI18n();

const header = document.querySelector('.atlas-header');
const filters = Array.from(
  document.querySelectorAll('[data-book-filter]')
);
const nodes = Array.from(
  document.querySelectorAll('.atlas-node[data-book]')
);
const filterStatus = document.querySelector('#atlas-filter-status span');

let activeFilter = 'all';

const filterStatusKeys = Object.freeze({
  all: 'atlas.layers.showingAll',
  1: 'atlas.layers.showingBookOne',
  2: 'atlas.layers.showingBookTwo',
  3: 'atlas.layers.showingBookThree'
});

function normalizeFilter(value) {
  const cleanValue = String(value || '').trim();

  return ['1', '2', '3'].includes(cleanValue)
    ? cleanValue
    : 'all';
}

function updateFilterStatus() {
  if (!filterStatus) {
    return;
  }

  filterStatus.textContent = t(
    filterStatusKeys[activeFilter] || filterStatusKeys.all
  );
}

function updateFilterQuery(filter) {
  if (typeof window === 'undefined' || !window.history?.replaceState) {
    return;
  }

  const url = new URL(window.location.href);

  if (filter === 'all') {
    url.searchParams.delete('book');
  } else {
    url.searchParams.set('book', filter);
  }

  window.history.replaceState({}, '', url);
}

function applyFilter(value, { updateQuery = true } = {}) {
  activeFilter = normalizeFilter(value);

  filters.forEach(button => {
    const isActive = button.dataset.bookFilter === activeFilter;

    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  nodes.forEach(node => {
    const isVisible =
      activeFilter === 'all' ||
      node.dataset.book === activeFilter;

    node.hidden = !isVisible;

    if (!isVisible) {
      node.open = false;
    }
  });

  updateFilterStatus();

  if (updateQuery) {
    updateFilterQuery(activeFilter);
  }
}

filters.forEach(button => {
  button.addEventListener('click', () => {
    applyFilter(button.dataset.bookFilter);
  });
});

function openHashLayer() {
  const hash = window.location.hash;

  if (!hash.startsWith('#layer-')) {
    return;
  }

  const target = document.querySelector(hash);

  if (!(target instanceof HTMLDetailsElement)) {
    return;
  }

  if (target.hidden) {
    applyFilter(target.dataset.book || 'all');
  }

  target.open = true;
}

function updateHeaderState() {
  header?.classList.toggle(
    'is-scrolled',
    window.scrollY > 24
  );
}

const requestedBook = new URLSearchParams(
  window.location.search
).get('book');

applyFilter(requestedBook, { updateQuery: false });
openHashLayer();
updateHeaderState();

window.addEventListener('hashchange', openHashLayer);
window.addEventListener('scroll', updateHeaderState, { passive: true });

renderAtlasFigures();

const atlasFigureConfig = Object.freeze({
  1: [
    ['1A', '/assets/images/figures/book-1/web/1A.webp', 'figure1a'],
    ['1B', '/assets/images/figures/book-1/web/1B.webp', 'figure1b']
  ],
  2: [
    ['2A', '/assets/images/figures/book-1/web/2A.webp', 'figure2a']
  ],
  3: [
    ['3A', '/assets/images/figures/book-1/web/3A.webp', 'figure3a'],
    ['3B', '/assets/images/figures/book-1/web/3B.webp', 'figure3b'],
    ['3C', '/assets/images/figures/book-1/web/3C.webp', 'figure3c']
  ],
  4: [
    ['4A', '/assets/images/figures/book-1/web/4A.webp', 'figure4a'],
    ['4B', '/assets/images/figures/book-1/web/4B.webp', 'figure4b'],
    ['4C', '/assets/images/figures/book-1/web/4C.webp', 'figure4c'],
    ['4D', '/assets/images/figures/book-1/web/4D.webp', 'figure4d']
  ],
  5: [
    ['5A', '/assets/images/figures/book-1/web/5A.webp', 'figure5a'],
    ['5B', '/assets/images/figures/book-1/web/5B.webp', 'figure5b'],
    ['5C', '/assets/images/figures/book-1/web/5C.webp', 'figure5c'],
    ['5D', '/assets/images/figures/book-1/web/5D.webp', 'figure5d'],
    ['5E', '/assets/images/figures/book-1/web/5E.webp', 'figure5e']
  ]
});

const atlasFigureThemes = Object.freeze([
  'atlas-figure-bridge--gold',
  'atlas-figure-bridge--violet',
  'atlas-figure-bridge--cyan'
]);

function renderAtlasFigures() {
  document.querySelectorAll('[data-atlas-figures]').forEach(container => {
    const part = Number(container.dataset.atlasFigures);
    const figures = atlasFigureConfig[part] || [];

    container.replaceChildren(...figures.map(([number, image, key], index) => {
      const article = document.createElement('article');
      article.className = `atlas-figure-bridge ${atlasFigureThemes[index % atlasFigureThemes.length]}`;

      const copy = document.createElement('div');
      copy.className = 'atlas-figure-copy';

      const label = document.createElement('p');
      label.className = 'atlas-figure-label';
      label.textContent = `Figure ${number}`;

      const title = document.createElement('h4');
      title.textContent = t(`atlas.parts.part${part}.${key}Title`);

      const description = document.createElement('p');
      description.textContent = t(`atlas.parts.part${part}.${key}Description`);

      copy.append(label, title, description);

      const figure = document.createElement('figure');
      figure.className = 'atlas-figure-preview';

      const link = document.createElement('a');
      link.href = image;
      link.target = '_blank';
      link.rel = 'noopener';

      const img = document.createElement('img');
      img.src = image;
      img.loading = 'lazy';
      img.alt = `${t(`atlas.parts.part${part}.${key}Title`)} — Figure ${number}`;

      const caption = document.createElement('figcaption');
      caption.textContent = t('atlas.parts.openCompleteFigure');

      link.append(img);
      figure.append(link, caption);
      article.append(copy, figure);
      return article;
    }));
  });
}


onLocaleChange(() => {
  updateFilterStatus();
  renderAtlasFigures();
});
