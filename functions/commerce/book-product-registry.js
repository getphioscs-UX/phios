import {
  DEFAULT_PRODUCT_DEFINITIONS
} from '../pws/registry/product-offer-registry.js';

export const BOOK_PRODUCT_REGISTRY_VERSION = 'phi-os.book-products.v1';

const CANONICAL_BOOK_ONE = DEFAULT_PRODUCT_DEFINITIONS.find(
  product => product.product_code === 'phios-book-one-zh-pdf'
);

if (!CANONICAL_BOOK_ONE) {
  throw new Error('Canonical Book I Product is not registered.');
}

export const BOOK_ONE_PRODUCT = Object.freeze({
  productId: CANONICAL_BOOK_ONE.product_code,
  legacyProductId: CANONICAL_BOOK_ONE.legacy_product_ids[0],
  productVersion: '1.0.0',
  title: '《世界如何形成》第一册',
  subtitle: '现实形成与体验',
  language: 'zh-Hans',
  format: 'watermarked-pdf',
  pageCount: 462,
  currency: CANONICAL_BOOK_ONE.offer.currency,
  amountMinor: CANONICAL_BOOK_ONE.offer.amount_minor,
  displayPrice: `RM${CANONICAL_BOOK_ONE.offer.amount_minor / 100}`,
  license: 'single-purchaser-personal-use',
  sourceObjectKey: 'private/books/book-one/zh-Hans/book-one-v1.pdf',
  paymentMethods: Object.freeze(['card', 'fpx']),
  downloadTokenLifetimeSeconds: 900,
  downloadTokenMaxUses: 2,
  emailTokenLifetimeSeconds: 259200,
  emailTokenMaxUses: 3,
  active: true
});

export const BOOK_PRODUCTS = Object.freeze([BOOK_ONE_PRODUCT]);

export function getBookProduct(productId) {
  return BOOK_PRODUCTS.find(product =>
    product.productId === productId ||
    product.legacyProductId === productId
  ) || null;
}

export function publicProduct(product = BOOK_ONE_PRODUCT) {
  return Object.freeze({
    registryVersion: BOOK_PRODUCT_REGISTRY_VERSION,
    productId: product.productId,
    productVersion: product.productVersion,
    title: product.title,
    subtitle: product.subtitle,
    language: product.language,
    format: product.format,
    pageCount: product.pageCount,
    currency: product.currency,
    amountMinor: product.amountMinor,
    displayPrice: product.displayPrice,
    license: product.license,
    paymentMethods: product.paymentMethods,
    clientMaySetPrice: false,
    requiresVerifiedPurchase: true,
    requiresPurchaserWatermark: true
  });
}
