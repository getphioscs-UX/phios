import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const EDITORIAL_REVISION_REGISTRY = 'content/knowledge/public/editorial-revisions/article-editorial-revision-registry-v1.json';
export const shaText = text => crypto.createHash('sha256').update(String(text), 'utf8').digest('hex');
const readJson = (root, rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

export function loadEditorialRevisionRegistry(root = process.cwd()) {
  const abs = path.join(root, EDITORIAL_REVISION_REGISTRY);
  if (!fs.existsSync(abs)) return { schemaVersion: 'PHI-OS-PUBLIC-ARTICLE-EDITORIAL-REVISION-REGISTRY-v1.0.0', records: [] };
  return readJson(root, EDITORIAL_REVISION_REGISTRY);
}

export function activeEditorialRevisions(root = process.cwd()) {
  const registry = loadEditorialRevisionRegistry(root);
  return (registry.records ?? []).filter(r => r.status === 'ACTIVE').sort((a,b) => a.revisionCode.localeCompare(b.revisionCode));
}

export function validateEditorialRevisionAgainstAuthority(record, authorityRecord) {
  const errors = [];
  if (!authorityRecord) errors.push('AUTHORITY_RECORD_MISSING');
  if (record.revisionClass !== 'PRESENTATION_ONLY_EDITORIAL_REPAIR') errors.push('REVISION_CLASS_INVALID');
  if (record.semanticChangeAllowed !== false) errors.push('SEMANTIC_CHANGE_MUST_BE_FALSE');
  if (record.scope !== 'PUBLIC_PROJECTION_ONLY') errors.push('PUBLIC_PROJECTION_SCOPE_REQUIRED');
  if (authorityRecord && record.nodeCode !== authorityRecord.nodeCode) errors.push('NODE_CODE_MISMATCH');
  if (authorityRecord && record.locale !== authorityRecord.locale) errors.push('LOCALE_MISMATCH');
  if (authorityRecord && record.sourcePublicationDigest !== authorityRecord.lineage?.publicationDigest) errors.push('PUBLICATION_DIGEST_MISMATCH');
  if (authorityRecord && record.baseBodyDigest !== shaText(authorityRecord.article?.bodyMarkdown ?? '')) errors.push('BASE_BODY_DIGEST_STALE');
  if (record.replacementBodyDigest !== shaText(record.replacementBodyMarkdown ?? '')) errors.push('REPLACEMENT_BODY_DIGEST_INVALID');
  if (!record.authorization || record.authorization.authorizedBy !== 'TL' || record.authorization.decision !== 'APPLY_PUBLIC_EDITORIAL_REPAIR') errors.push('TL_AUTHORIZATION_REQUIRED');
  return { valid: errors.length === 0, errors };
}

export function applyEditorialRevisionRegistryToAuthorityOutput(root, output, hashValue) {
  const revisions = activeEditorialRevisions(root);
  const applied = [];
  for (const revision of revisions) {
    const index = output.registry.records.findIndex(r => r.nodeCode === revision.nodeCode && r.locale === revision.locale);
    if (index < 0) throw new Error(`ARTICLE_EDITORIAL_REVISION_AUTHORITY_MISSING:${revision.revisionCode}`);
    const current = output.registry.records[index];
    const validation = validateEditorialRevisionAgainstAuthority(revision, current);
    if (!validation.valid) throw new Error(`ARTICLE_EDITORIAL_REVISION_INVALID:${revision.revisionCode}:${validation.errors.join(',')}`);
    const next = structuredClone(current);
    const beforeAuthorityDigest = next.authorityDigest;
    next.article.bodyMarkdown = revision.replacementBodyMarkdown;
    next.editorialRevision = {
      revisionCode: revision.revisionCode,
      revisionClass: revision.revisionClass,
      sourcePublicationDigest: revision.sourcePublicationDigest,
      baseBodyDigest: revision.baseBodyDigest,
      replacementBodyDigest: revision.replacementBodyDigest,
      authorizedBy: revision.authorization.authorizedBy,
      authorizedAt: revision.authorization.authorizedAt,
      semanticChangeAllowed: false,
      scope: revision.scope
    };
    const base = structuredClone(next); delete base.authorityDigest;
    next.authorityDigest = hashValue(base);
    output.registry.records[index] = next;
    output.articleFiles[`content/knowledge/public/authority/articles/${next.locale}/${next.nodeCode}.json`] = structuredClone(next);
    applied.push({ revisionCode: revision.revisionCode, authorityRecordCode: next.authorityRecordCode, beforeAuthorityDigest, afterAuthorityDigest: next.authorityDigest });
  }
  if (revisions.length) {
    output.registry.sourceOfTruth = 'Publication Packages + governed public editorial revision overlay';
    output.registry.policy.editorialRevisionOverlayAllowed = true;
    output.registry.policy.editorialRevisionScope = 'PUBLIC_PROJECTION_ONLY';
    output.registry.policy.canonicalPublicationMutationAllowed = false;
    output.registry.policy.editorialRevisionRegistry = EDITORIAL_REVISION_REGISTRY;
  }
  return { output, applied };
}
