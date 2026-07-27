import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ACCOUNT_CAPABILITIES, createAccountPreview, createPasswordResetRequest, createPrivacySettings, requestAccountDeletion } from '../functions/account/account-contract.js';
import { MY_REALITY_SECTIONS, createMyRealityProjection } from '../functions/account/my-reality-account-projection.js';
import { MEMBERSHIP_TIERS, ENTITLEMENT_TYPES, resolveEntitlements } from '../functions/membership/membership-contract.js';
import { BILLING_INTERVALS, SUBSCRIPTION_ACTIONS, SUBSCRIPTION_STATUSES, createSubscriptionPreview, proposeSubscriptionChange } from '../functions/membership/subscription-contract.js';

const root = process.cwd();
const read = file => fs.readFile(path.join(root, file), 'utf8');
const [accountPage, realityPage, membershipPage, css, en, zh, registry, checkout] = await Promise.all([
  read('account.html'), read('account-my-reality.html'), read('membership.html'),
  read('assets/css/account-membership.css'), read('assets/js/locales/en/account.js'),
  read('assets/js/locales/zh-Hans/account.js'),
  read('content/registry/m4c-account-payment-membership.json').then(JSON.parse),
  read('checkout.html')
]);

assert.equal(registry.baseline, 'e06cbae98ec16b26773f56e9cbbacecaee10262d');
assert.equal(ACCOUNT_CAPABILITIES.length, 7);
assert.deepEqual(MY_REALITY_SECTIONS, ['current_journeys', 'past_journeys', 'reports', 'book_access', 'reading_progress', 'appointments', 'shared_access']);
assert.deepEqual(MEMBERSHIP_TIERS.map(item => item.id), ['explorer', 'reader', 'navigator', 'professional']);
assert.equal(new Set(MEMBERSHIP_TIERS.map(item => item.id)).size, 4);
assert.deepEqual(ENTITLEMENT_TYPES, ['book_access', 'journey_quota', 'report_access', 'professional_review', 'academy_access']);
assert.deepEqual(BILLING_INTERVALS, ['monthly', 'annual']);
assert.deepEqual(SUBSCRIPTION_ACTIONS, ['upgrade', 'downgrade', 'cancel']);
for (const state of ['grace_period', 'failed_payment', 'cancelled']) assert.ok(SUBSCRIPTION_STATUSES.includes(state));

const account = createAccountPreview({ email: ' Reader@example.com ', locale: 'zh-Hans' });
assert.equal(account.email, 'reader@example.com');
assert.equal(account.email_verified, false);
assert.equal(account.authentication_provider_connected, false);
assert.equal(account.password_persisted_by_preview, false);
assert.equal(createPasswordResetRequest('reader@example.com').reset_email_sent, false);
assert.equal(createPrivacySettings({ analytics: true }).runtime_memory_default, false);
assert.throws(() => requestAccountDeletion({ account_id: 'acct_1' }));
assert.equal(requestAccountDeletion({ account_id: 'acct_1', confirmed: true }).account_deleted, false);

const projection = createMyRealityProjection({ current_journeys: [{ id: 'j1' }] });
assert.equal(Object.keys(projection.sections).length, 7);
assert.equal(projection.reads_browser_runtime, false);
assert.equal(projection.writes_runtime_memory, false);
for (const tier of MEMBERSHIP_TIERS) {
  const access = resolveEntitlements(tier.id);
  assert.equal(Object.keys(access.entitlements).length, 5);
  assert.equal(access.requires_server_validation, true);
  assert.equal(access.authoritative, false);
}
const subscription = createSubscriptionPreview({ membership_tier: 'reader', billing_interval: 'annual' });
assert.equal(subscription.checkout_enabled, false);
assert.equal(subscription.payment_credentials_collected, false);
assert.equal(proposeSubscriptionChange(subscription, 'upgrade', 'navigator').applied, false);

for (const [page, keys] of [
  [accountPage, ['registration', 'login', 'verification', 'reset', 'profile', 'privacy', 'deletion']],
  [realityPage, ['current', 'past', 'reports', 'books', 'progress', 'appointments', 'shared']],
  [membershipPage, ['explorer', 'reader', 'navigator', 'professional', 'monthly', 'annual']]
]) {
  for (const key of keys) assert.ok(page.includes(`.${key}`), `Page key missing: ${key}`);
  assert.equal(/\bfetch\s*\(/.test(page), false);
  assert.equal(/localStorage|sessionStorage/.test(page), false);
}
assert.ok(accountPage.includes('Account services are not connected'));
assert.ok(en.includes('Checkout and payment collection are not enabled'));
assert.ok(checkout.includes('checkout') && checkout.includes('not'));
assert.ok(css.includes('@media (max-width: 900px)'));
assert.ok(css.includes('@media (max-width: 600px)'));
assert.deepEqual(registry.responsive_viewports, [360, 768, 1440]);
assert.equal(registry.boundaries.checkout_enabled, false);
assert.equal(registry.boundaries.client_entitlements_authoritative, false);
for (const key of ['registration', 'deletion', 'current', 'shared', 'explorer', 'professional', 'boundary']) {
  assert.ok(en.includes(`${key}:`), `English key missing: ${key}`);
  assert.ok(zh.includes(`${key}:`), `Chinese key missing: ${key}`);
}
console.log('✓ M4C Account, My Reality, Membership, Subscription and Entitlements passed.');
