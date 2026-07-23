export const PURCHASE_STATES = Object.freeze([
  'not_purchased',
  'payment_pending',
  'purchased',
  'refunded',
  'revoked'
]);

export const ACCESS_GRANTING_STATES = Object.freeze(['purchased']);

export function normalizePurchaseState(value) {
  return PURCHASE_STATES.includes(value)
    ? value
    : 'not_purchased';
}

export function canAccessBook(state) {
  return ACCESS_GRANTING_STATES.includes(normalizePurchaseState(state));
}

export const BOOK_ONE_ACCESS_CONTRACT = Object.freeze({
  contractVersion: '1.0.0',
  productId: 'phios-book-one',
  currency: 'MYR',
  amountMinor: 8900,
  authoritativeSource: 'server_purchase_record',
  browserStorageCanGrantAccess: false,
  progressStorageCanGrantAccess: false,
  permittedStateTransitions: Object.freeze({
    not_purchased: Object.freeze(['payment_pending']),
    payment_pending: Object.freeze(['purchased', 'not_purchased']),
    purchased: Object.freeze(['refunded', 'revoked']),
    refunded: Object.freeze([]),
    revoked: Object.freeze([])
  })
});
