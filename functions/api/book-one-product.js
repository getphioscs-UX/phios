import {
  publicProduct
} from '../commerce/book-product-registry.js';
import {
  commerceReadiness
} from '../commerce/commerce-readiness.js';
import {
  json,
  methodNotAllowed
} from '../commerce/commerce-http.js';

export async function onRequestGet({ env = {} }) {
  const readiness = await commerceReadiness(env);
  return json({
    success: true,
    product: publicProduct(),
    checkoutReady: false,
    purchaseUrl:'/account#commerce',
    languageVersions:['COM-BOOK-01-ZH','COM-BOOK-01-EN'],
    deliveryReady: (
      readiness.privateBookBucketBound &&
      readiness.sourceBookPresent &&
      readiness.watermarkServiceConfigured &&
      readiness.receiptSenderConfigured
    )
  });
}

export async function onRequest(context) {
  return context.request.method === 'GET'
    ? onRequestGet(context)
    : methodNotAllowed(['GET']);
}
