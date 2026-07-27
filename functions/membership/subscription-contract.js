export const SUBSCRIPTION_VERSION = 'm4c-w4.v1';
export const BILLING_INTERVALS = Object.freeze(['monthly', 'annual']);
export const SUBSCRIPTION_ACTIONS = Object.freeze([
  'upgrade', 'downgrade', 'cancel'
]);
export const SUBSCRIPTION_STATUSES = Object.freeze([
  'inactive', 'active', 'grace_period', 'failed_payment', 'cancelled'
]);

export function createSubscriptionPreview({
  membership_tier = 'explorer',
  billing_interval = 'monthly'
} = {}) {
  if (!BILLING_INTERVALS.includes(billing_interval)) {
    throw new TypeError('Unsupported billing interval.');
  }
  return Object.freeze({
    contract_version: SUBSCRIPTION_VERSION,
    membership_tier,
    billing_interval,
    status: 'inactive',
    checkout_enabled: false,
    payment_provider_connected: false,
    payment_credentials_collected: false
  });
}

export function proposeSubscriptionChange(subscription, action, targetTier = null) {
  if (!SUBSCRIPTION_ACTIONS.includes(action)) {
    throw new TypeError('Unsupported subscription action.');
  }
  return Object.freeze({
    previous: Object.freeze({ ...subscription }),
    action,
    target_tier: targetTier,
    status: 'pending_confirmation',
    applied: false,
    requires_server_validation: true
  });
}
