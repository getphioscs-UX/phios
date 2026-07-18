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

onLocaleChange(() => {
  updateFilterStatus();
});
