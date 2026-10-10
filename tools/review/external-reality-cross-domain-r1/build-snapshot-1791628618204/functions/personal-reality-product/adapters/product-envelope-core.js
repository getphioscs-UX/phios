// PPR-R3 adapter compatibility boundary.
//
// Method adapters and method-owned projections historically resolve
// ./product-envelope-core.js from this directory. The canonical shared
// envelope authority lives one level up. Keep this file implementation-free
// so adapters share one authority while Cloudflare/Node resolution remains
// stable across the PPR-R3 successor.
export * from '../product-envelope-core.js';
