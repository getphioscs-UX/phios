import { resolvePublicAssetForWeb } from '../runtime/web-production/asset-resolver.js';

const JSON_HEADERS = Object.freeze({ Accept: 'application/json' });

export const BOOK_ROUTE_BY_ID = Object.freeze({
  'book-1': '/books/reality-formation/',
  'book-2': '/books/reality-runtime/',
  'book-3': '/books/reality-continuity/',
  'book-4': '/books/reality-civilization/',
  'book-5': '/books/reality-navigation/'
});

export const BOOK_COMPATIBILITY_ROUTES = Object.freeze({
  '/books/reality-maintenance/': Object.freeze({
    target: '/books/reality-continuity/',
    redirectStatus: 308,
    canonicalAuthority: false
  })
});

export const BOOK_ASSET_CODE_BY_ID = Object.freeze({
  'book-1': 'BOOK-1-HARDCOVER',
  'book-2': 'BOOK-2-HARDCOVER',
  'book-3': 'BOOK-3-HARDCOVER',
  'book-4': 'BOOK-4-HARDCOVER',
  'book-5': 'BOOK-5-HARDCOVER'
});

async function fetchJson(path) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: JSON_HEADERS
  });
  if (!response.ok) throw new Error(`WPR_PUBLIC_SOURCE_UNAVAILABLE:${path}`);
  return response.json();
}

export async function loadCanonicalBooks() {
  const registry = await fetchJson('/content/registry/books.json');
  if (!Array.isArray(registry.books) || registry.books.length !== 5 || registry.architecture !== 'five-volume-15-part') {
    throw new Error('WPR_BOOK_REGISTRY_INVALID');
  }
  return registry;
}

export async function loadCanonicalParts() {
  const registry = await fetchJson('/content/registry/parts.json');
  if (!Array.isArray(registry.parts) || registry.parts.length !== 15 || registry.architecture !== 'five-volume-15-part') {
    throw new Error('WPR_PART_REGISTRY_INVALID');
  }
  return registry;
}

export async function loadFigureRegistry() {
  const registry = await fetchJson('/content/registry/figures.json');
  if (!Array.isArray(registry.figures)) throw new Error('WPR_FIGURE_REGISTRY_INVALID');
  return registry;
}

export function bookRoute(bookId) {
  return BOOK_ROUTE_BY_ID[bookId] || '/books/';
}

export function bookStatusKind(book) {
  switch (book?.status) {
    case 'publication-preparation': return 'available';
    case 'in-development': return 'development';
    case 'architecture-defined': return 'architecture';
    default: return 'architecture';
  }
}

export function canonicalPartsForBook(book, partsRegistry) {
  const owned = new Set(book?.parts || []);
  return (partsRegistry?.parts || [])
    .filter(part => owned.has(part.number) && part.book === book.book_id)
    .sort((a, b) => a.number - b.number);
}

export function figureHasCanonicalBookOwnership(figure, partsRegistry) {
  if (!figure || !partsRegistry) return false;
  if (Number(figure.part) === 0) return figure.book === 1;
  const canonicalPart = partsRegistry.parts.find(part => part.number === Number(figure.part));
  const expectedBook = canonicalPart?.book;
  return expectedBook === `book-${Number(figure.book)}`;
}

export function alignedFiguresForBook(book, figuresRegistry, partsRegistry) {
  const volume = Number(book?.volume);
  return (figuresRegistry?.figures || []).filter(figure => (
    Number(figure.book) === volume &&
    figureHasCanonicalBookOwnership(figure, partsRegistry)
  ));
}

export function figurePublicSrc(figure) {
  const raw = String(figure?.web_file || '').trim();
  if (!raw || raw.includes('..') || /^https?:\/\//i.test(raw)) return null;
  return `/${raw.replace(/^\/+/, '')}`;
}

export async function resolveBookCover(bookId, options = {}) {
  const assetCode = BOOK_ASSET_CODE_BY_ID[bookId];
  if (!assetCode) return null;
  try {
    const resolved = await resolvePublicAssetForWeb(assetCode, {
      surface: options.surface || 'BOOK',
      locale: options.locale || null,
      variant: options.variant || 'ORIGINAL'
    });
    return resolved.renderable ? resolved : null;
  } catch {
    return null;
  }
}
