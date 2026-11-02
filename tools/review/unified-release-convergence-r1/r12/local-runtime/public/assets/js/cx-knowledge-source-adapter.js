// CX-R8 source adapter: exposes existing public Knowledge projections to the
// customer UI without moving retrieval, publication or figure ownership into CX.
export {loadPublishedArticles,articleHref} from './knowledge/published-content.js';
export {BOOK_ROUTE_BY_ID,figureHasCanonicalBookOwnership,loadCanonicalParts,loadFigureRegistry} from './web-production/public-surface-data.js';
