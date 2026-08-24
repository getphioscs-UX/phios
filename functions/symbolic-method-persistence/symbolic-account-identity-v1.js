const clean = value => String(value ?? '').normalize('NFKC').trim();

export const SYMBOLIC_ACCOUNT_IDENTITY_VERSION = '1.0.0';

/**
 * Account identity is trusted only when another server-side authentication
 * provider has already populated context.data.symbolicAccountIdentity.
 * Request bodies, query strings, cookies and arbitrary request headers are
 * deliberately not consulted here.
 */
export function normalizeVerifiedSymbolicAccountIdentity(value = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const userId = clean(source.userId);
  const providerId = clean(source.providerId);
  const sessionId = clean(source.sessionId) || null;
  const verified = source.verified === true && source.authenticated === true;
  if (!verified || !userId || !providerId) return null;
  return Object.freeze({
    version: SYMBOLIC_ACCOUNT_IDENTITY_VERSION,
    userId,
    providerId,
    sessionId,
    verified: true,
    authenticated: true,
    source: 'TRUSTED_SERVER_REQUEST_CONTEXT_ONLY'
  });
}

export function assertVerifiedSymbolicAccountIdentity(value = {}) {
  const identity = normalizeVerifiedSymbolicAccountIdentity(value);
  if (!identity) {
    const error = new Error('VERIFIED_SYMBOLIC_ACCOUNT_IDENTITY_REQUIRED');
    error.code = 'VERIFIED_SYMBOLIC_ACCOUNT_IDENTITY_REQUIRED';
    error.status = 503;
    throw error;
  }
  return identity;
}

export function symbolicPersistenceProviderState(context = {}) {
  const identity = normalizeVerifiedSymbolicAccountIdentity(context?.data?.symbolicAccountIdentity || {});
  const d1Bound = Boolean(context?.env?.RUNTIME_DB && typeof context.env.RUNTIME_DB.prepare === 'function');
  return Object.freeze({
    d1Bound,
    verifiedIdentityBound: Boolean(identity),
    providerReady: d1Bound && Boolean(identity),
    identityProviderId: identity?.providerId || null,
    localStorageFallbackAllowed: false,
    sessionStorageFallbackAllowed: false
  });
}
