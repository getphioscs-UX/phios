export const MEMBERSHIP_VERSION = 'm4c-w3.v1';

export const MEMBERSHIP_TIERS = Object.freeze([
  Object.freeze({ id: 'explorer', rank: 1 }),
  Object.freeze({ id: 'reader', rank: 2 }),
  Object.freeze({ id: 'navigator', rank: 3 }),
  Object.freeze({ id: 'professional', rank: 4 })
]);

export const ENTITLEMENT_TYPES = Object.freeze([
  'book_access',
  'journey_quota',
  'report_access',
  'professional_review',
  'academy_access'
]);

const TIER_ENTITLEMENTS = Object.freeze({
  explorer: Object.freeze({
    book_access: 'preview',
    journey_quota: 1,
    report_access: 'basic',
    professional_review: false,
    academy_access: 'preview'
  }),
  reader: Object.freeze({
    book_access: 'included',
    journey_quota: 3,
    report_access: 'standard',
    professional_review: false,
    academy_access: 'foundation'
  }),
  navigator: Object.freeze({
    book_access: 'included',
    journey_quota: 10,
    report_access: 'navigation',
    professional_review: 'eligible',
    academy_access: 'foundation'
  }),
  professional: Object.freeze({
    book_access: 'included',
    journey_quota: 'workspace_policy',
    report_access: 'professional',
    professional_review: 'workspace_scope',
    academy_access: 'professional'
  })
});

export function resolveEntitlements(tierId) {
  const entitlements = TIER_ENTITLEMENTS[tierId];
  if (!entitlements) throw new TypeError('Unknown membership tier.');
  return Object.freeze({
    tier_id: tierId,
    entitlements,
    authoritative: false,
    requires_server_validation: true
  });
}
