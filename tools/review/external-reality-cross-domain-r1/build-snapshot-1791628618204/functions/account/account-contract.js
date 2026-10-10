export const ACCOUNT_VERSION = 'm4c-w1.v1';

export const ACCOUNT_CAPABILITIES = Object.freeze([
  'registration',
  'login',
  'email_verification',
  'password_reset',
  'profile',
  'privacy_settings',
  'delete_account'
]);

export const ACCOUNT_STATUS = Object.freeze({
  PREVIEW: 'preview',
  PENDING_VERIFICATION: 'pending_verification',
  ACTIVE: 'active',
  DELETION_REQUESTED: 'deletion_requested',
  DELETED: 'deleted'
});

const clean = value => typeof value === 'string' ? value.trim() : '';

export function createAccountPreview(input = {}) {
  const email = clean(input.email).toLowerCase();
  if (!email || !email.includes('@')) {
    throw new TypeError('A valid email is required.');
  }

  return Object.freeze({
    contract_version: ACCOUNT_VERSION,
    email,
    display_name: clean(input.display_name),
    locale: input.locale === 'zh-Hans' ? 'zh-Hans' : 'en',
    status: ACCOUNT_STATUS.PENDING_VERIFICATION,
    email_verified: false,
    authentication_provider_connected: false,
    verification_email_sent: false,
    password_persisted_by_preview: false
  });
}

export function createPasswordResetRequest(email) {
  const normalized = clean(email).toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    throw new TypeError('A valid email is required.');
  }
  return Object.freeze({
    contract_version: ACCOUNT_VERSION,
    email: normalized,
    status: 'request_preview',
    reset_email_sent: false,
    token_created: false
  });
}

export function createPrivacySettings(input = {}) {
  return Object.freeze({
    analytics: Boolean(input.analytics),
    product_updates: Boolean(input.product_updates),
    professional_service_updates: Boolean(input.professional_service_updates),
    runtime_memory_default: false
  });
}

export function requestAccountDeletion({ account_id, confirmed = false } = {}) {
  if (!clean(account_id) || confirmed !== true) {
    throw new TypeError('Account ID and explicit confirmation are required.');
  }
  return Object.freeze({
    contract_version: ACCOUNT_VERSION,
    account_id: clean(account_id),
    status: ACCOUNT_STATUS.DELETION_REQUESTED,
    account_deleted: false,
    requires_identity_verification: true
  });
}
