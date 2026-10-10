import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { serialize } from '../knowledge-production/canonical-brief-v2.mjs';
import { validateZhHansCandidate } from '../knowledge-production/zh-hans-candidate-v1.mjs';
import { validateHumanReview } from '../knowledge-production/human-review-v1.mjs';
import { validateHumanApproval } from '../knowledge-production/human-approval-v1.mjs';
import {
  PUBLICATION_SCHEMA_VERSION,
  PUBLICATION_TYPE,
  computePublicationDigest,
  validatePublication,
  buildPublicationRegistryRecord
} from '../knowledge-production/publication-v1.mjs';

export const APS_PJA_SUCCESSOR_SCHEMA = 'PHI-OS-APS-PJA-FROZEN-BRIEF-PUBLICATION-SUCCESSOR-v1.0.0';
export const FROZEN_PJA_PUBLICATION_IMPLEMENTATION = 'scripts/lib/knowledge-production/publication-v1.mjs';
export const FROZEN_PJA_PUBLICATION_SHA256 = '7e62f8b2a61524eb735d332103d5970ebf17130f0f26857782e5bc39b77bbe30';
const REGISTRY = 'content/knowledge/production/registry/publication-registry.json';
const fail = (code, message) => Object.assign(new Error(`${code}: ${message}`), { code });
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const exists = file => fs.access(file).then(() => true, () => false);
const readJson = async (root, rel) => JSON.parse(await fs.readFile(path.join(root, rel), 'utf8'));

export async function assertFrozenPjaPublicationImplementation(root) {
  const actual = sha(await fs.readFile(path.join(root, FROZEN_PJA_PUBLICATION_IMPLEMENTATION)));
  if (actual !== FROZEN_PJA_PUBLICATION_SHA256) throw fail('APS_PJA_FROZEN_IMPLEMENTATION_DRIFT', actual);
  return actual;
}

export async function buildPublicationFromFrozenBrief(root, { candidate, review, approval, canonicalBriefPath, publisherCode = 'TL', publishedAt, version = '1.0.0' }) {
  await assertFrozenPjaPublicationImplementation(root);
  const briefAbs = path.join(root, canonicalBriefPath);
  const cv = await validateZhHansCandidate(root, candidate, { briefPath: briefAbs });
  if (!cv.valid) throw fail('APS_PJA_PUBLICATION_REQUIRES_VALID_FROZEN_BRIEF_CANDIDATE', JSON.stringify(cv.errors));
  const rv = validateHumanReview(review, candidate);
  if (!rv.valid || review.decision !== 'accept') throw fail('APS_PJA_PUBLICATION_REQUIRES_ACCEPTED_REVIEW', JSON.stringify(rv.errors));
  const av = validateHumanApproval(approval, candidate, review);
  if (!av.valid || approval.decision !== 'approve') throw fail('APS_PJA_PUBLICATION_REQUIRES_APPROVAL', JSON.stringify(av.errors));
  if (!publishedAt || Number.isNaN(Date.parse(publishedAt))) throw fail('APS_PJA_PUBLISHED_AT_INVALID', String(publishedAt));
  const brief = await readJson(root, canonicalBriefPath);
  if (brief.briefDigest !== candidate.sourceBrief?.briefDigest || brief.briefCode !== candidate.sourceBrief?.briefCode || brief.repositoryCommit !== candidate.sourceBrief?.repositoryCommit) {
    throw fail('APS_PJA_FROZEN_BRIEF_LINEAGE_INVALID', candidate.nodeCode);
  }
  const articleCode = `KA-${candidate.nodeCode.replace(/^KN-/, '')}-ZH-ARTICLE`;
  const payload = {
    publicationType: PUBLICATION_TYPE,
    publicationSchemaVersion: PUBLICATION_SCHEMA_VERSION,
    publicationCode: `PUBLICATION-${approval.approvalCode}-V1`,
    candidate: { candidateCode: candidate.candidateCode, candidateDigest: candidate.candidateDigest, nodeCode: candidate.nodeCode, locale: candidate.locale },
    review: { reviewCode: review.reviewCode, reviewDigest: review.reviewDigest, decision: review.decision },
    approval: { approvalCode: approval.approvalCode, approvalDigest: approval.approvalDigest, decision: approval.decision },
    publisher: { publisherCode, authority: 'TL Independent Publication Authority' },
    decision: 'publish',
    article: {
      articleCode,
      nodeCode: candidate.nodeCode,
      locale: candidate.locale,
      title: candidate.article.title,
      summary: candidate.article.summary,
      bodyMarkdown: candidate.article.bodyMarkdown,
      slug: brief.localizedIdentity.slug,
      href: `/articles/${brief.localizedIdentity.slug}`,
      version
    },
    authority: { canonicalMeaning: 'TL', review: 'human_review_accepted', approval: 'human_approval_recorded', publication: 'independent_publication_recorded' },
    governance: { candidateMutationAllowed: false, reviewMutationAllowed: false, approvalMutationAllowed: false, knowledgeRegistryMutationAllowed: false, publicRuntimeProjectionWritten: false, localeInheritanceAllowed: false },
    publishedAt: new Date(publishedAt).toISOString()
  };
  const publication = { ...payload, publicationDigest: computePublicationDigest(payload) };
  const validation = validatePublication(publication, candidate, review, approval);
  if (!validation.valid) throw fail('APS_PJA_PUBLICATION_SUCCESSOR_INVALID', JSON.stringify(validation.errors));
  return { publication, brief, validation };
}

async function atomicWrite(target, text) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temp = `${target}.tmp-${process.pid}-${crypto.randomUUID()}`;
  await fs.writeFile(temp, text, { flag: 'wx' });
  await fs.rename(temp, target);
}

export async function ensurePublicationAndRegistry(root, publication, { apply = false } = {}) {
  const rel = `content/knowledge/production/publications/${publication.article.locale}/${publication.article.nodeCode}/publication.v1.json`;
  const target = path.join(root, rel);
  const record = buildPublicationRegistryRecord(publication);
  const registry = await readJson(root, REGISTRY);
  const existingRecord = registry.records.find(item => item.nodeCode === record.nodeCode && item.locale === record.locale) ?? null;
  let packageState = 'create';
  if (await exists(target)) {
    const existing = await readJson(root, rel);
    if (serialize(existing) !== serialize(publication)) throw fail('APS_PJA_PUBLICATION_PACKAGE_CONFLICT', rel);
    packageState = 'existing_equivalent';
  }
  let registryState = 'create';
  if (existingRecord) {
    if (serialize(existingRecord) !== serialize(record)) throw fail('APS_PJA_PUBLICATION_REGISTRY_CONFLICT', `${record.nodeCode}:${record.locale}`);
    registryState = 'existing_equivalent';
  }
  if (!apply) return { applied: false, publicationPath: rel, packageState, registryState, record };
  if (packageState === 'create') await atomicWrite(target, serialize(publication));
  if (registryState === 'create') {
    const next = { ...registry, records: [...registry.records, record].sort((a, b) => a.publicationCode.localeCompare(b.publicationCode)) };
    const file = path.join(root, REGISTRY);
    const temp = `${file}.tmp-${process.pid}-${crypto.randomUUID()}`;
    await fs.writeFile(temp, serialize(next), { flag: 'wx' });
    await fs.rename(temp, file);
  }
  return { applied: true, publicationPath: rel, packageState, registryState, record };
}
