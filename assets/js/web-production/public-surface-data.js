import { resolvePublicAssetForWeb } from '../runtime/web-production/asset-resolver.js';

const JSON_HEADERS = Object.freeze({ Accept: 'application/json' });
const FIVE_VOLUME_CONTEXT_PATH = '/content/web-production/registries/wpr-five-volume-publication-context-registry-v1.json';

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
  if (registry.books.some((book, index) => Number(book.volume) !== index + 1)) {
    throw new Error('WPR_BOOK_VOLUME_ORDER_INVALID');
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

export async function loadFiveVolumePublicationContextRegistry() {
  const registry = await fetchJson(FIVE_VOLUME_CONTEXT_PATH);
  if (
    registry?.architecture !== 'five-volume-15-part' ||
    !Array.isArray(registry.partOwnership) ||
    registry.partOwnership.length !== 15 ||
    registry?.identityPolicy?.nodeBPrefixBookInferenceAllowed !== false
  ) {
    throw new Error('WPR_FIVE_VOLUME_PUBLICATION_CONTEXT_INVALID');
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

function normalizedPartCode(value) {
  const match = /^P(\d{1,2})$/.exec(String(value || '').trim().toUpperCase());
  if (!match) return null;
  const number = Number(match[1]);
  return number >= 1 && number <= 15 ? `P${number}` : null;
}

function partNumber(partCode) {
  const normalized = normalizedPartCode(partCode);
  return normalized ? Number(normalized.slice(1)) : null;
}

function explicitNodeOverride(nodeCode, contextRegistry) {
  return (contextRegistry?.nodeOverrides || []).find(record => record.nodeCode === nodeCode) || null;
}

function contextAuthorityForPart(partCode, contextRegistry) {
  return (contextRegistry?.partOwnership || []).find(record => record.partCode === partCode) || null;
}

export function resolvePublicationContextForNode(node, booksRegistry, partsRegistry, contextRegistry) {
  if (!node || !booksRegistry || !partsRegistry || !contextRegistry) return null;
  const override = explicitNodeOverride(node.nodeCode, contextRegistry);
  const resolvedPartCode = normalizedPartCode(
    override?.publicationPartCode || node.publicationPartCode || node.partCode
  );
  const number = partNumber(resolvedPartCode);
  if (!number) return null;

  const authority = contextAuthorityForPart(resolvedPartCode, contextRegistry);
  const part = (partsRegistry.parts || []).find(candidate => Number(candidate.number) === number);
  const book = authority
    ? (booksRegistry.books || []).find(candidate => candidate.book_id === authority.publicationBookId)
    : (booksRegistry.books || []).find(candidate => candidate.book_id === part?.book);
  if (!part || !book) return null;

  return Object.freeze({
    nodeCode: node.nodeCode || null,
    identityPreserved: true,
    partCode: resolvedPartCode,
    partNumber: number,
    partTitle: part.title || null,
    publicationBookCode: authority?.publicationBookCode || book.bookCode,
    publicationBookId: authority?.publicationBookId || book.book_id,
    publicationVolume: Number(authority?.publicationVolume || book.volume),
    bookTitle: authority?.bookTitle || book.title || null,
    bookRoute: `${authority?.bookRoute || bookRoute(book.book_id).replace(/\/$/, '')}/`,
    resolutionAuthority: override?.authority || 'PUBLICATION_OWNERSHIP_PLUS_CANONICAL_PART_OWNERSHIP',
    nodeCodePrefixUsedForBookInference: false
  });
}

export function resolveFigurePublicationContext(figure, booksRegistry, partsRegistry, contextRegistry) {
  if (!figure || !booksRegistry || !partsRegistry || !contextRegistry) return null;
  if (figure.canonicalNodeCode) {
    return resolvePublicationContextForNode({
      nodeCode: figure.canonicalNodeCode,
      publicationPartCode: figure.publicationPartCode || (Number(figure.part) ? `P${Number(figure.part)}` : null),
      partCode: Number(figure.part) ? `P${Number(figure.part)}` : null
    }, booksRegistry, partsRegistry, contextRegistry);
  }
  if (Number(figure.part) === 0) {
    const book = booksRegistry.books.find(candidate => candidate.book_id === 'book-1');
    return book ? Object.freeze({
      nodeCode: null,
      identityPreserved: true,
      partCode: 'P0',
      partNumber: 0,
      partTitle: partsRegistry.part_0?.title || null,
      publicationBookCode: book.bookCode,
      publicationBookId: book.book_id,
      publicationVolume: Number(book.volume),
      bookTitle: book.title || null,
      bookRoute: bookRoute(book.book_id),
      resolutionAuthority: 'LEGACY_CROSS_VOLUME_FIGURE_COMPATIBILITY',
      nodeCodePrefixUsedForBookInference: false
    }) : null;
  }
  const number = Number(figure.part);
  if (!Number.isInteger(number) || number < 1 || number > 15) return null;
  const partCode = `P${number}`;
  const authority = contextAuthorityForPart(partCode, contextRegistry);
  const part = partsRegistry.parts.find(candidate => Number(candidate.number) === number);
  const book = authority
    ? booksRegistry.books.find(candidate => candidate.book_id === authority.publicationBookId)
    : part && booksRegistry.books.find(candidate => candidate.book_id === part.book);
  return part && book ? Object.freeze({
    nodeCode: figure.canonicalNodeCode || null,
    identityPreserved: true,
    partCode,
    partNumber: number,
    partTitle: part.title || null,
    publicationBookCode: authority?.publicationBookCode || book.bookCode,
    publicationBookId: authority?.publicationBookId || book.book_id,
    publicationVolume: Number(authority?.publicationVolume || book.volume),
    bookTitle: authority?.bookTitle || book.title || null,
    bookRoute: `${authority?.bookRoute || bookRoute(book.book_id).replace(/\/$/, '')}/`,
    resolutionAuthority: 'CANONICAL_PART_OWNERSHIP_LEGACY_FIGURE_COMPATIBILITY',
    nodeCodePrefixUsedForBookInference: false
  }) : null;
}

export function readingPathVolumeTransition(fromNode, toNode, booksRegistry, partsRegistry, contextRegistry) {
  const from = resolvePublicationContextForNode(fromNode, booksRegistry, partsRegistry, contextRegistry);
  const to = resolvePublicationContextForNode(toNode, booksRegistry, partsRegistry, contextRegistry);
  if (!from || !to) return null;
  return Object.freeze({
    from,
    to,
    crossesVolumeBoundary: from.publicationVolume !== to.publicationVolume,
    label: from.publicationVolume !== to.publicationVolume
      ? `Volume ${from.publicationVolume} → Volume ${to.publicationVolume}`
      : `Volume ${from.publicationVolume}`
  });
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
