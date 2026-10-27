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

// Additional private source keys are deployment configuration, never browser input.
// No Book V–VII preview or unverified R2 path is invented here.
export function resolveCommerceBookSourceKey(env,productId){
  if(bookLanguageIdentity(productId))return resolveBookPdfSource(env,productId).objectKey;
  if(productId==='COM-BOOK-01') return resolveBookOneSourceKey(env);
  let mappings={};try{mappings=JSON.parse(env.COMMERCE_BOOK_SOURCE_KEYS_JSON||'{}');}catch{}
  const key=String(mappings[productId]||'');
  if(!/^(?:COM-BOOK-0[2-7]|COM-BOOK-CONFIGURATION)$/.test(productId)||!key||key.includes('..')||key.startsWith('/')||/^https?:/.test(key)) throw Object.assign(new Error('Private book source mapping is not configured.'),{status:503,code:'commerce_book_source_unconfigured'});
  return key;
}

export function bookLanguageIdentity(productId){
 const m=/^COM-BOOK-(0?[1-7])-(ZH|EN)$/.exec(String(productId||''));
 return m?{productId,bookCode:'BOOK-'+Number(m[1]),volume:Number(m[1]),language:m[2]==='EN'?'en':'zh-Hans'}:null;
}
export function resolveBookPdfSource(env,productId){
 const identity=bookLanguageIdentity(productId);if(!identity)throw Object.assign(Error('Choose one book language.'),{status:422,code:'book_language_required'});
 let rows;try{rows=JSON.parse(env.COMMERCE_BOOK_SOURCE_VERSIONS_JSON||'{}');}catch{}
 const row=rows?.[productId];
 if(!row||!['BOOKS','MANUSCRIPTS'].includes(row.binding)||(identity.language==='en'&&row.binding!=='MANUSCRIPTS')||typeof row.objectKey!=='string'||!row.objectKey||row.objectKey.includes('..')||row.objectKey.startsWith('/')||row.objectKey.includes(':')||!Number.isSafeInteger(row.pageCount)||row.pageCount<1||!Number.isSafeInteger(row.byteSize)||row.byteSize<100||!/^[a-f0-9]{64}$/.test(row.sourceSha256||''))throw Object.assign(Error('Verified private PDF source is not configured.'),{status:503,code:'book_pdf_source_unconfigured'});
 return {...identity,binding:row.binding,objectKey:row.objectKey,pageCount:row.pageCount,byteSize:row.byteSize,sourceSha256:row.sourceSha256};
}
export async function requireBookPdfReadiness(env,productId){
 const source=resolveBookPdfSource(env,productId),head=await env[source.binding]?.head?.(source.objectKey);
 if(env.PHIOS_BOOK_PDF_CHECKOUT_ENABLED!=='true'||!head||Number(head.size)!==source.byteSize||head.customMetadata?.sourceSha256!==source.sourceSha256||!env.BOOKS?.get||!env.BOOKS?.head||String(env.BOOK_ACCESS_TOKEN_SECRET||'').length<32||!env.BOOK_WATERMARK_SERVICE_URL||!env.BOOK_WATERMARK_SERVICE_TOKEN)throw Object.assign(Error('Private PDF delivery is not ready.'),{status:503,code:'book_pdf_delivery_not_ready'});
 return source;
}
export function orderBookPdfSource(order){
 const identity=bookLanguageIdentity(order?.product_id);if(!identity)return null;
 let source;try{source=JSON.parse(order.context_json||'{}').bookPdf;}catch{}
 if(!source||source.productId!==identity.productId||source.bookCode!==identity.bookCode||source.language!==identity.language)throw Object.assign(Error('Purchased book/language does not match delivery.'),{status:422,code:'book_pdf_order_mismatch'});
 return source;
}

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

// Shared source authority for readiness, catalog persistence and watermark jobs.
export function resolveBookOneSourceKey(env = {}) {
  return String(env.BOOK_ONE_SOURCE_KEY || "").trim() || BOOK_ONE_PRODUCT.sourceObjectKey;
}
