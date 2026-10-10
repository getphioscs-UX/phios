import crypto from 'node:crypto';

export const PACKAGE_TYPE = 'BFA_COMPLETE_PUBLICATION_PACKAGE';
export const PACKAGE_SCHEMA_VERSION = 'PHI-OS-BFA-COMPLETE-PUBLICATION-PACKAGE-v1.0.0';
export const DIGEST_RE = /^[a-f0-9]{64}$/;

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function stableSerialize(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : stableSerialize(value), 'utf8').digest('hex');
}

export function finalPackageDigestPayload(packageRecord) {
  const clone = structuredClone(packageRecord ?? {});
  delete clone.finalPackageDigest;
  delete clone.assembledAt;
  delete clone.reviewState;
  delete clone.decisionState;
  return clone;
}

export function computeFinalPackageDigest(packageRecord) {
  return sha256(finalPackageDigestPayload(packageRecord));
}

export function bindFinalPackageDigest(packageRecord) {
  const record = structuredClone(packageRecord);
  record.finalPackageDigest = computeFinalPackageDigest(record);
  return record;
}

export function verifyFinalPackageDigest(packageRecord) {
  return DIGEST_RE.test(packageRecord?.finalPackageDigest ?? '') && packageRecord.finalPackageDigest === computeFinalPackageDigest(packageRecord);
}

function requireDigestObject(errors, object, path) {
  if (!object || typeof object !== 'object' || Array.isArray(object)) {
    errors.push(`${path}:OBJECT_REQUIRED`);
    return;
  }
  if (!DIGEST_RE.test(object.sourceDigest ?? '')) errors.push(`${path}.sourceDigest:SHA256_REQUIRED`);
}

function requireLocale(errors, localeObject, locale) {
  const path = `locales.${locale}`;
  if (!localeObject || typeof localeObject !== 'object') {
    errors.push(`${path}:OBJECT_REQUIRED`);
    return;
  }
  if (localeObject.locale !== locale) errors.push(`${path}.locale:EXPECTED_${locale}`);
  if (!localeObject.candidateCode) errors.push(`${path}.candidateCode:REQUIRED`);
  if (!DIGEST_RE.test(localeObject.candidateDigest ?? '')) errors.push(`${path}.candidateDigest:SHA256_REQUIRED`);
  const article = localeObject.article;
  if (!article || typeof article !== 'object') {
    errors.push(`${path}.article:OBJECT_REQUIRED`);
    return;
  }
  for (const field of ['title', 'summary', 'bodyMarkdown']) {
    if (typeof article[field] !== 'string') errors.push(`${path}.article.${field}:STRING_REQUIRED`);
  }
}

export function validateCompletePublicationPackage(packageRecord, { requireDigest = true } = {}) {
  const errors = [];
  if (packageRecord?.packageType !== PACKAGE_TYPE) errors.push('packageType:INVALID');
  if (packageRecord?.packageSchemaVersion !== PACKAGE_SCHEMA_VERSION) errors.push('packageSchemaVersion:INVALID');
  if (!/^BFA-PACKAGE-KN-[A-Z0-9-]+-v[0-9]+$/.test(packageRecord?.packageCode ?? '')) errors.push('packageCode:INVALID');
  if (!/^BATCH-[0-9]{3,}$/.test(packageRecord?.batchCode ?? '')) errors.push('batchCode:INVALID');
  if (!/^KN-[A-Z0-9-]+$/.test(packageRecord?.nodeCode ?? '')) errors.push('nodeCode:INVALID');
  if (!/^BOOK-[0-9]+$/.test(packageRecord?.bookCode ?? '')) errors.push('bookCode:INVALID');

  requireDigestObject(errors, packageRecord?.canonicalAuthority, 'canonicalAuthority');
  requireDigestObject(errors, packageRecord?.pjaBrief, 'pjaBrief');
  requireLocale(errors, packageRecord?.locales?.['zh-Hans'], 'zh-Hans');
  requireLocale(errors, packageRecord?.locales?.en, 'en');
  requireDigestObject(errors, packageRecord?.localeIdentity, 'localeIdentity');
  requireDigestObject(errors, packageRecord?.sameRouteIdentity, 'sameRouteIdentity');
  requireDigestObject(errors, packageRecord?.figure, 'figure');
  requireDigestObject(errors, packageRecord?.automaticEvidence, 'automaticEvidence');
  requireDigestObject(errors, packageRecord?.presentationPreview, 'presentationPreview');
  requireDigestObject(errors, packageRecord?.publicationReadiness, 'publicationReadiness');

  if (requireDigest && !verifyFinalPackageDigest(packageRecord)) errors.push('finalPackageDigest:INVALID_OR_STALE');
  return { valid: errors.length === 0, errors };
}

export function isFinalApprovalCurrent(approvalRecord, packageRecord) {
  return approvalRecord?.authorityType === 'BILINGUAL_FINAL_PUBLICATION_APPROVAL'
    && approvalRecord?.reviewerCode === 'TL'
    && approvalRecord?.nodeCode === packageRecord?.nodeCode
    && approvalRecord?.batchCode === packageRecord?.batchCode
    && approvalRecord?.finalPackageDigest === packageRecord?.finalPackageDigest
    && verifyFinalPackageDigest(packageRecord);
}
