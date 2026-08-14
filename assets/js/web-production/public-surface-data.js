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

export const PUBLICATION_CONTEXT_RUNTIME_POLICY = Object.freeze({
  nodeCodePrefixUsedForBookInference: false,
  publicationOwnershipAuthoritative: true
});

const FIVE_VOLUME_PUBLICATION_CONTEXT_REGISTRY =
  '/content/web-production/registries/wpr-five-volume-publication-context-registry-v1.json';

export async function loadFiveVolumePublicationContextRegistry() {
  const registry = await fetchJson(FIVE_VOLUME_PUBLICATION_CONTEXT_REGISTRY);
  if (
    registry?.architecture !== 'five-volume-15-part' ||
    registry?.identityPolicy?.nodeBPrefixBookInferenceAllowed !== false ||
    !Array.isArray(registry.partOwnership) ||
    registry.partOwnership.length !== 15 ||
    !Array.isArray(registry.nodeOverrides)
  ) {
    throw new Error('WPR_PUBLICATION_CONTEXT_REGISTRY_INVALID');
  }
  return registry;
}

function publicationContextForPartCode(
  partCode,
  booksRegistry,
  partsRegistry,
  publicationContextRegistry
) {
  if (!/^P(?:[1-9]|1[0-5])$/.test(String(partCode || ''))) return null;

  const ownership = publicationContextRegistry?.partOwnership?.find(
    record => record.partCode === partCode
  );
  if (!ownership) return null;

  const part = partsRegistry?.parts?.find(
    record => Number(record.number) === Number(ownership.partNumber)
  );
  const book = booksRegistry?.books?.find(
    record => record.bookCode === ownership.publicationBookCode
  );

  if (
    !part ||
    !book ||
    part.book !== book.book_id ||
    Number(book.volume) !== Number(ownership.publicationVolume)
  ) {
    return null;
  }

  return Object.freeze({
    partCode: ownership.partCode,
    partNumber: Number(ownership.partNumber),
    partTitle: part.title,
    publicationBookCode: ownership.publicationBookCode,
    publicationBookId: ownership.publicationBookId,
    publicationVolume: Number(ownership.publicationVolume),
    bookTitle: ownership.bookTitle || book.title,
    bookRoute: ownership.bookRoute || bookRoute(book.book_id)
  });
}

export function resolvePublicationContextForNode(
  node,
  booksRegistry,
  partsRegistry,
  publicationContextRegistry
) {
  if (!node || !publicationContextRegistry) return null;

  const override = publicationContextRegistry.nodeOverrides?.find(
    record => record.nodeCode === node.nodeCode
  );
  const partCode = override?.publicationPartCode ||
    node.publicationPartCode ||
    node.partCode ||
    '';

  return publicationContextForPartCode(
    partCode,
    booksRegistry,
    partsRegistry,
    publicationContextRegistry
  );
}

export function resolveFigurePublicationContext(
  figure,
  booksRegistry,
  partsRegistry,
  publicationContextRegistry
) {
  if (!figure || !publicationContextRegistry) return null;

  const partNumber = Number(figure.part);
  if (partNumber === 0) {
    const book = booksRegistry?.books?.find(record => record.bookCode === 'BOOK-1');
    if (!book) return null;
    return Object.freeze({
      partCode: 'P0',
      partNumber: 0,
      partTitle: { 'zh-Hans': '核心语言', en: 'Core Language' },
      publicationBookCode: 'BOOK-1',
      publicationBookId: 'book-1',
      publicationVolume: 1,
      bookTitle: book.title,
      bookRoute: bookRoute('book-1')
    });
  }

  return publicationContextForPartCode(
    `P${partNumber}`,
    booksRegistry,
    partsRegistry,
    publicationContextRegistry
  );
}

export function readingPathVolumeTransition(
  fromPartCode,
  toPartCode,
  booksRegistry,
  partsRegistry,
  publicationContextRegistry
) {
  const from = publicationContextForPartCode(
    fromPartCode,
    booksRegistry,
    partsRegistry,
    publicationContextRegistry
  );
  const to = publicationContextForPartCode(
    toPartCode,
    booksRegistry,
    partsRegistry,
    publicationContextRegistry
  );
  if (!from || !to) return null;

  return Object.freeze({
    fromPart: from.partCode,
    toPart: to.partCode,
    fromVolume: from.publicationVolume,
    toVolume: to.publicationVolume,
    label: `Volume ${toRoman(from.publicationVolume)} → Volume ${toRoman(to.publicationVolume)}`
  });
}

function toRoman(value) {
  return ['I', 'II', 'III', 'IV', 'V'][Number(value) - 1] || String(value || '');
}
